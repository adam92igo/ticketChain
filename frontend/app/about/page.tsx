import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CircleCheck, LockKeyhole, Route, Ticket, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const lifecycle = [
  ["Created", "Organizer defines supply and price rules."],
  ["Issued", "After a partner-confirmed sale, the organizer signs the NFT issuance in this MVP."],
  ["Owned", "The current wallet is publicly verifiable."],
  ["Resold", "The selected concert's marketplace shows real listings under the maximum price."],
  ["Checked", "Gate staff verify ownership and usage."],
  ["Used or expired", "Entry is recorded once, or concert cancellation expires all associated tickets."]
] as const;

export default function AboutPage() {
  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Product case"
        title="About TicketChain"
        description="A partner-sale, resale-control and ownership-verification feature within ticketing, built to demonstrate where public state and enforceable rules add real value."
        actions={<Link className="secondary-button button-link" href="/demo">Open Demo Guide <ArrowRight size={16} /></Link>}
      />

      <section className="about-grid">
        <article className="story-panel problem-panel"><Ticket size={23} /><p className="eyebrow">Problem</p><h2>Ticket trust breaks after the first sale.</h2><p>Copied files, uncontrolled resale and invisible ownership changes leave buyers and venues guessing at entry.</p></article>
        <article className="story-panel solution-panel"><CircleCheck size={23} /><p className="eyebrow">Solution</p><h2>Issue transparently, control resale and verify ownership.</h2><p>TicketChain turns a partner-confirmed sale into a visible organizer-signed NFT issuance, then adds capped resale, current-wallet visibility and one-time entry state.</p></article>
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
          <p>The MVP demonstrates primary-sale collection, an honest partner-sale issuance stand-in, and seller-paid resale without adding a platform fee. A production integration would replace the visible organizer signature with a secured partner webhook after payment confirmation.</p>
        </article>
        <article className="workspace">
          <Users size={23} />
          <p className="eyebrow">Go-to-market</p>
          <h2>Start where trust is visible</h2>
          <p>Pilot with student events, independent venues and small festivals where organizers can run one gate, cancel an event transparently, and explain the ownership benefit directly to attendees.</p>
        </article>
      </section>
    </div>
  );
}
