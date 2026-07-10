# TicketChain Multi-Page Frontend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-page TicketChain dashboard with a stable, navigable multi-route app while preserving its smart-contract, QR, gate and transaction behavior.

**Architecture:** A client-side `TicketChainProvider` owns MetaMask, network, contract reads, wallet data, errors and transaction state beneath the root App Router layout. Focused route components consume that shared state; reusable cards and status components preserve the current visual identity without introducing a new state library.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, ethers.js 6, qrcode.react, lucide-react, existing Solidity/Hardhat stack.

## Global Constraints

- Do not modify `contracts/TicketChain.sol`.
- Do not modify `frontend/config/ticketchainAbi.ts`.
- Preserve `/verify?tokenId=<id>` direct navigation and QR behavior.
- Do not optimistically mark a gate ticket used before a successful receipt.
- Do not add marketplace enumeration, fake listings, an indexer or seeded data.
- Preserve the user's existing `frontend/next-env.d.ts` change.

---

### Task 1: Shared provider and application shell

**Files:**

- Create: `frontend/context/TicketChainContext.tsx`
- Create: `frontend/types/ticketchain.ts`
- Create: `frontend/config/app.ts`
- Create: `frontend/components/AppHeader.tsx`
- Create: `frontend/components/WalletStatus.tsx`
- Create: `frontend/components/TransactionStatus.tsx`
- Modify: `frontend/app/layout.tsx`

**Provider responsibilities:** Restore authorized MetaMask state without prompting; connect explicitly; track account/network changes; expose concerts, owned tickets, owner status and loading state; centralize verification reads and all existing writes; preserve friendly errors; publish transaction phases and Etherscan hashes; refresh only after confirmed receipts.

- [ ] Add shared domain types and configuration constants without changing the ABI.
- [ ] Implement `TicketChainProvider` and `useTicketChain()` using the existing contract calls.
- [ ] Implement the responsive persistent header, active navigation, wallet/network controls and global transaction/error notices.
- [ ] Wrap all routes with the provider and application shell in the root layout.
- [ ] Run `npm run frontend:build`; expect all provider and layout types to compile.

### Task 2: Shared product components

**Files:**

- Create: `frontend/components/PageHeader.tsx`
- Create: `frontend/components/StatusBadge.tsx`
- Create: `frontend/components/FormInput.tsx`
- Create: `frontend/components/EmptyState.tsx`
- Create: `frontend/components/ConcertCard.tsx`
- Create: `frontend/components/TicketCard.tsx`
- Create: `frontend/components/QRCodeBlock.tsx`
- Create: `frontend/components/DemoStepCard.tsx`

- [ ] Extract the existing ticket, concert, form, QR and semantic-status visuals into typed reusable components.
- [ ] Keep verification URLs absolute in QR codes and relative for in-app links.
- [ ] Preserve Sepolia NFT links, Valid/Used/For Sale status precedence and accessible button states.
- [ ] Run `npm run frontend:build`; expect the component layer to compile without route regressions.

### Task 3: Migrate interactive routes

**Files:**

- Rewrite: `frontend/app/page.tsx`
- Create: `frontend/app/concerts/page.tsx`
- Create: `frontend/app/tickets/page.tsx`
- Create: `frontend/app/marketplace/page.tsx`
- Create: `frontend/app/gate/page.tsx`

**Route migration:** Move concert creation, minting and primary purchase to `/concerts`; owned cards, QR, listing and transfer to `/tickets`; exact-token inspection and exact-price resale purchase to `/marketplace`; staff verification and confirmed-only mark-as-used to `/gate`; reduce `/` to the hero and previews.

- [ ] Build the concise Home route with Launch Demo and Verify a Ticket calls to action.
- [ ] Migrate concert reads and organizer actions without changing transaction arguments.
- [ ] Migrate owned-ticket QR, resale-listing and transfer behavior.
- [ ] Implement numeric exact-token marketplace inspection through `verifyTicket`; buy only a currently listed, unused token using its inspected on-chain price.
- [ ] Implement Gate Check states and update the checked result only when `markAsUsed` returns success.
- [ ] Run `npm run frontend:build`; expect all interactive routes to compile.

### Task 4: Preserve verification and add presentation routes

**Files:**

- Modify: `frontend/app/verify/VerifyTicketClient.tsx`
- Create: `frontend/app/demo/page.tsx`
- Create: `frontend/app/about/page.tsx`

- [ ] Move `/verify` onto the shared shell while keeping direct URL parsing, automatic QR lookup, independent read access and the exact invalid-input message `Enter a numeric token ID.`
- [ ] Preserve Valid ticket, Already used, Invalid ticket, Entry approved/denied, details and Sepolia links; add a Gate Check link.
- [ ] Add the 13-step jury guide, wallet requirements, backup checklist and MetaMask troubleshooting.
- [ ] Add concise Problem, Solution, Why Blockchain, lifecycle, unit economics and go-to-market sections without invented projections.
- [ ] Run `npm run frontend:build`; expect all eight routes to be generated successfully.

### Task 5: Responsive styling and documentation

**Files:**

- Rewrite: `frontend/app/globals.css`
- Modify: `README.md`

- [ ] Reorganize the existing visual tokens and motifs around the persistent shell, responsive menu, route layouts, cards, loading/empty states and visible focus styles.
- [ ] Confirm mobile layouts do not overflow and reduced-motion behavior remains intact.
- [ ] Update the README architecture, route list and live demo script for the multi-page flow.
- [ ] Run `git diff --check`; expect no whitespace errors.

### Task 6: Safety and final verification

**Safety checks:** No contract/ABI diffs; direct `/verify` accepts QR token IDs and rejects malformed values cleanly; marketplace never displays uninspected data; transaction notices persist across routes; Gate Check mutates local status only after confirmed success.

- [ ] Run `git diff -- contracts/TicketChain.sol frontend/config/ticketchainAbi.ts`; expect no output.
- [ ] Run `npm test`; expect the Hardhat behavior suite to pass.
- [ ] Run `npm run compile`; expect successful Solidity compilation.
- [ ] Run `npm run frontend:build`; expect a successful production build for `/`, `/concerts`, `/tickets`, `/marketplace`, `/gate`, `/verify`, `/demo` and `/about`.
- [ ] Review the final diff for accidental ABI, contract, secret or user-owned-file changes.
