import { PitchPresentation } from "@/components/PitchPresentation";

export default async function PitchPage({
  searchParams
}: {
  searchParams: Promise<{ concertId?: string | string[]; tokenId?: string | string[] }>;
}) {
  const params = await searchParams;
  const concertId = Array.isArray(params.concertId) ? params.concertId[0] : params.concertId || "";
  const tokenId = Array.isArray(params.tokenId) ? params.tokenId[0] : params.tokenId || "";

  return <PitchPresentation concertId={concertId} tokenId={tokenId} />;
}
