import VerifyTicketClient from "./VerifyTicketClient";

export default async function VerifyPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tokenId = Array.isArray(params.tokenId) ? params.tokenId[0] : params.tokenId;

  return <VerifyTicketClient initialTokenId={tokenId || ""} />;
}
