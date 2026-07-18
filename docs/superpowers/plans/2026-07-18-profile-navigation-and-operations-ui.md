# Profile Navigation and Operations UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Focus Client and Organisateur navigation on actual work, make the presentation page useful, and clarify partner issuance, My Tickets, and Gate Check.

**Architecture:** Profiles remain route-driven: Client owns /concerts, /tickets, /marketplace, /verify; Organisateur owns /organizer and /gate. Neutral routes /demo and /about move to the persistent footer. Only existing frontend components, copy, and CSS change; contract reads, writes, ABI, and ticket data remain untouched.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS, lucide-react, ethers v6.

## Global Constraints

- Do not modify contracts/TicketChain.sol or frontend/config/ticketchainAbi.ts.
- Preserve /verify?tokenId=<id>, numeric token validation, and confirmed-only Gate Check refresh.
- Do not add a backend, webhook, authentication, fake data, global discovery, or dependencies.
- Preserve the user-owned frontend/next-env.d.ts change and unrelated dirty files.
- There is no frontend test script; do not invent one. Use build checks and desktop/390 px browser validation.

---

## File Map

- frontend/config/app.ts: Client and Organisateur navigation arrays.
- frontend/app/layout.tsx: neutral footer links.
- frontend/app/demo/page.tsx and frontend/app/about/page.tsx: neutral product and presentation language.
- frontend/app/organizer/OrganizerClient.tsx: partner-sale explanation only.
- frontend/app/tickets/page.tsx and frontend/components/TicketCard.tsx: compact owned-ticket list and disclosure.
- frontend/app/gate/GateClient.tsx: organizer entrance-control wording.
- frontend/app/globals.css: scoped responsive styles.
- README.md and docs/PROJECT_CONTEXT.md: route wording.

## Task 1: Reduce profile navigation to operations

**Files:**
- Modify: frontend/config/app.ts
- Modify: frontend/app/layout.tsx
- Modify: frontend/app/globals.css

**Interfaces:**
- Consumes: clientNavigationItems and organizerNavigationItems from AppHeader.
- Produces: task-only profile menus and neutral footer links to /demo and /about.

- [ ] **Step 1: Confirm existing profile route logic**

Run:

~~~
sed -n '1,120p' frontend/config/app.ts
sed -n '1,160p' frontend/components/AppHeader.tsx
~~~

Expected: AppHeader selects organizer navigation only on /organizer and /gate; Demo and About currently appear in that menu.

- [ ] **Step 2: Remove neutral pages from organizer navigation**

Replace the organizer array in frontend/config/app.ts with:

~~~ts
export const organizerNavigationItems = [
  { href: "/organizer", label: "Organizer Portal" },
  { href: "/gate", label: "Gate Check" }
] as const;
~~~

Keep the Client array. Do not create URL profile parameters or browser storage.

- [ ] **Step 3: Add footer links**

Import Link from next/link in frontend/app/layout.tsx. In the existing app-footer, add:

~~~tsx
<nav className="footer-links" aria-label="Product information">
  <Link href="/demo">Presentation scenario</Link>
  <Link href="/about">About</Link>
</nav>
~~~

Keep the contract-address link and missing-configuration block unchanged.

- [ ] **Step 4: Add scoped footer styling**

Add beside the existing footer rules:

