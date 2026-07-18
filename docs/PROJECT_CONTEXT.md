# TicketChain Project Context

## 1. Product Intent

TicketChain demonstrates how a shared on-chain ticket record can reduce forgery, duplicate resale, abusive resale pricing, and repeated entry.

Each concert ticket is an ERC-721 NFT. Its contract state connects the ticket to a concert, current owner, maximum resale price, listing state, one-time usage state, and concert active state. The frontend turns those rules into a presentation-ready flow on Ethereum Sepolia.

The intended two-profile demo story requires a cancellation-compatible Sepolia deployment; manual MetaMask validation remains part of the demonstration:

1. The organizer profile creates a concert and selects it in `/organizer`.
2. After a confirmed partner sale, the organizer signs the real issuance transaction to the buyer wallet. This is an explicit MVP stand-in for a production partner webhook, not a backend integration.
3. The client buys, owns, verifies, lists, transfers, or resells NFT tickets within the contract rules; resale is browsed one concert at a time.
4. Public QR verification reads validity and the current owner without account connection; optional holder-wallet proof separately compares the connected wallet to that owner.
5. The organizer can cancel a concert. Its issued tickets remain historical records but are immediately expired: QR and Gate Check return **Concert cancelled / Entry denied**, and issuance, sale, resale, transfer, and use are blocked.
6. For an active concert, the organizer follows the ticket's Gate Check link, records use only after confirmation, and a later QR check returns **Already used / Entry denied**.
7. Etherscan provides independent transaction and ownership evidence.

This is an academic MVP for the BTS FinTech Summer School, not production ticketing software.

## 2. User Roles

### Organizer

The wallet that deployed the contract. It can create concerts, issue a ticket after a partner-confirmed sale, cancel concerts, mark tickets as used, and withdraw primary-sale funds held by the contract. The `/organizer` portal itself is readable without account connection: it reads real concerts and the issued tickets for a selected concert, while all organizer writes remain owner-only.

### Ticket Holder

A client wallet that owns a ticket NFT. It can buy a primary ticket, view the ticket in My Tickets, open or copy its QR verification link, list it for resale, transfer it, or buy a known listed ticket. A connected holder can prove wallet control on the verify page by matching MetaMask to the current on-chain owner.

### Resale Buyer

A second wallet that selects the concert containing the ticket. It can inspect only that concert's real active listings, pays the exact on-chain price plus gas, and receives the NFT after confirmation.

### Gate Staff

A user who can scan the TicketChain QR or enter a token ID and sees **Valid ticket**, **Already used**, **Concert cancelled**, or **Invalid ticket** with an entry decision. Only the contract owner records use after confirming **Mark as Used** for an active, unused ticket.

## 3. Core On-Chain Flow

~~~text
Create concert
→ Confirm partner sale and issue ticket
→ Verify ownership
→ List for resale
→ Select concert and buy from another wallet
→ Check at gate
→ Mark as used
→ Reject second use
~~~

Primary purchase and controlled transfer are also implemented. They are alternative ownership paths within the same ticket lifecycle.

Cancellation is an alternative terminal event: `cancelConcert` preserves the concert and issued-ticket history but sets the concert inactive. Every ticket for it becomes expired (`valid: false`), and the contract blocks minting, primary purchases, listing, resale purchase, transfer, and mark-as-used.

`getConcertTicketIds(concertId)` is a per-concert read used by the organizer portal. It returns the IDs issued for that concert, then the frontend reads each ticket's current state. The contract does not record whether issuance came from `buyTicket` or `mintTicket`, so the portal must not infer an issuance source.

## 4. Legacy Historical Deployment

~~~text
Network: Ethereum Sepolia
Chain ID: 11155111
Contract: 0xd4aFD3b8D2290412Bf4521eC462aEB7Fc0D20149
Etherscan: https://sepolia.etherscan.io/address/0xd4aFD3b8D2290412Bf4521eC462aEB7Fc0D20149
~~~

The address is public. It is a **legacy historical deployment**, not the current compatible deployment for this revision: it lacks `getConcertTicketIds` and concert cancellation, which the organizer portal and expiry behavior require. The deployment private key is secret and is not stored in documentation.

Owner-only actions depend on the wallet that deployed this legacy address. The earlier manual validation applies only to its legacy holder, buyer, resale, gate, and QR flows; it does not validate organizer issuance or cancellation.

## 5. Frontend Architecture

The frontend is a Next.js App Router application under **frontend/**.

- **frontend/app/layout.tsx** wraps every route in **TicketChainProvider**, renders the persistent header and navigation, shows global transaction notices, and links the configured Sepolia contract.
- **frontend/components/AppHeader.tsx** provides the active desktop navigation and responsive mobile menu.
- **frontend/components/WalletStatus.tsx** displays the connected address, current network, refresh action, and wallet connection.
- **frontend/components/TransactionStatus.tsx** displays missing configuration, wrong network, wallet confirmation, pending, confirmed, failed, and friendly error states.
- **frontend/context/TicketChainContext.tsx** centralizes MetaMask, chain, contract, organizer, concert, owned-ticket, selected-concert ticket, loading, error, and transaction state.
- Shared cards and helpers keep concert, ticket, QR, badge, form, empty-state, and transaction presentation consistent.

Routes:

- **/** — landing page and product lifecycle preview.
- **/concerts** — client event inventory and primary purchase.
- **/tickets** — connected-wallet collection, QR links, resale listing, and controlled transfer.
- **/marketplace** — selected-concert listing inspection and resale purchase; it reads no global listing feed.
- **/organizer** — organizer profile with real concert inventory, selected-concert issued-ticket rows, partner issuance, and cancellation; write controls remain contract-owner-only.
- **/gate** — organizer entrance-staff decision and confirmed owner-only mark-as-used.
- **/verify?tokenId=&lt;id&gt;** — direct QR-first verification.
- **/demo** — presentation scenario and fallback checklist.
- **/about** — problem, blockchain rationale, lifecycle, and business summary.

