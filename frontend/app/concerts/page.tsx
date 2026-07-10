"use client";

import { useState } from "react";
import { Plus, ShieldCheck, Ticket } from "lucide-react";
import { ConcertCard } from "@/components/ConcertCard";
import { EmptyState } from "@/components/EmptyState";
import { FormInput } from "@/components/FormInput";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { emptyCreateForm } from "@/config/app";
import { useTicketChain } from "@/context/TicketChainContext";

export default function ConcertsPage() {
  const {
    address,
    concerts,
    loading,
    isOwner,
    isSepolia,
    transactionBusy,
    connectWallet,
    createConcert,
    mintTicket,
    buyTicket
  } = useTicketChain();
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [mintForm, setMintForm] = useState({ concertId: "1", to: "" });

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Organizer + primary sale"
        title="Concerts"
        description="Create event inventory, mint tickets to a wallet or buy directly from the organizer on Sepolia."
        actions={<StatusBadge label={isOwner ? "Organizer wallet" : "Public view"} tone={isOwner ? "green" : "blue"} />}
      />

      {!address ? (
        <EmptyState
          title="Connect a wallet to transact"
          description="Concert inventory can be read on Sepolia, but creating, minting and buying require MetaMask."
          action={<button className="primary-button" onClick={() => void connectWallet()}>Connect Wallet</button>}
        />
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Live inventory</p><h2>On-chain concerts</h2></div>
          <StatusBadge label={`${concerts.length} created`} tone="blue" />
        </div>
        {loading ? <div className="loading-state">Reading concerts from Sepolia…</div> : null}
        {!loading && concerts.length === 0 ? (
          <EmptyState title="No concerts created" description="Connect the organizer wallet and create the first concert for the demo." icon={<Ticket size={22} />} />
        ) : null}
        <div className="concert-grid">
          {concerts.map((concert) => (
            <ConcertCard
              concert={concert}
              key={concert.id.toString()}
              onBuy={(selected) => void buyTicket(selected)}
              disabled={!address || !isSepolia || transactionBusy}
            />
          ))}
        </div>
      </section>

      <section className="organizer-layout">
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
          {!isOwner ? <p className="helper-copy">Switch to the contract owner wallet to enable organizer actions.</p> : null}
        </article>
      </section>
    </div>
  );
}
