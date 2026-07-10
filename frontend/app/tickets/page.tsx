"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeDollarSign, Send, Ticket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FormInput } from "@/components/FormInput";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TicketCard } from "@/components/TicketCard";
import { useTicketChain } from "@/context/TicketChainContext";

export default function TicketsPage() {
  const {
    address,
    myTickets,
    loading,
    isSepolia,
    transactionBusy,
    connectWallet,
    listTicket,
    transferTicket
  } = useTicketChain();
  const [resaleForm, setResaleForm] = useState({ tokenId: "", price: "0.03" });
  const [transferForm, setTransferForm] = useState({ tokenId: "", to: "", declaredPrice: "0" });

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Fan wallet"
        title="My Tickets"
        description="Your on-chain ticket wallet: ownership, usage status, resale rules and the QR link staff scan at the gate."
        actions={<StatusBadge label={`${myTickets.length} owned`} tone="blue" />}
      />

      {!address ? (
        <EmptyState
          title="Wallet not connected"
          description="Connect MetaMask on Sepolia to load the NFTs owned by this wallet."
          action={<button className="primary-button" onClick={() => void connectWallet()}>Connect Wallet</button>}
        />
      ) : null}
      {address && !isSepolia ? (
        <EmptyState title="Tickets are on Sepolia" description="Use the network control above to switch MetaMask before loading this wallet's tickets." />
      ) : null}
      {address && isSepolia && loading ? <div className="loading-state">Reading your tickets from Sepolia…</div> : null}
      {address && isSepolia && !loading && myTickets.length === 0 ? (
        <EmptyState
          title="No tickets owned"
          description="Buy a primary ticket or ask the organizer to mint one to this wallet."
          icon={<Ticket size={22} />}
          action={<Link className="secondary-button button-link" href="/concerts">Browse Concerts</Link>}
        />
      ) : null}

      <section className="ticket-grid">
        {myTickets.map((ticket) => <TicketCard ticket={ticket} key={ticket.tokenId.toString()} />)}
      </section>

      {address ? (
        <section className="ticket-actions-layout">
          <article className="workspace">
            <div className="section-heading">
              <div><p className="eyebrow">Secondary market</p><h2>List a ticket</h2></div>
              <StatusBadge label="Price cap enforced" tone="gray" />
            </div>
            <p>List one of your valid tickets. Buyers complete the purchase from Marketplace using its exact token ID.</p>
            <FormInput label="Token ID" value={resaleForm.tokenId} inputMode="numeric" onChange={(tokenId) => setResaleForm({ ...resaleForm, tokenId })} />
            <FormInput label="Price ETH" value={resaleForm.price} inputMode="decimal" onChange={(price) => setResaleForm({ ...resaleForm, price })} />
            <button className="primary-button full" onClick={() => void listTicket(resaleForm.tokenId, resaleForm.price)} disabled={transactionBusy || !isSepolia}>
              <BadgeDollarSign size={17} /> List Ticket
            </button>
            <Link className="inline-link" href="/marketplace">Open Marketplace</Link>
          </article>

          <article className="workspace">
            <div className="section-heading">
              <div><p className="eyebrow">Controlled move</p><h2>Transfer ticket</h2></div>
              <Send size={21} />
            </div>
            <p>Transfer ownership directly. The declared price must remain within the ticket's on-chain resale ceiling.</p>
            <FormInput label="Token ID" value={transferForm.tokenId} inputMode="numeric" onChange={(tokenId) => setTransferForm({ ...transferForm, tokenId })} />
            <FormInput label="Recipient wallet" value={transferForm.to} placeholder="0x…" onChange={(to) => setTransferForm({ ...transferForm, to })} />
            <FormInput label="Declared price ETH" value={transferForm.declaredPrice} inputMode="decimal" onChange={(declaredPrice) => setTransferForm({ ...transferForm, declaredPrice })} />
            <button
              className="primary-button full"
              onClick={() => void transferTicket(transferForm.tokenId, transferForm.to, transferForm.declaredPrice)}
              disabled={transactionBusy || !isSepolia}
            >
              <Send size={17} /> Transfer Ticket
            </button>
          </article>
        </section>
      ) : null}
    </div>
  );
}
