# TicketChain Project Context

## 1. Product Intent

TicketChain demonstrates how a shared on-chain ticket record can reduce forgery, duplicate resale, abusive resale pricing, and repeated entry.

Each concert ticket is an ERC-721 NFT. Its contract state connects the ticket to a concert, current owner, maximum resale price, listing state, and one-time usage state. The frontend turns those rules into a presentation-ready flow on Ethereum Sepolia.

The intended demo story is:

1. An organizer creates a concert and mints a ticket.
2. The holder sees the NFT and its QR verification link.
3. Anyone with MetaMask on Sepolia can verify the token without connecting an account.
4. The holder lists the ticket and a second wallet buys it by exact token ID.
5. Verification proves that ownership changed.
6. The organizer checks the ticket at the gate and marks it as used.
7. A later check returns **Already used / Entry denied**.
8. Etherscan provides independent transaction and ownership evidence.

This is an academic MVP for the BTS FinTech Summer School, not production ticketing software.

## 2. User Roles

### Organizer

The wallet that deployed the contract. It can create concerts, mint tickets manually, mark tickets as used, and withdraw primary-sale funds held by the contract.

### Ticket Holder

A wallet that owns a ticket NFT. It can view the ticket in My Tickets, open or copy its QR verification link, list it for resale, or transfer it within the contract's rules.

### Resale Buyer

A second wallet that knows the exact listed token ID. It inspects the seller and on-chain price, pays that exact price plus gas, and receives the NFT after confirmation.

### Gate Staff

A user who checks a token ID and sees **Valid ticket**, **Already used**, or **Invalid ticket** with an entry decision. Only the contract owner can execute **Mark as Used**.

## 3. Core On-Chain Flow

~~~text
Create concert
→ Mint ticket
→ Verify ownership
→ List for resale
→ Buy from another wallet
→ Check at gate
→ Mark as used
→ Reject second use
~~~

Primary purchase and controlled transfer are also implemented. They are alternative ownership paths within the same ticket lifecycle.

## 4. Current Deployment

~~~text
Network: Ethereum Sepolia
Chain ID: 11155111
Contract: 0xd4aFD3b8D2290412Bf4521eC462aEB7Fc0D20149
Etherscan: https://sepolia.etherscan.io/address/0xd4aFD3b8D2290412Bf4521eC462aEB7Fc0D20149
~~~

The address is public. The deployment private key is secret and is not stored in documentation.

Owner-only actions depend on the wallet that deployed this address. Teammates who do not control that wallet can still test reads, primary purchases, ticket-holder actions for NFTs they own, resale purchases, transfers, and verification. A personal deployment is required for complete organizer and gate-write access.

## 5. Frontend Architecture

The frontend is a Next.js App Router application under **frontend/**.

- **frontend/app/layout.tsx** wraps every route in **TicketChainProvider**, renders the persistent header and navigation, shows global transaction notices, and links the configured Sepolia contract.
- **frontend/components/AppHeader.tsx** provides the active desktop navigation and responsive mobile menu.
- **frontend/components/WalletStatus.tsx** displays the connected address, current network, refresh action, and wallet connection.
- **frontend/components/TransactionStatus.tsx** displays missing configuration, wrong network, wallet confirmation, pending, confirmed, failed, and friendly error states.
- **frontend/context/TicketChainContext.tsx** centralizes MetaMask, chain, contract, organizer, concert, owned-ticket, loading, error, and transaction state.
- Shared cards and helpers keep concert, ticket, QR, badge, form, empty-state, and transaction presentation consistent.

Routes:

- **/** — landing page and product lifecycle preview.
- **/concerts** — concert inventory, owner create/mint forms, and primary purchase.
- **/tickets** — connected-wallet collection, QR links, resale listing, and controlled transfer.
- **/marketplace** — exact-token listing inspection and resale purchase.
- **/gate** — gate decision and confirmed owner-only mark-as-used.
- **/verify?tokenId=&lt;id&gt;** — direct QR-first verification.
- **/demo** — jury presentation script.
- **/about** — problem, blockchain rationale, lifecycle, and business summary.

The provider creates read contracts through MetaMask's injected Sepolia provider. Verification does not request account access, but the current implementation still requires MetaMask to be installed and Sepolia selected.

Ticket QR codes are generated from **window.location.origin** plus **/verify?tokenId=&lt;id&gt;**. A localhost QR is suitable for opening on the same computer. Physical phone scanning requires a deployed or LAN-accessible frontend origin.

## 6. Smart Contract Responsibilities

**contracts/TicketChain.sol** implements:

- owner-only concert creation with name, location, date, original price, maximum resale price, and supply;
- owner-only manual ticket minting;
- primary ticket purchase at the exact original price;
- ERC-721 ownership and enumeration;
- ticket listing at a positive price no greater than its resale cap;
- resale purchase at the exact listed price with payment to the seller;
- controlled transfer with a declared price no greater than the resale cap;
- non-reverting verification data for unknown token IDs;
- owner-only mark-as-used;
- primary-sale fund withdrawal by the owner;
- events for concert creation, minting, listing, resale, transfer, and use.

The frontend ABI is manually maintained in **frontend/config/ticketchainAbi.ts**. It must change only when the contract interface intentionally changes.

## 7. Critical Invariants

- A used ticket cannot be used, listed, resold, or transferred again.
- Gate Check refreshes to a used state only after **markAsUsed** returns a confirmed transaction result.
- A rejected or failed MetaMask request must not produce optimistic success.
- Marketplace inspection requires a known exact token ID.
- The application must not invent listing discovery or fake blockchain data.
- **/verify?tokenId=&lt;id&gt;** must remain independently addressable from a QR link.
- Invalid token text must return **Enter a numeric token ID.**
- Unknown numeric tokens must return a clean invalid result rather than a contract revert.
- Owner-only frontend controls depend on the configured contract's deployment wallet.
- The active network is Ethereum Sepolia with chain ID 11155111.

## 8. Current Known Limitations

- Sepolia and test ETH only.
- One organizer: the contract owner.
- Exact-token marketplace inspection; no global listing feed.
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

Manual validation:

- organizer creates a concert and mints a ticket;
- connected holder sees the NFT and QR link;
- direct QR verification displays the expected token, owner, network, and entry decision;
- malformed, unknown, and used token IDs show the correct states;
- two MetaMask accounts complete listing and resale purchase;
- the newly selected MetaMask account is authorized for the local site;
- ownership changes after resale or transfer;
- Gate Check marks a valid ticket as used only after confirmation;
- rejecting **Mark as Used** does not falsely update the result;
- used tickets return **Already used / Entry denied**;
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
