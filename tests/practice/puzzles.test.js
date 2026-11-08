// Listen and Read (js/practice/lists.js and puzzles.js), against the real dictionary. No page, no sound.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCmudict } from "../../js/words/cmudict.js";
import { lookUpIn } from "../../js/words/lookup.js";
import { PAIRS, STRONG_WORDS, UH_WORDS, SAME_SOUND } from "../../js/practice/lists.js";
import { listenRound, vowelParts, canStrong, canUh, uhParts, checkUh, sameSound } from "../../js/practice/puzzles.js";

const dict = parseCmudict(readFileSync(new URL("../../data/words/cmudict.dict", import.meta.url), "utf8"));
const L = (w) => lookUpIn(dict, w);

test("every Listen word is in the dictionary, and each pair sounds different", () => {
  for (const g of PAIRS) {
    assert.ok(g.sound && g.tip, g.sound);
    for (const [a, b] of g.words) {
      assert.ok(L(a), a);
      assert.ok(L(b), b);
      assert.notDeepEqual(L(a).phones.map((p) => p.replace(/\d/, "")), L(b).phones.map((p) => p.replace(/\d/, "")), `${a}/${b}`);
    }
  }
});

test("a Listen round says one of its two words", () => {
  let x = 0;
  const rand = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  for (let k = 0; k < 50; k++) {
    const r = listenRound([], rand);
    assert.equal(r.words.length, 2);
    assert.ok(r.words.includes(r.target));
  }
});

test("a Listen round favors the learner's own words", () => {
  const rounds = Array.from({ length: 200 }, () => listenRound(["think"]));
  assert.ok(rounds.filter((r) => r.words.includes("think")).length > 50);
});

test("every strong-part word works, with the strong part on the right letters", () => {
  for (const w of STRONG_WORDS) assert.ok(canStrong(L(w)), w);
  const t = L("today");
  assert.equal(t.parts[t.strong].letters, "ay");
  const p = L("photography");
  assert.equal(p.strong, 3); // ph·o·t·[o]·g·r·a·ph·y
});

test("only parts with a vowel sound can be tapped", () => {
  assert.deepEqual(vowelParts(L("banana")).map((p) => p.letters), ["a", "a", "a"]);
  assert.equal(canStrong(L("think")), false); // one part only: no puzzle
});

test("every small-uh word has one, and the answer is exact", () => {
  for (const w of UH_WORDS) assert.ok(canUh(L(w)), w);
  const b = L("banana");
  assert.deepEqual(uhParts(b), [1, 5]);
  assert.equal(checkUh(b, [5, 1]), true);
  assert.equal(checkUh(b, [1]), false);
  assert.equal(checkUh(b, [1, 3, 5]), false);
});

test("every same-sound puzzle can be answered from the dictionary", () => {
  let same = 0;
  for (const [a, la, b, lb] of SAME_SOUND) {
    const r = sameSound(L(a), la, L(b), lb);
    assert.notEqual(r, null, `${a} ${la} / ${b} ${lb}`);
    if (r) same++;
  }
  assert.ok(same >= 3 && same <= SAME_SOUND.length - 3, "a mix of same and different");
  assert.equal(sameSound(L("meat"), "ea", L("meet"), "ee"), true);
  assert.equal(sameSound(L("bread"), "ea", L("bead"), "ea"), false);
});
