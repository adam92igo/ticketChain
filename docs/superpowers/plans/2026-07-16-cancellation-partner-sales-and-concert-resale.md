# Cancellation, Partner Sales, and Concert Resale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add cancellation with immediate ticket expiry, partner-sale minting, readable IDs, concert-scoped resale, and push/PR CI.

**Architecture:** Add cancellation state to the contract and propagate it as `concertActive` to the existing provider and UI. Retain scoped `getConcertTicketIds`; marketplace filters only one selected concert's real ticket records.

**Tech Stack:** Solidity 0.8.28, Hardhat 3, Next.js, React, ethers.js 6, GitHub Actions.

## Global Constraints

- Preserve public QR verification, numeric validation, confirmed-only gate updates, Sepolia, and real on-chain data.
- No backend, webhook, global resale discovery, secrets in CI, fake sales, fake tickets, or CI deployment.
- Partner issuance is an owner-signed demo action and must explain that production automation would use a partner webhook.
- Cancelled concerts retain history but block mint, primary sale, listing, resale, transfer, and entry.
- Intentional contract/ABI change requires a new Sepolia deployment and ignored local frontend configuration update.

### Task 1: Contract cancellation and ABI

**Files:** contracts/TicketChain.sol, test/TicketChain.test.ts, frontend/config/ticketchainAbi.ts

- [ ] Write contract tests that create two concerts, issue tickets for both, cancel the first, and prove owner-only cancellation, preserved history, `concertActive=false`, invalid verification, and unaffected second concert.
- [ ] Run `npm test -- --grep "cancels a concert"` and confirm RED because `cancelConcert` is missing.
- [ ] Add `ConcertCancelled(uint256 indexed concertId)`, `cancelConcert(uint256)`, and `_concertExists(uint256)`.
- [ ] Change `getConcert` and `getConcertTicketIds` to require existence rather than active state so history remains readable.
- [ ] Add `concertActive` to `TicketVerification`; set `valid` to `concert.active && !ticket.used`.
- [ ] Require `Concert inactive` before list, resale purchase, transfer, mark-as-used, primary purchase, and mint.
- [ ] Add the cancel function and `concertActive` tuple field to the ABI.
- [ ] Run `npm test`, `npm run compile`, then commit `feat: expire tickets when a concert is cancelled`.

### Task 2: Provider and cancellation states

**Files:** frontend/lib/ticketchainTypes.ts, frontend/context/TicketChainContext.tsx, frontend/lib/ticketState.ts, frontend/lib/ticketState.test.ts

- [ ] Add failing helper tests for `Expired`, `Concert cancelled`, and cancelled marketplace states.
- [ ] Run `node --test frontend/lib/ticketState.test.ts` and confirm RED.
- [ ] Add `concertActive: boolean` to owned/verification ticket types; map it from the contract and current concert reads.
- [ ] Make ticket status return `{ label: "Expired", tone: "red" }` for inactive concerts, Gate return `Concert cancelled / Entry denied`, and marketplace reject inactive concert tickets before listing logic.
- [ ] Run helper tests and `npm run frontend:build`; commit `feat: expose cancelled concert ticket state`.

### Task 3: Organizer partner issuance and cancellation UI

**Files:** frontend/app/organizer/OrganizerClient.tsx, frontend/components/OrganizerConcertSelector.tsx, frontend/components/OrganizerTicketTable.tsx, frontend/app/globals.css

- [ ] Expose `cancelConcert` through the existing confirmed transaction runner.
- [ ] Show `Concert name · Event #<id>` and `Bill #<tokenId>` in the organizer views; retain raw IDs as secondary technical references.
- [ ] Add an owner-only cancellation control with explicit confirmation and the number of emitted tickets; disable it after cancellation.
- [ ] Replace manual concert-ID entry in the partner panel with the selected concert ID and a recipient address field.
- [ ] Use the exact copy `In production, a ticketing partner webhook would trigger this issuance. This demo keeps the organizer signature visible.`
- [ ] Disable mint/partner/cancel actions for non-owners, busy transactions, and cancelled concerts as applicable.
- [ ] Run `npm run frontend:build`, inspect desktop/390 px, commit `feat: add partner issue and concert cancellation controls`.

### Task 4: My Tickets and resale by concert

**Files:** frontend/components/TicketCard.tsx, frontend/app/tickets/page.tsx, frontend/app/marketplace/page.tsx, frontend/app/globals.css

- [ ] Move listing and transfer actions from generic forms into the matching ticket card.
- [ ] Render compact ticket cards with concert, date, location, status, `Bill #<tokenId>`, QR, and technical reference; hide resale/transfer on used or expired tickets.
- [ ] Replace exact-token-first marketplace entry with a real concert selection, call `getConcertTickets(concertId)`, and show only `concertActive && listed && !used` records.
- [ ] Render `No tickets are listed for resale for this concert.` for an empty selected concert; do not query global tickets/listings.
- [ ] Run `npm run frontend:build`, manually verify active, expired, listed and mobile cases, commit `feat: organize tickets and resale by concert`.

### Task 5: CI, documentation, deploy

**Files:** .github/workflows/ci.yml, README.md, docs/PROJECT_CONTEXT.md, frontend/app/demo/page.tsx, frontend/app/about/page.tsx

- [ ] Create CI on `push` and `pull_request` with actions/checkout@v4, actions/setup-node@v4 Node 22, root `npm ci`, frontend `npm --prefix frontend ci`, `npm test`, `npm run compile`, and `npm run frontend:build`.
- [ ] Do not set secrets, create `.env`, or run deployment in CI.
- [ ] Document the honest partner-sale MVP, cancelled ticket expiry, scoped resale, CI behavior, and new deployment requirements.
- [ ] Run `git diff -- contracts/TicketChain.sol frontend/config/ticketchainAbi.ts`, `git diff --check`, `npm test`, `npm run compile`, and `npm run frontend:build`.
- [ ] Deploy Sepolia manually, update only ignored `frontend/.env.local`, restart the frontend, and test cancellation rejection/confirmation, QR expiry, Gate denial, partner issue and concert-scoped resale.
- [ ] Commit `ci: verify TicketChain on every push`.

## Plan Self-Review

- Task 1 covers contract cancellation and ABI; Task 2 maps expiry; Task 3 exposes organizer actions; Task 4 improves client/revente; Task 5 provides CI, docs, deployment and manual checks.
- No task introduces a backend, global listing feed, fabricated sale, CI secret, or fake blockchain state.
