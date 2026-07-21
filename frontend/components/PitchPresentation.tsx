"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  LockKeyhole,
  ShieldCheck,
  Ticket,
  Users,
  WalletCards
} from "lucide-react";
import { CONTRACT_ADDRESS } from "@/config/app";
import { sepoliaAddressUrl } from "@/lib/format";
import { createPitchDemoLinks } from "@/lib/pitchLinks";
import { parsePitchScrollPosition } from "@/lib/pitchScroll";

const pitchScrollStorageKey = "ticketchain:pitch-scroll";

function PitchDemoLink({
  href,
  children,
  className
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const saveScrollPosition = () => {
    const path = `${window.location.pathname}${window.location.search}`;
    window.sessionStorage.setItem(pitchScrollStorageKey, JSON.stringify({ path, y: window.scrollY }));
  };

  return <Link href={href} className={className} onClick={saveScrollPosition}>{children}</Link>;
}

function SlideTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="pitch-slide-title"><p>{eyebrow}</p><h2>{title}</h2></div>;
}

export function PitchPresentation({ concertId, tokenId }: { concertId: string; tokenId: string }) {
  const presentationRef = useRef<HTMLElement>(null);
  const demoLinks = useMemo(() => createPitchDemoLinks({ concertId, tokenId }), [concertId, tokenId]);
  const hasDemoContext = demoLinks.organizer !== "/organizer" || demoLinks.verify !== "/verify";

  useEffect(() => {
    const path = `${window.location.pathname}${window.location.search}`;
    const savedPosition = parsePitchScrollPosition(window.sessionStorage.getItem(pitchScrollStorageKey), path);
    if (savedPosition === null) return;

    const restoreFrame = window.requestAnimationFrame(() => window.scrollTo({ top: savedPosition, behavior: "auto" }));
    window.sessionStorage.removeItem(pitchScrollStorageKey);
    return () => window.cancelAnimationFrame(restoreFrame);
  }, []);

  useEffect(() => {
    const sections = presentationRef.current?.querySelectorAll<HTMLElement>(".pitch-landing-section");
    if (!sections?.length) return;

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      }),
      { threshold: 0.16 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const slides = [
    <section className="pitch-slide pitch-cover" key="cover">
      <div className="pitch-cover-copy">
        <p className="pitch-overline">BTS · FINTECH SUMMER SCHOOL — GENÈVE</p>
        <h1>TicketChain</h1>
        <p className="pitch-cover-tagline">Authentic concert tickets, verified on-chain.</p>
        <p>Concert tickets you can&apos;t copy, can&apos;t overprice on resale, and can&apos;t use twice.</p>
        <div className="pitch-cover-pills"><span>Sepolia testnet</span><span>Live MVP</span><span>Live demo</span></div>
      </div>
      <div className="pitch-cover-image" role="img" aria-label="TicketChain concert ticket at a live venue" />
      <p className="pitch-cover-footer">Practical project · A working blockchain application — built, validated, presented live.</p>
    </section>,

    <section className="pitch-slide" key="problem">
      <SlideTitle eyebrow="01 · Problem & persona" title="The problem" />
      <div className="pitch-problem-layout">
        <div className="pitch-stacked-cards">
          <article><Ticket size={21} /><h3>Fake tickets & duplicates</h3><p>The same ticket can be sold to several people; buyers can&apos;t check authenticity before paying.</p></article>
          <article><ArrowRight size={21} /><h3>Uncontrolled resale</h3><p>Vinted, Facebook groups, bots: prices spike and the organizer earns nothing on that resale.</p></article>
          <article><LockKeyhole size={21} /><h3>No proof at the door</h3><p>A screenshot is enough to get in: entry control doesn&apos;t prove the person really owns the ticket.</p></article>
        </div>
        <aside className="pitch-side-note"><p className="pitch-overline">Two victims, one gap</p><div><h3>The organizer</h3><p>Loses resale revenue and sees its reputation hurt by fraud and scams.</p></div><div><h3>The fan</h3><p>Risks buying a fake, already-used, or multiply-sold ticket — with no guarantee.</p></div></aside>
      </div>
    </section>,

    <section className="pitch-slide" key="persona">
      <SlideTitle eyebrow="01 · Problem & persona" title="Who we serve" />
      <div className="pitch-persona-grid">
        <article className="pitch-persona-card primary"><p className="pitch-overline">Primary persona · the buyer</p><h3>Karim, 38</h3><strong>Product lead at an independent ticketing operator</strong><p><b>Goal</b> cut fraud and capture a share of resale instead of letting it slip away.</p><p><b>Pain #1</b> the black market pockets all the speculation; he gets none. <em>[TO VALIDATE]</em></p><p><b>Today</b> classic ticketing (Eventbrite) with no cap and no independent verification.</p></article>
        <article className="pitch-persona-card"><p className="pitch-overline">Secondary persona · the beneficiary</p><h3>Léa, 24</h3><strong>Student, buys and resells second-hand</strong><p><b>Goal</b> go to concerts without getting scammed; resell without losing money or being blamed.</p><p><b>Pain #1</b> fear of a ticket that&apos;s already used, fake, or sold to several people. <em>[TO VALIDATE]</em></p><p><b>Her role</b> her pain proves the problem is real — but she is not the one who signs.</p></article>
      </div>
    </section>,

    <section className="pitch-slide" key="market">
      <SlideTitle eyebrow="02 · Market" title="Market & why now" />
      <div className="pitch-market-layout">
        <div className="pitch-table-wrap"><h3>Competitive matrix</h3><table><thead><tr><th>Solution</th><th>Resale cap</th><th>Authenticity</th><th>Independent check</th></tr></thead><tbody><tr><td>Eventbrite / classic ticketing</td><td>No</td><td>Partial</td><td>No</td></tr><tr><td>Ticketmaster (SafeTix)</td><td>Partial</td><td>Yes</td><td>No</td></tr><tr><td>Wild resale (Vinted, FB, bots)</td><td>No</td><td>No</td><td>No</td></tr><tr className="highlight"><td>TicketChain</td><td>Yes</td><td>Yes</td><td>Yes</td></tr></tbody></table></div>
        <aside className="pitch-side-note"><p className="pitch-overline">Why now?</p><ul><li>NFT standards (ERC-721) are mature and battle-tested.</li><li>L2 networks make the per-transaction cost negligible.</li><li>Secondary-market fraud keeps growing.</li><li>Public, independent verification is finally feasible.</li></ul><p className="pitch-callout">The gap we fill: a resale cap and an authenticity proof no one offers openly.</p></aside>
      </div>
    </section>,

    <section className="pitch-slide pitch-impact-slide" key="impact">
      <SlideTitle eyebrow="02 · Market evidence" title="The cost of unprotected resale" />
      <p className="pitch-lead">The problem is measurable: inflated prices, invalid tickets, and a sizeable secondary market. These figures are UK evidence, sourced below.</p>
      <div className="pitch-impact-grid">
        <article className="pitch-impact-feature"><p className="pitch-impact-stat">×8</p><h3>Face value can become speculation</h3><p>An IDLES ticket in Bristol was £59.65 at face value, but listed up to £480 on Viagogo while official tickets were still available.</p><a href="https://www.which.co.uk/news/article/tickets-for-popular-music-and-sports-events-listed-for-inflated-prices-on-viagogo-and-stubhub-aUa8T5w8tmLI" target="_blank" rel="noreferrer">Source: Which? <ExternalLink size={13} /></a></article>
        <article><strong>Almost £10m</strong><h3>lost to ticket fraud</h3><p>Reported UK losses in 2024, up nearly 50% in one year.</p><a href="https://www.which.co.uk/campaigns/stop-fleecing-fans" target="_blank" rel="noreferrer">Which? / Action Fraud <ExternalLink size={13} /></a></article>
        <article><strong>1 in 5</strong><h3>resale buyers have an issue</h3><p>And 6 in 10 affected buyers never made it into the event.</p><a href="https://www.which.co.uk/news/article/which-calls-for-a-price-cap-on-resale-tickets-and-tougher-enforcement-aTr7A8h0sETX" target="_blank" rel="noreferrer">Source: Which? <ExternalLink size={13} /></a></article>
        <article><strong>1.9m</strong><h3>tickets resold online</h3><p>Worth about £350m across UK secondary platforms in 2019.</p><a href="https://assets.publishing.service.gov.uk/media/61163dd1d3bf7f63a54f5f94/Secondary_Tickets_Report.pdf" target="_blank" rel="noreferrer">Source: UK CMA <ExternalLink size={13} /></a></article>
        <article><strong>£34 → £154</strong><h3>Royal Ascot</h3><p>A 352% mark-up on Viagogo, despite official tickets still being available.</p><a href="https://www.which.co.uk/news/article/tickets-for-popular-music-and-sports-events-listed-for-inflated-prices-on-viagogo-and-stubhub-aUa8T5w8tmLI" target="_blank" rel="noreferrer">Source: Which? <ExternalLink size={13} /></a></article>
      </div>
      <p className="pitch-slide-footnote">Why TicketChain matters: ownership proof, capped resale and one-time use directly address the risks these sources describe.</p>
    </section>,

    <section className="pitch-slide pitch-chain-slide" key="chain">
      <SlideTitle eyebrow="03 · Design" title="Why blockchain?" />
      <p className="pitch-lead">The test: does it really need one? Yes — a classic database would not do this.</p>
      <div className="pitch-three-column">
        <article><ShieldCheck size={25} /><h3>Verifiable by anyone</h3><p>Anyone checks authenticity on Etherscan — no trusted, closed middleman required.</p></article>
        <article><WalletCards size={25} /><h3>Tamper-proof ownership</h3><p>Every ticket is a unique NFT: impossible to copy or to sell twice.</p></article>
        <article><LockKeyhole size={25} /><h3>Rules enforced in code</h3><p>The resale cap and the “used” status are enforced by the contract, not by a promise.</p></article>
      </div>
      <div className="pitch-onchain-strip"><strong>On-chain</strong><span>ticket ownership · resale cap · “used” status · concert cancellation</span><strong>Off-chain</strong><span>holder proof via wallet signature (EIP-191) · interface display</span></div>
    </section>,

    <section className="pitch-slide" key="validation">
      <SlideTitle eyebrow="04 · Validation" title="The tech holds up — 17/17 on-chain" />
      <div className="pitch-validation-layout"><div className="pitch-validation-score"><strong>17/17</strong><span>lifecycle steps validated on-chain</span><p>Real Sepolia transactions, real gas, publicly visible on Etherscan.</p><small>script: validate-live-deployment.ts</small></div><div className="pitch-validation-points"><p><CheckCircle2 /> Primary purchase (buyTicket)</p><p><CheckCircle2 /> Resale at the capped price</p><p><CheckCircle2 /> Holder proof EIP-191 (signer = on-chain owner)</p><p><CheckCircle2 /> Mark as used at the gate</p><p><CheckCircle2 /> Double-use rejected</p><p><CheckCircle2 /> Cancellation + transfer / resale rejected</p><a href={CONTRACT_ADDRESS ? sepoliaAddressUrl(CONTRACT_ADDRESS) : "#"} target={CONTRACT_ADDRESS ? "_blank" : undefined} rel="noreferrer">Demo contract: 0xcf91…4259 <ExternalLink size={14} /></a></div></div>
    </section>,

    <section className="pitch-slide" key="demand">
      <SlideTitle eyebrow="04 · Validation" title="Proving demand — the evidence file" />
      <p className="pitch-lead">To complete with your real signals before the pitch — it&apos;s 20% of the grade.</p>
      <div className="pitch-demand-grid"><article><Users /><h3>Short survey</h3><p>Google Forms / Typeform, posted on Reddit & Discord.</p><strong>N = [ • ] responses</strong></article><article><Users /><h3>User interviews</h3><p>5 to 10 conversations with real fans / organizers.</p><strong>[ • ] real quotes</strong></article><article><Users /><h3>Communities</h3><p>Reddit / Discord threads of fans in the target segment.</p><strong>[ • ] links captured</strong></article><article><Users /><h3>Fake door / waitlist</h3><p>A landing page to measure real interest.</p><strong>[ • ] sign-ups</strong></article></div>
      <p className="pitch-slide-footnote">Brief&apos;s advice: ask about past behavior (not “would you use it?”), talk to strangers, screenshot everything.</p>
    </section>,

    <section className="pitch-slide" key="journey">
      <SlideTitle eyebrow="05 · MVP" title="The app — one full journey that works" />
      <div className="pitch-journey-grid"><article><span>1</span><h3>Create a concert</h3><p>The organizer opens the event and its on-chain inventory.</p></article><article><span>2</span><h3>Buy → NFT</h3><p>The fan receives a unique NFT ticket in their wallet.</p></article><article><span>3</span><h3>Resell (capped)</h3><p>Resale is allowed, but never above the set cap.</p></article><article><span>4</span><h3>Verify</h3><p>Anyone checks the ticket&apos;s authenticity on Etherscan.</p></article><article><span>5</span><h3>Gate entry</h3><p>The holder proves ownership by signing with their wallet.</p></article><article><span>6</span><h3>Mark used</h3><p>The ticket flips to “used”: a second scan is refused.</p></article></div>
      <p className="pitch-stack-line"><b>Stack</b> Solidity · ERC-721 (OpenZeppelin) · Hardhat · Next.js · MetaMask · Sepolia</p>
    </section>,

    <section className="pitch-slide pitch-demo-slide" key="demo">
      <SlideTitle eyebrow="05 · MVP" title="Live demo — the run of show" />
      <form className="pitch-deck-context" action="/pitch" method="get"><label>Concert ID <input name="concertId" inputMode="numeric" defaultValue={concertId} placeholder="Real ID" /></label><label>Ticket ID <input name="tokenId" inputMode="numeric" defaultValue={tokenId} placeholder="Real ID" /></label><button type="submit">Prepare real shortcuts</button><span>{hasDemoContext ? "Real numeric context loaded." : "No IDs configured — links remain neutral."}</span></form>
      <div className="pitch-demo-run"><PitchDemoLink href={demoLinks.organizer}><b>1</b><span><strong>Set up the organiser</strong>Owner wallet for organizer actions.</span></PitchDemoLink><PitchDemoLink href={demoLinks.organizer}><b>2</b><span><strong>Create a concert</strong>The jury demo event, on-chain.</span></PitchDemoLink><PitchDemoLink href={demoLinks.organizer}><b>3</b><span><strong>Confirm a partner sale → issue NFT</strong>The ticket lands in the buyer&apos;s wallet.</span></PitchDemoLink><PitchDemoLink href={demoLinks.tickets}><b>4</b><span><strong>Open My Tickets → show the NFT</strong>Ownership is public and current.</span></PitchDemoLink><PitchDemoLink href={demoLinks.verify}><b>5</b><span><strong>Verify + gate entry</strong>Holder signs proof with their own wallet.</span></PitchDemoLink><PitchDemoLink href={demoLinks.gate}><b>6</b><span><strong>Mark used → second scan refused</strong>The anti-double-use moment, live.</span></PitchDemoLink></div>
      <aside className="pitch-demo-proof"><p>Show the proof</p><strong>Live app</strong><a href="https://ticket-chain-six.vercel.app" target="_blank" rel="noreferrer">ticket-chain-six.vercel.app <ExternalLink size={13} /></a><strong>Contract</strong><span>0xcf91…4259</span><strong>Explorer</strong><span>sepolia.etherscan.io</span><PitchDemoLink href={demoLinks.marketplace}>Open capped resale <ArrowRight size={14} /></PitchDemoLink></aside>
      <small className="pitch-slide-footnote">Backup video ready.</small>
    </section>,

    <section className="pitch-slide" key="economics">
      <SlideTitle eyebrow="06 · Business" title="Unit economics" />
      <div className="pitch-economics-layout"><table><thead><tr><th>Item (per resold ticket)</th><th>Value</th><th>Status</th></tr></thead><tbody><tr><td>Average primary ticket price</td><td>~25 CHF</td><td>hypothesis</td></tr><tr><td>Resale cap (maxResalePrice)</td><td>+20% of primary price</td><td>existing</td></tr><tr><td>Platform commission on resale</td><td>5–10% of resale price</td><td>to decide + to build</td></tr><tr><td>Gas cost (on an L2 in prod)</td><td>a few cents / transaction</td><td>chain-dependent</td></tr><tr><td>Net margin / resold ticket</td><td>commission − gas − amortized CAC</td><td>computable next</td></tr></tbody></table><aside className="pitch-side-note"><p className="pitch-overline">Revenue model</p><h3>Commission on resale</h3><p>The contract pays the seller while withholding a % for the platform / organizer.</p><p className="pitch-callout">Honesty: this commission is not in the contract yet — it&apos;s our next engineering step, not a box already ticked.</p></aside></div>
    </section>,

    <section className="pitch-slide" key="gtm">
      <SlideTitle eyebrow="06 · Business" title="Go-to-market" />
      <div className="pitch-gtm-grid"><article className="pitch-dark-card"><p className="pitch-overline">Beachhead</p><h3>Small independent venues</h3><p>200–500 seats. Immediate, concrete pain and a short sales cycle — far faster than a Ticketmaster-scale giant.</p></article><article><p className="pitch-overline">Channels</p><p>Direct outreach to 1–2 local venues for a pilot event.</p><p>Discord / Reddit communities of the venue&apos;s music scene.</p><p>Proof on screen (Etherscan) over an abstract pitch.</p></article><article><p className="pitch-overline">First-100 plan</p><ol><li>A pilot event with one real partner venue.</li><li>Recruit the first buyers via that venue&apos;s community.</li><li>Measure: tickets verified at the gate, resale captured vs. lost.</li></ol><p>Then move upmarket: the pilot&apos;s results become the proof to approach bigger operators.</p></article></div>
    </section>,

    <section className="pitch-slide" key="positioning">
      <SlideTitle eyebrow="07 · Communication" title="Positioning & message" />
      <blockquote>“Concert tickets you can&apos;t copy, can&apos;t overprice on resale, and can&apos;t use twice.”</blockquote>
      <p className="pitch-lead">Value proposition — passes the “12-year-old” test.</p>
      <div className="pitch-three-column"><article><span>1</span><h3>Capture resale instead of suffering it</h3><p>The black market pockets the speculation; TicketChain caps resale and pays you a commission on it.</p></article><article><span>2</span><h3>Guaranteed authenticity, checkable by anyone</h3><p>Each ticket is a unique NFT: no more fakes or duplicates, provable on a block explorer.</p></article><article><span>3</span><h3>Fraud-free entry</h3><p>The holder proves it with their own wallet — a screenshot or a photo is not enough.</p></article></div>
    </section>,

    <section className="pitch-slide pitch-closing-slide" key="closing">
      <BadgeCheck size={32} />
      <p className="pitch-overline">In closing</p>
      <h2>A product that runs. A real pain. A clear model.</h2>
      <div className="pitch-closing-points"><p>Working MVP on Sepolia — 17/17 validated on-chain, demoed live.</p><p>A real use of blockchain: authenticity anyone can verify.</p><p>A model: commission on resale, beachhead = small independent venues.</p></div>
      <div className="pitch-ask">Our ask: your feedback, and an intro to an independent venue to launch the pilot.</div>
      <p className="pitch-closing-footer">TicketChain · BTS FinTech Summer School — Geneva</p>
    </section>
  ];

  return (
    <section className="pitch-landing" ref={presentationRef} aria-label="TicketChain interactive presentation">
      <header className="pitch-landing-intro">
        <div><p className="pitch-overline">BTS · FinTech Summer School — Genève</p><h1>The TicketChain story</h1><p>A scrolling pitch with real product shortcuts at the moment they matter.</p></div>
        <nav aria-label="Pitch sections"><a href="#pitch-section-1">Start</a><a href="#pitch-section-7">Proof</a><a href="#pitch-section-10">Live demo</a><a href="#pitch-section-14">Closing</a></nav>
      </header>
      <div className="pitch-landing-track">
        {slides.map((slide, index) => (
          <div className="pitch-landing-section" id={`pitch-section-${index + 1}`} key={index}>
            <span className="pitch-landing-section-number">{String(index + 1).padStart(2, "0")}</span>
            {slide}
          </div>
        ))}
      </div>
    </section>
  );
}
