import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatEth, shortAddress } from "@/lib/format";
import { getTicketStatus } from "@/lib/ticketState";
import type { Verification } from "@/lib/ticketchainTypes";

export function OrganizerTicketTable({ tickets }: { tickets: Verification[] }) {
  if (tickets.length === 0) {
    return <EmptyState title="No tickets issued" description="This concert has no issued NFT tickets yet." />;
  }

  return (
    <div className="organizer-ticket-table">
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Resale price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const status = getTicketStatus(ticket);
            return (
              <tr key={ticket.tokenId.toString()}>
                <td>#{ticket.tokenId.toString()}</td>
                <td><StatusBadge label={status.label} tone={status.tone} /></td>
                <td title={ticket.owner}>{shortAddress(ticket.owner)}</td>
                <td>{formatEth(ticket.resalePrice)}</td>
                <td className="organizer-ticket-actions">
                  <Link className="inline-link" href={"/verify?tokenId=" + ticket.tokenId.toString()}>Verify</Link>
                  <Link className="inline-link" href={"/gate?tokenId=" + ticket.tokenId.toString()}>Gate Check</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
