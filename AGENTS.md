# TicketChain Agent Instructions

## 1. Project Summary

TicketChain is a Sepolia-only academic MVP for blockchain concert ticketing. Each ticket is an ERC-721 NFT whose contract state records its concert, current owner, resale constraints, listing, and one-time usage status.

The application supports organizer, ticket-holder, resale-buyer, and gate-staff flows. It is designed for a reliable live demonstration, not for production use.

Current compatible public deployment:

~~~text
Network: Ethereum Sepolia
Chain ID: 11155111
Contract: 0x3f311ab156d94233B71Bb40E93Cea4dFc269BF3b
~~~

The former `0xd4aFD3b8D2290412Bf4521eC462aEB7Fc0D20149` deployment is legacy and incompatible with `getConcertTicketIds`.

## 2. Mandatory Reading Order

Before changing the repository, inspect:

1. **AGENTS.md**
2. **README.md**
3. **docs/PROJECT_CONTEXT.md**
4. **package.json**
5. **hardhat.config.ts**
6. **contracts/TicketChain.sol**
7. **frontend/config/ticketchainAbi.ts**
8. The relevant route, provider, component, helper, and test files

Do not rely on an outdated repository map or an assumed ABI. Read the current files.

## 3. Non-Negotiable Constraints

- Do not modify **contracts/TicketChain.sol** unless the user explicitly requests a contract change.
- Do not modify **frontend/config/ticketchainAbi.ts** unless the contract intentionally changes.
- Preserve direct **/verify?tokenId=&lt;id&gt;** navigation and numeric token validation.
- Preserve confirmed-only Gate Check updates: rejected or failed MetaMask transactions must not make the UI appear used.
- Do not add fake tickets, listings, seeded marketplace data, or invented blockchain results.
- Do not add global token enumeration or listing discovery without explicit approval.
- Do not introduce a backend, indexer, authentication system, or unrelated dependency unless explicitly requested.
- Never expose, print, stage, or commit secrets.
- Preserve existing local changes to **frontend/next-env.d.ts**. Next.js may regenerate this file during a build; compare and restore the user's pre-existing version if necessary.
- Preserve all unrelated user changes in a dirty worktree.
- Keep the MVP simple, stable, and demo-friendly.

## 4. Architecture

- The repository root contains Hardhat configuration, the Solidity contract, deployment script, and contract tests.
- **frontend/** is a Next.js App Router application.
- **frontend/app/layout.tsx** provides persistent navigation, transaction notices, and the footer inside **TicketChainProvider**.
- **frontend/context/TicketChainContext.tsx** owns wallet, chain, contract, concert, ticket, error, loading, and transaction state. It is the shared source of contract reads and writes.
- Transaction state moves through wallet confirmation, pending, confirmed, or failed. Contract-dependent UI refreshes only after receipt confirmation.
- **/marketplace** inspects and buys a listing by exact token ID. It does not discover all listings.
- Ticket QR codes point to the current origin plus **/verify?tokenId=&lt;id&gt;**.
- **/verify** reads the token ID from the URL and performs a read through MetaMask's Sepolia provider without requesting account connection.

Route responsibilities:

- **/** — concise product landing page.
- **/concerts** — concert inventory, owner creation and minting, primary purchase.
- **/tickets** — connected-wallet tickets, QR links, listing, and transfer.
- **/marketplace** — exact-token listing inspection and resale purchase.
- **/gate** — staff decision and owner-only mark-as-used.
- **/verify?tokenId=&lt;id&gt;** — direct QR verification.
- **/demo** — jury walkthrough and recovery checklist.
- **/about** — product, lifecycle, and business context.

## 5. Important Routes

Preserve all current routes:

~~~text
/
/concerts
/tickets
/marketplace
/gate
/verify?tokenId=<id>
/demo
/about
~~~

## 6. Verified Commands

Run commands from the repository root:

~~~bash
npm test
npm run compile
npm run frontend:build
npm run frontend:dev
npm run deploy:sepolia
~~~

Do not document or run invented package scripts. The current project does not expose a separate frontend test script.

## 7. Environment Rules

- Root **.env** contains Hardhat deployment values: **SEPOLIA_RPC_URL** and **SEPOLIA_PRIVATE_KEY**.
- **frontend/.env.local** contains public frontend values: **NEXT_PUBLIC_CONTRACT_ADDRESS** and **NEXT_PUBLIC_CHAIN_ID**.
- Never put a secret in a **NEXT_PUBLIC_** variable; those values are sent to the browser.
- Never commit **.env** or **frontend/.env.local**.
- Never print private keys, recovery phrases, or complete secret-bearing environment files in logs or responses.
- Use placeholders in examples.
- Restart the frontend after changing **frontend/.env.local**.

## 8. Change Workflow

1. Inspect Git status, relevant files, tests, and documentation before editing.
2. Identify pre-existing user changes and keep them out of the task diff.
3. Make the smallest focused change that satisfies the request.
4. Avoid speculative features and unrelated refactors.
5. Update tests first when contract behavior intentionally changes.
6. Update the manual ABI only when the contract interface intentionally changes.
7. Run checks proportional to the change and the full required checks before completion.
8. Summarize modified files, verification results, and remaining MetaMask tests.

Use **apply_patch** for manual file edits. Stage specific files rather than relying on **git add .**.

## 9. Safety Checks

Before completion, run:

~~~bash
git diff -- contracts/TicketChain.sol frontend/config/ticketchainAbi.ts
git diff --check
npm test
npm run compile
npm run frontend:build
~~~

No contract or ABI diff is expected unless the user explicitly requested one. Recheck Git status after the frontend build because Next.js can regenerate **frontend/next-env.d.ts**.

For UI work, also inspect the affected routes at desktop width and 390px mobile width. MetaMask transactions, account permissions, QR navigation, and rejection safety require manual browser testing when they cannot be exercised in the automated environment.

## 10. Definition of Done for AI Agents

A task is complete only when:

- the requested behavior or documentation is delivered;
- no unrelated feature or refactor was added;
- relevant tests pass;
- Solidity compilation and the frontend build pass when required;
- no secret is exposed;
- protected contract and ABI files remain unchanged unless explicitly in scope;
- user-owned local changes remain intact;
- documentation matches current behavior;
- remaining manual MetaMask steps are listed clearly.
