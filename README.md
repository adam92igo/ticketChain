# TicketChain

> Authentic concert tickets, verified on-chain.

TicketChain is a working blockchain ticketing MVP that represents each concert ticket as an ERC-721 NFT. The application demonstrates client purchase and ownership, capped resale and transfer, public QR verification, organizer inventory review, gate control, and one-time usage on Ethereum Sepolia.

**Status:** functional academic MVP. Earlier holder, buyer, resale, gate, and QR flows were manually validated on a legacy Sepolia deployment. The revised organizer-issued-ticket portal requires a new Sepolia deployment and still awaits deployment and manual MetaMask validation. It was created for the BTS FinTech Summer School and is not production-ready software.

## 1. Quick Start

This is the fastest path for a teammate who wants to prepare the frontend for a compatible Sepolia deployment.

~~~bash
git clone <REPOSITORY_URL>
cd ticketChain
npm install
npm --prefix frontend install
cp frontend/.env.example frontend/.env.local
~~~

Set the following public frontend configuration in **frontend/.env.local**:

~~~env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_COMPATIBLE_NEW_SEPOLIA_DEPLOYMENT
NEXT_PUBLIC_CHAIN_ID=11155111
~~~

Start the application:

~~~bash
npm run frontend:dev
~~~

Open:

~~~text
http://localhost:3000
~~~

If port 3000 is already in use, open the alternative URL printed by Next.js.

Requirements for a compatible deployment:

- Install and unlock MetaMask.
- Select **Ethereum Sepolia** with chain ID **11155111**.
- Configure a newly deployed Sepolia contract that includes `getConcertTicketIds`; the organizer-issued-ticket portal cannot run against the legacy address documented below.
- Connected wallets can then read the contract and use the documented client and organizer flows.
- Read-only pages still use MetaMask as the browser provider, even when account connection is not required.

> **Organizer writes are restricted.** With a compatible new deployment, anyone can open the **Organisateur** profile and `/organizer` to read real concerts and their issued-ticket rows. Creating concerts, minting tickets manually, marking tickets as used, and withdrawing primary-sale funds remain controlled by the wallet that deployed the contract.

## 2. Project Overview

Traditional ticket files can be copied, forged, sold to several buyers, or presented more than once. Secondary buyers may not know the current owner, whether a ticket has already been used, or whether a resale price respects the organizer's rules.

TicketChain records each ticket as a unique NFT. The smart contract links it to a concert, enforces supply and resale limits, tracks its current owner and listing, and records whether it has been used. The frontend separates that work into client and organizer profiles:

- **Client:** buys a primary ticket, owns and verifies its NFT, lists it for resale, transfers it, or buys a known listed ticket from another holder.
- **Organisateur:** opens `/organizer` to read real concerts and the issued tickets for a selected concert. Contract-owner-only controls create concerts and mint tickets; the same owner can record gate usage.
- **Gate staff:** checks public authenticity and usage status. The contract owner alone can mark entry as used.

Public QR validity and holder-wallet proof are deliberately separate. A QR lookup reads the ticket state and current owner from Sepolia without account connection; connecting MetaMask only compares the connected wallet with that owner. A QR alone does not prove that the person presenting it controls the holder wallet.

TicketChain is an academic MVP running only on Ethereum Sepolia with testnet funds.

## 3. Why Blockchain?

The project uses blockchain where a shared, independently verifiable record is useful:

- **NFT uniqueness:** every ticket has a unique ERC-721 token ID.
- **Public ownership:** the current wallet owner can be checked on-chain.
- **Transparent transfers:** mint, resale, and transfer events are visible publicly.
- **Controlled resale:** listing and declared transfer prices cannot exceed the ticket's maximum resale price.
- **On-chain usage:** the contract stores whether a ticket has been used.
- **Double-use prevention:** a used ticket cannot be used, listed, resold, or transferred again.
- **Independent proof:** the contract, NFT, wallet, and transactions can be inspected through Sepolia Etherscan.

Blockchain does not solve every ticketing problem:

