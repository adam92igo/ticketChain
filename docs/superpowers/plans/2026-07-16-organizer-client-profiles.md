# Organizer and Client Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visible Client/Organisateur profiles, a real organizer concert portal, and holder-wallet ownership proof without changing TicketChain’s established visual identity.

**Architecture:** The contract stores the token IDs emitted by each concert and returns them through one scoped read. The shared React provider transforms those IDs into verification records for a new organizer route. Profile choice changes navigation only; contract-owner authorization remains mandatory for all writes.

**Tech Stack:** Solidity 0.8.28, OpenZeppelin ERC-721Enumerable 5.x, Hardhat 3, TypeScript, Next.js App Router, React 19, ethers.js 6, lucide-react, MetaMask, Ethereum Sepolia.

## Global Constraints

- Keep the existing TicketChain ticket, QR, badge, and Sepolia art direction; do not build a Ticketmaster copy.
- Preserve direct /verify?tokenId=<id> navigation and the exact numeric token validation message.
- Preserve confirmed-only Gate Check behavior. A rejected, failed, or reverted transaction never makes a ticket appear used.
- Do not add fake data, a backend, an indexer, authentication, or global resale-listing discovery.
- The only new discovery read is scoped to one explicit concert; the frontend must not enumerate every NFT.
- The Client/Organisateur selector is interface context only. Contract writes stay protected by onlyOwner and UI controls remain gated by isOwner on Sepolia.
- Organizer copy must call records “issued tickets”; it must not distinguish buyer purchases from manual mints.
- Update the ABI only because this plan intentionally changes the contract interface.
- Never stage or commit .env, frontend/.env.local, secrets, generated .superpowers files, or the user-owned frontend/next-env.d.ts change.
- Before handoff run git diff -- contracts/TicketChain.sol frontend/config/ticketchainAbi.ts, git diff --check, npm test, npm run compile, and npm run frontend:build. Restore the user version of frontend/next-env.d.ts if the build changes it.

---

## File Structure

| File | Responsibility |
| --- | --- |
| contracts/TicketChain.sol | Indexed token IDs for one concert and a scoped read API. |
| test/TicketChain.test.ts | Contract index behavior and regression coverage. |
| frontend/config/ticketchainAbi.ts | Intentional ABI entry for getConcertTicketIds. |
| frontend/lib/ticketchainTypes.ts | getConcertTickets provider contract. |
| frontend/context/TicketChainContext.tsx | Scoped organizer ticket read. |
| frontend/config/app.ts | Client and organizer navigation items. |
| frontend/components/ProfileSwitcher.tsx | Persistent two-profile control. |
| frontend/app/organizer/page.tsx | Query parameter wrapper. |
| frontend/app/organizer/OrganizerClient.tsx | Organizer portal, forms, and data loading. |
| frontend/components/OrganizerConcertSelector.tsx | Real concert inventory selection. |
| frontend/components/OrganizerTicketTable.tsx | Issued-ticket status and deep links. |
| frontend/lib/ownership.ts | Wallet-owner address comparison. |
| frontend/lib/ownership.test.ts | Address-comparison regression test. |
| frontend/app/verify/VerifyTicketClient.tsx | Explicit proof state after public QR read. |
| frontend/app/gate/page.tsx | Query parameter wrapper for Gate Check. |
| frontend/app/gate/GateClient.tsx | Existing Gate Check behavior with optional prefill. |
| frontend/app/concerts/page.tsx | Client-only event catalogue and purchase. |
| frontend/components/AppHeader.tsx, frontend/app/globals.css | Profile UI and responsive organizer styling. |
| README.md, docs/PROJECT_CONTEXT.md, frontend/app/demo/page.tsx, frontend/app/about/page.tsx | Updated product and demonstration narrative. |

### Task 1: Scoped contract index for issued tickets

