// Lining letters up with sounds, and looking words up, against the real dictionary.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCmudict } from "../../js/words/cmudict.js";
import { align } from "../../js/words/align.js";
import { loadDictionary, lookUpIn } from "../../js/words/lookup.js";

const dict = parseCmudict(readFileSync(new URL("../../data/words/cmudict.dict", import.meta.url), "utf8"));
const cut = (w) => align(w, dict.get(w)[0]).map((p) => p.letters).join("|");

test("the letters of usual words line up with their sounds", () => {
  const expected = {
    think: "th|i|n|k", weather: "w|ea|th|er", three: "th|r|ee", world: "w|or|l|d", sheep: "sh|ee|p", bread: "b|r|ea|d",
    thirty: "th|ir|t|y", about: "a|b|ou|t", banana: "b|a|n|a|n|a", photography: "ph|o|t|o|g|r|a|ph|y",
    though: "th|ough", through: "th|r|ough", thought: "th|ough|t", laugh: "l|au|gh", daughter: "d|augh|t|er",
    enough: "e|n|ou|gh", knight: "kn|igh|t", comb: "c|o|mb", write: "wr|i|t|e",
  };
  for (const [w, want] of Object.entries(expected)) assert.equal(cut(w), want, w);
});

test("silent letters stand alone, and one spelling can make two sounds", () => {
  assert.equal(cut("vegetable"), "v|e|ge|t|a|b|le"); // "ge" makes the j sound, as in page
  assert.equal(cut("island"), "i|s|l|a|n|d");
  assert.equal(cut("box"), "b|o|x");
  assert.equal(cut("one"), "o|n|e");
  assert.equal(cut("queen"), "qu|ee|n");
  assert.equal(cut("use"), "u|s|e");
  assert.equal(cut("people"), "p|eo|p|le");
  const box = align("box", dict.get("box")[0]);
  assert.deepEqual(box[2], { letters: "x", sounds: [2, 3] });
  const write = align("write", dict.get("write")[0]);
  assert.deepEqual(write.at(-1), { letters: "e", sounds: [] });
});

test("every piece spells the word, and every sound is used once, for a thousand common words", () => {
  let checked = 0;
  for (const [w, ways] of dict) {
    if (!/^[a-z]+$/.test(w) || w.length < 3 || w.length > 10) continue;
    const parts = align(w, ways[0]);
    assert.equal(parts.map((p) => p.letters).join(""), w, w);
    assert.deepEqual(parts.flatMap((p) => p.sounds), ways[0].map((_, i) => i), w);
    if (++checked === 1000) break;
  }
});

test("looking a word up: sounds, letters, stress, and the strong part", () => {
  const w = lookUpIn(dict, "  Weather ");
  assert.equal(w.word, "weather");
  assert.deepEqual(w.phones, ["W", "EH1", "DH", "ER0"]);
  assert.deepEqual(w.parts.map((p) => p.letters), ["w", "ea", "th", "er"]);
  assert.deepEqual(w.stress, [1, 0]);
  assert.equal(w.strong, 1);
  const p = lookUpIn(dict, "photography");
  assert.equal(p.parts[p.strong].letters, "o");
  assert.equal(p.strong, 3);
  assert.equal(lookUpIn(dict, "zzzqq"), null);
});

test("the dictionary loads once, and a failed load can be tried again", async () => {
  let calls = 0;
  const fails = () => { calls++; return Promise.reject(new Error("offline")); };
  await assert.rejects(loadDictionary(fails), /offline/);
  const text = "think TH IH1 NG K\n";
  const d = await loadDictionary(() => { calls++; return Promise.resolve(text); });
  assert.deepEqual(d.get("think"), [["TH", "IH1", "NG", "K"]]);
  await loadDictionary(() => { calls++; return Promise.resolve(""); });
  assert.equal(calls, 2);
});
