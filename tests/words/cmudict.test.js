// Reading the dictionary and looking words up.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeWord, parseCmudict, pronunciations } from "../../js/words/cmudict.js";

const SAMPLE = `think TH IH1 NG K
live L AY1 V
live(2) L IH1 V
aalborg AO1 L B AO0 R G # place, danish
don't D OW1 N T
x-ray EH1 K S R EY2

not a line`;

test("reads words, second ways of saying them, and notes", () => {
  const dict = parseCmudict(SAMPLE);
  assert.deepEqual(dict.get("think"), [["TH", "IH1", "NG", "K"]]);
  assert.deepEqual(dict.get("live"), [["L", "AY1", "V"], ["L", "IH1", "V"]]);
  assert.deepEqual(dict.get("aalborg"), [["AO1", "L", "B", "AO0", "R", "G"]]);
  assert.deepEqual(dict.get("x-ray"), [["EH1", "K", "S", "R", "EY2"]]);
  assert.equal(dict.size, 5);
});

test("typed words are looked up the way a phone types them", () => {
  const dict = parseCmudict(SAMPLE);
  assert.equal(normalizeWord("  Don’t "), "don't");
  assert.deepEqual(pronunciations(dict, "Don’t"), [["D", "OW1", "N", "T"]]);
  assert.deepEqual(pronunciations(dict, "zzzz"), []);
});

test("the real dictionary reads in full", () => {
  const dict = parseCmudict(readFileSync(new URL("../../data/words/cmudict.dict", import.meta.url), "utf8"));
  assert.ok(dict.size > 120000, `${dict.size} words`);
  assert.deepEqual(dict.get("weather"), [["W", "EH1", "DH", "ER0"]]);
});
