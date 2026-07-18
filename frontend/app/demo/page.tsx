import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Wallet } from "lucide-react";
import { DemoStepCard } from "@/components/DemoStepCard";
import { PageHeader } from "@/components/PageHeader";

const steps = [
  ["Set up the organiser", "Open the Organizer Portal and use the contract-owner wallet for organizer operations: create, partner-sale issuance, cancellation, and mark-as-used. Client purchases, resale, and transfers are performed by their respective wallets."],
  ["Create a concert", "Use the contract-owner wallet to create the jury demo event."],
  ["Select the concert", "Show its empty issued-ticket list, then keep this view open for the ledger."],
  ["Confirm a partner sale", "With the selected concert, enter the buyer wallet and sign the real partner-sale issuance. Explain that this visible signature represents the production webhook step."],
  ["Show issued tickets", "Refresh the selected concert and point out the real token IDs, current owners, and listing status."],
  ["Open My Tickets", "Switch to the client wallet and load its owned NFT collection."],
  ["Show QR and wallet proof", "Open /verify?tokenId=<id>; explain public validity, then connect the holder wallet to compare ownership."],
  ["Resell by concert or transfer", "List a ticket, select its concert in Marketplace, and buy with the second wallet; or use controlled transfer, then refresh the organizer row."],
  ["Open Gate Check", "Use the organizer row’s Gate Check link so the token ID is preloaded."],
  ["Reject once", "Reject Mark as Used in MetaMask and show that the ticket still reads as unused."],
  ["Confirm use", "Approve Mark as Used and wait for the confirmed Sepolia transaction before showing the used state."],
  ["Verify again", "Reopen the same QR link and show Already used with Entry denied."],
  ["Show cancellation expiry", "With a separate concert, reject cancellation once, then confirm it. Show its QR and Gate Check return Concert cancelled / Entry denied."],
  ["Open Sepolia Etherscan", "Finish with the issuance, cancellation, resale, or NFT public record."]
] as const;

export default function DemoPage() {
  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Presentation preparation"
        title="Presentation scenario"
        description="Use this short order of operations to explain the TicketChain feature and prove each on-chain rule during a live presentation."
        actions={<Link className="primary-button button-link" href="/organizer">Open Organizer Portal <ArrowRight size={17} /></Link>}
      />

      <p className="helper-copy">This page does not run a demo automatically. It tells you which real action to show next and what it proves.</p>

      <section className="demo-step-grid">
        {steps.map(([title, description], index) => <DemoStepCard key={title} number={index + 1} title={title} description={description} />)}
      </section>

      <section className="guide-grid">
        <article className="workspace">
          <div className="section-heading"><div><p className="eyebrow">Required wallets</p><h2>Two profiles, three moments</h2></div><Wallet size={22} /></div>
          <ul className="check-list">
            <li><strong>Organisateur:</strong> the portal is readable without an account; use the deployer/contract-owner wallet for create, partner-sale issuance, cancellation and gate use.</li>
            <li><strong>Client:</strong> a second wallet for primary purchase, ticket ownership, concert-scoped resale, transfer and holder-wallet proof.</li>
            <li>Public QR validation reads ticket state; it does not by itself prove control of the holder wallet.</li>
            <li>Fund both wallets with enough Sepolia ETH before the presentation.</li>
          </ul>
        </article>
        <article className="workspace">
          <div className="section-heading"><div><p className="eyebrow">Backup checklist</p><h2>Prepare the fallback</h2></div><CheckCircle2 size={22} /></div>
          <ul className="check-list">
            <li>Keep one active unused token ID, one already-used token ID, and one cancelled-concert token ID in your notes.</li>
            <li>Save the deployed contract address and direct verification URLs.</li>
            <li>Open Etherscan tabs before presenting in case confirmation is slow.</li>
            <li>Confirm both wallets can switch to Sepolia.</li>
          </ul>
        </article>
        <article className="workspace full-span">
          <div className="section-heading"><div><p className="eyebrow">MetaMask troubleshooting</p><h2>Recover without breaking the flow</h2></div><AlertTriangle size={22} /></div>
          <div className="troubleshooting-grid">
            <p><strong>Wrong network:</strong> use the header’s Switch to Sepolia action, then refresh.</p>
            <p><strong>Rejected request:</strong> no state changed; repeat the action and approve it in MetaMask.</p>
            <p><strong>Cancelled concert:</strong> use a separate demo concert; its QR and Gate Check must deny entry without marking tickets used.</p>
            <p><strong>Insufficient funds:</strong> top up with a Sepolia faucet and keep a funded backup wallet ready.</p>
            <p><strong>Wrong account:</strong> switch in MetaMask and wait for the header address and page data to refresh.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
