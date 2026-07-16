"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
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
        {myTickets.map((ticket) => (
          <TicketCard
            ticket={ticket}
            transactionBusy={transactionBusy}
            onList={listTicket}
            onTransfer={transferTicket}
            key={ticket.tokenId.toString()}
          />
        ))}
      </section>
    </div>
  );
}
