import assert from "node:assert/strict";
import test from "node:test";
import {
  getGateDecision,
  getMarketplaceState,
  getTicketStatus,
  normalizeTokenId
} from "./ticketState.ts";

test("normalizeTokenId accepts digits and removes surrounding whitespace", () => {
  assert.equal(normalizeTokenId(" 42 "), "42");
});

test("normalizeTokenId rejects missing and non-numeric values with the demo message", () => {
  assert.throws(() => normalizeTokenId(""), /Enter a numeric token ID\./);
  assert.throws(() => normalizeTokenId("12a"), /Enter a numeric token ID\./);
});

test("getTicketStatus gives used tickets precedence over listing state", () => {
  assert.deepEqual(getTicketStatus({ used: true, listed: true }), { label: "Used", tone: "red" });
  assert.deepEqual(getTicketStatus({ used: false, listed: true }), { label: "For Sale", tone: "amber" });
  assert.deepEqual(getTicketStatus({ used: false, listed: false }), { label: "Valid", tone: "green" });
});

test("getMarketplaceState permits purchase only for a live listing owned by another wallet", () => {
  assert.equal(getMarketplaceState({ exists: false, used: false, listed: false, owner: "", viewer: "0x1" }), "invalid");
  assert.equal(getMarketplaceState({ exists: true, used: true, listed: true, owner: "0x2", viewer: "0x1" }), "used");
  assert.equal(getMarketplaceState({ exists: true, used: false, listed: false, owner: "0x2", viewer: "0x1" }), "not-listed");
  assert.equal(getMarketplaceState({ exists: true, used: false, listed: true, owner: "0xA", viewer: "0xa" }), "owned");
  assert.equal(getMarketplaceState({ exists: true, used: false, listed: true, owner: "0x2", viewer: "0x1" }), "available");
});

test("getGateDecision maps verification data to the required entry language", () => {
  assert.deepEqual(getGateDecision({ exists: false, used: false, valid: false }), {
    title: "Invalid ticket",
    decision: "Entry denied",
    message: "This token does not exist on the TicketChain contract.",
    tone: "denied"
  });
  assert.deepEqual(getGateDecision({ exists: true, used: true, valid: false }), {
    title: "Already used",
    decision: "Entry denied",
    message: "This ticket has already been used for entry.",
    tone: "denied"
  });
  assert.deepEqual(getGateDecision({ exists: true, used: false, valid: true }), {
    title: "Valid ticket",
    decision: "Entry approved",
    message: "Ownership and usage status are valid on-chain.",
    tone: "approved"
  });
});
