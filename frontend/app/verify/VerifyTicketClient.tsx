"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { FormInput } from "@/components/FormInput";
import { StatusBadge } from "@/components/StatusBadge";
import { CONTRACT_ADDRESS } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";
import { getFriendlyError } from "@/lib/errors";
import { formatEth, sepoliaAddressUrl, sepoliaNftUrl, shortAddress } from "@/lib/format";
import { isTicketOwner } from "@/lib/ownership";
import { getGateDecision } from "@/lib/ticketState";
import type { Verification } from "@/lib/ticketchainTypes";

export default function VerifyTicketClient({ initialTokenId }: { initialTokenId: string }) {
  const { address, chainId, connectWallet, isSepolia, contractReady, verifyTicket, switchToSepolia } = useTicketChain();
  const [tokenId, setTokenId] = useState(initialTokenId);
  const [result, setResult] = useState<Verification | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const decision = useMemo(() => result ? getGateDecision(result) : null, [result]);
  const ownerConfirmed = Boolean(result?.exists) && isTicketOwner(address, result?.owner || "");

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
                      <div><dt>Status</dt><dd>{result.used ? "Used" : result.listed ? "For Sale" : "Valid"}</dd></div>
                      <div><dt>Blockchain</dt><dd>Ethereum Sepolia</dd></div>
                      <div><dt>Max resale</dt><dd>{formatEth(result.maxResalePrice)}</dd></div>
                      {result.listed ? <div><dt>Listed price</dt><dd>{formatEth(result.resalePrice)}</dd></div> : null}
                    </dl>
                    <div className={`ownership-proof ${ownerConfirmed ? "confirmed" : "unconfirmed"}`}>
                      <Wallet size={20} />
                      <div>
                        <p className="eyebrow">Holder wallet proof</p>
                        <strong>{address ? ownerConfirmed ? "Wallet ownership confirmed" : "This wallet does not own this NFT" : "Connect the holder wallet to compare ownership"}</strong>
                        <p>Public QR validation remains readable without connecting. Connecting compares the current MetaMask address to the owner read from Sepolia.</p>
                      </div>
                      {!address ? <button className="secondary-button" onClick={() => void connectWallet()}>Connect holder wallet</button> : null}
                    </div>
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