**Files:**
- Modify: contracts/TicketChain.sol
- Modify: test/TicketChain.test.ts
- Modify: frontend/config/ticketchainAbi.ts

**Interfaces:**
- Produces: getConcertTicketIds(uint256 concertId) external view returns (uint256[] memory).
- Consumed by: getConcertTickets(concertId: string) in Task 2.

- [ ] **Step 1: Write the failing test**

Add this Hardhat test after the current primary-purchase test:

~~~ts
it("returns only the issued ticket IDs for the requested concert", async function () {
  const { ticketChain, buyer, secondBuyer } = await networkHelpers.loadFixture(deployTicketChainFixture);
  await ticketChain.createConcert(
    "Afterparty",
    "Madrid Arena",
    "2026-08-16",
    ethers.parseEther("0.01"),
    ethers.parseEther("0.02"),
    3
  );
  await ticketChain.mintTicket(1, buyer.address);
  await ticketChain.connect(secondBuyer).buyTicket(1, { value: concertInput.originalPrice });
  await ticketChain.mintTicket(2, buyer.address);

  expect(await ticketChain.getConcertTicketIds(1)).to.deep.equal([1n, 2n]);
  expect(await ticketChain.getConcertTicketIds(2)).to.deep.equal([3n]);
  await expect(ticketChain.getConcertTicketIds(999)).to.be.revertedWith("Concert does not exist");
});
~~~

- [ ] **Step 2: Run the test and confirm the missing-read failure**

Run: npm test -- --grep "returns only the issued ticket IDs"  
Expected: failure because getConcertTicketIds does not exist.

- [ ] **Step 3: Implement the smallest contract and ABI change**

Add contract storage alongside _concerts and _tickets:

~~~solidity
mapping(uint256 => uint256[]) private _concertTicketIds;
~~~

In _mintTicket, push the new ID immediately after storing _tickets[tokenId] and before _safeMint:

~~~solidity
_concertTicketIds[concertId].push(tokenId);
~~~

Add this read beside getTicket:

~~~solidity
function getConcertTicketIds(uint256 concertId) external view returns (uint256[] memory) {
    require(_concerts[concertId].active, "Concert does not exist");
    return _concertTicketIds[concertId];
}
~~~

Add this ABI entry immediately after getTicket:

~~~ts
{
  type: "function",
  name: "getConcertTicketIds",
  stateMutability: "view",
  inputs: [{ name: "concertId", type: "uint256" }],
  outputs: [{ name: "", type: "uint256[]" }]
}
~~~

- [ ] **Step 4: Verify contract behavior**

Run: npm test -- --grep "returns only the issued ticket IDs"  
Expected: PASS.

Run: npm run compile  
Expected: Solidity compilation succeeds.

- [ ] **Step 5: Commit the focused change**

~~~bash
git add contracts/TicketChain.sol test/TicketChain.test.ts frontend/config/ticketchainAbi.ts
git commit -m "feat: index issued tickets by concert"
~~~

### Task 2: Make concert ticket reads available to the organizer UI

**Files:**
- Modify: frontend/lib/ticketchainTypes.ts
- Modify: frontend/context/TicketChainContext.tsx

**Interfaces:**
- Consumes: getConcertTicketIds(uint256) and verifyTicket(uint256).
- Produces: getConcertTickets(concertId: string): Promise<Verification[]> from useTicketChain.

- [ ] **Step 1: Define the context API**

Add this property to TicketChainContextValue after myTickets:

~~~ts
getConcertTickets: (concertId: string) => Promise<Verification[]>;
~~~

- [ ] **Step 2: Implement the scoped reader**

After verifyTicket in TicketChainProvider, add:

~~~ts
const getConcertTickets = useCallback(
  async (concertId: string) => {
    const normalizedConcertId = normalizeTokenId(concertId);
    const readContract = await getReadContract();
    const tokenIds = (await readContract.getConcertTicketIds(BigInt(normalizedConcertId))) as bigint[];
    return Promise.all(
      tokenIds.map(async (tokenId) => mapVerification(await readContract.verifyTicket(tokenId)))
    );
  },
  [getReadContract]
);
~~~

