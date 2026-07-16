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
