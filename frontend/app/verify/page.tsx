import VerifyTicketClient from "./VerifyTicketClient";
import { parseGateHolderChallengeQuery } from "@/lib/gateHolderProof";

export default async function VerifyPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tokenId = Array.isArray(params.tokenId) ? params.tokenId[0] : params.tokenId;
  const hasChallengeParams = ["contractAddress", "chainId", "nonce", "expiresAt"].some((key) => params[key] !== undefined);

  return (
    <VerifyTicketClient
      initialTokenId={tokenId || ""}
      challenge={parseGateHolderChallengeQuery(params)}
      hasChallengeParams={hasChallengeParams}
    />
  );
}