Insert getConcertTickets in the useMemo value and in its dependency list. Keep loadData unchanged so the client collection still relies only on tokensOfOwner.

- [ ] **Step 3: Run the frontend type and production build**

Run: npm run frontend:build  
Expected: no ABI-method or context-property TypeScript error.

- [ ] **Step 4: Commit**

~~~bash
git add frontend/lib/ticketchainTypes.ts frontend/context/TicketChainContext.tsx
git commit -m "feat: expose concert ticket reads to organizer UI"
~~~

### Task 3: Add the permanent Client/Organisateur navigation

**Files:**
- Create: frontend/components/ProfileSwitcher.tsx
- Modify: frontend/config/app.ts
- Modify: frontend/components/AppHeader.tsx
- Modify: frontend/app/globals.css

**Interfaces:**
- Produces: clientNavigationItems, organizerNavigationItems, and route-derived ProfileSwitcher.
- Consumed by: AppHeader.

- [ ] **Step 1: Replace the mixed and dead navigation list**

Replace navigationItems with:

~~~ts
export const clientNavigationItems = [
  { href: "/concerts", label: "Events" },
  { href: "/tickets", label: "My Tickets" },
  { href: "/marketplace", label: "Resale" },
  { href: "/verify", label: "Verify" }
] as const;

export const organizerNavigationItems = [
  { href: "/organizer", label: "Organizer Portal" },
  { href: "/gate", label: "Gate Check" },
  { href: "/demo", label: "Demo Guide" },
  { href: "/about", label: "About" }
] as const;
~~~

- [ ] **Step 2: Create ProfileSwitcher**

~~~tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProfileSwitcher() {
  const pathname = usePathname();
  const organizerActive = pathname.startsWith("/organizer") || pathname.startsWith("/gate");

  return (
    <div className="profile-switcher" aria-label="Choose application profile">
      <Link className={!organizerActive ? "active" : ""} href="/concerts" aria-current={!organizerActive ? "page" : undefined}>
        Client
      </Link>
      <Link className={organizerActive ? "active" : ""} href="/organizer" aria-current={organizerActive ? "page" : undefined}>
        Organisateur
      </Link>
    </div>
  );
}
~~~

- [ ] **Step 3: Wire the header**

In AppHeader, import ProfileSwitcher and the two navigation arrays. Derive organizerActive with the same route check, derive navigationItems from that boolean, render ProfileSwitcher between the brand and WalletStatus, and keep the existing mobile menu close-on-path-change logic.

- [ ] **Step 4: Add CSS that reuses the current style tokens**

~~~css
.profile-switcher {
  display: inline-grid;
  grid-template-columns: repeat(2, auto);
  overflow: hidden;
  border: 1px solid rgba(16, 19, 31, 0.16);
  border-radius: 8px;
  background: var(--panel-strong);
}
.profile-switcher a {
  padding: 8px 11px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
}
.profile-switcher a.active {
  background: var(--ink);
  color: #fffdf8;
}
@media (max-width: 720px) {
  .header-primary { flex-wrap: wrap; }
  .profile-switcher { order: 3; width: 100%; }
  .profile-switcher a { text-align: center; }
}
~~~

- [ ] **Step 5: Verify and commit**

Run: npm run frontend:build  
Expected: build passes.

Manually inspect /concerts, /tickets, /organizer, and /gate at desktop and 390 px. Expected: both profiles are always visible and neither obsolete /admin nor /client link remains.

~~~bash
git add frontend/config/app.ts frontend/components/ProfileSwitcher.tsx frontend/components/AppHeader.tsx frontend/app/globals.css
git commit -m "feat: add visible client and organizer profiles"
~~~

### Task 4: Build the organizer portal and separate the client catalogue

