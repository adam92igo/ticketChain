import assert from "node:assert/strict";
import test from "node:test";
import { parsePitchScrollPosition } from "./pitchScroll.ts";

test("parsePitchScrollPosition restores a saved position for the same pitch URL", () => {
  const saved = JSON.stringify({ path: "/pitch?concertId=7&tokenId=42", y: 684 });

  assert.equal(parsePitchScrollPosition(saved, "/pitch?concertId=7&tokenId=42"), 684);
});

test("parsePitchScrollPosition ignores malformed, mismatched and negative saved positions", () => {
  assert.equal(parsePitchScrollPosition("not-json", "/pitch"), null);
  assert.equal(parsePitchScrollPosition(JSON.stringify({ path: "/pitch?tokenId=42", y: 200 }), "/pitch"), null);
  assert.equal(parsePitchScrollPosition(JSON.stringify({ path: "/pitch", y: -20 }), "/pitch"), null);
});
