"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BadgeDollarSign, ExternalLink, Ticket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CONTRACT_ADDRESS } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";
import { getFriendlyError } from "@/lib/errors";
import { formatEth, sepoliaNftUrl, shortAddress } from "@/lib/format";
import type { Verification } from "@/lib/ticketchainTypes";

export default function MarketplacePage() {
  const { address, concerts, isSepolia, transactionBusy, getConcertTickets, buyResaleTicket } = useTicketChain();
  const [concertId, setConcertId] = useState("");
  const [listings, setListings] = useState<Verification[]>([]);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const requestSequence = useRef(0);

  const selectConcert = async (nextConcertId: string) => {
    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    setConcertId(nextConcertId);
    setLocalError("");
    setConfirmation("");
    setListings([]);
    if (!nextConcertId) {
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      const tickets = await getConcertTickets(nextConcertId);
      if (requestId === requestSequence.current) {
        setListings(tickets.filter((ticket) => ticket.concertActive && ticket.listed && !ticket.used));
      }
    } catch (err) {
      if (requestId === requestSequence.current) {
        setLocalError(getFriendlyError(err, "Could not load resale tickets for this concert."));
      }
    } finally {
      if (requestId === requestSequence.current) setChecking(false);
    }
  };

  const purchase = async (ticket: Verification) => {
    const confirmed = await buyResaleTicket(ticket.tokenId.toString(), ticket.resalePrice);
    if (confirmed) {
      setListings((current) => current.filter((listing) => listing.tokenId !== ticket.tokenId));
      setConfirmation("Purchase confirmed. The ticket now appears in My Tickets for this wallet.");
    }
  };

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Concert resale"
        title="Marketplace"
        description="Choose a real concert, then browse its active on-chain resale listings and buy at the seller's exact price."
        actions={<StatusBadge label="MVP mode" tone="amber" />}
      />

      <section className="marketplace-limit">
        <AlertTriangle size={21} />
        <div>
          <h2>Resale is scoped to one concert.</h2>
          <p>TicketChain reads the selected concert&apos;s issued-ticket IDs only. A production marketplace would use an event indexer for broader discovery.</p>
        </div>
      </section>

      <section className="marketplace-layout">
        <article className="workspace lookup-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Choose an event</p><h2>Browse resale</h2></div>
            <Ticket size={21} />
          </div>
          <label className="field">
            <span>Concert</span>
            <select value={concertId} onChange={(event) => void selectConcert(event.target.value)} disabled={checking}>
              <option value="">Select a concert</option>
              {concerts.map((concert) => (
                <option key={concert.id.toString()} value={concert.id.toString()}>
                  {concert.name} · Event #{concert.id.toString()}{concert.active ? "" : " (Cancelled)"}
                </option>
              ))}
            </select>
          </label>
          <p className="helper-copy">Only active, listed and unused tickets for the selected concert are shown.</p>
        </article>

        <article className="workspace marketplace-result-panel">
          {!concertId && !localError && !confirmation ? (
            <EmptyState title="No concert selected" description="Select an on-chain concert to load its real resale listings." icon={<Ticket size={22} />} />
          ) : null}
          {checking ? <div className="loading-state">Reading resale listings from Sepolia…</div> : null}
          {localError ? <div className="notice error"><strong>Listing check failed</strong><p>{localError}</p></div> : null}
          {confirmation ? (
            <div className="notice success">
              <strong>Ticket purchased</strong><p>{confirmation}</p>
              <Link className="inline-link" href="/tickets">Open My Tickets</Link>
            </div>
          ) : null}
          {concertId && !checking && !localError && listings.length === 0 ? (
            <EmptyState title="No tickets are listed for resale for this concert." description="Choose another concert or check back after a ticket holder lists an active ticket." />
          ) : null}
          {listings.map((ticket) => {
            const isOwner = Boolean(address) && ticket.owner.toLowerCase() === address.toLowerCase();
            return (
              <div className={`market-ticket ${isOwner ? "owned" : "available"}`} key={ticket.tokenId.toString()}>
                <div className="ticket-card-topline">
                  <span className="ticket-stub"><Ticket size={17} /> Bill #{ticket.tokenId.toString()}</span>
                  <StatusBadge label={isOwner ? "Your listing" : "Listed for resale"} tone={isOwner ? "amber" : "green"} />
                </div>
                <h2>{ticket.concertName}</h2>
                <p>{ticket.location} · {ticket.date}</p>
                <dl className="ticket-details">
                  <div><dt>Seller</dt><dd className="address-value" title={ticket.owner}>{shortAddress(ticket.owner)}</dd></div>
                  <div><dt>Resale price</dt><dd>{formatEth(ticket.resalePrice)}</dd></div>
                  <div><dt>Maximum resale</dt><dd>{formatEth(ticket.maxResalePrice)}</dd></div>
                </dl>
                <a className="inline-link" href={sepoliaNftUrl(CONTRACT_ADDRESS, ticket.tokenId)} target="_blank" rel="noreferrer">
                  View NFT on Sepolia <ExternalLink size={13} />
                </a>
                {isOwner ? <p className="helper-copy">Switch to a buyer wallet to purchase this listing.</p> : (
                  <button className="primary-button full" onClick={() => void purchase(ticket)} disabled={!address || !isSepolia || transactionBusy}>
                    <BadgeDollarSign size={17} /> Buy for {formatEth(ticket.resalePrice)}
                  </button>
                )}
                {!isOwner && !address ? <p className="field-error">Connect the buyer wallet before purchasing.</p> : null}
              </div>
            );
          })}
        </article>
      </section>
    </div>
  );
}