~~~css
.footer-links {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-links a {
  color: var(--blue);
  font-size: 12px;
  font-weight: 850;
  text-underline-offset: 3px;
}
~~~

At the current mobile footer breakpoint, ensure app-footer can wrap rather than overflow.

- [ ] **Step 5: Validate and commit**

Run:

~~~bash
npm run frontend:build
~~~

Expected: success. Inspect /organizer, /gate, and /concerts; each menu contains only its operational links. Inspect direct /demo and /about navigation from the footer.

~~~bash
git add frontend/config/app.ts frontend/app/layout.tsx frontend/app/globals.css
git commit -m "feat: focus navigation on profile operations"
~~~

## Task 2: Turn Demo into a presentation scenario

**Files:**
- Modify: frontend/app/demo/page.tsx
- Modify: frontend/app/about/page.tsx
- Modify: README.md
- Modify: docs/PROJECT_CONTEXT.md

**Interfaces:**
- Consumes: existing /demo, /about, and DemoStepCard.
- Produces: a neutral preparation checklist that never writes blockchain state.

- [ ] **Step 1: Replace Demo heading and entry action**

In frontend/app/demo/page.tsx, set the header values to:

~~~tsx
eyebrow="Presentation preparation"
title="Presentation scenario"
description="Use this short order of operations to explain the TicketChain feature and prove each on-chain rule during a live presentation."
actions={<Link className="primary-button button-link" href="/organizer">Open Organizer Portal <ArrowRight size={17} /></Link>}
~~~

Add this paragraph immediately before demo-step-grid:

~~~tsx
<p className="helper-copy">This page does not run a demo automatically. It tells you which real action to show next and what it proves.</p>
~~~

Rename the first step to Set up the organiser and explain that the contract-owner wallet is required for writes. Keep all existing lifecycle steps, including separate-concert cancellation, as real actions.

- [ ] **Step 2: Keep About neutral**

In frontend/app/about/page.tsx, replace its action with:

~~~tsx
actions={<Link className="secondary-button button-link" href="/demo">View presentation scenario <ArrowRight size={16} /></Link>}
~~~

- [ ] **Step 3: Align route documentation**

In README.md, set the /demo route purpose to Presentation scenario and recovery checklist. In docs/PROJECT_CONTEXT.md, set its route description to presentation scenario and fallback checklist. Do not modify lifecycle, commands, or contract claims.

- [ ] **Step 4: Validate and commit**

Run npm run frontend:build. Expected: success. Inspect /demo: its use is explicit and its CTA opens /organizer; inspect /about: it remains neutral.

~~~bash
git add frontend/app/demo/page.tsx frontend/app/about/page.tsx README.md docs/PROJECT_CONTEXT.md
git commit -m "docs: clarify TicketChain presentation scenario"
~~~

## Task 3: Explain partner-sale issuance beside its real action

**Files:**
- Modify: frontend/app/organizer/OrganizerClient.tsx
- Modify: frontend/app/globals.css

**Interfaces:**
- Consumes: selectedConcert, mintTicket(concertId, recipient), isOwner, and transactionBusy.
- Produces: the same owner-only mint transaction with clear three-step context.

- [ ] **Step 1: Add the visible explanation**

In the Partner sale panel, after selected-concert context and before FormInput, render:

~~~tsx
<div className="partner-sale-explainer">
  <p><strong>What this demonstrates</strong></p>
  <ol className="partner-sale-steps">
    <li><span>1</span><p>A ticketing partner confirms that the customer has paid outside TicketChain.</p></li>
    <li><span>2</span><p>You enter the customer’s wallet for the selected concert.</p></li>
    <li><span>3</span><p>Your MetaMask signature issues the real NFT ticket to that wallet on Sepolia.</p></li>
  </ol>
  <p className="helper-copy">For this MVP, you trigger the last step manually. In production, a secured partner webhook would request it after payment confirmation.</p>
</div>
~~~

Rename the heading to Issue a ticket after partner sale. Change the button label to Confirm partner sale & issue ticket. Preserve the existing onClick and disabled expressions exactly.

- [ ] **Step 2: Style explanatory steps**

Add:

~~~css
.partner-sale-explainer {
  margin: 0 0 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px;
  background: var(--blue-soft);
}

.partner-sale-steps {
  display: grid;
  gap: 9px;
  margin: 10px 0;
  padding: 0;
  list-style: none;
}

.partner-sale-steps li {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.partner-sale-steps span {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--ink);
  color: #fff;
  font-family: "Courier New", Courier, monospace;
  font-size: 11px;
  font-weight: 900;
}

.partner-sale-steps p { margin: 3px 0 0; }
~~~

- [ ] **Step 3: Validate safety and commit**

Run npm run frontend:build. With an active concert, inspect the explanation, reject issuance once, and confirm no ticket appears. Confirm non-owner, cancelled, and busy disabled states are unchanged.

~~~bash
git add frontend/app/organizer/OrganizerClient.tsx frontend/app/globals.css
git commit -m "feat: clarify partner ticket issuance"
~~~

## Task 4: Make My Tickets a compact expandable list

**Files:**
- Modify: frontend/app/tickets/page.tsx
- Modify: frontend/components/TicketCard.tsx
- Modify: frontend/app/globals.css

**Interfaces:**
- Consumes: OwnedTicket, getTicketStatus, QRCodeBlock, onList, and onTransfer.
- Produces: one compact row per ticket; existing QR and transaction controls in native details disclosure.

- [ ] **Step 1: Use list semantics at route level**

In frontend/app/tickets/page.tsx, set the header description to:

~~~tsx
description="Your on-chain tickets in one compact list. Open a ticket to show its QR, verification link, resale controls or transfer form."
~~~

Replace section className ticket-grid with:

~~~tsx
<section className="ticket-list" aria-label="Owned tickets">
~~~

Preserve all wallet conditions and existing map props.

- [ ] **Step 2: Change only TicketCard presentation**

Keep all TicketCard state and action functions. Its summary must show Bill number, concert, location/date, status, max resale, and listing price. Replace the current return body with a compact summary plus this complete disclosure body:

~~~tsx
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
~~~

Keep actionable = ticket.concertActive && !ticket.used. Do not expose listing or transfer forms for used/expired tickets. Preserve action handlers, price validation, MetaMask call functions, and form button disabled conditions unchanged.

- [ ] **Step 3: Implement responsive list styling**

Add these rules and remove ticket-grid only after confirming it has no remaining consumer:

~~~css
.ticket-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.ticket-list-item { padding: 0; }

.ticket-list-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 15px 18px;
}

