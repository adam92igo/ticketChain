"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Plus, ShieldCheck, Ticket } from "lucide-react";
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
    address,
    concerts,
    getConcertTickets,
    createConcert,
    cancelConcert,
    mintTicket,
    isOwner,
    transactionBusy
  } = useTicketChain();
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [partnerRecipient, setPartnerRecipient] = useState("");
  const [tickets, setTickets] = useState<Verification[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");

  const selectedConcert = useMemo(
    () => concerts.find((concert) => concert.id.toString() === initialConcertId) || null,
    [concerts, initialConcertId]
  );
  const canManageSelectedConcert = Boolean(selectedConcert && selectedConcert.active && isOwner && !transactionBusy);

  const cancelSelectedConcert = async () => {
    if (!selectedConcert || !selectedConcert.active || !isOwner || transactionBusy) return;

    const issuedTickets = selectedConcert.minted.toString();
    const confirmed = window.confirm(
      `Cancel ${selectedConcert.name}? ${issuedTickets} issued ticket${issuedTickets === "1" ? "" : "s"} will expire immediately and this cannot be undone.`
    );
    if (confirmed) await cancelConcert(selectedConcert.id.toString());
  };

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
        actions={
          <StatusBadge
            label={isOwner ? "Organizer wallet" : address ? "Create-only access" : "Not connected"}
            tone={isOwner ? "green" : address ? "amber" : "gray"}
          />
        }
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
                <div>
                  <p className="eyebrow">Issued ticket ledger</p>
                  <h2>{selectedConcert.name} · Event #{selectedConcert.id.toString()}</h2>
                </div>
                <StatusBadge
                  label={selectedConcert.active ? `${selectedConcert.minted.toString()} / ${selectedConcert.totalSupply.toString()} minted` : "Cancelled"}
                  tone={selectedConcert.active ? "blue" : "red"}
                />
              </div>
              <dl className="concert-metrics organizer-concert-summary">
                <div><dt>Location</dt><dd>{selectedConcert.location}</dd></div>
                <div><dt>Date</dt><dd>{selectedConcert.date}</dd></div>
                <div><dt>Primary price</dt><dd>{formatEth(selectedConcert.originalPrice)}</dd></div>
                <div><dt>Technical reference</dt><dd>Concert ID: {selectedConcert.id.toString()}</dd></div>
              </dl>
              {!selectedConcert.active ? (
                <div className="notice error organizer-cancelled-notice">
                  <strong>Concert cancelled</strong>
                  <p>{selectedConcert.minted.toString()} issued ticket{selectedConcert.minted.toString() === "1" ? "" : "s"} remain visible here as expired history.</p>
                </div>
              ) : null}
              {ticketsLoading ? <div className="loading-state">Reading issued tickets from Sepolia…</div> : null}
              {ticketError ? <div className="notice error"><strong>Could not load issued tickets</strong><p>{ticketError}</p></div> : null}
              {!ticketsLoading && !ticketError ? <OrganizerTicketTable tickets={tickets} /> : null}
            </article>
          )}

          <section className="ticket-actions-layout organizer-forms">
            <article className="workspace">
              <div className="section-heading">
                <div><p className="eyebrow">Organizer desk</p><h2>Create concert</h2></div>
                <StatusBadge label="Open to any wallet" tone={address ? "green" : "amber"} />
              </div>
              <p className="helper-copy">Anyone can create a concert to try the flow — issuing tickets, cancelling, and marking entry as used remain restricted to the organizer wallet.</p>
              <FormInput label="Name" value={createForm.name} onChange={(name) => setCreateForm({ ...createForm, name })} />
              <FormInput label="Location" value={createForm.location} onChange={(location) => setCreateForm({ ...createForm, location })} />
              <FormInput label="Date" value={createForm.date} onChange={(date) => setCreateForm({ ...createForm, date })} />
              <div className="two-col">
                <FormInput label="Original price ETH" value={createForm.originalPrice} inputMode="decimal" onChange={(originalPrice) => setCreateForm({ ...createForm, originalPrice })} />
                <FormInput label="Max resale ETH" value={createForm.maxResalePrice} inputMode="decimal" onChange={(maxResalePrice) => setCreateForm({ ...createForm, maxResalePrice })} />
              </div>
              <FormInput label="Total tickets" value={createForm.totalSupply} inputMode="numeric" onChange={(totalSupply) => setCreateForm({ ...createForm, totalSupply })} />
              <button className="primary-button full" onClick={() => void createConcert(createForm)} disabled={!address || transactionBusy}>
                <Plus size={17} /> Create Concert
              </button>
              {!address ? <p className="helper-copy">Connect any wallet to create a concert.</p> : null}
            </article>

            <article className="workspace organizer-partner-panel">
              <div className="section-heading">
                <div><p className="eyebrow">Partner sale</p><h2>Issue a ticket after partner sale</h2></div>
                <ShieldCheck size={21} />
              </div>
              {selectedConcert ? (
                <div className="selected-concert-reference">
                  <strong>{selectedConcert.name} · Event #{selectedConcert.id.toString()}</strong>
                  <span>Technical concert ID: {selectedConcert.id.toString()}</span>
                </div>
              ) : (
                <p className="helper-copy">Select a concert before issuing a partner-sale ticket.</p>
              )}
              <div className="partner-sale-explainer">
                <p><strong>What this demonstrates</strong></p>
                <ol className="partner-sale-steps">
                  <li><span>1</span><p>A ticketing partner confirms that the customer has paid outside TicketChain.</p></li>
                  <li><span>2</span><p>You enter the customer’s wallet for the selected concert.</p></li>
                  <li><span>3</span><p>Your MetaMask signature issues the real NFT ticket to that wallet on Sepolia.</p></li>
                </ol>
                <p className="helper-copy">For this MVP, you trigger the last step manually. In production, a secured partner webhook would request it after payment confirmation.</p>
              </div>
              <FormInput label="Recipient wallet" value={partnerRecipient} placeholder="0x…" onChange={setPartnerRecipient} />
              <button
                className="primary-button full"
                onClick={() => selectedConcert && void mintTicket(selectedConcert.id.toString(), partnerRecipient)}
                disabled={!canManageSelectedConcert}
              >
                <Ticket size={17} /> Confirm partner sale & issue ticket
              </button>
              {!isOwner ? <p className="helper-copy">Switch to the contract owner wallet to execute organizer transactions.</p> : null}
              {selectedConcert && !selectedConcert.active ? <p className="helper-copy">Cancelled concerts cannot issue new tickets.</p> : null}
            </article>

            <article className="workspace organizer-cancel-panel">
              <div className="section-heading">
                <div><p className="eyebrow">Concert status</p><h2>Cancellation control</h2></div>
                <Ban size={21} />
              </div>
              {selectedConcert ? (
                <>
                  <p>
                    Cancel {selectedConcert.name} · Event #{selectedConcert.id.toString()}. This will expire all {selectedConcert.minted.toString()} issued ticket{selectedConcert.minted.toString() === "1" ? "" : "s"}.
                  </p>
                  <button className="secondary-button full" onClick={() => void cancelSelectedConcert()} disabled={!canManageSelectedConcert}>
                    <Ban size={17} /> {selectedConcert.active ? "Cancel Concert" : "Concert Cancelled"}
                  </button>
                  {!isOwner ? <p className="helper-copy">Switch to the contract owner wallet to execute organizer transactions.</p> : null}
                  {selectedConcert.active ? <p className="helper-copy">You will be asked to confirm this irreversible on-chain cancellation.</p> : null}
                </>
              ) : (
                <p className="helper-copy">Select a concert to review its cancellation control.</p>
              )}
            </article>
          </section>
        </div>
      </section>
    </div>
  );
}
