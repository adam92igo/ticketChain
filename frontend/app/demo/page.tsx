import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Wallet } from "lucide-react";
import { DemoStepCard } from "@/components/DemoStepCard";
import { PageHeader } from "@/components/PageHeader";

const steps = [
  ["Connect MetaMask", "Use the organizer wallet and confirm Sepolia is selected."],
  ["Create a concert", "Open Concerts and create the jury demo event."],
  ["Mint a ticket", "Mint one NFT ticket to the attendee wallet."],
  ["Open My Tickets", "Switch to the attendee wallet and load its collection."],
  ["Show the QR code", "Point out the token ID and QR-first verification link."],
  ["Open verification", "Scan the QR or open /verify?tokenId=<id> directly."],
  ["Show Valid ticket", "Confirm Entry approved, concert details and current owner."],
  ["Resell or transfer", "List and buy with the second wallet, or use controlled transfer."],
  ["Show ownership changed", "Verify the same token ID and compare the owner wallet."],
  ["Mark as used", "Return to the organizer wallet and use Gate Check."],
  ["Verify again", "Read the same token after the confirmed gate transaction."],
  ["Show entry denied", "Point out Already used and Entry denied."],
  ["Open Sepolia Etherscan", "Finish with the transaction or NFT public record."]
] as const;

export default function DemoPage() {
  return (
    <div className="route-page">
      <PageHeader
        eyebrow="Jury presentation"
        title="Demo Guide"
        description="A calm, repeatable script for showing the complete TicketChain lifecycle live on Sepolia."
        actions={<Link className="primary-button button-link" href="/concerts">Start Demo <ArrowRight size={17} /></Link>}
      />

      <section className="demo-step-grid">
        {steps.map(([title, description], index) => <DemoStepCard key={title} number={index + 1} title={title} description={description} />)}
      </section>

      <section className="guide-grid">
        <article className="workspace">
          <div className="section-heading"><div><p className="eyebrow">Required wallets</p><h2>Two roles, three moments</h2></div><Wallet size={22} /></div>
          <ul className="check-list">
            <li><strong>Organizer:</strong> deployer/contract-owner wallet for create, mint and gate use.</li>
            <li><strong>Attendee or buyer:</strong> second wallet for ticket ownership, resale and transfer proof.</li>
            <li>Fund both wallets with enough Sepolia ETH before the presentation.</li>
          </ul>
        </article>
        <article className="workspace">
          <div className="section-heading"><div><p className="eyebrow">Backup checklist</p><h2>Prepare the fallback</h2></div><CheckCircle2 size={22} /></div>
          <ul className="check-list">
            <li>Keep one unused token ID and one already-used token ID in your notes.</li>
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
            <p><strong>Insufficient funds:</strong> top up with a Sepolia faucet and keep a funded backup wallet ready.</p>
            <p><strong>Wrong account:</strong> switch in MetaMask and wait for the header address and page data to refresh.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
