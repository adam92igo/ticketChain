"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, DoorOpen, ExternalLink, ScanLine, ShieldCheck, Ticket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FormInput } from "@/components/FormInput";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CONTRACT_ADDRESS } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";
import { getFriendlyError } from "@/lib/errors";
import { sepoliaNftUrl, shortAddress } from "@/lib/format";
import { getGateDecision, normalizeTokenId } from "@/lib/ticketState";
import type { Verification } from "@/lib/ticketchainTypes";

export default function GatePage() {
  const { address, isOwner, transactionBusy, verifyTicket, markAsUsed } = useTicketChain();
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState<Verification | null>(null);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState("");
  const [recorded, setRecorded] = useState(false);

  const decision = useMemo(() => result ? getGateDecision(result) : null, [result]);

  const checkTicket = async () => {
    setLocalError("");
    setRecorded(false);
    setResult(null);
    setChecking(true);
    try {
      normalizeTokenId(tokenId);
      setResult(await verifyTicket(tokenId));
    } catch (err) {
      setLocalError(getFriendlyError(err, "Gate check failed."));
    } finally {
      setChecking(false);
    }
  };

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
        eyebrow="Staff entrance control"
        title="Gate Check"
        description="Scan a ticket QR code or enter its token ID manually to verify ownership and usage status on-chain."
        actions={<StatusBadge label={isOwner ? "Organizer ready" : "Read-only staff view"} tone={isOwner ? "green" : "amber"} />}
      />

      <section className="gate-console">
        <article className="workspace gate-controls">
          <div className="section-heading">
            <div><p className="eyebrow">Manual lookup</p><h2>Check a ticket</h2></div>
            <ScanLine size={22} />
          </div>
          <FormInput label="Token ID" value={tokenId} inputMode="numeric" placeholder="Scan or enter token ID" onChange={setTokenId} />
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
          {!address ? <p className="helper-copy">Verification is read-only. Connect the organizer wallet to mark entry on-chain.</p> : null}
          {address && !isOwner ? <p className="helper-copy">Only the contract owner can mark a ticket as used.</p> : null}
          <Link className="inline-link" href="/verify">Open public verification</Link>
        </article>

        <article className="workspace gate-display" aria-live="polite">
          {localError ? <div className="notice error"><strong>Gate check failed</strong><p>{localError}</p></div> : null}
          {!result && !localError ? (
            <EmptyState title="Awaiting a ticket" description="No ticket selected. Enter a numeric token ID to make an entry decision." icon={<ShieldCheck size={22} />} />
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
