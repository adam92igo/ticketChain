"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ShieldCheck, Ticket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FormInput } from "@/components/FormInput";
import { OrganizerConcertSelector } from "@/components/OrganizerConcertSelector";
import { OrganizerTicketTable } from "@/components/OrganizerTicketTable";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { emptyCreateForm } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";
import { getFriendlyError } from "@/lib/errors";
import { formatEth } from "@/lib/format";
import type { Verification } from "@/lib/ticketchainTypes";

export default function OrganizerClient({ initialConcertId }: { initialConcertId: string }) {
  const {
    concerts,
    getConcertTickets,
    createConcert,
    mintTicket,
    isOwner,
    transactionBusy
  } = useTicketChain();
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [mintForm, setMintForm] = useState({ concertId: "1", to: "" });
  const [tickets, setTickets] = useState<Verification[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");

  const selectedConcert = useMemo(
    () => concerts.find((concert) => concert.id.toString() === initialConcertId) || null,
    [concerts, initialConcertId]
  );

  useEffect(() => {
    if (!selectedConcert) {
      setTickets([]);
      setTicketError("");
      return;
    }
    let active = true;
    setTicketsLoading(true);
    setTicketError("");
    void getConcertTickets(selectedConcert.id.toString())
      .then((records) => { if (active) setTickets(records); })
      .catch((err) => { if (active) setTicketError(getFriendlyError(err, "Could not load issued tickets.")); })
      .finally(() => { if (active) setTicketsLoading(false); });
    return () => { active = false; };
  }, [getConcertTickets, selectedConcert]);

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Organizer operations"
        title="Organizer Portal"
        description="Manage real Sepolia concert inventory, issue tickets, and review the current on-chain status of every issued NFT."
        actions={<StatusBadge label={isOwner ? "Organizer wallet" : "Read-only view"} tone={isOwner ? "green" : "amber"} />}
      />

      <section className="organizer-layout">
        <OrganizerConcertSelector concerts={concerts} selectedConcertId={initialConcertId} />

        <div className="organizer-content">
          {!selectedConcert ? (
            <EmptyState
              title="Select a concert"
              description="Choose a real on-chain concert from the organizer list to review its issued NFT tickets."
            />
          ) : (
            <article className="workspace">
              <div className="section-heading">
                <div><p className="eyebrow">Issued ticket ledger</p><h2>{selectedConcert.name}</h2></div>
                <StatusBadge label={`${selectedConcert.minted.toString()} / ${selectedConcert.totalSupply.toString()} minted`} tone="blue" />
              </div>
              <dl className="concert-metrics organizer-concert-summary">
                <div><dt>Location</dt><dd>{selectedConcert.location}</dd></div>
                <div><dt>Date</dt><dd>{selectedConcert.date}</dd></div>
                <div><dt>Primary price</dt><dd>{formatEth(selectedConcert.originalPrice)}</dd></div>
              </dl>
              {ticketsLoading ? <div className="loading-state">Reading issued tickets from Sepolia…</div> : null}
              {ticketError ? <div className="notice error"><strong>Could not load issued tickets</strong><p>{ticketError}</p></div> : null}
              {!ticketsLoading && !ticketError ? <OrganizerTicketTable tickets={tickets} /> : null}
            </article>
          )}

          <section className="ticket-actions-layout organizer-forms">
            <article className="workspace">
              <div className="section-heading">
                <div><p className="eyebrow">Organizer desk</p><h2>Create concert</h2></div>
                <StatusBadge label="Owner only" tone={isOwner ? "green" : "amber"} />
              </div>
              <FormInput label="Name" value={createForm.name} onChange={(name) => setCreateForm({ ...createForm, name })} />
              <FormInput label="Location" value={createForm.location} onChange={(location) => setCreateForm({ ...createForm, location })} />
              <FormInput label="Date" value={createForm.date} onChange={(date) => setCreateForm({ ...createForm, date })} />
              <div className="two-col">
                <FormInput label="Original price ETH" value={createForm.originalPrice} inputMode="decimal" onChange={(originalPrice) => setCreateForm({ ...createForm, originalPrice })} />
                <FormInput label="Max resale ETH" value={createForm.maxResalePrice} inputMode="decimal" onChange={(maxResalePrice) => setCreateForm({ ...createForm, maxResalePrice })} />
              </div>
              <FormInput label="Total tickets" value={createForm.totalSupply} inputMode="numeric" onChange={(totalSupply) => setCreateForm({ ...createForm, totalSupply })} />
              <button className="primary-button full" onClick={() => void createConcert(createForm)} disabled={!isOwner || transactionBusy}>
                <Plus size={17} /> Create Concert
              </button>
              {!isOwner ? <p className="helper-copy">Switch to the contract owner wallet to execute organizer transactions.</p> : null}
            </article>

            <article className="workspace">
              <div className="section-heading">
                <div><p className="eyebrow">Primary issue</p><h2>Mint to wallet</h2></div>
                <ShieldCheck size={21} />
              </div>
              <p>Issue a ticket directly to a known attendee wallet without changing the primary-sale contract rules.</p>
              <FormInput label="Concert ID" value={mintForm.concertId} inputMode="numeric" onChange={(concertId) => setMintForm({ ...mintForm, concertId })} />
              <FormInput label="Recipient wallet" value={mintForm.to} placeholder="0x…" onChange={(to) => setMintForm({ ...mintForm, to })} />
              <button className="primary-button full" onClick={() => void mintTicket(mintForm.concertId, mintForm.to)} disabled={!isOwner || transactionBusy}>
                <Ticket size={17} /> Mint Ticket
              </button>
              {!isOwner ? <p className="helper-copy">Switch to the contract owner wallet to execute organizer transactions.</p> : null}
            </article>
          </section>
        </div>
      </section>
    </div>
  );
}
