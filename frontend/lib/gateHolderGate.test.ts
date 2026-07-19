import assert from "node:assert/strict";
import test from "node:test";
import { getGateHolderChallengeKey, type GateHolderChallenge } from "./gateHolderProof.ts";
import { createGateHolderChallengeUrl, isGateHolderConfirmationCurrent } from "./gateHolderGate.ts";

const challenge: GateHolderChallenge = {
  tokenId: "42",
  contractAddress: "0x1111111111111111111111111111111111111111",
  chainId: 11155111,
  nonce: "a".repeat(64),
  expiresAt: 1_700_000_300_000
};

test("creates a same-origin verify URL with exactly the holder challenge query keys", () => {
  const value = createGateHolderChallengeUrl("https://tickets.example", challenge);
  const url = new URL(value);

  assert.equal(url.origin, "https://tickets.example");
  assert.equal(url.pathname, "/verify");
  assert.deepEqual([...url.searchParams.keys()], [
    "tokenId",
    "contractAddress",
    "chainId",
    "nonce",
    "expiresAt"
  ]);
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    tokenId: "42",
    contractAddress: challenge.contractAddress,
    chainId: "11155111",
    nonce: challenge.nonce,
    expiresAt: "1700000300000"
  });
});

test("requires valid ticket state and a matching unexpired confirmation", () => {
  const confirmation = {
    challengeKey: getGateHolderChallengeKey(challenge),
    signer: "0x2222222222222222222222222222222222222222"
  };
  const base = {
    challenge,
    challengeKey: getGateHolderChallengeKey(challenge),
    confirmation,
    tokenId: "42",
    ticketValid: true,
    now: challenge.expiresAt - 1
  };

  assert.equal(isGateHolderConfirmationCurrent(base), true);
  assert.equal(isGateHolderConfirmationCurrent({ ...base, tokenId: "43" }), false);
  assert.equal(isGateHolderConfirmationCurrent({ ...base, ticketValid: false }), false);
  assert.equal(isGateHolderConfirmationCurrent({ ...base, now: challenge.expiresAt }), false);
  assert.equal(isGateHolderConfirmationCurrent({ ...base, confirmation: { ...confirmation, challengeKey: "old" } }), false);
  assert.equal(isGateHolderConfirmationCurrent({ ...base, confirmation: null }), false);
});
