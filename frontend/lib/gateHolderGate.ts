import type { GateHolderChallenge } from "./gateHolderProof";

export type GateHolderConfirmation = {
  challengeKey: string;
  signer: string;
};

export function createGateHolderChallengeUrl(origin: string, challenge: GateHolderChallenge): string {
  const url = new URL("/verify", new URL(origin).origin);
  url.searchParams.set("tokenId", challenge.tokenId);
  url.searchParams.set("contractAddress", challenge.contractAddress);
  url.searchParams.set("chainId", challenge.chainId.toString());
  url.searchParams.set("nonce", challenge.nonce);
  url.searchParams.set("expiresAt", challenge.expiresAt.toString());
  return url.toString();
}

export function isGateHolderConfirmationCurrent({
  challenge,
  confirmation,
  challengeKey,
  tokenId,
  ticketValid,
  now
}: {
  challenge: GateHolderChallenge | null;
  confirmation: GateHolderConfirmation | null;
  challengeKey: string;
  tokenId: string;
  ticketValid: boolean;
  now: number;
}): boolean {
  if (!challenge || !confirmation || !ticketValid || now >= challenge.expiresAt) return false;

  try {
    return (
      BigInt(tokenId).toString() === challenge.tokenId &&
      confirmation.challengeKey === challengeKey
    );
  } catch {
    return false;
  }
}

export function isGateHolderMarkPreflightEligible({
  latestOwner,
  ...confirmationArgs
}: Parameters<typeof isGateHolderConfirmationCurrent>[0] & { latestOwner: string }): boolean {
  const { confirmation } = confirmationArgs;
  return Boolean(
    confirmation &&
    isGateHolderConfirmationCurrent(confirmationArgs) &&
    confirmation.signer.toLowerCase() === latestOwner.toLowerCase()
  );
}
