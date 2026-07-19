import assert from "node:assert/strict";
import test from "node:test";
import { Wallet } from "ethers";
import {
  createGateHolderChallenge,
  createGateHolderProofMessage,
  serializeGateHolderProof,
  validateGateHolderProof
} from "./gateHolderProof.ts";

const contractAddress = "0x1111111111111111111111111111111111111111";
const now = 1_700_000_000_000;

function createChallenge() {
  return createGateHolderChallenge({
    contractAddress,
    chainId: 11155111,
    tokenId: "42",
    now
  });
}

async function createSignedPayload(challenge: ReturnType<typeof createChallenge>, wallet: Wallet) {
  return serializeGateHolderProof({
    ...challenge,
    signer: wallet.address,
    signature: await wallet.signMessage(createGateHolderProofMessage(challenge))
  });
}

test("creates a five-minute challenge with a 32-byte nonce and deterministic message", () => {
  const challenge = createChallenge();

  assert.match(challenge.nonce, /^[0-9a-f]{64}$/);
  assert.equal(challenge.expiresAt, now + 5 * 60 * 1000);
  assert.equal(createGateHolderProofMessage(challenge), [
    "TicketChain Gate Holder Proof",
    `Contract: ${contractAddress}`,
    "Chain ID: 11155111",
    "Token ID: 42",
    `Nonce: ${challenge.nonce}`,
    `Expires At: ${challenge.expiresAt}`
  ].join("\n"));
});

test("validates a proof signed by the current owner", async () => {
  const challenge = createChallenge();
  const holder = Wallet.createRandom();
  const result = validateGateHolderProof({
    challenge,
    payload: await createSignedPayload(challenge, holder),
    expectedOwner: holder.address,
    usedNonces: new Set(),
    now
  });

  assert.deepEqual(result, { ok: true, signer: holder.address });
});

test("rejects a proof signed by a wallet other than the current owner", async () => {
  const challenge = createChallenge();
  const holder = Wallet.createRandom();
  const otherWallet = Wallet.createRandom();
  const result = validateGateHolderProof({
    challenge,
    payload: await createSignedPayload(challenge, otherWallet),
    expectedOwner: holder.address,
    usedNonces: new Set(),
    now
  });

  assert.deepEqual(result, { ok: false, code: "wrong-owner" });
});

test("rejects a proof bound to another ticket", async () => {
  const challenge = createChallenge();
  const holder = Wallet.createRandom();
  const payload = JSON.parse(await createSignedPayload(challenge, holder));
  payload.tokenId = "43";
  const result = validateGateHolderProof({
    challenge,
    payload: JSON.stringify(payload),
    expectedOwner: holder.address,
    usedNonces: new Set(),
    now
  });

  assert.deepEqual(result, { ok: false, code: "wrong-ticket" });
});

test("rejects an expired challenge", async () => {
  const challenge = createChallenge();
  const holder = Wallet.createRandom();
  const result = validateGateHolderProof({
    challenge,
    payload: await createSignedPayload(challenge, holder),
    expectedOwner: holder.address,
    usedNonces: new Set(),
    now: challenge.expiresAt
  });

  assert.deepEqual(result, { ok: false, code: "expired" });
});

test("rejects a proof whose challenge nonce was already consumed", async () => {
  const challenge = createChallenge();
  const holder = Wallet.createRandom();
  const result = validateGateHolderProof({
    challenge,
    payload: await createSignedPayload(challenge, holder),
    expectedOwner: holder.address,
    usedNonces: new Set([challenge.nonce]),
    now
  });

  assert.deepEqual(result, { ok: false, code: "replayed" });
});

test("rejects malformed proof payloads", () => {
  const result = validateGateHolderProof({
    challenge: createChallenge(),
    payload: "not a proof",
    expectedOwner: Wallet.createRandom().address,
    usedNonces: new Set(),
    now
  });

  assert.deepEqual(result, { ok: false, code: "malformed" });
});
