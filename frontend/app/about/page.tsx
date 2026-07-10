import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CircleCheck, LockKeyhole, Route, Ticket, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const lifecycle = [
  ["Created", "Organizer defines supply and price rules."],
  ["Minted", "Each ticket becomes a unique ERC721 NFT."],
  ["Owned", "The current wallet is publicly verifiable."],
  ["Resold", "The contract enforces the maximum price."],
  ["Checked", "Gate staff verify ownership and usage."],
  ["Used", "Entry is recorded once and cannot be replayed."]
] as const;

export default function AboutPage() {
  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Product case"
        title="About TicketChain"
        description="A small but complete Web3 ticketing product built to demonstrate where public ownership and enforceable rules add real value."
        actions={<Link className="secondary-button button-link" href="/demo">Open Demo Guide <ArrowRight size={16} /></Link>}
      />

      <section className="about-grid">
        <article className="story-panel problem-panel"><Ticket size={23} /><p className="eyebrow">Problem</p><h2>Ticket trust breaks after the first sale.</h2><p>Copied files, duplicate resale and invisible ownership changes leave buyers guessing until they reach the venue.</p></article>
        <article className="story-panel solution-panel"><CircleCheck size={23} /><p className="eyebrow">Solution</p><h2>Make the ticket state public and enforceable.</h2><p>TicketChain connects authenticity, ownership, resale limits and entry status to one NFT record.</p></article>
        <article className="story-panel why-panel"><LockKeyhole size={23} /><p className="eyebrow">Why blockchain?</p><h2>The proof should not depend on TicketChain’s promise.</h2><p>Sepolia provides a shared record that a buyer, seller, organizer, venue and jury can inspect independently.</p></article>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Ticket lifecycle</p><h2>Rules follow the asset.</h2></div><Route size={23} /></div>
        <div className="about-lifecycle">
          {lifecycle.map(([title, description], index) => <article key={title}><span>{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}
        </div>
      </section>

      <section className="business-grid">
        <article className="workspace">
          <BadgeDollarSign size={23} />
          <p className="eyebrow">Unit economics</p>
          <h2>Simple value exchange</h2>
          <p>The MVP demonstrates primary-sale collection and seller-paid resale without adding a platform fee. A production model could charge organizers a setup or per-ticket service fee while keeping resale rules transparent.</p>
        </article>
        <article className="workspace">
          <Users size={23} />
          <p className="eyebrow">Go-to-market</p>
          <h2>Start where trust is visible</h2>
          <p>Pilot with student events, independent venues and small festivals where organizers can run one gate and explain the ownership benefit directly to attendees.</p>
        </article>
      </section>
    </div>
  );
}
