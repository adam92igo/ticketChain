import assert from "node:assert/strict";
import test from "node:test";
import { parseGateQrToken } from "./gateQr.ts";

Object.defineProperty(globalThis, "window", {
  value: { location: { origin: "https://tickets.example" } },
  configurable: true
});

test("parseGateQrToken accepts same-origin absolute and relative verification URLs", () => {
  assert.equal(parseGateQrToken("https://tickets.example/verify?tokenId=42"), "42");
  assert.equal(parseGateQrToken("/verify?tokenId=7"), "7");
});

test("parseGateQrToken rejects other origins, paths, and non-numeric token IDs", () => {
  assert.equal(parseGateQrToken("https://untrusted.example/verify?tokenId=42"), null);
  assert.equal(parseGateQrToken("/tickets?tokenId=42"), null);
  assert.equal(parseGateQrToken("/verify?tokenId=abc"), null);
});
