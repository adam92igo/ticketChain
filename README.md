# TicketChain

TicketChain is a FinTech Summer School MVP for blockchain-based concert ticketing.

Slogan: **Authentic concert tickets, verified on-chain.**

## Problem

Concert tickets can be forged, resold several times, or resold at abusive prices. Buyers often have to trust a central platform and cannot easily verify whether a ticket is authentic.

## Solution

TicketChain represents each ticket as a unique ERC721 NFT. The smart contract stores the concert link, usage status, resale cap, current ownership, and resale listing state. A wallet or block explorer can verify ownership and ticket history.

## Why Blockchain?

TicketChain uses blockchain because every concert ticket must be unique, publicly verifiable, transferable under clear rules, and impossible to use twice. A traditional database would force buyers to trust a central platform. With an NFT on Sepolia, authenticity, ownership, usage status, and ticket history can be verified directly on-chain.

## Features

- MetaMask wallet connection.
- Sepolia network check.
- Owner-only concert creation.
- Owner-only ticket minting to a chosen address.
- Primary ticket purchase with test ETH.
- NFT ticket display for the connected wallet.
- QR code and `/verify?tokenId=<id>` link for every owned ticket.
- Resale listing with maximum price enforcement.
- Resale purchase with ETH payment to the seller.
- Controlled transfer with declared price cap check.
- Public ticket verification by `tokenId`.
- Gate Check flow with owner-only `markAsUsed`.
- Sepolia Etherscan links for contract, wallets, NFTs, and transactions.
- Multi-page application shell with responsive navigation and shared wallet state.

## Frontend Routes

- `/` — concise product landing page.
- `/concerts` — concert inventory, organizer creation/minting, and primary purchase.
- `/tickets` — connected-wallet NFTs, QR links, resale listing, and transfer.
- `/marketplace` — exact-token listing inspection and resale purchase.
- `/gate` — staff ticket checks and organizer-only `markAsUsed`.
- `/verify?tokenId=<id>` — QR-first public verification route.
- `/demo` — jury demo script, backup checklist, and MetaMask troubleshooting.
- `/about` — problem, solution, blockchain rationale, lifecycle, and business summary.

The Marketplace intentionally does not claim global listing discovery. In this MVP, a buyer checks and purchases a known token ID. A production implementation would index `TicketListed` and related contract events through a backend or event indexer.

## Architecture

```text
ticketchain/
  contracts/
    TicketChain.sol
  scripts/
    deploy.ts
  test/
    TicketChain.test.ts
  frontend/
    app/
      layout.tsx
      page.tsx
      about/page.tsx
      concerts/page.tsx
      demo/page.tsx
      gate/page.tsx
      marketplace/page.tsx
      tickets/page.tsx
      verify/
        page.tsx
        VerifyTicketClient.tsx
      globals.css
    components/
      AppHeader.tsx
      ConcertCard.tsx
      QRCodeBlock.tsx
      TicketCard.tsx
      TransactionStatus.tsx
      ...
    context/
      TicketChainContext.tsx
    config/
      ticketchainAbi.ts
    lib/
      errors.ts
      format.ts
    public/
      ticketchain-hero.png
    .env.example
  hardhat.config.ts
  package.json
  .env.example
  README.md
```

## Smart Contract

`TicketChain.sol` uses:

- `ERC721Enumerable` for NFTs and `tokensOfOwner`.
- `Ownable` for organizer/admin actions.
- `ReentrancyGuard` for ETH purchase and resale flows.
- Internal counters for `concertId` and `tokenId`.

Main functions:

- `createConcert(...)`
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

## Install

From the repository root:

```bash
cd ticketchain
npm install
cd frontend
npm install
cd ..
```

## Environment

Create the Hardhat environment file:

```bash
cp .env.example .env
```

Set:

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0xyour_wallet_private_key
```

After deploying, create the frontend environment file:

```bash
cp frontend/.env.example frontend/.env.local
```

Set:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_CHAIN_ID=11155111
```

Never commit real private keys.

## Compile

```bash
npm run compile
```

## Test

```bash
npm test
```

The Hardhat test suite covers:

- concert creation;
- ticket minting;
- primary ticket purchase;
- ticket verification;
- resale under the maximum price;
- rejection above the maximum resale price;
- `markAsUsed`;
- double-use rejection;
- non-owner gate-check rejection;
- clean response for an unknown token.

The frontend build verifies that all application routes and the dynamic `/verify?tokenId=<id>` flow compile successfully.

## Deploy to Sepolia

Make sure the deployer wallet has Sepolia ETH, then run:

```bash
npm run deploy:sepolia
```

Copy the deployed address into `frontend/.env.local`:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
```

## Run Frontend

```bash
npm run frontend:dev
```

Open:

```text
http://localhost:3000
```

If port `3000` is busy, Next.js will suggest another port.

## Live Demo Script

1. Open the app, connect MetaMask, and confirm the header shows **Sepolia**.
2. Open **Concerts** with the deployer wallet and create a concert.
3. Wait for the global status notice to show **Transaction confirmed**.
4. Mint a ticket to the attendee wallet, or buy a ticket from its concert card.
5. Open **My Tickets** with the attendee wallet.
6. Show the ticket card, `tokenId`, QR code, and **Copy verification link** action.
7. Open `/verify?tokenId=<id>` from the QR/link and show **Valid ticket / Entry approved**.
8. Return to **My Tickets** and list the ticket below its maximum resale price, or transfer it directly.
9. For resale, switch to the buyer wallet, open **Marketplace**, inspect the exact token ID, and buy at the displayed on-chain price.
10. Verify the same token ID and show that the owner changed.
11. Switch back to the organizer wallet and open **Gate Check**.
12. Check the token ID, then click **Mark as Used** and wait for confirmation.
13. Verify the token again and show **Already used / Entry denied**.
14. Reject or fail a repeated gate transaction and point out that the UI does not claim a successful state change.
15. Open the transaction or NFT link on Sepolia Etherscan.

The in-app `/demo` page contains the presentation-ready 13-step jury script, wallet requirements, backup token checklist, and MetaMask recovery tips.

## MVP Limits

- Concert dates are stored as strings for demo simplicity.
- Ticket metadata images are not uploaded to IPFS.
- The primary sale sends ETH to the contract; the owner can withdraw with `withdraw()`.
- The resale flow is intentionally simple and uses exact ETH values.
- There is one organizer: the contract owner.
- The frontend uses a manually maintained ABI in `frontend/config/ticketchainAbi.ts`.
- The QR code points to the dApp's `/verify` route and uses the same configured contract address.

## Future Improvements

- IPFS/Arweave metadata and richer mobile ticket views.
- Role-based organizers per concert.
- Royalties or platform fees.
- Better marketplace discovery for all listed tickets.
- Event cancellation/refund logic.
- Contract verification automation on Etherscan.
- Mobile scanner mode for entrance staff.
