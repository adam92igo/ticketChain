"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { BadgeDollarSign, MapPin, Send, Ticket } from "lucide-react";
import { FormInput } from "@/components/FormInput";
import { QRCodeBlock } from "@/components/QRCodeBlock";
import { StatusBadge } from "@/components/StatusBadge";
import { formatEth, shortAddress } from "@/lib/format";
import { getTicketStatus } from "@/lib/ticketState";
import type { OwnedTicket } from "@/lib/ticketchainTypes";

export function TicketCard({
  ticket,
  transactionBusy,
  onList,
  onTransfer
}: {
  ticket: OwnedTicket;
  transactionBusy: boolean;
  onList: (tokenId: string, price: string) => Promise<boolean>;
  onTransfer: (tokenId: string, to: string, declaredPrice: string) => Promise<boolean>;
}) {
  const status = getTicketStatus(ticket);
  const [showListing, setShowListing] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [resalePrice, setResalePrice] = useState(ticket.listed ? ethers.formatEther(ticket.resalePrice) : "");
  const [recipient, setRecipient] = useState("");
  const [declaredPrice, setDeclaredPrice] = useState("0");
  const actionable = ticket.concertActive && !ticket.used;

  const submitListing = async () => {
    if (await onList(ticket.tokenId.toString(), resalePrice)) setShowListing(false);
  };

  const submitTransfer = async () => {
    if (await onTransfer(ticket.tokenId.toString(), recipient, declaredPrice)) setShowTransfer(false);
  };

  const toggleListing = () => {
    setShowTransfer(false);
    setResalePrice(ticket.listed ? ethers.formatEther(ticket.resalePrice) : "");
    setShowListing((visible) => !visible);
  };

  const toggleTransfer = () => {
    setShowListing(false);
    setShowTransfer((visible) => !visible);
  };

  return (
    <article className="owned-ticket ticket-list-item">
      <div className="ticket-list-summary">
        <div className="ticket-list-title">
          <span className="ticket-stub"><Ticket size={17} /> Bill #{ticket.tokenId.toString()}</span>
          <div>
            <h3>{ticket.concertName}</h3>
            <p className="card-location"><MapPin size={15} /> {ticket.location} · {ticket.date}</p>
          </div>
        </div>
        <div className="ticket-list-status">
          <StatusBadge label={status.label} tone={status.tone} />
          <span><small>Max resale</small>{formatEth(ticket.maxResalePrice)}</span>
          <span><small>Listing</small>{ticket.listed ? formatEth(ticket.resalePrice) : "Not listed"}</span>
        </div>
      </div>
      <details className="ticket-list-details">
        <summary>Open ticket, QR and actions</summary>
        <div className="ticket-list-expanded">
          <dl className="ticket-details">
            <div><dt>Owner</dt><dd className="address-value" title={ticket.owner}>{shortAddress(ticket.owner)}</dd></div>
            <div><dt>Max resale</dt><dd>{formatEth(ticket.maxResalePrice)}</dd></div>
            {ticket.listed ? <div><dt>Listed at</dt><dd>{formatEth(ticket.resalePrice)}</dd></div> : null}
          </dl>
          <QRCodeBlock tokenId={ticket.tokenId} />
          <details className="ticket-technical-reference">
            <summary>Technical reference</summary>
            <span>Token ID: {ticket.tokenId.toString()}</span>
            <span>Concert ID: {ticket.concertId.toString()}</span>
          </details>
          {actionable ? (
            <div className="ticket-actions">
              <div className="ticket-action-buttons">
                <button className="secondary-button compact-button" onClick={toggleListing} disabled={transactionBusy}>
                  <BadgeDollarSign size={15} /> {ticket.listed ? "Update resale" : "List for resale"}
                </button>
                <button className="secondary-button compact-button" onClick={toggleTransfer} disabled={transactionBusy}>
                  <Send size={15} /> Transfer
                </button>
              </div>
              {showListing ? (
                <div className="ticket-action-form">
                  <FormInput label="Resale price ETH" value={resalePrice} inputMode="decimal" placeholder="e.g. 0.03" onChange={setResalePrice} />
                  <button className="primary-button full" onClick={() => void submitListing()} disabled={transactionBusy || !resalePrice.trim()}>
                    <BadgeDollarSign size={16} /> {ticket.listed ? "Update Listing" : "List Ticket"}
                  </button>
                </div>
              ) : null}
              {showTransfer ? (
                <div className="ticket-action-form">
                  <FormInput label="Recipient wallet" value={recipient} placeholder="0x…" onChange={setRecipient} />
                  <FormInput label="Declared price ETH" value={declaredPrice} inputMode="decimal" onChange={setDeclaredPrice} />
                  <button className="primary-button full" onClick={() => void submitTransfer()} disabled={transactionBusy || !recipient.trim() || !declaredPrice.trim()}>
                    <Send size={16} /> Transfer Ticket
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </details>
    </article>
  );
}