- It does not prove the real-world identity of the person controlling a wallet.
- Marketplace inspection requires an exact token ID; there is no global listing feed.
- Production discovery would require contract-event indexing or a backend indexer.
- SepoliaETH has no real monetary value.
- This code has not received a production security audit and must not be used for real events or funds.

## 4. Main Features

- MetaMask wallet connection and account-change handling.
- Ethereum Sepolia detection and network-switch prompt.
- Owner-only concert creation.
- Owner-only ticket minting to a selected wallet.
- Primary ticket purchase at the contract's exact original price.
- Connected-wallet ticket collection in My Tickets.
- NFT status badges, owner, concert details, resale limits, and prices.
- QR code and copyable **/verify?tokenId=&lt;id&gt;** link for each owned ticket.
- Direct QR-first ticket verification plus an optional connected-wallet ownership comparison.
- Resale listing with an enforced maximum price.
- Exact-token marketplace inspection and resale purchase.
- Controlled ticket transfer with a declared-price cap.
- Read-only `/organizer` concert inventory with issued-ticket rows, current owners, listing status, and gate links.
- Gate Check with valid, used, and invalid decisions.
- Owner-only mark-as-used transaction and prevention of ticket reuse.
- Sepolia Etherscan links for the contract, wallet, NFT, and transaction.
- Global wallet-confirmation, pending, confirmed, and failed transaction states.
- Friendly messages for rejected MetaMask requests, insufficient funds, wrong networks, and known contract errors.

## 5. Application Routes

| Route | Purpose | Wallet required | Organizer required |
| --- | --- | --- | --- |
| **/** | Product landing page | No | No |
| **/concerts** | Client event inventory and primary purchase | Account for purchase; MetaMask provider for reads | No |
| **/tickets** | Connected wallet's ticket collection, resale listing, and transfer | Yes | No |
| **/marketplace** | Exact-token resale inspection and purchase | No account for inspection; account for purchase | No |
| **/organizer** | Organizer profile: concert inventory and per-concert issued-ticket view | No account for reads; account for writes | Yes for create and mint |
| **/gate** | Staff verification and mark-as-used | No account for checks; account for write action | Yes for mark-as-used |
| **/verify?tokenId=&lt;id&gt;** | Direct QR ticket verification | No connected account; MetaMask provider and Sepolia required | No |
| **/demo** | Jury and test walkthrough | No | No |
| **/about** | Product, lifecycle, and business explanation | No | No |

The current read contract is created from MetaMask's injected browser provider. Consequently, inspection does not request account access, but MetaMask must be installed and set to Sepolia.

## 6. Technical Stack

- Solidity 0.8.28
- OpenZeppelin Contracts 5.x
- Hardhat 3
- TypeScript
- Hardhat Mocha and ethers test tooling
- Next.js App Router
- React 19
- ethers.js 6
- qrcode.react
- MetaMask
- Ethereum Sepolia

## 7. Repository Structure

~~~text
ticketChain/
├── contracts/
│   └── TicketChain.sol          ERC-721 ticket contract
├── scripts/
│   └── deploy.ts                Sepolia deployment script
├── test/
│   └── TicketChain.test.ts      Contract and end-to-end behavior tests
├── frontend/
│   ├── app/                     Next.js routes, root layout, and global styles
│   ├── components/              Shared cards, status, QR, navigation, and forms
│   ├── context/                 Shared TicketChainProvider state and actions
│   ├── config/                  Public app settings and manually maintained ABI
│   ├── lib/                     Types, formatting, errors, and ticket-state helpers
│   └── .env.example             Public frontend configuration template
├── docs/
│   └── PROJECT_CONTEXT.md       Durable product and architecture context
├── .env.example                 Hardhat Sepolia secret template
├── AGENTS.md                    Mandatory instructions for AI coding agents
├── hardhat.config.ts            Solidity and Sepolia configuration
├── package.json                 Root commands and dependencies
└── README.md                    Human onboarding and operating guide
~~~

Generated folders such as **node_modules**, **frontend/.next**, **artifacts**, and **cache** are intentionally omitted.

## 8. Prerequisites

