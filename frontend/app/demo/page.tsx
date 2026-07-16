import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Wallet } from "lucide-react";
import { DemoStepCard } from "@/components/DemoStepCard";
import { PageHeader } from "@/components/PageHeader";

const steps = [
  ["Open the organizer profile", "Choose Organisateur and open the read-only Organizer Portal on Sepolia."],
  ["Create a concert", "Use the contract-owner wallet to create the jury demo event."],
  ["Select the concert", "Show its empty issued-ticket list, then keep this view open for the ledger."],
  ["Mint or buy", "Mint one ticket to a client wallet and optionally let the client buy another primary ticket."],
  ["Show issued tickets", "Refresh the selected concert and point out the real token IDs, current owners, and listing status."],
  ["Open My Tickets", "Switch to the client wallet and load its owned NFT collection."],
  ["Show QR and wallet proof", "Open /verify?tokenId=<id>; explain public validity, then connect the holder wallet to compare ownership."],
  ["Resell or transfer", "List and buy with the second wallet, or use controlled transfer, then refresh the organizer row."],
  ["Open Gate Check", "Use the organizer row’s Gate Check link so the token ID is preloaded."],
  ["Reject once", "Reject Mark as Used in MetaMask and show that the ticket still reads as unused."],
  ["Confirm use", "Approve Mark as Used and wait for the confirmed Sepolia transaction before showing the used state."],
  ["Verify again", "Reopen the same QR link and show Already used with Entry denied."],
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
          <div className="section-heading"><div><p className="eyebrow">Required wallets</p><h2>Two profiles, three moments</h2></div><Wallet size={22} /></div>
          <ul className="check-list">
            <li><strong>Organisateur:</strong> the portal is readable without an account; use the deployer/contract-owner wallet for create, mint and gate use.</li>
            <li><strong>Client:</strong> a second wallet for primary purchase, ticket ownership, resale, transfer and holder-wallet proof.</li>
            <li>Public QR validation reads ticket state; it does not by itself prove control of the holder wallet.</li>
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
