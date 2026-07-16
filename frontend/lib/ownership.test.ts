import assert from "node:assert/strict";
import test from "node:test";
import { isTicketOwner } from "./ownership.ts";

test("isTicketOwner requires both addresses and ignores checksum casing", () => {
  assert.equal(isTicketOwner("", "0xabc"), false);
  assert.equal(isTicketOwner("0xabc", ""), false);
  assert.equal(isTicketOwner("0xAbC", "0xaBc"), true);
  assert.equal(isTicketOwner("0xabc", "0xdef"), false);
});
