import { getAddress, isAddress, verifyMessage } from "ethers";

const NONCE_BYTES = 32;
const CHALLENGE_LIFETIME_MS = 5 * 60 * 1000;

export type GateHolderChallenge = {
  contractAddress: string;
  chainId: number;
  tokenId: string;
  nonce: string;
  expiresAt: number;
};

export type GateHolderProof = GateHolderChallenge & {
  signer: string;
  signature: string;
};

export type GateHolderProofValidation =
  | { ok: true; signer: string }
  | { ok: false; code: "malformed" | "expired" | "replayed" | "wrong-ticket" | "wrong-owner" };

export function createGateHolderChallenge({
  contractAddress,
  chainId,
  tokenId,
  now = Date.now()
}: {
  contractAddress: string;
  chainId: number;
  tokenId: string;
  now?: number;
}): GateHolderChallenge {
  return {
    contractAddress: normalizeAddress(contractAddress),
    chainId: normalizeChainId(chainId),
    tokenId: normalizeTokenId(tokenId),
    nonce: createNonce(),
    expiresAt: normalizeNow(now) + CHALLENGE_LIFETIME_MS
  };
}

export function createGateHolderProofMessage(challenge: GateHolderChallenge): string {
  const normalized = normalizeChallenge(challenge);
  return [
    "TicketChain Gate Holder Proof",
    `Contract: ${normalized.contractAddress}`,
    `Chain ID: ${normalized.chainId}`,
    `Token ID: ${normalized.tokenId}`,
    `Nonce: ${normalized.nonce}`,
    `Expires At: ${normalized.expiresAt}`
  ].join("\n");
}

export function serializeGateHolderProof(proof: GateHolderProof): string {
  const normalized = normalizeProof(proof);
  return JSON.stringify(normalized);
}

export function validateGateHolderProof({
  challenge,
  payload,
  expectedOwner,
  usedNonces,
  now = Date.now()
}: {
  challenge: GateHolderChallenge;
  payload: string;
  expectedOwner: string;
  usedNonces: ReadonlySet<string>;
  now?: number;
}): GateHolderProofValidation {
  let expectedChallenge: GateHolderChallenge;
  let proof: GateHolderProof;

  try {
    expectedChallenge = normalizeChallenge(challenge);
    proof = parseGateHolderProof(payload);
    normalizeNow(now);
  } catch {
    return { ok: false, code: "malformed" };
  }

  if (now >= expectedChallenge.expiresAt) {
    return { ok: false, code: "expired" };
  }

  if (usedNonces.has(expectedChallenge.nonce)) {
    return { ok: false, code: "replayed" };
  }

  if (proof.tokenId !== expectedChallenge.tokenId) {
    return { ok: false, code: "wrong-ticket" };
  }

  if (
    proof.contractAddress !== expectedChallenge.contractAddress ||
    proof.chainId !== expectedChallenge.chainId ||
    proof.nonce !== expectedChallenge.nonce ||
    proof.expiresAt !== expectedChallenge.expiresAt
  ) {
    return { ok: false, code: "malformed" };
  }

  try {
    const signer = getAddress(verifyMessage(createGateHolderProofMessage(expectedChallenge), proof.signature));
    if (signer !== proof.signer) return { ok: false, code: "malformed" };
    if (signer.toLowerCase() !== normalizeAddress(expectedOwner).toLowerCase()) {
      return { ok: false, code: "wrong-owner" };
    }
    return { ok: true, signer };
  } catch {
    return { ok: false, code: "malformed" };
  }
}

function createNonce(): string {
  const bytes = new Uint8Array(NONCE_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseGateHolderProof(payload: string): GateHolderProof {
  if (typeof payload !== "string") throw new Error("Proof payload must be text.");
  return normalizeProof(JSON.parse(payload));
}

function normalizeProof(value: unknown): GateHolderProof {
  if (!value || typeof value !== "object") throw new Error("Proof payload is invalid.");
  const proof = value as Record<string, unknown>;
  return {
    ...normalizeChallenge(proof as GateHolderChallenge),
    signer: normalizeAddress(proof.signer),
    signature: normalizeSignature(proof.signature)
  };
}

function normalizeChallenge(value: GateHolderChallenge): GateHolderChallenge {
  return {
    contractAddress: normalizeAddress(value.contractAddress),
    chainId: normalizeChainId(value.chainId),
    tokenId: normalizeTokenId(value.tokenId),
    nonce: normalizeNonce(value.nonce),
    expiresAt: normalizeNow(value.expiresAt)
  };
}

function normalizeAddress(value: unknown): string {
  if (typeof value !== "string" || !isAddress(value)) throw new Error("Address is invalid.");
  return getAddress(value);
}

function normalizeChainId(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Chain ID is invalid.");
  }
  return value;
}

function normalizeTokenId(value: unknown): string {
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw new Error("Token ID is invalid.");
  return BigInt(value).toString();
}

function normalizeNonce(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) throw new Error("Nonce is invalid.");
  return value;
}

function normalizeNow(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Timestamp is invalid.");
  }
  return value;
}

function normalizeSignature(value: unknown): string {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{130}$/.test(value)) {
    throw new Error("Signature is invalid.");
  }
  return value;
}