- Node.js and npm
- Git
- MetaMask
- Ethereum Sepolia enabled in MetaMask
- Two MetaMask accounts for the complete resale scenario
- SepoliaETH for transactions and gas
- A Sepolia RPC provider only when deploying a personal contract

Recommended account names:

~~~text
TicketChain Organizer
TicketChain Buyer
~~~

Security rules:

- Use dedicated test wallets only.
- Never use a wallet containing real funds.
- Never share a Secret Recovery Phrase.
- Never commit or send a private key.
- Never use real ETH for this project.
- Inspect the network, destination, value, and gas estimate before confirming every MetaMask transaction.

## 9. Environment Variables

| File | Variable | Purpose | Secret |
| --- | --- | --- | --- |
| **.env** | **SEPOLIA_RPC_URL** | Hardhat Sepolia RPC endpoint | Treat as private |
| **.env** | **SEPOLIA_PRIVATE_KEY** | Dedicated test organizer deployment key | Yes |
| **frontend/.env.local** | **NEXT_PUBLIC_CONTRACT_ADDRESS** | Deployed TicketChain contract address | No |
| **frontend/.env.local** | **NEXT_PUBLIC_CHAIN_ID** | Expected Sepolia chain ID | No |

- The root **.env** file is used by Hardhat for deployment.
- **frontend/.env.local** configures the Next.js frontend.
- Variables prefixed with **NEXT_PUBLIC_** are exposed to the browser and must never contain secrets.
- Both local environment files are ignored by Git.
- Restart the frontend after changing **frontend/.env.local**.

## 10. Legacy Historical Sepolia Deployment

~~~text
Network: Ethereum Sepolia
Chain ID: 11155111
Contract address: 0xd4aFD3b8D2290412Bf4521eC462aEB7Fc0D20149
Etherscan: https://sepolia.etherscan.io/address/0xd4aFD3b8D2290412Bf4521eC462aEB7Fc0D20149
~~~

[Open the legacy historical TicketChain contract on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xd4aFD3b8D2290412Bf4521eC462aEB7Fc0D20149).

This public address is a legacy historical deployment, not the current compatible deployment for this revision. It lacks `getConcertTicketIds`, so it cannot support the organizer-issued-ticket portal. The deployment private key is not public and must never be shared.

Its contract owner controls concert creation, manual minting, gate usage, and contract withdrawal. The prior manual validation applies only to the legacy holder, buyer, resale, gate, and QR flows. Deploy a new compatible Sepolia contract before using or demonstrating the revised organizer portal.

## 11. Deploying a Personal Contract

Create the root Hardhat environment file:

~~~bash
cp .env.example .env
~~~

Configure a dedicated test-only deployer:

~~~env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_PRIVATE_KEY=YOUR_DEDICATED_TEST_WALLET_PRIVATE_KEY
~~~

Obtain:

1. A Sepolia RPC URL from a provider such as Alchemy or Infura.
2. SepoliaETH from a reputable faucet.
3. The private key of a dedicated MetaMask account used only for this testnet project.

Never paste secrets into chat, screenshots, email, shared documents, issues, or Pull Requests. Never commit **.env**. Rotate an RPC credential or private key immediately if it is exposed.

Deploy:

~~~bash
npm run deploy:sepolia
~~~

The deployment script prints the new contract address and its Sepolia Etherscan link. Copy the new address into **frontend/.env.local**:

~~~env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_NEW_CONTRACT_ADDRESS
NEXT_PUBLIC_CHAIN_ID=11155111
~~~

Stop and restart **npm run frontend:dev** so Next.js loads the new public variables.

## 12. Running Tests and Builds

Run from the repository root:

~~~bash
npm test
npm run compile
npm run frontend:build
~~~

- **npm test** runs the Hardhat suite and validates smart-contract behavior.
- **npm run compile** validates Solidity compilation.
- **npm run frontend:build** performs a production Next.js and TypeScript build.

There is no separate frontend test script in the current package files. Do not invent or document one without adding it intentionally.

## 13. Complete Manual Test Guide

Before testing, configure the frontend, select Sepolia, and fund the test accounts.

### A. Organizer Portal and Issuance Flow

