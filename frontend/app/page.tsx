import Link from "next/link";
import { ArrowRight, CircleCheck, LockKeyhole, ScanLine, Ticket } from "lucide-react";

const lifecycle = ["Create", "Mint", "Own", "Resell", "Verify", "Use"];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">NFT ticketing for live events</p>
          <h1>TicketChain</h1>
          <p className="hero-slogan">Authentic concert tickets, verified on-chain.</p>
          <p className="hero-text">
            A focused Sepolia demo where every ticket is a unique NFT, ownership is public, resale is capped and entry can happen only once.
          </p>
          <div className="hero-actions">
            <Link className="primary-button button-link" href="/concerts">
              Launch Demo <ArrowRight size={18} />
            </Link>
            <Link className="secondary-button button-link" href="/verify">
              <ScanLine size={18} /> Verify a Ticket
            </Link>
          </div>
        </div>
        <div className="hero-proof-strip" aria-label="TicketChain guarantees">
          <span>Unique NFT</span>
          <span>Public owner</span>
          <span>Resale cap</span>
          <span>One-time entry</span>
        </div>
      </section>

      <section className="home-story-grid" aria-label="TicketChain overview">
        <article className="story-panel problem-panel">
          <span className="story-icon"><Ticket size={21} /></span>
          <p className="eyebrow">The problem</p>
          <h2>A PDF ticket can be copied. Trust cannot.</h2>
          <p>Buyers face forged tickets, duplicate resales and abusive pricing without a public source of truth.</p>
        </article>
        <article className="story-panel solution-panel">
          <span className="story-icon"><CircleCheck size={21} /></span>
          <p className="eyebrow">The solution</p>
          <h2>Turn every ticket into verifiable ownership.</h2>
          <p>TicketChain binds a concert, wallet owner, resale ceiling and one-time usage state to an ERC721 NFT.</p>
        </article>
        <article className="story-panel why-panel">
          <span className="story-icon"><LockKeyhole size={21} /></span>
          <p className="eyebrow">Why blockchain?</p>
          <h2>Public proof travels with the ticket.</h2>
          <p>Anyone can inspect authenticity and current ownership without trusting a screenshot or a single ticketing database.</p>
          <Link href="/about">Read the product case <ArrowRight size={14} /></Link>
        </article>
      </section>

      <section className="lifecycle-preview">
        <div>
          <p className="eyebrow">Product lifecycle</p>
          <h2>One public record, from organizer to gate.</h2>
          <p>Each stage in the demo reads or writes the same Sepolia ticket state.</p>
        </div>
        <ol className="lifecycle-track">
          {lifecycle.map((step, index) => (
            <li key={step}><span>{index + 1}</span>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
