"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BadgeDollarSign, ExternalLink, Search, Ticket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FormInput } from "@/components/FormInput";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CONTRACT_ADDRESS } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";
import { getFriendlyError } from "@/lib/errors";
import { formatEth, sepoliaNftUrl, shortAddress } from "@/lib/format";
import { getMarketplaceState, normalizeTokenId } from "@/lib/ticketState";
import type { Verification } from "@/lib/ticketchainTypes";

const marketplaceCopy = {
  invalid: ["Invalid ticket", "This token does not exist on the TicketChain contract."],
  used: ["Already used", "Used tickets cannot be resold."],
  "not-listed": ["Not listed", "This ticket exists, but its owner has not listed it for resale."],
  owned: ["Your listing", "This ticket is listed by the connected wallet. Switch to the buyer wallet to purchase it."],
  available: ["Listed for resale", "The price below was read directly from the TicketChain contract."]
} as const;

export default function MarketplacePage() {
  const { address, isSepolia, transactionBusy, verifyTicket, buyResaleTicket } = useTicketChain();
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState<Verification | null>(null);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const state = useMemo(
    () => result ? getMarketplaceState({ ...result, viewer: address }) : null,
    [address, result]
  );

  const checkListing = async () => {
    setLocalError("");
    setConfirmation("");
    setResult(null);
    setChecking(true);
    try {
      normalizeTokenId(tokenId);
      setResult(await verifyTicket(tokenId));
    } catch (err) {
      setLocalError(getFriendlyError(err, "Could not inspect this ticket."));
    } finally {
      setChecking(false);
    }
  };

  const purchase = async () => {
    if (!result || state !== "available") return;
    const confirmed = await buyResaleTicket(result.tokenId.toString(), result.resalePrice);
    if (confirmed) {
      setResult(null);
      setTokenId("");
      setConfirmation("Purchase confirmed. The ticket now appears in My Tickets for this wallet.");
    }
  };

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Exact-token resale"
        title="Marketplace"
        description="Inspect a known token ID, confirm its on-chain listing and buy it at the exact price set by the owner."
        actions={<StatusBadge label="MVP mode" tone="amber" />}
      />

      <section className="marketplace-limit">
        <AlertTriangle size={21} />
        <div>
          <h2>Discovery is intentionally simple.</h2>
          <p>In this MVP, resale is available through exact ticket IDs. A production version would index listed tickets through contract events or a backend indexer.</p>
        </div>
      </section>

      <section className="marketplace-layout">
        <article className="workspace lookup-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Listing lookup</p><h2>Check a token</h2></div>
            <Search size={21} />
          </div>
          <FormInput label="Token ID" value={tokenId} inputMode="numeric" placeholder="e.g. 1" onChange={setTokenId} />
          <button className="primary-button full" onClick={() => void checkListing()} disabled={checking || !tokenId}>
            <Search size={17} /> {checking ? "Checking Sepolia…" : "Check Listing"}
          </button>
          <p className="helper-copy">Ask the seller for the exact token ID shown on their My Tickets card.</p>
        </article>

        <article className="workspace marketplace-result-panel">
          {!result && !localError && !confirmation ? (
            <EmptyState title="No ticket selected" description="Enter an exact token ID to inspect its real resale state on-chain." icon={<Ticket size={22} />} />
          ) : null}
          {localError ? <div className="notice error"><strong>Listing check failed</strong><p>{localError}</p></div> : null}
          {confirmation ? (
            <div className="notice success">
              <strong>Ticket purchased</strong><p>{confirmation}</p>
              <Link className="inline-link" href="/tickets">Open My Tickets</Link>
            </div>
          ) : null}
          {result && state ? (
            <div className={`market-ticket ${state}`}>
              <div className="ticket-card-topline">
                <span className="ticket-stub"><Ticket size={17} /> Token #{result.tokenId.toString()}</span>
                <StatusBadge
                  label={marketplaceCopy[state][0]}
                  tone={state === "available" ? "green" : state === "owned" ? "amber" : state === "not-listed" ? "gray" : "red"}
                />
              </div>
              <h2>{result.exists ? result.concertName : marketplaceCopy[state][0]}</h2>
              <p>{marketplaceCopy[state][1]}</p>
              {result.exists ? (
                <dl className="ticket-details">
                  <div><dt>Owner / seller</dt><dd className="address-value" title={result.owner}>{shortAddress(result.owner)}</dd></div>
                  <div><dt>Resale price</dt><dd>{result.listed ? formatEth(result.resalePrice) : "Not listed"}</dd></div>
                  <div><dt>Maximum resale</dt><dd>{formatEth(result.maxResalePrice)}</dd></div>
                </dl>
              ) : null}
              {result.exists ? (
                <a className="inline-link" href={sepoliaNftUrl(CONTRACT_ADDRESS, result.tokenId)} target="_blank" rel="noreferrer">
                  View NFT on Sepolia <ExternalLink size={13} />
                </a>
              ) : null}
              {state === "available" ? (
                <button className="primary-button full" onClick={() => void purchase()} disabled={!address || !isSepolia || transactionBusy}>
                  <BadgeDollarSign size={17} /> Buy for {formatEth(result.resalePrice)}
                </button>
              ) : null}
              {state === "available" && !address ? <p className="field-error">Connect the buyer wallet before purchasing.</p> : null}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