**Files:**
- Create: frontend/app/organizer/page.tsx
- Create: frontend/app/organizer/OrganizerClient.tsx
- Create: frontend/components/OrganizerConcertSelector.tsx
- Create: frontend/components/OrganizerTicketTable.tsx
- Modify: frontend/app/concerts/page.tsx
- Modify: frontend/app/globals.css

**Interfaces:**
- Consumes: concerts, getConcertTickets, createConcert, mintTicket, isOwner, and transactionBusy from useTicketChain.
- Consumes: Verification[] from Task 2.
- Produces: /organizer and /organizer?concertId=<id>; /concerts only handles client discovery and primary purchase.

- [ ] **Step 1: Create the route wrapper**

~~~tsx
import OrganizerClient from "./OrganizerClient";

export default async function OrganizerPage({
  searchParams
}: {
  searchParams: Promise<{ concertId?: string | string[] }>;
}) {
  const params = await searchParams;
  const concertId = Array.isArray(params.concertId) ? params.concertId[0] : params.concertId || "";
  return <OrganizerClient initialConcertId={concertId} />;
}
~~~

- [ ] **Step 2: Create focused selector and table components**

OrganizerConcertSelector accepts concerts and selectedConcertId. It renders every real concert as a Link to /organizer?concertId=<decimal id>, showing name, location, date, and minted / totalSupply.

OrganizerTicketTable accepts tickets: Verification[]. Each row uses getTicketStatus(ticket), shortAddress(ticket.owner), and formatEth(ticket.resalePrice). Its two action links are:

~~~tsx
<Link className="inline-link" href={"/verify?tokenId=" + ticket.tokenId.toString()}>Verify</Link>
<Link className="inline-link" href={"/gate?tokenId=" + ticket.tokenId.toString()}>Gate Check</Link>
~~~

For an empty array, use EmptyState with title “No tickets issued” and description “This concert has no issued NFT tickets yet.”

- [ ] **Step 3: Implement OrganizerClient**

Derive selectedConcert from concerts and initialConcertId. Load ticket records only for that selected concert:

~~~tsx
useEffect(() => {
  if (!selectedConcert) {
    setTickets([]);
    setTicketError("");
    return;
  }
  let active = true;
  setTicketsLoading(true);
  setTicketError("");
  void getConcertTickets(selectedConcert.id.toString())
    .then((records) => { if (active) setTickets(records); })
    .catch((err) => { if (active) setTicketError(getFriendlyError(err, "Could not load issued tickets.")); })
    .finally(() => { if (active) setTicketsLoading(false); });
  return () => { active = false; };
}, [getConcertTickets, selectedConcert]);
~~~

Render the selector at all times. With no selected concert, use an EmptyState asking the organizer to select a concert. With one selected, render concert summary, loading/error states, and OrganizerTicketTable.

Move the existing Create concert and Mint ticket forms here. Reuse emptyCreateForm, FormInput, createConcert, and mintTicket. Both write buttons use disabled={!isOwner || transactionBusy}; when isOwner is false show exactly: “Switch to the contract owner wallet to execute organizer transactions.”

- [ ] **Step 4: Remove admin-only UI from the client catalogue**

Remove the create/mint states, actions, imports, and workspace from /concerts. Keep its on-chain concert inventory, wallet connection notice, and ConcertCard primary-buy behavior. Set its PageHeader to:

~~~tsx
eyebrow="Client ticketing"
title="Events"
description="Browse real concerts on Sepolia and receive an NFT ticket in your connected wallet."
~~~

- [ ] **Step 5: Style and verify**

Add organizer-layout as a two-column grid with a 240px minimum selector column, organizer-ticket-table with horizontal overflow, and a 720px one-column mobile rule. Use existing colors, shadows, borders, and badges only.

