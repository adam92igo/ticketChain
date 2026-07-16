"use client";

import { Ticket } from "lucide-react";
import { ConcertCard } from "@/components/ConcertCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useTicketChain } from "@/context/TicketChainContext";

export default function ConcertsPage() {
  const {
    address,
    concerts,
    loading,
    isSepolia,
    transactionBusy,
    connectWallet,
    buyTicket
  } = useTicketChain();

  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Client ticketing"
        title="Events"
        description="Browse real concerts on Sepolia and receive an NFT ticket in your connected wallet."
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

    </div>
  );
}