This revised flow is pending deployment and manual MetaMask validation. Complete **Deploying a Personal Contract** first and configure that new Sepolia address; do not use the legacy historical address in section 10.

1. Select the **Organisateur** profile and open **/organizer**. The concert inventory and selected concert's issued-ticket rows are readable without connecting an account.
2. Connect the wallet that deployed the configured contract before attempting an organizer write.
3. Create a concert and wait for **Transaction confirmed**.
4. Select the concert in the organizer inventory. It initially shows no issued tickets.
5. Mint one NFT ticket to a client wallet, then have a client buy one primary ticket from **/concerts**.
6. Refresh or reselect the concert and confirm that its issued-ticket rows show both token IDs, their current owners, and listing status.

The selected-concert view uses `getConcertTicketIds(concertId)`, a per-concert contract read. It shows tickets issued for that concert regardless of their current owner, but the contract does not record whether a ticket was issued through a primary purchase or a manual mint.

The create form uses:

- concert name;
- location;
- date, stored as a string;
- original price in ETH;
- maximum resale price in ETH;
- total ticket supply.

The mint form uses:

- concert ID;
- recipient wallet address.

### B. Verification Flow

1. Open **My Tickets** with the current owner.
2. Select **Open verification page** or scan the QR code.
3. Confirm the URL is **/verify?tokenId=&lt;id&gt;**.
4. Confirm the result shows:
   - **NFT #...**;
   - **Valid ticket**;
   - **Entry approved**;
   - the current owner;
   - **Blockchain: Ethereum Sepolia**;
   - **View NFT on Sepolia**.
5. Explain that this is public ticket validity, not proof that the scanner controls the owner wallet. Connect the holder wallet only when needed; **Holder wallet proof** then compares its MetaMask address to the current on-chain owner.

Additional cases:

- Enter **abc**: the expected message is **Enter a numeric token ID.**
- Enter an unknown numeric ID: expect **Invalid ticket**, **Entry denied**, and **This token does not exist on the TicketChain contract.**
- Enter a used ticket ID: expect **Already used**, **Entry denied**, and **This ticket has already been used for entry.**

The direct verification route does not request account connection, but the current frontend requires MetaMask as its read provider and requires Sepolia to be selected.

### C. Resale Flow with Two Wallets

Current owner:

1. Open **/tickets**.
2. Enter the token ID and a price below or equal to its maximum resale price.
3. Select **List Ticket**.
4. Confirm the transaction and wait for **Transaction confirmed**.

Buyer:

5. Switch MetaMask to **TicketChain Buyer**.
6. Ensure that account is connected and authorized for **localhost:3000**.
7. Ensure the Buyer has enough SepoliaETH for the resale price and gas.
8. Open **/marketplace**.
9. Enter the exact token ID.
10. Select **Check Listing**.
11. Confirm the concert, owner/seller, resale price, and maximum resale price.
12. Select **Buy for ... ETH**.
13. Confirm the transaction and wait for **Transaction confirmed**.
14. Open **/tickets** with the Buyer wallet.
15. Confirm the NFT now belongs to the Buyer.
16. Verify the same token and confirm the owner changed.

Switching accounts inside MetaMask does not always authorize the newly selected account for the site. If the header still shows the old account, open MetaMask's connected-sites or Connect control, select the Buyer account, then refresh the application.

### D. Transfer Flow

The current My Tickets UI exposes controlled transfer:

1. Connect the wallet that currently owns the ticket.
2. Open **/tickets**.
3. Enter the token ID.
4. Enter the recipient wallet.
5. Enter the declared price in ETH. It must not exceed the ticket's maximum resale price.
6. Select **Transfer Ticket** and confirm the transaction.
7. Verify the new owner through the recipient's My Tickets page or **/verify?tokenId=&lt;id&gt;**.

### E. Gate Check Flow

Use the contract-owner wallet for the write step:

1. Open **/gate**.
2. Enter the token ID.
3. Select **Check Ticket**.
4. Confirm **Valid ticket** and **Entry approved**.
5. Select **Mark as Used**.
6. Confirm the transaction and wait for **Transaction confirmed**.
7. Check or verify the ticket again.
8. Confirm **Already used** and **Entry denied**.