After the Task 6 deployment, manually verify:
1. /organizer reads concert inventory without account permission.
2. Selecting one concert returns only its issued IDs.
3. Resale or transfer refreshes the owner and listing state.
4. A non-owner wallet cannot execute create or mint.

- [ ] **Step 6: Commit**

~~~bash
git add frontend/app/organizer frontend/components/OrganizerConcertSelector.tsx frontend/components/OrganizerTicketTable.tsx frontend/app/concerts/page.tsx frontend/app/globals.css
git commit -m "feat: add organizer concert and ticket portal"
~~~

### Task 5: Add ownership proof and gate deep links

**Files:**
- Create: frontend/lib/ownership.ts
- Create: frontend/lib/ownership.test.ts
- Modify: frontend/app/verify/VerifyTicketClient.tsx
- Modify: frontend/app/gate/page.tsx
- Create: frontend/app/gate/GateClient.tsx
- Modify: frontend/app/globals.css

**Interfaces:**
- Produces: isTicketOwner(connectedAddress: string, ticketOwner: string): boolean.
- Produces: public QR verification with a connected-wallet proof and /gate?tokenId=<id> prefill.

- [ ] **Step 1: Write the failing helper test**

~~~ts
import assert from "node:assert/strict";
import test from "node:test";
import { isTicketOwner } from "./ownership.ts";

test("isTicketOwner requires both addresses and ignores checksum casing", () => {
  assert.equal(isTicketOwner("", "0xabc"), false);
  assert.equal(isTicketOwner("0xabc", ""), false);
  assert.equal(isTicketOwner("0xAbC", "0xaBc"), true);
  assert.equal(isTicketOwner("0xabc", "0xdef"), false);
});
~~~

Run: node --test frontend/lib/ownership.test.ts  
Expected: missing-module failure.

- [ ] **Step 2: Implement and pass the helper test**

~~~ts
export function isTicketOwner(connectedAddress: string, ticketOwner: string) {
  return Boolean(connectedAddress && ticketOwner) && connectedAddress.toLowerCase() === ticketOwner.toLowerCase();
}
~~~

Run: node --test frontend/lib/ownership.test.ts  
Expected: PASS.

- [ ] **Step 3: Render the explicit proof state**

In VerifyTicketClient, read address and connectWallet from context, import Wallet and isTicketOwner, and compute:

~~~ts
const ownerConfirmed = Boolean(result?.exists) && isTicketOwner(address, result.owner);
~~~

Inside the result.exists area, add a wallet ownership panel. With no address, its button calls connectWallet and says “Connect holder wallet”. With an address, it says “Wallet ownership confirmed” only if ownerConfirmed; otherwise it says “This wallet does not own this NFT”. The panel must also explain that public QR validation remains readable without connecting and that connecting compares the current MetaMask address to the owner read from Sepolia.

- [ ] **Step 4: Make Gate Check accept organizer deep links**

Move the present client component from app/gate/page.tsx into app/gate/GateClient.tsx with prop initialTokenId: string. Replace page.tsx with the same async searchParams wrapper pattern used by VerifyPage. Initialize the form state from initialTokenId and auto-run the existing checkTicket when that value is supplied.

Do not alter the transaction guard:

~~~ts
const confirmed = await markAsUsed(tokenId);
if (!confirmed) return;
const refreshed = await verifyTicket(tokenId);
setResult(refreshed);
setRecorded(true);
~~~

- [ ] **Step 5: Verify and commit**

Run:
~~~bash
node --test frontend/lib/ownership.test.ts
npm run frontend:build
~~~

Expected: helper test and production build pass.

Manually check: the holder wallet confirms, a different wallet is refused, no wallet still permits public QR reading, and rejecting Mark as Used leaves the ticket valid.

~~~bash
git add frontend/lib/ownership.ts frontend/lib/ownership.test.ts frontend/app/verify/VerifyTicketClient.tsx frontend/app/gate/page.tsx frontend/app/gate/GateClient.tsx frontend/app/globals.css
git commit -m "feat: add ticket wallet proof and gate deep links"
~~~

