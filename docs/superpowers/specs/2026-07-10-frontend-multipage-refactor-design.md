# TicketChain Multi-Page Frontend Refactor Design

## Objective

Refactor TicketChain from a long single-page prototype into a concise, presentation-ready multi-page Next.js application without changing the smart contract, frontend ABI, or established blockchain behavior. The result must remain simple, reliable on Sepolia, and easy to demonstrate live.

## Constraints

- Do not modify `contracts/TicketChain.sol`.
- Do not modify `frontend/config/ticketchainAbi.ts`.
- Preserve all existing wallet, concert, mint, purchase, resale, transfer, verification, gate, QR, Etherscan, and transaction-status behavior.
- Preserve the current hero image, paper-grid background, ink/teal/coral/amber palette, ticket motifs, and academic FinTech framing.
- Keep `/verify?tokenId=<id>` independently usable when opened directly from a QR code.
- Do not invent marketplace data or add global token enumeration.
- Keep the implementation understandable for a short academic course.
- Preserve the user's existing uncommitted `frontend/next-env.d.ts` change.

## Information Architecture

The persistent navigation contains these routes:

| Route | Navigation label | Responsibility |
| --- | --- | --- |
| `/` | Home | Concise product landing page and entry points into the demo |
| `/concerts` | Concerts | Concert inventory, organizer creation and minting, primary purchase |
| `/tickets` | My Tickets | Connected-wallet ticket collection, QR links, listing and transfer |
| `/marketplace` | Marketplace | Exact-token resale inspection and purchase with an honest discovery limitation |
| `/gate` | Gate Check | Staff verification and owner-only mark-as-used flow |
| `/verify?tokenId=<id>` | Verify | QR-first, independently usable public ticket verification |
| `/demo` | Demo Guide | Jury script, required wallets, backup checklist and MetaMask troubleshooting |
| `/about` | About | Problem, solution, blockchain rationale, lifecycle and business summaries |

The desktop header shows the TicketChain brand, active route, wallet status, network status, refresh action and Etherscan wallet link. On small screens, the navigation collapses behind a menu button while wallet and network status remain visible.

## Application Architecture

### Shared application provider

A client-side `TicketChainProvider` wraps the routed content from the root layout. It owns:

- wallet address and current chain ID;
- contract signer instance and contract owner;
- connected/owner/Sepolia/configured derived state;
- concerts and connected-wallet tickets;
- initial and refresh loading state;
- shared human-readable error state;
- shared transaction phase, label, message and hash;
- MetaMask connection, network switch and account/network listeners;
- contract reads and all existing transaction actions.

The provider exposes one stable hook, `useTicketChain()`. Route components consume the hook rather than recreating providers, MetaMask listeners, contract instances or transaction handling.

The provider must not automatically request wallet access on first load. It may inspect already-authorized accounts and restore state without prompting. Explicit connection remains controlled by the header button. Account or network changes refresh shared state.

### Data model and reads

Existing `Concert`, `OwnedTicket`, verification, gate and transaction types move into focused shared files. Reads continue to use only methods already present in the current manual ABI.

`refreshData` loads the contract owner, all concerts and the current wallet's tickets. Page-level loading and empty states distinguish:

- wallet disconnected;
- wrong network;
- contract address missing or invalid;
- data loading;
- configured but empty data.

Read-only helpers support:

- `verifyTicket(tokenId)` for `/verify` and `/gate`;
- `inspectResaleTicket(tokenId)` for `/marketplace`, using `verifyTicket` to determine existence, ownership, status, listing state and exact price.

### Transaction safety

All contract mutations continue through one `runTransaction` pipeline. It verifies wallet and Sepolia readiness, displays the MetaMask confirmation state, tracks the submitted hash, waits for a successful receipt, refreshes shared data and then reports confirmation. Rejected or reverted transactions report failure through the existing friendly-error helper.

No optimistic mutation may claim on-chain success. In particular, Gate Check updates a ticket to used only after the `markAsUsed` receipt succeeds. MetaMask rejection, transaction failure or a reverted receipt leaves the previously checked gate result unchanged.

Transaction notices remain visible across page navigation and retain Sepolia Etherscan links.

## Route Designs

### Home

The home page retains the existing hero image and slogan, “Authentic concert tickets, verified on-chain.” Its main actions are “Launch Demo” linking to `/concerts` and “Verify a Ticket” linking to `/verify`. Below the hero are compact problem/solution cards, a short “Why blockchain?” preview and a short lifecycle preview. It does not contain wallet operations or the full feature console.

### Concerts

The page presents concert inventory first, using reusable concert cards with name, location, date, original price, maximum resale price, minted count, total supply and sold-out state. Primary purchase stays on each concert card.

Organizer actions are grouped in a clearly labeled owner workspace. Concert creation and mint-to-wallet keep their current fields and contract calls. Non-owners can see the organizer capability but cannot submit owner-only actions. Disconnected, wrong-network, loading and no-concert states are explicit.

### My Tickets

The page is wallet-focused. Each reusable ticket card shows token ID, concert details, owner, maximum resale price, current listing price when applicable, and a Valid, Used or For Sale badge. Its QR block encodes the absolute `/verify?tokenId=<id>` URL and provides copy, open-verification and Sepolia NFT actions.

