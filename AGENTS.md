# TicketChain AI Context

## Project Summary

TicketChain is an academic FinTech Summer School MVP for blockchain-based concert ticketing. The goal is to demonstrate a real end-to-end Web3 application on Sepolia, not just a slide deck.

The problem: concert tickets can be forged, resold multiple times, or resold at abusive prices. Buyers need a public way to verify authenticity, current ownership, usage status, and resale rules.

The solution: each ticket is an ERC721 NFT. The smart contract enforces uniqueness, ownership, resale price caps, and one-time usage.

## Core Demo Flow

The app must support this live demo:

1. Connect MetaMask.
2. Verify the user is on Sepolia.
3. Owner creates a concert.
4. A user buys a ticket, or the owner mints a ticket to a wallet.
5. The connected user sees the NFT ticket in the UI.
6. The ticket card shows its token ID, QR code, and `/verify?tokenId=<id>` link.
7. Staff can open the QR verification page and see whether the ticket is valid or already used.
8. The owner can transfer or resell the ticket to another wallet.
9. Verification shows the owner changed.
10. The contract owner marks the ticket as used.
11. Verification shows the ticket is no longer valid.
12. The transaction or NFT can be opened on Sepolia Etherscan.

## Tech Stack

- Solidity 0.8.28
- Hardhat 3
- OpenZeppelin Contracts 5.x
- ERC721Enumerable, Ownable, ReentrancyGuard
- TypeScript tests with Hardhat Mocha/Ethers
- Next.js App Router frontend
- React 19
- ethers.js 6
- MetaMask
- Sepolia testnet

## Repository Layout

```text
contracts/TicketChain.sol        Smart contract
scripts/deploy.ts                Hardhat deployment script
test/TicketChain.test.ts         Contract behavior tests
frontend/app/page.tsx            Main client-side dApp dashboard
frontend/app/verify/page.tsx     Verification route reading tokenId from the URL
frontend/app/verify/VerifyTicketClient.tsx Client-side gate verification UI
frontend/app/globals.css         UI styling
frontend/components/Badge.tsx    Badge component
frontend/config/ticketchainAbi.ts Manual frontend ABI
frontend/lib/errors.ts           Human-readable wallet/contract error helper
frontend/lib/format.ts           ETH/address/Etherscan helpers
frontend/public/ticketchain-hero.png Hero image asset
README.md                        Human-facing setup and demo docs
.env.example                     Hardhat/Sepolia deployment env example
frontend/.env.example            Frontend public env example
```

## Contract Behavior

`TicketChain.sol` exposes:

- `createConcert(name, location, date, originalPrice, maxResalePrice, totalSupply)`
- `mintTicket(concertId, to)`
- `buyTicket(concertId)`
- `listTicket(tokenId, price)`
- `buyResaleTicket(tokenId)`
- `transferTicket(to, tokenId, declaredPrice)`
- `verifyTicket(tokenId)`
- `markAsUsed(tokenId)`
- `getConcert(concertId)`
- `getTicket(tokenId)`
- `tokensOfOwner(owner)`
- `withdraw()`

Important rules:

- Only the contract owner can create concerts.
- Only the contract owner can mint tickets manually.
- Only the contract owner can mark tickets as used.
- Concert minting cannot exceed total supply.
- A used ticket cannot be listed, resold, transferred, or used again.
- Resale listing price must be less than or equal to the ticket max resale price.
- `verifyTicket` returns a clean non-reverting response for unknown token IDs.

## Frontend Behavior

The frontend is intentionally simple: a polished landing page, a live demo dashboard, and a QR verification route. It includes:

- Wallet connection
- Network status
- Sepolia warning and switch button
- Concert creation
- Primary purchase
- Owner minting
- My Tickets
- Ticket QR codes and copyable `/verify?tokenId=<id>` links
- Public `/verify` page for gate staff
- Resale listing and purchase
- Controlled transfer
- Ticket verification
- Gate Check with owner-only `markAsUsed`
- Sepolia Etherscan links

The browser can only read env variables prefixed with `NEXT_PUBLIC_`.

Required frontend env file:

```bash
frontend/.env.local
```

Required variables:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
```

## Commands

Install:

```bash
npm install
cd frontend
npm install
cd ..
```

Compile:

```bash
npm run compile
```

Test:

```bash
npm test
```

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```

Run frontend:

```bash
npm run frontend:dev
```

Build frontend:

```bash
npm run frontend:build
```

## Development Notes For Future AI Agents

- Keep the MVP simple and demo-focused.
- Do not add complex marketplace discovery unless requested.
- Do not commit real `.env` files or private keys.
- If the contract ABI changes, update `frontend/config/ticketchainAbi.ts`.
- If contract behavior changes, update tests first.
- Do not change the smart contract for UI-only ticket display, QR code, or scan-flow changes.
- Before claiming completion, run `npm test` and `npm run frontend:build`.
- Preserve the current academic framing: the README must clearly explain why blockchain is useful here.
- Avoid unrelated refactors; the project is designed to be understandable in a short course setting.

## Known MVP Limits

- Concert date is stored as a string.
- NFT metadata and images are not uploaded to IPFS.
- There is one organizer: the contract owner.
- The frontend uses a manually maintained ABI.
- Primary sale ETH stays in the contract until the owner calls `withdraw()`.
- The resale purchase flow requires the buyer to enter the listed price exactly.
