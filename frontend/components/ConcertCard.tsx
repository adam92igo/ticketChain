"use client";

import { BadgeDollarSign, MapPin, Ticket } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatEth } from "@/lib/format";
import type { Concert } from "@/lib/ticketchainTypes";

export function ConcertCard({
  concert,
  onBuy,
  disabled
}: {
  concert: Concert;
  onBuy: (concert: Concert) => void;
  disabled: boolean;
}) {
  const soldOut = concert.minted >= concert.totalSupply;

  return (
    <article className="concert-card">
      <div className="ticket-card-topline">
        <span className="ticket-stub"><Ticket size={17} /> Concert #{concert.id.toString()}</span>
        <StatusBadge label={!concert.active ? "Cancelled" : soldOut ? "Sold out" : "On sale"} tone={!concert.active || soldOut ? "red" : "green"} />
      </div>
      <h3>{concert.name}</h3>
      <p className="card-location"><MapPin size={15} /> {concert.location}</p>
      <p>{concert.date}</p>
      <dl className="concert-metrics">
        <div><dt>Original</dt><dd>{formatEth(concert.originalPrice)}</dd></div>
        <div><dt>Max resale</dt><dd>{formatEth(concert.maxResalePrice)}</dd></div>
        <div><dt>Minted</dt><dd>{concert.minted.toString()} / {concert.totalSupply.toString()}</dd></div>
      </dl>
      <button className="primary-button full" onClick={() => onBuy(concert)} disabled={disabled || soldOut || !concert.active}>
        <BadgeDollarSign size={17} />
        {!concert.active ? "Concert Cancelled" : soldOut ? "Sold Out" : "Buy Ticket"}
      </button>
    </article>
  );
}
