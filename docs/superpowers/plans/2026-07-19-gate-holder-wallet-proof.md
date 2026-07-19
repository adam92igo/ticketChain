# Gate Holder Wallet Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Require a fresh MetaMask signature from the current NFT owner before Gate Check permits entry.

**Architecture:** A pure proof helper creates and validates a random, expiring challenge, verifies ethers signatures and serializes proof QR payloads. `/verify` signs the active challenge on the holder phone. `/gate` scans the ticket, shows the challenge QR, scans the returned proof, validates the recovered signer against the current on-chain owner, then enables the existing confirmed-only mark-as-used action.

**Constraints:** No contract/ABI/backend/authentication change; direct `/verify?tokenId=<id>` remains public; ticket QR alone never authorizes entry; challenge is one-use and short-lived; no ownership result is invented.

## Tasks

### Task 1: Proof protocol and tests

Create `frontend/lib/gateHolderProof.ts` and `frontend/lib/gateHolderProof.test.ts`.

- [ ] Generate a 32-byte browser-random nonce, an expiry five minutes ahead, and a deterministic message containing contract address, chain ID, token ID, nonce and expiry.
- [ ] Validate ticket, expiry, nonce and recovered signer through `ethers.verifyMessage`; reject malformed, expired, re-used or mismatched proofs.
- [ ] Test success, wrong wallet, wrong token, expired challenge and replay rejection with Node test runner.
- [ ] Commit `feat: add holder wallet gate proof protocol`.

### Task 2: Holder phone signature page

Modify `frontend/app/verify/VerifyTicketClient.tsx` and add a small client component if needed.

- [ ] Read challenge parameters only when present alongside numeric tokenId.
- [ ] Connect the holder MetaMask wallet, sign the exact protocol message without sending a transaction, and render a QR proof containing token, challenge, signer and signature.
- [ ] Keep ordinary `/verify?tokenId=<id>` read-only verification unchanged.
- [ ] Handle rejected signatures without claiming ownership proof.
- [ ] Build and commit `feat: sign TicketChain gate holder proof`.

### Task 3: Gate two-device flow

Modify `frontend/app/gate/GateClient.tsx`, `frontend/components/GateQrScanner.tsx`, CSS and docs.

- [ ] After valid ticket identification, create and display a holder challenge QR; do not enable Mark as Used yet.
- [ ] Scan the returned proof QR, verify it locally, compare recovered address to the latest Sepolia ticket owner and consume the challenge only on success.
- [ ] Display explicit waiting, rejected and confirmed-holder states; retain manual ticket entry and existing ticket QR scanning.
- [ ] Enable Mark as Used only when ticket validity and holder proof are both current; preserve receipt-confirmed update behavior.
- [ ] Run `npm test`, `npm run compile`, `npm run frontend:build`, protected-file diff and manual two-device MetaMask tests; commit `feat: require holder proof at Gate Check`.
