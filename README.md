# TicketChain

TicketChain is a FinTech Summer School MVP for blockchain-based concert ticketing.

Slogan: **Authentic concert tickets, verified on-chain.**

## Problem

Concert tickets can be forged, resold several times, or resold at abusive prices. Buyers often have to trust a central platform and cannot easily verify whether a ticket is authentic.

## Solution

TicketChain represents each ticket as a unique ERC721 NFT. The smart contract stores the concert link, usage status, resale cap, current ownership, and resale listing state. A wallet or block explorer can verify ownership and ticket history.

## Why Blockchain?

TicketChain utilise la blockchain parce que chaque billet doit etre unique, verifiable publiquement, transferable de maniere controlee, et impossible a utiliser deux fois. Une base de donnees classique obligerait les acheteurs a faire confiance a une plateforme centrale. Avec un NFT sur une testnet, l'authenticite, la propriete et l'historique de chaque billet peuvent etre verifies directement on-chain.

## Features

- MetaMask wallet connection.
- Sepolia network check.
- Owner-only concert creation.
- Owner-only ticket minting to a chosen address.
- Primary ticket purchase with test ETH.
- NFT ticket display for the connected wallet.
- Resale listing with maximum price enforcement.
- Resale purchase with ETH payment to the seller.
- Controlled transfer with declared price cap check.
- Public ticket verification by `tokenId`.
- Owner-only gate check with `markAsUsed`.
- Sepolia Etherscan links for contract, wallets, NFTs, and transactions.

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
      globals.css
    components/
      Badge.tsx
    config/
      ticketchainAbi.ts
    lib/
      format.ts
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
cp .env.example frontend/.env.local
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

The test suite covers:

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

1. Open the app and connect MetaMask.
2. Switch MetaMask to Sepolia if the app shows a network warning.
3. With the deployer wallet, create a concert.
4. Confirm the transaction and wait for the app to show **Transaction confirmed**.
5. Buy a ticket from the concert card, or mint a ticket to a wallet as owner.
6. Confirm that the ticket appears in **My Tickets**.
7. Copy the `tokenId` and verify it in **Verify Ticket**.
8. List the ticket for resale below the max resale price.
9. Switch MetaMask to a second wallet.
10. Buy the listed ticket using **Buy Resale Ticket**.
11. Verify the same `tokenId` and show that the owner changed.
12. Switch back to the owner wallet.
13. Mark the ticket as used in **Admin Gate Check**.
14. Verify again and show that the ticket is now invalid/used.
15. Try marking the same ticket as used again and show the transaction fails.
16. Open the transaction or NFT link on Sepolia Etherscan.

## MVP Limits

- Concert dates are stored as strings for demo simplicity.
- Ticket metadata images are not uploaded to IPFS.
- The primary sale sends ETH to the contract; the owner can withdraw with `withdraw()`.
- The resale flow is intentionally simple and uses exact ETH values.
- There is one organizer: the contract owner.
- The frontend uses a manually maintained ABI in `frontend/config/ticketchainAbi.ts`.

## Future Improvements

- IPFS/Arweave metadata and QR-code ticket views.
- Role-based organizers per concert.
- Royalties or platform fees.
- Better marketplace discovery for all listed tickets.
- Event cancellation/refund logic.
- Contract verification automation on Etherscan.
- Mobile scanner mode for entrance staff.