Rejection-safety check:

1. Check a valid, unused ticket.
2. Select **Mark as Used**.
3. Reject the request in MetaMask.
4. Confirm the global notice reports failure and the result does not falsely change to used.
5. Repeat the transaction and approve it only after completing this rejection check.

## 14. Test Wallet Funding

SepoliaETH is required for:

- deploying a contract;
- creating concerts;
- minting tickets;
- primary purchases;
- listing tickets;
- resale purchases;
- transfers;
- marking tickets as used;
- gas fees.

A resale buyer needs enough SepoliaETH for both the exact resale price and the gas fee.

> Around 0.01 SepoliaETH is often enough for repeated MVP testing, depending on current gas conditions. This is a cautious estimate, not a guaranteed cost.

## 15. Troubleshooting

### MetaMask Does Not Connect

- Install and unlock MetaMask.
- Authorize the active account for **localhost:3000**.
- Refresh the application and select **Connect Wallet** again.

### Wrong Wallet Remains Displayed

- Switch to the intended account in MetaMask.
- Connect that account to **localhost:3000** through MetaMask's connected-sites control.
- Use the header refresh action.
- Reload the page if the address still does not update.

### Wrong Network

- Select **Ethereum Sepolia**.
- Verify chain ID **11155111**.
- Use **Switch to Sepolia** in the application's network warning when available.

### gas required exceeds allowance (0)

Possible causes:

- the deployment wallet has no SepoliaETH;
- the RPC URL points to another network;
- the private key belongs to a different account;
- the faucet funded another address;
- the RPC provider reports a zero balance.

Run this command locally from the repository root to print the deployer address and balance:

~~~bash
node -e "require('dotenv').config(); const { Wallet, JsonRpcProvider, formatEther } = require('ethers'); const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL); const wallet = new Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider); (async () => { console.log('Address:', wallet.address); console.log('Balance:', formatEther(await provider.getBalance(wallet.address)), 'SepoliaETH'); })().catch(console.error)"
~~~

This command reads the private key locally to derive the address, but it does not print the private key.

### missing revert data

Likely causes include:

- insufficient SepoliaETH;
- a ticket that is not listed;
- the wrong token ID;
- a connected wallet that is not the expected owner;
- a ticket that is already used;
- an unmet resale or contract precondition.

Inspect the selected wallet, token state, price, and recent transaction on Etherscan before retrying.

### Ticket Does Not Appear

- Verify the connected wallet shown in the header.
- Confirm the mint recipient or current owner.
- Select the header refresh action.
- Inspect the mint, resale, or transfer transaction on Etherscan.

### QR Opens the Wrong URL

- Confirm the frontend is running on the expected host and port.
- Reload My Tickets so the QR is generated from the current browser origin.
- The QR uses **window.location.origin**. A QR generated on localhost will point another phone to that phone's localhost; use a deployed or LAN-accessible host for physical-device scanning.

### Owner-Only Action Is Disabled

- Use the wallet that deployed the configured contract.
- Otherwise deploy and configure a personal contract.

### Environment Changes Are Ignored

- Stop and restart the Next.js development server.
- Confirm that the file is named **frontend/.env.local**.

## 16. Etherscan Verification

