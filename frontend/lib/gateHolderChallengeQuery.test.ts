import assert from "node:assert/strict";
import test from "node:test";
import { parseGateHolderChallengeQuery } from "./gateHolderProof.ts";

const challengeParams = {
  tokenId: "42",
  contractAddress: "0x1111111111111111111111111111111111111111",
  chainId: "11155111",
  nonce: "a".repeat(64),
  expiresAt: "1700000300000"
};

test("parses a complete numeric TicketChain holder challenge", () => {
  assert.deepEqual(parseGateHolderChallengeQuery(challengeParams), {
    tokenId: "42",
    contractAddress: "0x1111111111111111111111111111111111111111",
    chainId: 11155111,
    nonce: "a".repeat(64),
    expiresAt: 1700000300000
  });
});

test("rejects missing, duplicate, or malformed holder challenge parameters", () => {
  assert.equal(parseGateHolderChallengeQuery({ tokenId: "42", nonce: "a".repeat(64) }), null);
  assert.equal(parseGateHolderChallengeQuery({ ...challengeParams, tokenId: "not-a-ticket" }), null);
  assert.equal(parseGateHolderChallengeQuery({ ...challengeParams, chainId: "sepolia" }), null);
  assert.equal(parseGateHolderChallengeQuery({ ...challengeParams, chainId: "1e3" }), null);
  assert.equal(parseGateHolderChallengeQuery({ ...challengeParams, nonce: "short" }), null);
  assert.equal(parseGateHolderChallengeQuery({ ...challengeParams, expiresAt: "tomorrow" }), null);
  assert.equal(parseGateHolderChallengeQuery({ ...challengeParams, expiresAt: "1e3" }), null);
  assert.equal(parseGateHolderChallengeQuery({ ...challengeParams, nonce: ["a".repeat(64), "b".repeat(64)] }), null);
});
