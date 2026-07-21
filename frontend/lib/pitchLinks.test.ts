import assert from "node:assert/strict";
import test from "node:test";
import { createPitchDemoLinks } from "./pitchLinks.ts";

test("createPitchDemoLinks includes canonical real concert and token context", () => {
  assert.deepEqual(createPitchDemoLinks({ concertId: " 07 ", tokenId: "0042" }), {
    organizer: "/organizer?concertId=7",
    concerts: "/concerts",
    tickets: "/tickets",
    marketplace: "/marketplace?concertId=7",
    verify: "/verify?tokenId=42",
    gate: "/gate?tokenId=42"
  });
});

test("createPitchDemoLinks removes invalid values instead of inventing identifiers", () => {
  assert.deepEqual(createPitchDemoLinks({ concertId: "4x", tokenId: "" }), {
    organizer: "/organizer",
    concerts: "/concerts",
    tickets: "/tickets",
    marketplace: "/marketplace",
    verify: "/verify",
    gate: "/gate"
  });
});

test("createPitchDemoLinks keeps token and concert context independent", () => {
  const links = createPitchDemoLinks({ tokenId: "42" });

  assert.equal(links.organizer, "/organizer");
  assert.equal(links.marketplace, "/marketplace");
  assert.equal(links.verify, "/verify?tokenId=42");
  assert.equal(links.gate, "/gate?tokenId=42");
});
