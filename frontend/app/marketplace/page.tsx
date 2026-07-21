import MarketplaceClient from "./MarketplaceClient";

export default async function MarketplacePage({
  searchParams
}: {
  searchParams: Promise<{ concertId?: string | string[] }>;
}) {
  const params = await searchParams;
  const concertId = Array.isArray(params.concertId) ? params.concertId[0] : params.concertId || "";

  return <MarketplaceClient initialConcertId={concertId} />;
}