Existing listing and controlled-transfer forms remain available beside or below the owned collection. The page explains that resale purchase happens in Marketplace. Used tickets remain visible but cannot be represented as usable.

### Marketplace

The page does not attempt global discovery. It prominently states:

> In this MVP, resale is available through exact ticket IDs. A production version would index listed tickets through contract events or a backend indexer.

The user enters a numeric token ID and selects “Check listing.” The app reads `verifyTicket` through the unchanged ABI and shows one of these states: invalid ticket, already used, not listed, listed for sale, or currently owned by the connected wallet. For a listed ticket it displays concert, seller, exact resale price, maximum resale price and an Etherscan NFT link.

Purchase uses the inspected on-chain resale price automatically rather than asking the buyer to retype it. The existing `buyResaleTicket(tokenId)` contract call and exact `msg.value` behavior remain unchanged. Before inspection, the page shows a clean “no ticket selected” state rather than fake listings.

### Gate Check

The staff-oriented page contains the required instruction copy, numeric token input and Check Ticket action. Results clearly combine ticket status and entry decision:

- Valid ticket / Entry approved;
- Already used / Entry denied;
- Invalid ticket / Entry denied.

When a valid ticket is checked, concert and owner details are displayed. The owner-only Mark as Used button is enabled only for a valid checked result, an organizer wallet and a non-busy transaction state. After confirmation, the result changes to Already used / Entry denied and notes that entry was recorded on-chain. Failure or rejection never changes the checked result.

### Verify

The route remains QR-first and can run independently after direct navigation. It reads `tokenId` from the URL, fills the input and automatically verifies a valid supplied value. A missing or malformed value produces the exact message “Enter a numeric token ID.” Unknown numeric tokens show Invalid ticket / Entry denied without a contract error.

The result includes ticket status, entry decision, token ID, concert, venue/date, current owner, listing state, resale limits and Sepolia NFT link. The page includes a clear link back to `/gate`. Wrong network, missing MetaMask and missing contract configuration remain explicit and recoverable.

### Demo Guide

This static page presents the requested 13-step jury script as reusable step cards. It also lists the organizer wallet and attendee/buyer wallet requirements, a backup checklist for pre-funded wallets and known token IDs, and concise MetaMask troubleshooting for Sepolia selection, rejected requests, insufficient test ETH and account switching.

### About

This static page presents concise sections for Problem, Solution, Why Blockchain?, Ticket Lifecycle, Unit Economics and Go-to-Market. Business content remains a clearly labeled MVP summary: possible revenue from organizer/service fees and a pilot-first path through small venues, student events and festivals. No unsupported financial projections are invented.

## Shared Components

The refactor introduces only components that remove meaningful repetition:

- `AppHeader` and responsive `MobileNav` behavior;
- `WalletStatus` for connection, network and refresh controls;
- `TransactionStatus` for global wallet/pending/confirmed/failed feedback;
- `PageHeader` for route introductions and optional actions;
- `ConcertCard` for on-chain concert inventory;
- `TicketCard` for owned-ticket display;
- `StatusBadge` as the semantic wrapper around the existing badge visual;
- `QRCodeBlock` for stable absolute verification links;
- `DemoStepCard` for the jury walkthrough;
- small form and empty/loading-state primitives where they materially reduce duplication.

The existing `Badge` may remain as the low-level presentation primitive. Components do not introduce a general design system or external state-management dependency.

## Error Handling and Empty States

Shared notices use the established color language and `getFriendlyError`. Required user-facing cases include:

- missing/invalid `NEXT_PUBLIC_CONTRACT_ADDRESS`;
- MetaMask unavailable;
- wallet disconnected;
- wrong network with a Switch to Sepolia action;
- request rejected in MetaMask;
- transaction pending, confirmed or failed;
- invalid or missing numeric token ID;
- no concerts;
- no owned tickets;
- no marketplace ticket selected;
- ticket not listed for resale.

Pages must disable write actions while a transaction is awaiting wallet approval or pending on-chain.

## Responsive and Accessibility Behavior

The application uses semantic navigation, buttons and form labels. Active navigation is visible through both color and shape. The header menu is keyboard-operable and closes after navigation. Focus states remain visible. Cards, forms, QR blocks and action rows collapse to a single column on narrow screens without horizontal overflow. Reduced-motion preferences continue to disable transitions.

## Testing and Verification

Implementation uses conservative behavior tests around pure validation/status helpers where practical, followed by the required project checks:

```bash
npm test
npm run compile
npm run frontend:build
```

The final manual MetaMask checklist covers:

1. connect and switch to Sepolia;
2. create a concert as owner;
3. mint and buy a ticket;
4. confirm the ticket and QR link under My Tickets;
5. verify from a directly opened QR URL;
6. inspect/list/buy an exact token in Marketplace;
7. transfer a ticket and confirm owner changes;
8. check and mark a ticket used at the gate;
9. reject a mark-as-used request and confirm the UI does not change;
10. verify a used and an unknown ticket;
11. open wallet, transaction and NFT links on Sepolia Etherscan;
12. exercise the mobile menu and route transitions.

## Out of Scope

- Smart contract or ABI changes;
- global marketplace discovery;
- event indexing or backend services;
- fake or seeded blockchain data;
- IPFS metadata;
- role-based organizer changes;
- unrelated contract, deployment or test refactors.
