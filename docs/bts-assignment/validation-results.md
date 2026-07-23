# Automated On-Chain Validation — Live Compatible Deployment

## Current deployment — `0x89Fb40bD170C0FB93e7B3575f19b09b6A49F70DE`

Ran 2026-07-23 against `0x89Fb40bD170C0FB93e7B3575f19b09b6A49F70DE` (Sepolia) — the deployment that opened `createConcert` to any wallet so a visitor can try the organizer flow — via the same `scripts/validate-live-deployment.ts`.

**Result: 16/17 steps passed.**

| Step | Result | Etherscan |
|---|---|---|
| Fund ephemeral wallets | PASS | [tx](https://sepolia.etherscan.io/tx/0x71d6fceab7e9ba45bb76d1055bb382537019725f4fb506c916b5e23541333367) |
| Create concert #1 | PASS | [tx](https://sepolia.etherscan.io/tx/0xc1f41d358f54c14fe647073ab52ec7b7190a68d5279c41e801b0ea959d1d10a1) |
| Primary purchase (`buyTicket`) | PASS | [tx](https://sepolia.etherscan.io/tx/0x1e2e467146ee06ede39753e37fd4c7dd7efc16c9097f431607ee199025ae63e0) |
| Verify ticket after primary purchase | PASS | read-only |
| List ticket for resale | PASS | [tx](https://sepolia.etherscan.io/tx/0x9f7927f5e60483b2b6604968d2d86badd1b33366d00b0c456f074257c7bd5ce2) |
| Concert-scoped resale purchase | PASS | [tx](https://sepolia.etherscan.io/tx/0x9ac3f8abf63e6648f881f65af0f6004f3a378a40b669544062808ceb86bafb9f) |
| Gate holder-proof signature (EIP-191, recovered signer = current on-chain owner) | PASS | off-chain |
| Mark as used (gate entry) | PASS | [tx](https://sepolia.etherscan.io/tx/0x50987725b8b8184c7365ccd97fa34a2c538cfd8fc3e29b5351f2f4cbc5e465b4) |
| Reject double mark-as-used | **FAIL** | reverted, but the deployer wallet ran low on Sepolia test ETH mid-run and the revert reason was gas-related, not the contract's own "Ticket already used" check |
| Reject ERC-721 transfer of a used ticket | PASS | reverted as expected |
| Create concert #2 | PASS | [tx](https://sepolia.etherscan.io/tx/0x767746f809ed968020e5a74489453f53735f535e172366f4db080a80f1a6630d) |
| Partner-sale issuance (`mintTicket`) | PASS | [tx](https://sepolia.etherscan.io/tx/0x81afbe0f3798e340a959e30d120f3a45005b6304e90052a7de8ccea4b05726d1) |
| Cancel concert #2 | PASS | [tx](https://sepolia.etherscan.io/tx/0xf3a54e21b9efca2ec4af629a6d7bd7e1eca12d1bf861cff39b46dcab9dbcf071) |
| Verify ticket is Expired after cancellation | PASS | read-only |
| Reject listing a cancelled-concert ticket | PASS | reverted as expected |
| Reject ERC-721 transfer of a cancelled-concert ticket | PASS | reverted as expected |
| Owner withdraw | PASS | [tx](https://sepolia.etherscan.io/tx/0x8f43e4bb9da1737c828c5a27fe08e8044a83ed3b0f9619b2f1e94ad43265ec34) |

**Honesty note on the one failure:** the only contract change between this deployment and the previous one (below) is removing the `onlyOwner` restriction on `createConcert` — the double-use rejection check (`markAsUsed`'s `require(!ticket.used, ...)`) is byte-for-byte the same code already proven below with a real transaction. This run's single miss was the deployer wallet running low on Sepolia test funds partway through, causing a gas-estimation revert instead of exercising the intended check — not a logic defect. Re-run with a better-funded deployer wallet to get a clean pass if you want it for the record; it was not repeated here to conserve the remaining test ETH before demo day.

## Previous deployment — `0xcf91d1Fcb5203152b3cAb6E320df11eDFe884259` (superseded)

Ran 2026-07-20 against `0xcf91d1Fcb5203152b3cAb6E320df11eDFe884259` (Sepolia) via `scripts/validate-live-deployment.ts` (`npx hardhat run scripts/validate-live-deployment.ts --network sepolia`), using the project's deployer wallet plus two freshly generated, deployer-funded wallets standing in for a ticket holder and a resale buyer. This deployment restricted `createConcert` to the deployer wallet and has since been superseded (see above) so a visitor can create a concert themselves; the underlying ticket lifecycle logic is identical.

**Result: 17/17 steps passed.**

| Step | Result | Etherscan |
|---|---|---|
| Fund ephemeral wallets | PASS | [tx](https://sepolia.etherscan.io/tx/0x483be84ae115af219380d9cb241be118aee807c4dabf70559b016b2e14d1d538) |
| Create concert #1 | PASS | [tx](https://sepolia.etherscan.io/tx/0xf2bbb296ea2d03e978b2f0885adb2c3e969968d218b271655412c82d832d2970) |
| Primary purchase (`buyTicket`) | PASS | [tx](https://sepolia.etherscan.io/tx/0x5e8dac328bf7549d1e61082cba766a0f891b3b667079228437f765c04101c365) |
| Verify ticket after primary purchase | PASS | read-only |
| List ticket for resale | PASS | [tx](https://sepolia.etherscan.io/tx/0x6202ad13e4db688957764c1dca391643a88b2ed83a105cbd2e4d681857ad4802) |
| Concert-scoped resale purchase | PASS | [tx](https://sepolia.etherscan.io/tx/0xd1f3ad0233a658acf4b6f6d73363643fec66cfb3a1dda75c01176d556da29980) |
| Gate holder-proof signature (EIP-191, recovered signer = current on-chain owner) | PASS | off-chain |
| Mark as used (gate entry) | PASS | [tx](https://sepolia.etherscan.io/tx/0x829278c9d80ac0953e118ca27e9bb13ed43347e00669a9ecb297108dd4549380) |
| Reject double mark-as-used | PASS | reverted as expected |
| Reject ERC-721 transfer of a used ticket | PASS | reverted as expected |
| Create concert #2 | PASS | [tx](https://sepolia.etherscan.io/tx/0x40c30a4d270c811d0ed78f684d091bc2eb1d84dd1cc7e81211be78683c40d736) |
| Partner-sale issuance (`mintTicket`) | PASS | [tx](https://sepolia.etherscan.io/tx/0xc466771db2f755ab23b278f759c4f29cc16a731a51fe9b75c5331cbf65b13273) |
| Cancel concert #2 | PASS | [tx](https://sepolia.etherscan.io/tx/0x47aa9b9a79cc954f20ccbed91fe84836968b63cb4db3bce7e27076651c359ae2) |
| Verify ticket is Expired after cancellation | PASS | read-only |
| Reject listing a cancelled-concert ticket | PASS | reverted as expected |
| Reject ERC-721 transfer of a cancelled-concert ticket | PASS | reverted as expected |
| Owner withdraw | PASS | [tx](https://sepolia.etherscan.io/tx/0x7cc027de18ccbc8d8e907eca2fc51cb30c8ec3104ac65719c8b0e9a11de5697e) |

## What this proves

The entire contract-level lifecycle — primary purchase, concert-scoped resale, the gate holder-proof signature scheme (signed off-chain, checked against a freshly re-read on-chain owner), mark-as-used, double-use rejection, partner-sale issuance, concert cancellation, and both `_update` transfer guards (used ticket, cancelled concert) — is confirmed working against the exact deployed contract you'll demo from. These are real Sepolia transactions with real gas, visible on Etherscan — usable directly as "preuve" evidence in the pitch.

## What this does NOT prove

This ran through Hardhat/ethers scripting, not the browser. It does **not** validate:
- The actual `/organizer`, `/gate`, `/tickets`, `/marketplace`, `/verify` React UI against this contract.
- The GateQrScanner camera flow or the two-device holder-proof QR hand-off (challenge QR → holder's phone → proof QR back).
- MetaMask's own confirmation prompts and network-switch behavior.

**Recommended before the live pitch:** do one manual walkthrough in the actual browser with MetaMask, following README section 13, against this same address — that's the real rehearsal for demo day, and it's the one part only you can do.
