"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  Copy,
  DoorOpen,
  ExternalLink,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Ticket
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { EmptyState } from "@/components/EmptyState";
import { FormInput } from "@/components/FormInput";
import { GateQrScanner } from "@/components/GateQrScanner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CONTRACT_ADDRESS, EXPECTED_CHAIN_ID } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";
import { getFriendlyError } from "@/lib/errors";
import { sepoliaNftUrl, shortAddress } from "@/lib/format";
import {
  createGateHolderChallengeUrl,
  isGateHolderConfirmationCurrent,
  isGateHolderMarkPreflightEligible,
  type GateHolderConfirmation
} from "@/lib/gateHolderGate";
import {
  createGateHolderChallenge,
  getGateHolderChallengeKey,
  validateGateHolderProof,
  type GateHolderChallenge,
  type GateHolderProofValidation
} from "@/lib/gateHolderProof";
import { getGateDecision, normalizeTokenId } from "@/lib/ticketState";
import type { Verification } from "@/lib/ticketchainTypes";

type ProofRejection = {
  challengeKey: string;
  message: string;
};

type ProofRejectionCode = Extract<GateHolderProofValidation, { ok: false }>["code"];

function getProofRejectionMessage(code: ProofRejectionCode): string {
  switch (code) {
    case "expired":
      return "Proof rejected: this five-minute challenge has expired. Issue a new challenge.";
    case "replayed":
      return "Proof rejected: this challenge was already used. Issue a new challenge.";
    case "wrong-ticket":
      return "Proof rejected: the returned proof belongs to a different ticket.";
    case "wrong-owner":
      return "Proof rejected: the signing wallet is not the ticket’s current Sepolia owner.";
    default:
      return "Proof rejected: the QR is malformed or does not match the active challenge.";
  }
}

function formatRemainingTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export default function GateClient({ initialTokenId }: { initialTokenId: string }) {
  const { address, isOwner, transactionBusy, verifyTicket, markAsUsed } = useTicketChain();
  const [tokenId, setTokenId] = useState(initialTokenId);
  const [result, setResult] = useState<Verification | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkingProof, setCheckingProof] = useState(false);
  const [markingBusy, setMarkingBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [recorded, setRecorded] = useState(false);
  const [ticketScannerOpen, setTicketScannerOpen] = useState(false);
  const [proofScannerOpen, setProofScannerOpen] = useState(false);
  const [pastedProof, setPastedProof] = useState("");
  const [activeChallenge, setActiveChallenge] = useState<GateHolderChallenge | null>(null);
  const [holderConfirmation, setHolderConfirmation] = useState<GateHolderConfirmation | null>(null);
  const [proofRejection, setProofRejection] = useState<ProofRejection | null>(null);
  const [origin, setOrigin] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const consumedNoncesRef = useRef(new Set<string>());
  const activeChallengeKeyRef = useRef("");
  const lookupRequestIdRef = useRef(0);
  const proofRequestIdRef = useRef(0);
  const tokenIdRef = useRef(initialTokenId);
  const writeBusyRef = useRef(false);
  const transactionBusyRef = useRef(transactionBusy);
  transactionBusyRef.current = transactionBusy;

  const decision = useMemo(() => result ? getGateDecision(result) : null, [result]);
  const challengeKey = useMemo(
    () => activeChallenge ? getGateHolderChallengeKey(activeChallenge) : "",
    [activeChallenge]
  );
  const challengeUrl = useMemo(
    () => origin && activeChallenge ? createGateHolderChallengeUrl(origin, activeChallenge) : "",
    [activeChallenge, origin]
  );
  const challengeExpired = Boolean(activeChallenge && now >= activeChallenge.expiresAt);
  const rejectionMessage = proofRejection?.challengeKey === challengeKey ? proofRejection.message : "";
  const holderConfirmed = isGateHolderConfirmationCurrent({
    challenge: activeChallenge,
    challengeKey,
    confirmation: holderConfirmation,
    tokenId: result?.tokenId.toString() || tokenId,
    ticketValid: Boolean(result?.valid),
    now
  });
  const gateWriteBusy = markingBusy || transactionBusy;
  const canMarkAsUsed = Boolean(isOwner && !gateWriteBusy && result?.valid && holderConfirmed);
  const [challengeLinkCopied, setChallengeLinkCopied] = useState(false);

  const handleCopyChallengeLink = useCallback(async () => {
    if (!challengeUrl) return;
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setChallengeLinkCopied(true);
      setTimeout(() => setChallengeLinkCopied(false), 2000);
    } catch {
      // Clipboard access can be unavailable (permissions, insecure context); the QR code remains usable.
    }
  }, [challengeUrl]);

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!activeChallenge) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [activeChallenge]);

  useEffect(() => {
    if (!activeChallenge || now < activeChallenge.expiresAt) return;
    setHolderConfirmation(null);
    setProofScannerOpen(false);
  }, [activeChallenge, now]);

  useEffect(() => {
    if (!transactionBusy) return;
    setTicketScannerOpen(false);
    setProofScannerOpen(false);
  }, [transactionBusy]);

  const clearHolderProof = useCallback(() => {
    activeChallengeKeyRef.current = "";
    proofRequestIdRef.current += 1;
    setActiveChallenge(null);
    setHolderConfirmation(null);
    setProofRejection(null);
    setProofScannerOpen(false);
    setCheckingProof(false);
  }, []);

  const activateChallenge = useCallback((challenge: GateHolderChallenge) => {
    const nextChallengeKey = getGateHolderChallengeKey(challenge);
    activeChallengeKeyRef.current = nextChallengeKey;
    proofRequestIdRef.current += 1;
    setActiveChallenge(challenge);
    setHolderConfirmation(null);
    setProofRejection(null);
    setProofScannerOpen(false);
    setCheckingProof(false);
    setNow(Date.now());
  }, []);

  const checkTicketForToken = useCallback(async (value: string) => {
    if (writeBusyRef.current || transactionBusyRef.current) return;
    const requestId = ++lookupRequestIdRef.current;
    setLocalError("");
    setRecorded(false);
    setResult(null);
    clearHolderProof();
    setTicketScannerOpen(false);
    setChecking(true);
    try {
      const normalizedTokenId = normalizeTokenId(value);
      tokenIdRef.current = normalizedTokenId;
      setTokenId(normalizedTokenId);
      const nextResult = await verifyTicket(normalizedTokenId);
      if (lookupRequestIdRef.current !== requestId) return;
      setResult(nextResult);
      if (nextResult.valid) {
        activateChallenge(createGateHolderChallenge({
          contractAddress: CONTRACT_ADDRESS,
          chainId: EXPECTED_CHAIN_ID,
          tokenId: normalizedTokenId
        }));
      }
    } catch (err) {
      if (lookupRequestIdRef.current === requestId) {
        setLocalError(getFriendlyError(err, "Gate check failed."));
      }
    } finally {
      if (lookupRequestIdRef.current === requestId) setChecking(false);
    }
  }, [activateChallenge, clearHolderProof, verifyTicket]);

  const checkTicket = useCallback(() => checkTicketForToken(tokenId), [checkTicketForToken, tokenId]);

  useEffect(() => {
    if (initialTokenId) void checkTicketForToken(initialTokenId);
  }, [initialTokenId, checkTicketForToken]);

  const changeTokenId = useCallback((value: string) => {
    if (writeBusyRef.current || transactionBusyRef.current) return;
    lookupRequestIdRef.current += 1;
    tokenIdRef.current = value;
    setTokenId(value);
    setResult(null);
    setRecorded(false);
    setLocalError("");
    setChecking(false);
    clearHolderProof();
  }, [clearHolderProof]);

  const handleTicketScanned = useCallback((scannedTokenId: string) => {
    if (writeBusyRef.current || transactionBusyRef.current) return;
    setTicketScannerOpen(false);
    void checkTicketForToken(scannedTokenId);
  }, [checkTicketForToken]);

  const checkReturnedProof = useCallback(async (payload: string) => {
    if (!activeChallenge || writeBusyRef.current || transactionBusyRef.current) return;

    const capturedChallenge = activeChallenge;
    const capturedChallengeKey = getGateHolderChallengeKey(capturedChallenge);
    const proofRequestId = ++proofRequestIdRef.current;
    setProofScannerOpen(false);
    setPastedProof("");
    setHolderConfirmation(null);
    setProofRejection(null);
    setLocalError("");
    setCheckingProof(true);

    try {
      // Ownership and validity must be fresh before the local proof is parsed or trusted.
      const latestResult = await verifyTicket(capturedChallenge.tokenId);
      if (
        activeChallengeKeyRef.current !== capturedChallengeKey ||
        proofRequestIdRef.current !== proofRequestId ||
        writeBusyRef.current ||
        transactionBusyRef.current
      ) return;
      setResult(latestResult);

      if (!latestResult.valid) {
        setProofRejection({
          challengeKey: capturedChallengeKey,
          message: "Proof rejected: the latest Sepolia read says this ticket is no longer valid for entry."
        });
        return;
      }

      const validation = validateGateHolderProof({
        challenge: capturedChallenge,
        payload,
        expectedOwner: latestResult.owner,
        usedNonces: consumedNoncesRef.current,
        now: Date.now()
      });
      if (
        activeChallengeKeyRef.current !== capturedChallengeKey ||
        proofRequestIdRef.current !== proofRequestId ||
        writeBusyRef.current ||
        transactionBusyRef.current
      ) return;

      if (!validation.ok) {
        setProofRejection({ challengeKey: capturedChallengeKey, message: getProofRejectionMessage(validation.code) });
        return;
      }

      consumedNoncesRef.current.add(capturedChallenge.nonce);
      setHolderConfirmation({ challengeKey: capturedChallengeKey, signer: validation.signer });
    } catch (err) {
      if (
        activeChallengeKeyRef.current === capturedChallengeKey &&
        proofRequestIdRef.current === proofRequestId &&
        !writeBusyRef.current &&
        !transactionBusyRef.current
      ) {
        const message = getFriendlyError(err, "The ticket could not be re-read from Sepolia.");
        setProofRejection({
          challengeKey: capturedChallengeKey,
          message: `Proof rejected: ${message}`
        });
      }
    } finally {
      if (proofRequestIdRef.current === proofRequestId) setCheckingProof(false);
    }
  }, [activeChallenge, verifyTicket]);

  const useTicket = async () => {
    if (
      !activeChallenge ||
      !holderConfirmation ||
      !result?.valid ||
      !isOwner ||
      writeBusyRef.current ||
      transactionBusyRef.current
    ) return;

    const capturedChallenge = activeChallenge;
    const capturedChallengeKey = getGateHolderChallengeKey(capturedChallenge);
    const capturedConfirmation = holderConfirmation;
    const capturedTokenId = result.tokenId.toString();
    const markViewRequestId = ++lookupRequestIdRef.current;
    proofRequestIdRef.current += 1;
    writeBusyRef.current = true;
    setMarkingBusy(true);
    setTicketScannerOpen(false);
    setProofScannerOpen(false);
    setCheckingProof(false);
    setLocalError("");

    try {
      let latestResult: Verification;
      try {
        latestResult = await verifyTicket(capturedTokenId);
      } catch (err) {
        if (
          lookupRequestIdRef.current === markViewRequestId &&
          activeChallengeKeyRef.current === capturedChallengeKey
        ) {
          setHolderConfirmation(null);
          setProofRejection({
            challengeKey: capturedChallengeKey,
            message: "Proof rejected: the latest owner and ticket validity could not be rechecked before entry."
          });
          setLocalError(getFriendlyError(err, "Owner preflight failed. No Mark as Used transaction was sent."));
        }
        return;
      }

      if (
        lookupRequestIdRef.current !== markViewRequestId ||
        activeChallengeKeyRef.current !== capturedChallengeKey
      ) return;

      setResult(latestResult);
      const preflightEligible = isGateHolderMarkPreflightEligible({
        challenge: capturedChallenge,
        challengeKey: capturedChallengeKey,
        confirmation: capturedConfirmation,
        tokenId: capturedTokenId,
        ticketValid: latestResult.valid,
        latestOwner: latestResult.owner,
        now: Date.now()
      });

      if (!preflightEligible) {
        setHolderConfirmation(null);
        setProofRejection({
          challengeKey: capturedChallengeKey,
          message: !latestResult.valid
            ? "Proof rejected: the latest Sepolia read says this ticket is no longer valid for entry."
            : latestResult.owner.toLowerCase() !== capturedConfirmation.signer.toLowerCase()
              ? "Proof rejected: ownership changed after confirmation. Issue a new challenge for the latest owner."
              : "Proof rejected: the holder confirmation is no longer current. Issue a new challenge."
        });
        return;
      }

      const confirmed = await markAsUsed(capturedTokenId);
      if (!confirmed) return;

      let displayedTokenMatches = false;
      try {
        displayedTokenMatches = normalizeTokenId(tokenIdRef.current) === capturedTokenId;
      } catch {
        // A genuinely different or malformed token view must not be overwritten.
      }
      if (!displayedTokenMatches) return;

      const refreshRequestId = ++lookupRequestIdRef.current;
      clearHolderProof();
      try {
        const refreshed = await verifyTicket(capturedTokenId);
        if (
          lookupRequestIdRef.current !== refreshRequestId ||
          normalizeTokenId(tokenIdRef.current) !== capturedTokenId
        ) return;
        setResult(refreshed);
        setRecorded(true);
      } catch (err) {
        let stillShowingMarkedToken = false;
        try {
          stillShowingMarkedToken = normalizeTokenId(tokenIdRef.current) === capturedTokenId;
        } catch {
          // Do not overwrite a different token view.
        }
        if (lookupRequestIdRef.current === refreshRequestId && stillShowingMarkedToken) {
          setResult(null);
          setLocalError(getFriendlyError(err, "Ticket was marked as used, but the gate result could not be refreshed."));
        }
      }
    } finally {
      writeBusyRef.current = false;
      setMarkingBusy(false);
    }
  };

  const resultTone = !result?.valid
    ? "denied"
    : holderConfirmed
      ? "confirmed"
      : challengeExpired || rejectionMessage
        ? "rejected"
        : "waiting";
  const resultEyebrow = !result?.valid
    ? decision?.decision
    : holderConfirmed
      ? "Holder confirmed"
      : challengeExpired || rejectionMessage
        ? "Proof rejected"
        : "Ticket identified";
  const resultTitle = !result?.valid
    ? decision?.title
    : holderConfirmed
      ? "Wallet holder confirmed"
      : challengeExpired
        ? "Holder challenge expired"
        : rejectionMessage
          ? "Wallet proof required"
          : "Present the challenge to the holder";
  const resultMessage = !result?.valid
    ? recorded ? "Entry recorded: ticket marked as used on-chain." : decision?.message
    : holderConfirmed
      ? "The returned signature matches the latest Sepolia owner. The organizer may now record entry."
      : challengeExpired
        ? "This challenge can no longer confirm the holder. Recheck the ticket to issue a fresh QR."
        : rejectionMessage || "The ticket record is valid, but its QR alone does not prove wallet control.";

  return (
    <div className="route-page gate-page">
      <PageHeader
        eyebrow="Organizer entrance control"
        title="Gate Check"
        description="Identify the NFT, hand a one-time challenge to the holder’s phone, then scan the signed proof before recording entry."
        actions={<StatusBadge label={isOwner ? "Organizer ready" : "Read-only staff view"} tone={isOwner ? "green" : "amber"} />}
      />

      <div className="gate-purpose-note">
        <ShieldCheck size={19} />
        <p><strong>Two-device holder check.</strong> A ticket QR identifies the NFT only. Entry recording remains locked until the holder’s phone signs the active challenge and Gate Check matches that signature to the latest Sepolia owner.</p>
      </div>

      <section className="gate-console">
        <article className="workspace gate-controls">
          <div className="section-heading">
            <div><p className="eyebrow">Entrance staff</p><h2>Identify the ticket</h2></div>
            <ScanLine size={22} />
          </div>
          <FormInput label="Token ID" value={tokenId} inputMode="numeric" placeholder="Scan or enter token ID" onChange={changeTokenId} disabled={gateWriteBusy} />
          <button className="secondary-button full" onClick={() => setTicketScannerOpen((open) => !open)} disabled={checking || gateWriteBusy}>
            <Camera size={17} /> {ticketScannerOpen ? "Close ticket scanner" : "Scan ticket QR"}
          </button>
          {ticketScannerOpen ? (
            <GateQrScanner
              mode="ticket"
              onClose={() => setTicketScannerOpen(false)}
              onScanned={handleTicketScanned}
            />
          ) : null}
          <button className="secondary-button full" onClick={() => void checkTicket()} disabled={!tokenId || checking || gateWriteBusy}>
            <DoorOpen size={17} /> {checking ? "Checking Sepolia…" : "Check Ticket"}
          </button>
          <button
            className="primary-button full"
            onClick={() => void useTicket()}
            disabled={!canMarkAsUsed}
          >
            <CheckCircle2 size={17} /> {markingBusy ? "Rechecking owner…" : "Mark as Used"}
          </button>
          {!holderConfirmed && result?.valid ? <p className="helper-copy">Mark as Used stays locked until the active holder challenge is confirmed.</p> : null}
          {!address ? <p className="helper-copy">Ticket lookup and proof validation are public. Connect the contract-owner organizer wallet only for the final on-chain write.</p> : null}
          {address && !isOwner ? <p className="helper-copy">This wallet can check the holder proof, but only the contract-owner organizer wallet can record ticket use.</p> : null}
          <Link className="inline-link" href="/verify">Open public verification</Link>
        </article>

        <article className="workspace gate-display" aria-live="polite">
          {localError ? <div className="notice error"><strong>Gate check failed</strong><p>{localError}</p></div> : null}
          {!result && !localError ? (
            <EmptyState title="Awaiting a ticket" description="Scan a TicketChain ticket QR or enter a numeric token ID. A ticket QR alone never approves entry." icon={<ShieldCheck size={22} />} />
          ) : null}
          {result && decision ? (
            <div className={`gate-result ${resultTone}`}>
              <div className="gate-result-icon">
                {holderConfirmed ? <BadgeCheck size={28} /> : result.valid && !challengeExpired && !rejectionMessage ? <Clock3 size={28} /> : <AlertTriangle size={28} />}
              </div>
              <div className="gate-result-copy">
                <p className="eyebrow">{resultEyebrow}</p>
                <h2>{resultTitle}</h2>
                <p>{resultMessage}</p>
                {result.exists ? (
                  <>
                    <div className="result-summary-row">
                      <span className="ticket-stub result-token-badge"><Ticket size={16} /> NFT #{result.tokenId.toString()}</span>
                      <span className="result-concert">{result.concertName}</span>
                    </div>
                    <dl className="ticket-details result-metadata-grid">
                      <div><dt>Current owner</dt><dd className="address-value" title={result.owner}>{shortAddress(result.owner)}</dd></div>
                      <div><dt>Blockchain</dt><dd>Ethereum Sepolia</dd></div>
                    </dl>
                    {!result.valid && rejectionMessage ? <div className="notice error"><strong>Proof rejected</strong><p>{rejectionMessage}</p></div> : null}
                  </>
                ) : null}

                {result.valid && activeChallenge ? (
                  <section className={`gate-holder-handoff ${holderConfirmed ? "confirmed" : challengeExpired || rejectionMessage ? "rejected" : "waiting"}`}>
                    <div className="gate-handoff-heading">
                      <div>
                        <p className="eyebrow">Two-device handoff</p>
                        <h3>{holderConfirmed ? "Proof complete" : "Challenge → holder phone → returned proof"}</h3>
                      </div>
                      <StatusBadge
                        label={holderConfirmed ? "Wallet holder confirmed" : challengeExpired ? "Expired" : rejectionMessage ? "Proof rejected" : `Expires in ${formatRemainingTime(activeChallenge.expiresAt - now)}`}
                        tone={holderConfirmed ? "green" : challengeExpired || rejectionMessage ? "red" : "amber"}
                      />
                    </div>

                    <div className="gate-handoff-track">
                      <div className="gate-handoff-step challenge-step">
                        <span className="gate-step-number">01</span>
                        <Smartphone size={21} />
                        <div><strong>Present challenge</strong><p>The holder opens this QR on the phone that has MetaMask.</p></div>
                        {!challengeExpired && challengeUrl ? (
                          <div className="gate-challenge-qr">
                            <QRCodeSVG value={challengeUrl} size={260} level="M" marginSize={4} title={`Holder challenge for TicketChain token ${activeChallenge.tokenId}`} />
                            <button type="button" className="secondary-button full" onClick={handleCopyChallengeLink}>
                              {challengeLinkCopied ? <><CheckCircle2 size={17} /> Link copied</> : <><Copy size={17} /> Copy challenge link</>}
                            </button>
                            <p className="helper-copy">
                              If scanning opens a regular browser and MetaMask won&apos;t connect, paste this link into MetaMask&apos;s own in-app browser on the holder&apos;s phone instead.
                            </p>
                          </div>
                        ) : (
                          <div className="gate-challenge-expired"><Clock3 size={25} /><strong>Challenge expired</strong></div>
                        )}
                      </div>

                      <div className="gate-handoff-arrow" aria-hidden="true"><span>signature returns</span><span>→</span></div>

                      <div className="gate-handoff-step proof-step">
                        <span className="gate-step-number">02</span>
                        <QrCode size={21} />
                        <div><strong>Scan returned proof</strong><p>Gate Check re-reads Sepolia before validating the signature locally.</p></div>
                        <button
                          className="secondary-button full"
                          onClick={() => setProofScannerOpen((open) => !open)}
                          disabled={checkingProof || challengeExpired || gateWriteBusy}
                        >
                          <Camera size={17} /> {checkingProof ? "Rechecking Sepolia…" : proofScannerOpen ? "Close proof scanner" : holderConfirmed ? "Scan proof again" : "Scan holder proof"}
                        </button>
                        {proofScannerOpen ? (
                          <GateQrScanner
                            mode="holder-proof"
                            onClose={() => setProofScannerOpen(false)}
                            onScanned={checkReturnedProof}
                          />
                        ) : null}
                        <details className="gate-proof-paste">
                          <summary>Or paste the proof text</summary>
                          <p className="helper-copy">
                            On the holder&apos;s device, tap &quot;Copy proof&quot; below the QR on the verify page, then paste it here if scanning the QR off a screen doesn&apos;t work.
                          </p>
                          <textarea
                            className="gate-proof-textarea"
                            rows={3}
                            value={pastedProof}
                            onChange={(event) => setPastedProof(event.target.value)}
                            placeholder="Paste the copied proof text here"
                            disabled={checkingProof || challengeExpired || gateWriteBusy}
                          />
                          <button
                            type="button"
                            className="secondary-button full"
                            onClick={() => void checkReturnedProof(pastedProof.trim())}
                            disabled={!pastedProof.trim() || checkingProof || challengeExpired || gateWriteBusy}
                          >
                            Check pasted proof
                          </button>
                        </details>
                      </div>
                    </div>

                    <div className="gate-proof-status">
                      {holderConfirmed ? (
                        <><BadgeCheck size={22} /><div><strong>Wallet holder confirmed</strong><p title={holderConfirmation?.signer}>Signature recovered from {shortAddress(holderConfirmation?.signer || "")} and matched to the latest owner.</p></div></>
                      ) : challengeExpired || rejectionMessage ? (
                        <><AlertTriangle size={22} /><div><strong>Proof rejected</strong><p>{challengeExpired ? "The active challenge expired and no longer confirms the holder." : rejectionMessage}</p></div></>
                      ) : (
                        <><Clock3 size={22} /><div><strong>Ticket identified — wallet proof required</strong><p>Keep Mark as Used locked until the returned proof is confirmed.</p></div></>
                      )}
                    </div>

                    {challengeExpired || rejectionMessage ? (
                      <button className="secondary-button" onClick={() => void checkTicketForToken(result.tokenId.toString())} disabled={checking || gateWriteBusy}>
                        <RefreshCw size={17} /> {checking ? "Rechecking Sepolia…" : "Recheck ticket & issue new challenge"}
                      </button>
                    ) : null}
                    <p className="gate-origin-note">The holder’s phone must be able to reach <span>{origin || "this frontend origin"}</span>. Localhost QR links require a LAN-accessible or deployed origin for a second device.</p>
                  </section>
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