Use [Sepolia Etherscan](https://sepolia.etherscan.io/) to inspect independent proof:

- **Contract:** open the configured contract address.
- **Deployment transaction:** open the contract creator transaction from the contract page.
- **Ticket mint:** open a **TicketMinted** transaction or transaction hash shown by the app.
- **Transfer:** open a **TicketTransferred** transaction.
- **Resale purchase:** open a **TicketResold** transaction and compare seller, buyer, and value.
- **Gate use:** open a **TicketUsed** transaction.
- **NFT ownership:** select **View NFT on Sepolia** from a ticket or verification result.

Transaction URL format:

~~~text
https://sepolia.etherscan.io/tx/<TRANSACTION_HASH>
~~~

Never invent hashes in documentation or demos. Use real hashes from the current testnet activity.

## 17. End-to-End Demo Scenario

This revised demo scenario awaits a new compatible Sepolia deployment and manual MetaMask validation. The previously manually validated scenario was the legacy flow described in section 10 and did not include the organizer-issued-ticket portal.

1. Select the **Organisateur** profile and create a concert with the contract-owner wallet.
2. Select that concert in **/organizer** and show its initially empty issued-ticket list.
3. Mint one ticket to a client wallet, then let a client buy one from **Events**.
4. Return to the selected organizer concert and show the issued-ticket rows with their real token IDs and owners.
5. In the **Client** profile, show an owned NFT, its QR code, and the public **/verify?tokenId=&lt;id&gt;** result.
6. Connect the holder wallet on the verify page to demonstrate the separate holder-wallet proof.
7. Resell or transfer the ticket, then refresh the organizer view to show the changed current owner and listing status.
8. Follow the organizer Gate Check link for the token, reject **Mark as Used** once, and confirm the result remains unused.
9. Approve **Mark as Used** and wait for the confirmed transaction before showing the used state.
10. Reopen the same QR verification URL and show **Already used / Entry denied**.
11. Open the relevant transaction or NFT proof on Sepolia Etherscan.

Record a short backup demo video and keep one unused and one used token ID available in case testnet confirmation or wallet connectivity is slow.

## 18. Collaboration Workflow

Use a focused branch and Pull Request:

~~~bash
git checkout -b feature/short-description
git status
git add <specific-files>
git commit -m "Describe the change"
git push -u origin feature/short-description
~~~

Rules:

- Do not commit substantial changes directly to **main**.
- Use Pull Requests for review.
- Keep each change focused.
- Run relevant tests and the production build before opening a PR.
- Never commit **.env** or **frontend/.env.local**.
- Include automated results and manual test steps in the PR description.
- Avoid **git add .** when secrets, generated files, or unrelated changes may be present.

## 19. Definition of Done

- [ ] Requested behavior and documentation agree.
- [ ] **npm test** passes.
- [ ] **npm run compile** succeeds.
- [ ] **npm run frontend:build** succeeds.
- [ ] No accidental smart-contract or frontend ABI change exists.
- [ ] No secret is staged or committed.
- [ ] Desktop layout has been reviewed.
- [ ] Mobile layout and navigation have been reviewed.
- [ ] Required MetaMask flow has been tested manually.
- [ ] README and context documents are updated when behavior changes.

## 20. Known Limitations

- Ethereum Sepolia only.
- Test ETH only; no real funds.
- Exact-token marketplace discovery.
- The organizer's per-concert issued-ticket list cannot distinguish a primary purchase from a manual mint because the contract does not store that issuance source.
- No backend or contract-event indexer.
- No IPFS or decentralized NFT metadata.
- One organizer: the contract owner.
- No real-world identity verification.
- No production venue or access-control integration.
- No production anti-sharing mechanism.
- Gas fees and wallet complexity remain visible to users.
- Concert dates are stored as strings.
- Primary-sale ETH remains in the contract until the owner calls **withdraw()**.
- The frontend ABI is maintained manually.
- Academic MVP, not production software.

## 21. Roadmap

The following items are future work, not current features:

- contract-event indexer and global listing discovery;
- multi-organizer roles;
- richer NFT metadata with IPFS or Arweave;
- mobile QR scanning and venue-focused tooling;
- wallet abstraction;
- optional off-chain identity checks;
- fiat checkout;
- venue integration;
- production security audit.

## 22. Security Notes

- Testnet only.
- Do not use real funds or real customer data.
- Do not reuse production wallets, private keys, or RPC credentials.
- Never share private keys or recovery phrases.
- Never place secrets in **NEXT_PUBLIC_** variables.
- Verify Ethereum Sepolia before every transaction.
- Inspect transaction destination, value, and permissions before confirming.
- Rotate any secret that has been exposed.

## 23. Academic Note

TicketChain was created as an academic MVP for the BTS FinTech Summer School. No project-level license file is currently included in the repository; no additional license is implied by this documentation.
