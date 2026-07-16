import GateClient from "./GateClient";

export default async function GatePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tokenId = Array.isArray(params.tokenId) ? params.tokenId[0] : params.tokenId;

  return <GateClient initialTokenId={tokenId || ""} />;
}