The provider creates read contracts through MetaMask's injected Sepolia provider. Verification does not request account access, but the current implementation still requires MetaMask to be installed and Sepolia selected.

Ticket QR codes are generated from **window.location.origin** plus **/verify?tokenId=&lt;id&gt;**. A localhost QR is suitable for opening on the same computer. Physical phone scanning requires a deployed or LAN-accessible frontend origin. QR verification is public validity evidence, not holder-wallet-control evidence; the optional connected-wallet comparison is intentionally separate.

## 6. Smart Contract Responsibilities

**contracts/TicketChain.sol** implements:

- owner-only concert creation with name, location, date, original price, maximum resale price, and supply;
- owner-only `cancelConcert`, which retains history while invalidating issued tickets;
- owner-only ticket minting used by the visible partner-sale MVP action;
- primary ticket purchase at the exact original price;
- ERC-721 ownership and enumeration;
- per-concert issued-token IDs through `getConcertTicketIds`;
- ticket listing at a positive price no greater than its resale cap;
- resale purchase at the exact listed price with payment to the seller;
- controlled transfer with a declared price no greater than the resale cap;
- non-reverting verification data for unknown token IDs;
- owner-only mark-as-used;
- primary-sale fund withdrawal by the owner;
- events for concert creation, cancellation, minting, listing, resale, transfer, and use.

Both `mintTicket` and `buyTicket` emit `TicketMinted` and add the token ID to the concert's issued list. The stored ticket state does not label which of those issuance paths created a given token.

The frontend ABI is manually maintained in **frontend/config/ticketchainAbi.ts**. It must change only when the contract interface intentionally changes.

## 7. Critical Invariants

- A used ticket cannot be used, listed, resold, or transferred again.
- A cancelled concert's tickets are expired, remain visible as history, and cannot be minted, bought, listed, resold, transferred, or used.
- Gate Check refreshes to a used state only after **markAsUsed** returns a confirmed transaction result.
- A rejected or failed MetaMask request must not produce optimistic success.
- Marketplace browsing reads only the selected concert's `getConcertTicketIds` result and filters that real on-chain set; it must not enumerate or invent global listings.
- **/verify?tokenId=&lt;id&gt;** must remain independently addressable from a QR link.
- Public QR validity and connected holder-wallet proof are separate: a QR alone does not prove the presenter controls the owner wallet.
- Invalid token text must return **Enter a numeric token ID.**
- Unknown numeric tokens must return a clean invalid result rather than a contract revert.
- Owner-only frontend controls depend on the configured contract's deployment wallet.
- The active network is Ethereum Sepolia with chain ID 11155111.

## 8. Current Known Limitations

- Sepolia and test ETH only.
- One organizer: the contract owner.
- Concert-scoped resale; no global listing feed.
- The per-concert issued-ticket read shows current state, not whether issuance was a manual mint or primary purchase.
- No backend or contract-event indexer.
- No IPFS or decentralized NFT metadata.
- No real-world identity verification.
- No production venue integration or access-control hardware.
- No production anti-sharing mechanism.
- Wallet authorization, gas, and network selection remain visible user responsibilities.
- Concert dates are stored as strings.
- Primary-sale ETH stays in the contract until the owner withdraws it.
- The frontend requires MetaMask even for read-only verification.
- The frontend ABI is maintained manually.
- No production security audit.

## 9. Testing Expectations

Automated checks from the repository root:

~~~bash
npm test
npm run compile
npm run frontend:build
~~~

The contract and ABI should normally have no diff:

~~~bash
git diff -- contracts/TicketChain.sol frontend/config/ticketchainAbi.ts
~~~

GitHub Actions repeats the test, Solidity compile, and frontend production build on every push and pull request using Node.js 22. It installs both package trees with `npm ci`; it has no secrets, `.env` creation, or Sepolia deployment step.

The cancellation-compatible contract requires a new deployment and an ignored `frontend/.env.local` update before browser validation. Validate with MetaMask:

- organizer profile reads a new concert, creates it with the owner wallet, and shows no issued tickets initially;
- partner-sale issuance and client primary purchase both appear as correct issued-ticket rows for the selected concert;
- connected holder sees the NFT and QR link, while direct QR verification displays the expected token, owner, network, and entry decision;
- connecting the holder wallet proves only whether the current MetaMask wallet matches the on-chain owner;
- malformed, unknown, and used token IDs show the correct states;
- two MetaMask accounts complete listing and concert-scoped resale purchase;
- the newly selected MetaMask account is authorized for the local site;
- ownership changes after resale or transfer;
- organizer Gate Check links preload the selected token and mark a valid ticket as used only after confirmation;
- rejecting **Mark as Used** does not falsely update the result;
- used tickets return **Already used / Entry denied**;
- rejecting cancellation does not falsely display a cancelled concert; confirmed cancellation makes QR verification expired and Gate Check deny entry;
- cancelled tickets cannot be issued, bought, listed, resold, transferred, or marked used;
- navigation and affected routes work at desktop and 390px mobile width.

## 10. Future Work

Clearly future, not implemented:

- contract-event indexer and global marketplace discovery;
- multi-organizer roles;
- richer NFT metadata with IPFS or Arweave;
- mobile QR scanning and venue tooling;
- wallet abstraction;
- optional off-chain identity checks;
- fiat checkout;
- production venue integration;
- formal production security audit.
