// Five minutes: what a practice contains, in what order, in quiet mode, without speech, and the summary.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HEAR_STEPS, QUIET_HEAR_STEPS, SAY_STEPS, currentWord, focusSound, keepPlan, planFor, planSession, summary, takePlan } from "../../js/session.js";
import { fresh } from "../../js/store.js";

const tips = JSON.parse(readFileSync(new URL("../../data/tips/uk-en.json", import.meta.url), "utf8"));
let seed = 3;
const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const withMisses = (word, sound, n = 2) => { const s = fresh(); s.words = [{ text: word, added: "" }]; s.history[word] = Array.from({ length: n }, () => ({ at: "2026-11-09T10:00:00.000Z", score: 30, bad: [[sound, "red", "th"]] })); return s; };

test("the sound to work on: the hardest so far, else the word's own hardest sound", () => {
  assert.equal(focusSound(tips, withMisses("think", "TH")), "TH");
  assert.equal(focusSound(tips, fresh(), "W"), "W");
  assert.equal(focusSound(tips, fresh(), "XX"), null);
  assert.equal(focusSound(tips, fresh()), null);
});

test("out loud: look first, then listen, then say, with their own word first", () => {
  const p = planSession({ tips, state: withMisses("think", "TH"), word: "think", wordSound: "TH", rng });
  assert.equal(p.sound, "TH");
  assert.equal(p.name, "th");
  assert.deepEqual(p.steps.map((s) => s.kind), ["look", ...Array(HEAR_STEPS).fill("hear"), ...Array(SAY_STEPS).fill("say")]);
  assert.deepEqual(p.steps.filter((s) => s.kind === "say").map((s) => s.word), ["think", "thank", "thin"]);
  assert.ok(p.steps.filter((s) => s.kind === "hear").every((s) => s.pair.includes(s.said)));
  assert.deepEqual(p.preview.map((l) => l.kind), ["look", "hear", "say"]);
  assert.equal(p.preview[0].text, "See how to make the th");
  assert.match(p.preview[1].text, /^Hear the difference: \w+ · \w+$/);
  assert.equal(p.preview[2].text, "Say think, thank, and thin");
});

test("quiet: no saying, more listening", () => {
  const p = planSession({ tips, state: withMisses("think", "TH"), word: "think", quiet: true, rng });
  assert.deepEqual(p.steps.map((s) => s.kind), ["look", ...Array(QUIET_HEAR_STEPS).fill("hear")]);
  assert.ok(!p.preview.some((l) => l.kind === "say"));
});

test("a phone that can't speak words has no listening steps", () => {
  const p = planSession({ tips, state: withMisses("think", "TH"), word: "think", speech: false, rng });
  assert.deepEqual(p.steps.map((s) => s.kind), ["look", "say", "say", "say"]);
  assert.equal(planSession({ tips, state: fresh(), word: null, quiet: true, speech: false }), null, "quiet with no speech and no sound: nothing to do");
});

test("a new learner with one word and no history works on that word's sound", () => {
  const s = fresh();
  s.words = [{ text: "weather", added: "" }];
  const p = planSession({ tips, state: s, word: "weather", wordSound: "DH", rng });
  assert.equal(p.sound, "DH");
  assert.equal(p.steps.find((x) => x.kind === "say").word, "weather");
  assert.equal(p.preview.at(-1).text, "Say weather, this, and that");
});

test("nothing to practice yet: no words and no history", () => {
  assert.equal(planSession({ tips, state: fresh() }), null);
});

test("two words read as 'a and b', and a word with no tip sound still gets said", () => {
  const p = planSession({ tips, state: fresh(), word: "mom", wordSound: null, rng });
  assert.deepEqual(p.steps, [{ kind: "say", word: "mom" }]);
  assert.equal(p.preview[0].text, "Say mom");
});

test("the summary: each word before and now, and how many were heard right", () => {
  const p = planSession({ tips, state: withMisses("think", "TH"), word: "think", rng });
  const s = summary(p, { before: { think: 30 }, best: { think: 75, thank: 90 }, heardRight: 2 });
  assert.deepEqual(s.said, [{ word: "think", before: 30, now: 75 }, { word: "thank", before: null, now: 90 }, { word: "thin", before: null, now: null }]);
  assert.equal(s.heard, HEAR_STEPS);
  assert.equal(s.heardRight, 2);
  assert.equal(s.steps, HEAR_STEPS + 1 + SAY_STEPS);
});

test("the plan for this learner: their current word and its own hardest sound, through ctx.lookUp", async () => {
  const s = fresh();
  s.words = [{ text: "weather", added: "" }, { text: "very", added: "" }];
  assert.equal(currentWord(s), "very", "the newest word, when none is picked");
  s.current = "weather";
  assert.equal(currentWord(s), "weather");
  s.current = "gone";
  assert.equal(currentWord(s), "very", "a picked word that was removed doesn't count");
  s.current = "weather";
  const ctx = { state: s, lookUp: async (w) => (w === "weather" ? { phones: ["W", "EH1", "DH", "ER0"] } : null) };
  const p = await planFor(ctx, tips, { quiet: false });
  assert.equal(p.sound, "DH");
  assert.equal(p.steps.find((x) => x.kind === "say").word, "weather");
  const broken = await planFor({ state: s, lookUp: async () => { throw new Error("offline"); } }, tips);
  assert.deepEqual(broken.steps, [{ kind: "say", word: "weather" }], "if the word list doesn't load, it still practices the word");
});

test("Start runs the plan Home showed, once", () => {
  keepPlan({ steps: [1] });
  assert.deepEqual(takePlan(), { steps: [1] });
  assert.equal(takePlan(), null);
});