### Task 6: Update documentation, deploy, and validate the demo

**Files:**
- Modify: README.md
- Modify: docs/PROJECT_CONTEXT.md
- Modify: frontend/app/demo/page.tsx
- Modify: frontend/app/about/page.tsx
- Modify locally only: frontend/.env.local

**Interfaces:**
- Consumes: all completed routes and the new Sepolia public contract address.
- Produces: an accurate two-profile demo and a frontend pointed at the intentional new deployment.

- [ ] **Step 1: Update narrative and operating documentation**

README and PROJECT_CONTEXT must state:
- Client buys, owns, verifies, lists, transfers, and resells NFT tickets.
- Organisateur opens /organizer to read real concerts and issued tickets, while writes remain contract-owner-only.
- Public QR validity and holder-wallet proof are separate; QR alone does not prove control of the wallet.
- getConcertTicketIds is a per-concert read and the contract does not record whether issuance came from purchase or manual mint.

Update Demo Guide flow: organizer profile → create concert → select concert → mint or buy → show issued-ticket row → holder QR and wallet proof → organizer Gate Check → confirmed use → repeat verification denied. Keep About page’s visual composition but describe TicketChain as a resale-control and ownership-verification feature within ticketing.

- [ ] **Step 2: Run all local safety checks before deployment**

~~~bash
git diff -- contracts/TicketChain.sol frontend/config/ticketchainAbi.ts
git diff --check
npm test
npm run compile
npm run frontend:build
~~~

Expected: no whitespace errors; tests, compilation, and build pass. Restore frontend/next-env.d.ts to the pre-build user version if Next changes it.

- [ ] **Step 3: Deploy the approved contract revision**

With a funded dedicated Sepolia organizer wallet configured only in the ignored root environment file, run:

~~~bash
npm run deploy:sepolia
~~~

Copy only the public address printed by the deployment script into the ignored frontend/.env.local value NEXT_PUBLIC_CONTRACT_ADDRESS. Keep NEXT_PUBLIC_CHAIN_ID=11155111. Never print, stage, or commit the file. Restart npm run frontend:dev afterward.

- [ ] **Step 4: Run the complete manual scenario**

1. Organizer profile reads empty/new inventory without account connection.
2. Contract owner creates a concert, then sees no tickets initially.
3. Owner mints one ticket and a client buys one; detail lists both correct token IDs and owners.
4. Client resells or transfers; organizer refresh shows current owner and listing status.
5. Verify route still rejects nonnumeric values, reads a ticket publicly, and confirms only the holder’s connected wallet.
6. Gate route preloads from organizer link; reject MetaMask and confirm no used state, then confirm it and observe used state.
7. Reopen the same QR and observe Entry denied.
8. Inspect all changed routes at desktop and 390 px.

- [ ] **Step 5: Commit only the documentation and report remaining MetaMask checks**

~~~bash
git add README.md docs/PROJECT_CONTEXT.md frontend/app/demo/page.tsx frontend/app/about/page.tsx
git commit -m "docs: explain organizer and client ticket flows"
~~~

Do not include local environment files, generated files, .superpowers, or frontend/next-env.d.ts.

## Plan Self-Review

- Spec coverage: Task 1 adds scoped concert ticket data; Task 2 exposes it; Task 3 makes both profiles visible; Task 4 creates the portal and client split; Task 5 proves wallet ownership and preserves gate safety; Task 6 documents, deploys, and verifies.
- Interface consistency: getConcertTicketIds is defined in Task 1, exposed in Task 2, and used only for selected organizer concerts in Task 4.
- Scope consistency: no task introduces a backend, global listing discovery, fabricated blockchain data, authentication, or a new design system.
- Safety consistency: numeric QR validation, confirmed-only gate updates, secret handling, and preservation of user changes are all explicit.
