// What Speak says about a try (js/practice/feedback.js). No page, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GRADES, heardSentence, headline, heardNothing, plainSound, likeSound } from "../../js/practice/feedback.js";

const part = (letters, grade, heard = null, unsure = false) => ({ letters, grade, heard, unsure });

test("every grade has a word, a mark, and a tone, so color is never the only signal", () => {
  for (const g of ["green", "yellow", "orange", "red"]) {
    assert.ok(GRADES[g].word && GRADES[g].was && GRADES[g].mark && GRADES[g].tone, g);
  }
  assert.equal(new Set(Object.values(GRADES).map((g) => g.mark)).size, 4);
});

test("the learner never sees IPA for the sounds the model hears", () => {
  for (const ipa of ["θ", "ð", "ɹ", "ŋ", "ɾ", "ə", "ɝ", "ʤ", "ʧ", "ʃ", "ɪ", "ɛ", "æ", "ɑ", "ʊ", "eɪ", "aɪ", "oʊ", "aʊ", "ɔɪ"]) {
    assert.doesNotMatch(plainSound(ipa), /[θðɹŋɾəɝʤʧʃɪɛæɑʊɔ]/, ipa);
  }
  assert.equal(plainSound("d"), "d");
});

test("a or an, as you'd say it", () => {
  assert.equal(likeSound("d"), "a d");
  assert.equal(likeSound("s"), "an s");
  assert.equal(likeSound("v"), "a v");
  assert.equal(likeSound("f"), "an f");
  assert.equal(likeSound("j"), "a y");
  assert.equal(likeSound("θ"), "a th (as in think)");
  assert.equal(likeSound("i"), "an ee (as in see)");
  assert.equal(likeSound("ə"), "an uh");
  assert.equal(likeSound("ɾ"), "a quick d (as in water)");
});

test("the sentence names the worst parts first, at most two", () => {
  const parts = [part("w", "orange", "v"), part("ea", "yellow", "ɛ"), part("th", "red", "d"), part("er", "green")];
  assert.equal(heardSentence(parts), "The th sounded like a d, and the w sounded like a v.");
});

test("a left-out sound says so", () => {
  assert.equal(heardSentence([part("t", "red", "")]), "The t was left out.");
});

test("all green, or nothing heard per part: no sentence", () => {
  assert.equal(heardSentence([part("th", "green"), part("ink", "green")]), "");
  assert.equal(heardSentence([part("th", "red", null)]), "");
});

test("silent letters (grade null) are skipped", () => {
  assert.equal(heardSentence([part("k", null), part("n", "red", "m")]), "The n sounded like an m.");
});

test("headline", () => {
  assert.equal(headline([part("th", "green"), part("ink", "green")]), "Every part was good!");
  assert.equal(headline([part("th", "green"), part("ink", "yellow")]), "Really close.");
  assert.equal(headline([part("th", "red", "d"), part("ink", "green")]), "One part to work on.");
  assert.equal(headline([part("w", "orange", "v"), part("th", "red", "d")]), "2 parts to work on.");
  assert.equal(headline([part("k", null)]), "");
});

test("a try with nothing heard counts as no word", () => {
  assert.equal(heardNothing({ heard: [] }), true);
  assert.equal(heardNothing(null), true);
  assert.equal(heardNothing({ heard: ["θ", "ɪ"] }), false);
});
