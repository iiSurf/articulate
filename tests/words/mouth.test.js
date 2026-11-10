// How to make a sound: every sound in the tips has a picture, every Ukrainian start and every "you said" has a pose,
// the drawings have no broken numbers, and the panel holds what it should.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LOOP, loopAt } from "../../js/ui/mouthui.js";
import { HEARD, POSES, UK_POSES, frontView, heardKey, isVowel, panel, sideView, stateView, vowelMap } from "../../js/words/mouth.js";
import { CMU_TO_MODEL } from "../../js/score/phones.js";

const tips = JSON.parse(readFileSync(new URL("../../data/tips/uk-en.json", import.meta.url), "utf8"));
const clean = (svg) => !/NaN|undefined|null|Infinity/.test(svg);

test("every sound in the tips has a pose, and every Ukrainian sound a tip starts from has one too", () => {
  for (const [key, s] of Object.entries(tips.sounds)) {
    assert.ok(POSES[key], `${key} has a pose`);
    assert.ok(POSES[key].say && POSES[key].say.length > 20, `${key} says what the picture shows, for a screen reader`);
    if (s.uk) assert.ok(UK_POSES[s.uk.letter], `${key} starts from ${s.uk.letter}, which has a pose`);
  }
});

test("every 'you said…' in the tips can be drawn, so the panel can show what they said", () => {
  for (const swap of Object.keys(tips.swaps)) {
    const heard = swap.split(">")[1];
    assert.ok(POSES[heardKey(heard)], `${swap}: ${heard} has a pose`);
  }
  for (const ipa of Object.keys(HEARD)) assert.ok(Object.values(CMU_TO_MODEL).includes(ipa), `${ipa} is a sound the model hears`);
});

test("the drawings have no broken numbers, in every pose, every state, and every lips shape", () => {
  for (const [key, pose] of [...Object.entries(POSES), ...Object.entries(UK_POSES)]) {
    const svg = sideView(pose, { label: key });
    assert.ok(clean(svg), key);
    assert.match(svg, /^<svg viewBox="24 58 236 232" role="img" aria-label=/);
    assert.ok(clean(frontView(pose.lips)), `${key} lips`);
  }
  for (const [key, s] of Object.entries(tips.sounds)) {
    for (const state of ["start", "target", 0, 0.5, 1]) assert.ok(clean(stateView(key, s.uk?.letter ?? null, state)), `${key} at ${state}`);
  }
});

test("a pose with a buzz draws one, and air goes where the pose says", () => {
  assert.match(sideView(POSES.DH), /M209 268/, "th in this buzzes");
  assert.doesNotMatch(sideView(POSES.TH), /M209 268/, "th in think doesn't");
  assert.match(sideView(POSES.P), /M46 146 L20 146/, "p has a puff");
  assert.doesNotMatch(sideView(UK_POSES.п), /M46 146 L20 146/, "the Ukrainian п has none");
  assert.match(sideView(POSES.NG), /C194 104 199 118 197 132/, "for ng the soft palate is down, so air goes through the nose");
});

test("the panel for th: the move from с that runs by itself, no lips (they don't matter for th), the tip, Ukrainian marked", () => {
  const p = panel(tips, "TH");
  assert.match(p, /How to make th/);
  assert.match(p, /class="mouth-strip"/, "a label shows which sound is on the picture");
  assert.match(p, /data-mouth-pause/, "a pause button, and no button needed to start it");
  assert.doesNotMatch(p, /data-mouth-show|Show the move/);
  assert.match(p, /moves by itself, from the Ukrainian <span lang="uk">с<\/span> to th/, "screen readers are told it moves");
  assert.match(p, /<span lang="uk">с<\/span> \(<span lang="uk">сам<\/span>\)/);
  assert.match(p, /stroke-dasharray="5 5"/, "the Ukrainian tongue is dashed");
  assert.doesNotMatch(p, /mouth-front/);
  assert.doesNotMatch(p, /mouth-map/);
  assert.match(p, /class="mouth-tip">Start from the Ukrainian <span lang="uk">с<\/span>/);
  assert.doesNotMatch(panel(tips, "TH", { withTip: false, heading: false }), /mouth-tip|How to make/);
});

test("w shows the lips from the front; said as v, it shows what they wanted next to what they said", () => {
  assert.match(panel(tips, "W"), /mouth-front/);
  const p = panel(tips, "W", { said: "v" });
  assert.match(p, /Make: w/);
  assert.match(p, /You said: v/);
  assert.equal((p.match(/class="mouth-lips"/g) ?? []).length, 2, "lips for both");
  assert.doesNotMatch(panel(tips, "W", { said: "w" }), /You said/, "saying it right shows no comparison");
  assert.doesNotMatch(panel(tips, "W", { said: "ʃ" }), /You said/, "a sound with no picture shows no comparison");
  assert.doesNotMatch(panel(tips, "W", { said: "" }), /You said/, "a sound left out shows no comparison");
});

test("vowels get the map, with the Ukrainian sound they start from; sounds with no Ukrainian start have no move", () => {
  const ih = panel(tips, "IY");
  assert.ok(isVowel("IY") && !isVowel("TH"));
  assert.match(ih, /mouth-map/);
  assert.match(ih, />і<\/text>/);
  assert.match(ih, />see<\/text>/);
  const schwa = panel(tips, "AH0");
  assert.match(schwa, /mouth-map/);
  assert.doesNotMatch(schwa, /data-mouth-pause|mouth-strip/, "the small uh has no Ukrainian start, so nothing moves");
  assert.ok(clean(vowelMap("ER", { word: "her" })));
});

test("a sound the tips don't know draws nothing, and labels can't break out of the markup", () => {
  assert.equal(panel(tips, "XX"), "");
  assert.equal(panel(null, "TH"), "");
  assert.doesNotMatch(sideView(POSES.TH, { label: '"><script>' }), /<script>/);
});

test("the loop: hold the Ukrainian sound, slide, hold the English one, slide back, again", () => {
  assert.deepEqual(loopAt(0), { k: 0, phase: "from" });
  assert.deepEqual(loopAt(LOOP.start - 1), { k: 0, phase: "from" });
  const mid = loopAt(LOOP.start + LOOP.move / 2);
  assert.equal(mid.phase, "move");
  assert.ok(Math.abs(mid.k - 0.5) < 0.01, "halfway through the slide is halfway there");
  assert.deepEqual(loopAt(LOOP.start + LOOP.move + 10), { k: 1, phase: "to" });
  const back = loopAt(LOOP.start + LOOP.move + LOOP.end + LOOP.back / 2);
  assert.equal(back.phase, "move");
  assert.ok(back.k > 0.4 && back.k < 0.6, "and it slides back");
  const total = LOOP.start + LOOP.move + LOOP.end + LOOP.back;
  assert.deepEqual(loopAt(total + 5), loopAt(5), "and starts again");
  assert.ok(total >= 5000 && total <= 7000, "about six seconds a loop");
});
