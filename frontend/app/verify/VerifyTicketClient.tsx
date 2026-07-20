"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, QrCode, RefreshCw, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import { FormInput } from "@/components/FormInput";
import { StatusBadge } from "@/components/StatusBadge";
import { CONTRACT_ADDRESS, EXPECTED_CHAIN_ID } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";
import { getFriendlyError } from "@/lib/errors";
import { formatEth, sepoliaAddressUrl, sepoliaNftUrl, shortAddress } from "@/lib/format";
import {
  createGateHolderProofMessage,
  getGateHolderChallengeKey,
  serializeGateHolderProof,
  type GateHolderChallenge
} from "@/lib/gateHolderProof";
import { isTicketOwner } from "@/lib/ownership";
import { getGateDecision, getTicketStatus } from "@/lib/ticketState";
import type { InjectedEthereumProvider, Verification } from "@/lib/ticketchainTypes";

type VerifyTicketClientProps = {
  initialTokenId: string;
  challenge: GateHolderChallenge | null;
  hasChallengeParams: boolean;
};

type HolderProofState = {
  challengeKey: string;
  payload: string;
};

type HolderProofErrorState = {
  challengeKey: string;
  message: string;
};

type HolderProofRequestState = {
  challengeKey: string;
  requestId: number;
};

function getEthereum() {
  return (window as unknown as { ethereum?: InjectedEthereumProvider }).ethereum;
}

