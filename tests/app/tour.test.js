// The first visit's logic: steps, events, where each step happens, and that every control it points at exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { STEPS, FINISH, TIPS, address, advance, begin, copy, did, finish, isActive, needsWelcome, onRoute, routeKind, skip, tipFor, wordFor } from "../../js/tour.js";
import { fresh, sanitize } from "../../js/store.js";

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

test("a new learner gets the welcome, and skipping it ends the tour", () => {
  const t = fresh().tour;
  assert.equal(needsWelcome(t), true);
  assert.equal(isActive(t), false);
  skip(t);
  assert.equal(needsWelcome(t), false);
  assert.equal(isActive(t), false);
});

test("the five steps move on only for their own event", () => {
  const t = fresh().tour;
  begin(t);
  assert.equal(isActive(t), true);
  assert.equal(did(t, "said"), false); // not what step 1 waits for
  assert.equal(t.step, 1);
  for (const [i, s] of STEPS.entries()) {
    assert.equal(t.step, i + 1);
    assert.equal(did(t, "nope"), false);
    assert.equal(did(t, s.on), true);
  }
  assert.equal(t.step, FINISH);
  assert.equal(did(t, "said"), false); // the finish waits for Done
  assert.equal(isActive(t), true);
});

test("both tries in Speak say 'said', one for step 3 and one for step 5", () => {
  const t = { step: 3, done: false };
  did(t, "said");
  assert.equal(t.step, 4);
  did(t, "fixed");
  assert.equal(t.step, 5);
  did(t, "said");
  assert.equal(t.step, FINISH);
});

test("events do nothing before the tour starts, or after it's skipped", () => {
  const t = fresh().tour;
  assert.equal(did(t, "added"), false);
  begin(t);
  skip(t);
  assert.equal(did(t, "added"), false);
  assert.equal(advance(t), false);
  begin(t); // Show me around again
  assert.deepEqual(t, { step: 1, done: false });
});

test("Next moves a step on by hand, but never past the finish", () => {
  const t = { step: 4, done: false };
  assert.equal(advance(t), true);
  assert.equal(t.step, 5);
  advance(t);
  assert.equal(t.step, FINISH);
  assert.equal(advance(t), false);
});

test("finishing marks the tour done and the two tips it already covered", () => {
  const s = fresh();
  s.tipsSeen.push("read");
  finish(s);
  assert.equal(s.tour.done, true);
  assert.deepEqual(s.tipsSeen, ["read", "words", "speak"]);
  finish(s);
  assert.deepEqual(s.tipsSeen, ["read", "words", "speak"]);
});

test("where the learner is", () => {
  assert.equal(routeKind("", "speak"), "words");
  assert.equal(routeKind("#/words", "speak"), "words");
  assert.equal(routeKind("#/words/weather", "speak"), "word");
  assert.equal(routeKind("#/practice/speak", "read"), "speak");
  assert.equal(routeKind("#/practice", "speak"), "speak");
  assert.equal(routeKind("#/practice/read", "speak"), "other");
  assert.equal(routeKind("#/colors", "speak"), "other");
});

test("each step knows where it happens, and speaking needs a word picked", () => {
  const s = { ...fresh(), current: null };
  assert.equal(onRoute(1, "words", s), true);
  assert.equal(onRoute(1, "word", s), false);
  assert.equal(onRoute(2, "words", s), true);
  assert.equal(onRoute(2, "word", s), true);
  assert.equal(onRoute(3, "speak", s), false);
  assert.equal(onRoute(3, "speak", { ...s, current: "weather" }), true);
  assert.equal(onRoute(5, "words", { ...s, current: "weather" }), false);
  assert.equal(onRoute(FINISH, "other", s), true);
});

test("Take me there: the address, and the word it needs practicing", () => {
  const s = { ...fresh(), words: [{ text: "think" }, { text: "weather" }], current: null };
  assert.equal(wordFor(s), "weather");
  assert.equal(wordFor({ ...s, current: "think" }), "think");
  assert.deepEqual(address(1, s), { hash: "#/words", word: null });
  assert.deepEqual(address(2, s), { hash: "#/words/weather", word: null });
  assert.deepEqual(address(3, s), { hash: "#/practice/speak", word: "weather" });
  assert.deepEqual(address(5, { ...s, current: "think" }), { hash: "#/practice/speak", word: "think" });
  assert.deepEqual(address(3, fresh()), { hash: "#/words", word: null }); // no words yet: back to adding one
});

test("every step and the finish have words to say, and most point at a control", () => {
  for (let step = 1; step <= FINISH; step++) {
    const c = copy(step, step === 2 ? "word" : "speak");
    assert.ok(c.text.length > 10, `step ${step}`);
    if (step <= STEPS.length) assert.ok(c.targets.length > 0, `step ${step}`);
  }
  assert.ok(copy(2, "words").text.includes("Tap your word"));
  assert.equal(copy(FINISH).title, "You did it!");
  assert.equal(copy(FINISH).list.length, 3);
});

test("every data-tour name the tour points at exists in the code", () => {
  const code = walk(new URL("../../js", import.meta.url).pathname)
    .filter((f) => f.endsWith(".js") && !f.endsWith("/tour.js"))
    .map((f) => readFileSync(f, "utf8")).join("\n");
  const names = new Set();
  for (let step = 1; step <= FINISH; step++) {
    for (const kind of ["words", "word", "speak"]) {
      for (const sel of copy(step, kind).targets) for (const m of sel.matchAll(/data-tour="([a-z-]+)"/g)) names.add(m[1]);
    }
  }
  assert.ok(names.size >= 7);
  for (const name of names) assert.ok(code.includes(`data-tour="${name}"`), `data-tour="${name}" is not in the code`);
  for (const id of ["get-model"]) assert.ok(code.includes(`id="${id}"`), `#${id} is not in the code`);
});

test("one tip for each screen, none for a word's page or Progress, and the picked mode for Practice", () => {
  assert.deepEqual(Object.keys(TIPS).sort(), ["colors", "listen", "read", "speak", "words"]);
  assert.equal(tipFor("words", "speak", ""), "words");
  assert.equal(tipFor("words", "speak", "weather"), null);
  assert.equal(tipFor("practice", "listen", "listen"), "listen");
  assert.equal(tipFor("colors", "speak", ""), "colors");
  assert.equal(tipFor("progress", "speak", ""), null);
});

test("a saved tour keeps the finish step, and nonsense is thrown out", () => {
  assert.deepEqual(sanitize({ tour: { step: FINISH, done: false } }).tour, { step: FINISH, done: false });
  assert.deepEqual(sanitize({ tour: { step: 7 } }).tour, { step: 0, done: false });
});
