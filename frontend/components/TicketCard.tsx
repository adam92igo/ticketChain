import { MapPin, Ticket } from "lucide-react";
import { QRCodeBlock } from "@/components/QRCodeBlock";
import { StatusBadge } from "@/components/StatusBadge";
import { formatEth, shortAddress } from "@/lib/format";
import { getTicketStatus } from "@/lib/ticketState";
import type { OwnedTicket } from "@/lib/ticketchainTypes";

export function TicketCard({ ticket }: { ticket: OwnedTicket }) {
  const status = getTicketStatus(ticket);

  return (
    <article className="owned-ticket">
      <div className="ticket-card-topline">
        <span className="ticket-stub"><Ticket size={17} /> Token #{ticket.tokenId.toString()}</span>
        <StatusBadge label={status.label} tone={status.tone} />
      </div>
      <h3>{ticket.concertName}</h3>
      <p className="card-location"><MapPin size={15} /> {ticket.location} · {ticket.date}</p>
      <dl className="ticket-details">
        <div><dt>Owner</dt><dd>{shortAddress(ticket.owner)}</dd></div>
        <div><dt>Max resale</dt><dd>{formatEth(ticket.maxResalePrice)}</dd></div>
        {ticket.listed ? <div><dt>Listed at</dt><dd>{formatEth(ticket.resalePrice)}</dd></div> : null}
      </dl>
      <QRCodeBlock tokenId={ticket.tokenId} />
    </article>
  );
}
