import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import type { Concert } from "@/lib/ticketchainTypes";

export function OrganizerConcertSelector({
  concerts,
  selectedConcertId
}: {
  concerts: Concert[];
  selectedConcertId: string;
}) {
  return (
    <aside className="workspace organizer-concert-selector">
      <div className="section-heading">
        <div><p className="eyebrow">Concert inventory</p><h2>Select a concert</h2></div>
      </div>
      {concerts.length === 0 ? (
        <EmptyState title="No concerts created" description="Create a concert to begin issuing NFT tickets." />
      ) : (
        <div className="organizer-concert-list">
          {concerts.map((concert) => {
            const concertId = concert.id.toString();
            const selected = concertId === selectedConcertId;
            return (
              <Link
                className={`organizer-concert-option${selected ? " active" : ""}`}
                href={`/organizer?concertId=${concertId}`}
                key={concertId}
                aria-current={selected ? "page" : undefined}
              >
                <strong>{concert.name}</strong>
                <span>{concert.location}</span>
                <span>{concert.date}</span>
                <small>{concert.minted.toString()} / {concert.totalSupply.toString()} minted</small>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