export default function VerifyTicketClient({ initialTokenId, challenge, hasChallengeParams }: VerifyTicketClientProps) {
  const { address, chainId, connectWallet, isSepolia, contractReady, verifyTicket, switchToSepolia } = useTicketChain();
  const [tokenId, setTokenId] = useState(initialTokenId);
  const [result, setResult] = useState<Verification | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [proof, setProof] = useState<HolderProofState | null>(null);
  const [proofError, setProofError] = useState<HolderProofErrorState | null>(null);
  const [activeRequest, setActiveRequest] = useState<HolderProofRequestState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [proofCopied, setProofCopied] = useState(false);
  const challengeKey = useMemo(() => challenge ? getGateHolderChallengeKey(challenge) : "", [challenge]);
  const activeChallengeKeyRef = useRef(challengeKey);
  const requestIdRef = useRef(0);
  activeChallengeKeyRef.current = challengeKey;
  const decision = useMemo(() => result ? getGateDecision(result) : null, [result]);
  const ticketStatus = useMemo(() => result?.exists ? getTicketStatus(result) : null, [result]);
  const ownerConfirmed = Boolean(result?.exists) && isTicketOwner(address, result?.owner || "");
  const challengeExpired = Boolean(challenge && now >= challenge.expiresAt);
  const challengeMatchesApp = Boolean(
    challenge &&
    challenge.contractAddress.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
    challenge.chainId === EXPECTED_CHAIN_ID
  );
  const challengeMatchesTicket = Boolean(result?.exists && challenge && result.tokenId.toString() === challenge.tokenId);
  const proofPayload = proof?.challengeKey === challengeKey ? proof.payload : "";
  const proofErrorMessage = proofError?.challengeKey === challengeKey ? proofError.message : "";
  const signing = activeRequest?.challengeKey === challengeKey;

  const handleCopyProof = useCallback(async () => {
    if (!proofPayload) return;
    try {
      await navigator.clipboard.writeText(proofPayload);
      setProofCopied(true);
      setTimeout(() => setProofCopied(false), 2000);
    } catch {
      // Clipboard access can be unavailable (permissions, insecure context); the QR code remains usable.
    }
  }, [proofPayload]);

  useEffect(() => {
    if (!challenge || !challengeMatchesApp || !challengeMatchesTicket) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [challenge, challengeMatchesApp, challengeMatchesTicket]);

  useEffect(() => {
    requestIdRef.current += 1;
    setProof(null);
    setProofError(null);
    setActiveRequest(null);
  }, [challengeKey]);

  const verifyFromWallet = useCallback(async () => {
    setError("");
    setStatus("Reading ticket from Sepolia…");
    setResult(null);
    try {
      setResult(await verifyTicket(tokenId));
    } catch (err) {
      setError(getFriendlyError(err, "Ticket verification failed."));
    } finally {
      setStatus("");
    }
  }, [tokenId, verifyTicket]);

  useEffect(() => {
    if (initialTokenId && tokenId === initialTokenId) void verifyFromWallet();
  }, [initialTokenId, tokenId, verifyFromWallet]);

  const signHolderProof = useCallback(async () => {
    if (!challenge || !challengeMatchesApp || !challengeMatchesTicket) return;

    const capturedChallengeKey = challengeKey;
    const requestId = ++requestIdRef.current;
    const isCurrentRequest = () => (
      activeChallengeKeyRef.current === capturedChallengeKey && requestIdRef.current === requestId
    );

    setProof(null);
    setProofError(null);
    if (Date.now() >= challenge.expiresAt) {
      setProofError({ challengeKey: capturedChallengeKey, message: "This gate challenge has expired. Ask Gate Check for a new QR." });
      return;
    }

    setActiveRequest({ challengeKey: capturedChallengeKey, requestId });
    try {
      const ethereum = getEthereum();
      if (!ethereum) throw new Error("MetaMask is not available in this browser.");

      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== challenge.chainId) {
        throw new Error("Switch MetaMask to Sepolia before signing this gate proof.");
      }

      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const signature = await signer.signMessage(createGateHolderProofMessage(challenge));
      if (!isCurrentRequest()) return;
      if (Date.now() >= challenge.expiresAt) {
        setProofError({
          challengeKey: capturedChallengeKey,
          message: "This gate challenge expired before the signature was completed. Ask Gate Check for a new QR."
        });
        return;
      }
      setProof({
        challengeKey: capturedChallengeKey,
        payload: serializeGateHolderProof({ ...challenge, signer: signerAddress, signature })
      });
    } catch (err) {
      if (isCurrentRequest()) {
        setProofError({ challengeKey: capturedChallengeKey, message: getFriendlyError(err, "Holder proof was not signed.") });
      }
    } finally {
      if (isCurrentRequest()) setActiveRequest(null);
    }
  }, [challenge, challengeKey, challengeMatchesApp, challengeMatchesTicket]);

  return (
    <div className="verify-page">
      <section className="verify-hero">
        <div className="verify-copy">
          <p className="eyebrow">QR verification</p>
          <h1>Scan result</h1>
          <p>Read the NFT ticket directly from Sepolia before approving entry.</p>
        </div>
        <div className="verify-hero-seal"><ShieldCheck size={28} /><span>On-chain gate proof</span></div>
      </section>

      <section className="verify-layout">
        <article className="verify-card">
          <div className="section-heading">
            <div><p className="eyebrow">Token lookup</p><h2>Verify on-chain</h2></div>
            <StatusBadge label={chainId === null ? "Wallet network unavailable" : isSepolia ? "Sepolia" : `Chain ${chainId}`} tone={isSepolia ? "green" : "red"} />
          </div>
          <FormInput label="Token ID" value={tokenId} inputMode="numeric" placeholder="Enter a numeric token ID" onChange={setTokenId} />
          <div className="verify-actions">
            <button className="primary-button" onClick={() => void verifyFromWallet()}>
              <ShieldCheck size={17} /> Verify On-Chain
            </button>
            {contractReady ? (
              <a className="secondary-button button-link" href={sepoliaAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
                Contract on Sepolia <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
          {error ? (
            <div className="notice error">
              <strong>Verification failed</strong><p>{error}</p>
              {error.includes("Sepolia") ? <button onClick={() => void switchToSepolia()}>Switch to Sepolia</button> : null}
            </div>
          ) : null}
          {status ? <div className="notice pending"><strong>{status}</strong></div> : null}
          {hasChallengeParams && !challenge ? (
            <div className="notice error">
              <strong>Gate proof unavailable</strong><p>This gate challenge is incomplete or invalid. Do not sign this link; ask Gate Check for a new QR.</p>
            </div>
          ) : null}
          <Link className="inline-link" href="/gate">Back to Gate Check</Link>
        </article>

        <article className="verify-result-card" aria-live="polite">
          {result && decision ? (
            <div className={`scan-result ${decision.tone}`}>
              <div className="scan-icon">{decision.tone === "approved" ? <CheckCircle2 size={29} /> : <AlertTriangle size={29} />}</div>
              <div>
                <p className="eyebrow">{decision.decision}</p>
                <h2>{decision.title}</h2>
                {result.exists ? (
                  <>
                    <div className="result-summary-row">
                      <span className="ticket-stub result-token-badge"><Ticket size={16} /> NFT #{result.tokenId.toString()}</span>
                      <span className="result-concert">{result.concertName}</span>
                    </div>
                    <p className="result-venue">{result.location} · {result.date}</p>
                    <dl className="ticket-details result-metadata-grid">
                      <div><dt>Owner</dt><dd className="address-value" title={result.owner}>{shortAddress(result.owner)}</dd></div>
                      <div><dt>Status</dt><dd>{ticketStatus?.label}</dd></div>
                      <div><dt>Blockchain</dt><dd>Ethereum Sepolia</dd></div>
                      <div><dt>Max resale</dt><dd>{formatEth(result.maxResalePrice)}</dd></div>
                      {result.listed ? <div><dt>Listed price</dt><dd>{formatEth(result.resalePrice)}</dd></div> : null}
                    </dl>
                    {challenge ? (
                      result.valid && challengeMatchesApp && challengeMatchesTicket ? (
                        <div className={`holder-proof-panel ${proofPayload && !challengeExpired ? "confirmed" : "pending"}`}>
                          <div className="holder-proof-copy">
                            <QrCode size={21} />
                            <div>
                              <p className="eyebrow">Gate holder proof</p>
                              <strong>{proofPayload && !challengeExpired ? "Proof QR ready for Gate Check" : challengeExpired ? "Gate challenge expired" : "Sign this one-time gate challenge"}</strong>
                              <p>{proofPayload && !challengeExpired ? "Show this QR to Gate Check. The staff device will verify the signer against the current NFT owner." : "MetaMask will ask for a signature only. It does not send a transaction or require payment."}</p>
                            </div>
                          </div>
                          {proofPayload && !challengeExpired ? (
                            <div className="holder-proof-qr">
                              <QRCodeSVG value={proofPayload} size={320} level="M" marginSize={4} title={`Gate holder proof for TicketChain token ${challenge.tokenId}`} />
                              <p>Present this QR before the challenge expires.</p>
                              <button type="button" className="secondary-button full" onClick={() => void handleCopyProof()}>
                                {proofCopied ? <><CheckCircle2 size={17} /> Proof copied</> : <><Copy size={17} /> Copy proof (if the QR won&apos;t scan)</>}
                              </button>
                            </div>
                          ) : (
                            <button className="primary-button" onClick={() => void signHolderProof()} disabled={signing || challengeExpired}>
                              <Wallet size={17} /> {signing ? "Awaiting MetaMask…" : challengeExpired ? "Challenge expired" : "Connect and sign proof"}
                            </button>
                          )}
                          {proofErrorMessage ? <p className="field-error">{proofErrorMessage}</p> : null}
                        </div>
                      ) : (
                        <div className="notice error">
                          <strong>Gate proof unavailable</strong>
                          <p>{!challengeMatchesApp ? "This challenge does not match the configured TicketChain contract on Sepolia." : !challengeMatchesTicket ? "Verify the ticket identified by this challenge before signing." : "This ticket is not valid for entry, so it cannot produce a holder proof."}</p>
                        </div>
                      )
                    ) : (
                      <div className={`ownership-proof ${ownerConfirmed ? "confirmed" : "unconfirmed"}`}>
                        <Wallet size={20} />
                        <div>
                          <p className="eyebrow">Holder wallet proof</p>
                          <strong>{address ? ownerConfirmed ? "Wallet ownership confirmed" : "This wallet does not own this NFT" : "Connect the holder wallet to compare ownership"}</strong>
                          <p>Public QR validation remains readable without connecting. Connecting compares the current MetaMask address to the owner read from Sepolia.</p>
                        </div>
                        {!address ? <button className="secondary-button" onClick={() => void connectWallet()}>Connect holder wallet</button> : null}
                      </div>
                    )}
                    <a className="inline-link" href={sepoliaNftUrl(CONTRACT_ADDRESS, result.tokenId)} target="_blank" rel="noreferrer">
                      View NFT on Sepolia <ExternalLink size={13} />
                    </a>
                  </>
                ) : <p>This token does not exist on the TicketChain contract.</p>}
              </div>
            </div>
          ) : (
            <div className="scan-result idle">
              <div className="scan-icon"><RefreshCw size={26} /></div>
              <div><p className="eyebrow">Awaiting verification</p><h2>Ready to scan</h2><p>A ticket QR code opens this page with its token ID already filled in.</p></div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
