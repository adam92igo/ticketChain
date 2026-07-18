"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Camera, CheckCircle2, DoorOpen, ExternalLink, ScanLine, ShieldCheck, Ticket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FormInput } from "@/components/FormInput";
import { GateQrScanner } from "@/components/GateQrScanner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CONTRACT_ADDRESS } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";
import { getFriendlyError } from "@/lib/errors";
import { sepoliaNftUrl, shortAddress } from "@/lib/format";
import { getGateDecision, normalizeTokenId } from "@/lib/ticketState";
import type { Verification } from "@/lib/ticketchainTypes";

export default function GateClient({ initialTokenId }: { initialTokenId: string }) {
  const { address, isOwner, transactionBusy, verifyTicket, markAsUsed } = useTicketChain();
  const [tokenId, setTokenId] = useState(initialTokenId);
  const [result, setResult] = useState<Verification | null>(null);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState("");
  const [recorded, setRecorded] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const decision = useMemo(() => result ? getGateDecision(result) : null, [result]);

  const checkTicketForToken = useCallback(async (value: string) => {
    setLocalError("");
    setRecorded(false);
    setResult(null);
    setChecking(true);
    try {
      const normalizedTokenId = normalizeTokenId(value);
      setTokenId(normalizedTokenId);
      setResult(await verifyTicket(normalizedTokenId));
    } catch (err) {
      setLocalError(getFriendlyError(err, "Gate check failed."));
    } finally {
      setChecking(false);
    }
  }, [verifyTicket]);

  const checkTicket = useCallback(() => checkTicketForToken(tokenId), [checkTicketForToken, tokenId]);

  useEffect(() => {
    if (initialTokenId) void checkTicketForToken(initialTokenId);
  }, [initialTokenId, checkTicketForToken]);

  const useTicket = async () => {
    if (!result?.valid) return;
    const confirmed = await markAsUsed(tokenId);
    if (!confirmed) return;

    try {
      const refreshed = await verifyTicket(tokenId);
      setResult(refreshed);
      setRecorded(true);
    } catch (err) {
      setLocalError(getFriendlyError(err, "Ticket was marked as used, but the gate result could not be refreshed."));
    }
  };

  return (
    <div className="route-page gate-page">
      <PageHeader
        eyebrow="Organizer entrance control"
        title="Gate Check"
        description="For the organizer’s entrance staff: scan a purchased ticket QR code or enter its bill number, then decide entry from its live Sepolia status."
        actions={<StatusBadge label={isOwner ? "Organizer ready" : "Read-only staff view"} tone={isOwner ? "green" : "amber"} />}
      />

      <div className="gate-purpose-note">
        <ShieldCheck size={19} />
        <p><strong>For event staff.</strong> Gate Check validates the NFT’s concert, current status and one-time entry state. A valid QR proves the ticket record; the organizer records entry only after the guest is admitted.</p>
      </div>

      <section className="gate-console">
        <article className="workspace gate-controls">
          <div className="section-heading">
            <div><p className="eyebrow">Entrance staff</p><h2>Scan or check a ticket</h2></div>
            <ScanLine size={22} />
          </div>
          <FormInput label="Token ID" value={tokenId} inputMode="numeric" placeholder="Scan or enter token ID" onChange={setTokenId} />
          <button className="secondary-button full" onClick={() => setScannerOpen((open) => !open)} disabled={checking}>
            <Camera size={17} /> {scannerOpen ? "Close QR scanner" : "Scan the QR"}
          </button>
          {scannerOpen ? (
            <GateQrScanner
              onClose={() => setScannerOpen(false)}
              onTokenScanned={(scannedTokenId) => {
                setScannerOpen(false);
                void checkTicketForToken(scannedTokenId);
              }}
            />
          ) : null}
          <button className="secondary-button full" onClick={() => void checkTicket()} disabled={!tokenId || checking}>
            <DoorOpen size={17} /> {checking ? "Checking Sepolia…" : "Check Ticket"}
          </button>
          <button
            className="primary-button full"
            onClick={() => void useTicket()}
            disabled={!isOwner || transactionBusy || !result?.valid}
          >
            <CheckCircle2 size={17} /> Mark as Used
          </button>
          {!address ? <p className="helper-copy">Ticket lookup is public. Connect the contract-owner organizer wallet to record a valid ticket as used after entry.</p> : null}
          {address && !isOwner ? <p className="helper-copy">This wallet can check entry, but only the contract-owner organizer wallet can record ticket use.</p> : null}
          <Link className="inline-link" href="/verify">Open public verification</Link>
        </article>

        <article className="workspace gate-display" aria-live="polite">
          {localError ? <div className="notice error"><strong>Gate check failed</strong><p>{localError}</p></div> : null}
          {!result && !localError ? (
            <EmptyState title="Awaiting a ticket" description="Scan a TicketChain QR code or enter a numeric bill number to make an entry decision." icon={<ShieldCheck size={22} />} />
          ) : null}
          {result && decision ? (
            <div className={`gate-result ${decision.tone}`}>
              <div className="gate-result-icon">
                {decision.tone === "approved" ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
              </div>
              <div className="gate-result-copy">
                <p className="eyebrow">{decision.decision}</p>
                <h2>{decision.title}</h2>
                <p>{recorded ? "Entry recorded: ticket marked as used on-chain." : decision.message}</p>
                {result.exists ? (
                  <>
                    <div className="result-summary-row">
                      <span className="ticket-stub result-token-badge"><Ticket size={16} /> NFT #{result.tokenId.toString()}</span>
                      <span className="result-concert">{result.concertName}</span>
                    </div>
                    <dl className="ticket-details result-metadata-grid">
                      <div><dt>Owner</dt><dd className="address-value" title={result.owner}>{shortAddress(result.owner)}</dd></div>
                      <div><dt>Blockchain</dt><dd>Ethereum Sepolia</dd></div>
                    </dl>
                  </>
                ) : null}
                {result.exists ? (
                  <a className="inline-link" href={sepoliaNftUrl(CONTRACT_ADDRESS, result.tokenId)} target="_blank" rel="noreferrer">
                    View NFT on Sepolia <ExternalLink size={13} />
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