.ticket-list-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 13px;
}

.ticket-list-title h3 { margin: 0 0 4px; }
.ticket-list-title .card-location { margin: 0; }

.ticket-list-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.ticket-list-status span {
  display: grid;
  gap: 2px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 850;
  text-align: right;
}

.ticket-list-status small {
  color: var(--muted);
  font-family: "Courier New", Courier, monospace;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.ticket-list-details {
  border-top: 1px solid var(--line);
  padding: 0 18px 16px;
}

.ticket-list-details > summary {
  cursor: pointer;
  padding: 12px 0 0;
  color: var(--blue);
  font-size: 13px;
  font-weight: 850;
}

.ticket-list-expanded { padding-top: 2px; }

@media (max-width: 620px) {
  .ticket-list-summary,
  .ticket-list-title { align-items: flex-start; flex-direction: column; }

  .ticket-list-status { justify-content: flex-start; }
  .ticket-list-status span { text-align: left; }
}
~~~

- [ ] **Step 4: Validate and commit**

Run npm run frontend:build. Inspect list at desktop and 390 px. Confirm each ticket expands independently; QR, verification link, listing, and transfer still work. Reject a listing once and confirm no false state change.

~~~bash
git add frontend/app/tickets/page.tsx frontend/components/TicketCard.tsx frontend/app/globals.css
git commit -m "feat: compact the owned ticket collection"
~~~

## Task 5: Present Gate Check as organiser entrance control

**Files:**
- Modify: frontend/app/gate/GateClient.tsx
- Modify: frontend/app/globals.css
- Modify: README.md
- Modify: docs/PROJECT_CONTEXT.md

**Interfaces:**
- Consumes: existing verifyTicket, markAsUsed, owner check, and Gate decision logic.
- Produces: clearer staff copy without changing lookup or confirmed-only transaction behavior.

- [ ] **Step 1: Update user-facing Gate copy**

Set the PageHeader props to:

~~~tsx
eyebrow="Organizer entrance control"
title="Gate Check"
description="For the organizer’s entrance staff: scan a purchased ticket QR code or enter its bill number, then decide entry from its live Sepolia status."
~~~

Change manual lookup to eyebrow Entrance staff and title Scan or check a ticket. Replace the unauthenticated helper with: Ticket lookup is public. Connect the contract-owner organizer wallet to record a valid ticket as used after entry. Replace the non-owner helper with: This wallet can check entry, but only the contract-owner organizer wallet can record ticket use. Do not change checkTicket, useTicket, button disabled conditions, or refresh behavior.

- [ ] **Step 2: Add a staff-purpose note**

Before gate-console, add:

~~~tsx
<div className="gate-purpose-note">
  <ShieldCheck size={19} />
  <p><strong>For event staff.</strong> Gate Check validates the NFT’s concert, current status and one-time entry state. A valid QR proves the ticket record; the organizer records entry only after the guest is admitted.</p>
</div>
~~~

Add:

~~~css
.gate-purpose-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  border-left: 4px solid var(--violet);
  padding: 11px 13px;
  background: var(--violet-soft);
}

.gate-purpose-note svg { flex: 0 0 auto; color: var(--violet); }
.gate-purpose-note p { margin: 0; }
~~~

- [ ] **Step 3: Align documentation**

In README.md, set /gate purpose to Organizer entrance-staff verification and owner-only mark-as-used. In docs/PROJECT_CONTEXT.md, describe /gate as organizer entrance-staff decision and confirmed owner-only mark-as-used.

- [ ] **Step 4: Run final checks and commit**

Run:

~~~bash
git diff -- contracts/TicketChain.sol frontend/config/ticketchainAbi.ts
git diff --check
npm test
npm run compile
npm run frontend:build
git status --short
~~~

Expected: no contract or ABI diff; whitespace check, 13 Hardhat tests, compilation, and frontend build pass. Restore frontend/next-env.d.ts if the build overwrote the user version. At desktop and 390 px, check a valid ticket as non-owner (lookup works, mark-used disabled), reject mark-used once as owner (result remains unused), then confirm it (result becomes used only after confirmation).

~~~bash
git add frontend/app/gate/GateClient.tsx frontend/app/globals.css README.md docs/PROJECT_CONTEXT.md
git commit -m "feat: clarify organizer gate control"
~~~
