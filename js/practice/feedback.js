// What Speak says about a try, in plain words (the teammate's Practice part). No page, no model: just the
// scoring result (ctx.score in js/app.js) turned into what the learner reads. Tested in tests/practice/.

// The four grades, the words for each, and the mark drawn on each part, so color is never the only signal.
export const GRADES = {
  green: { word: "good", was: "was good", mark: "✓", tone: "good" },
  yellow: { word: "close", was: "was close", mark: "≈", tone: "close" },
  orange: { word: "a little off", was: "was a little off", mark: "!", tone: "off" },
  red: { word: "needs work", was: "needs work", mark: "✕", tone: "work" },
};

// The model's sounds (IPA, js/score/phones.js), as a learner would say them. The learner never sees IPA.
const PLAIN = {
  θ: "th (as in think)", ð: "th (as in this)", s: "s", z: "z", t: "t", d: "d", f: "f", v: "v", w: "w",
  ɹ: "r", l: "l", n: "n", m: "m", ŋ: "ng", p: "p", b: "b", k: "k", g: "g", h: "h", j: "y",
  ʃ: "sh", ʧ: "ch", ʤ: "j", ɾ: "a quick d (as in water)",
  ɪ: "i (as in sit)", i: "ee (as in see)", ɛ: "e (as in bed)", æ: "a (as in cat)", ɑ: "ah (as in father)",
  ə: "uh", ʊ: "oo (as in book)", u: "oo (as in food)", ɝ: "er (as in her)",
  eɪ: "ay (as in day)", aɪ: "i (as in time)", oʊ: "oh (as in go)", aʊ: "ow (as in now)", ɔɪ: "oy (as in boy)",
};

export const plainSound = (ipa) => PLAIN[ipa] ?? ipa;

// The sound with "a" or "an" in front, ready for "it sounded like …".
export const likeSound = (ipa) => article(plainSound(ipa));

// One sentence about the parts that aren't green, worst first, at most two:
// "The th sounded like a d (as in…)." / "The w was left out." / "" when everything is green.
export function heardSentence(parts) {
  const rank = { red: 0, orange: 1, yellow: 2 };
  const off = parts
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.grade && p.grade !== "green" && p.heard !== null && p.heard !== undefined)
    .sort((a, b) => rank[a.grade] - rank[b.grade] || a.i - b.i)
    .slice(0, 2);
  const bits = off.map((p) => (p.heard === "" ? `the ${p.letters} was left out` : `the ${p.letters} sounded like ${likeSound(p.heard)}`));
  if (!bits.length) return "";
  const s = bits.join(", and ");
  return s[0].toUpperCase() + s.slice(1) + ".";
}

// "a d", "an s" (said "ess"), "an ee", "a th". Letters whose names start with a vowel sound take "an".
function article(sound) {
  if (/^(a|an) /.test(sound)) return sound;
  const first = sound.split(" ")[0];
  const an = first.length === 1 ? "aefhilmnorsx".includes(first) : /^[aeio]|^u[^ ]/.test(first);
  return `${an ? "an" : "a"} ${sound}`;
}

// A short headline for the whole try.
export function headline(parts) {
  const graded = parts.filter((p) => p.grade);
  if (!graded.length) return "";
  if (graded.every((p) => p.grade === "green")) return "Every part was good!";
  if (graded.every((p) => p.grade === "green" || p.grade === "yellow")) return "Really close.";
  const n = graded.filter((p) => p.grade === "red" || p.grade === "orange").length;
  return n === 1 ? "One part to work on." : `${n} parts to work on.`;
}

// Did the app hear a word at all? An empty or near-silent try comes back with nothing heard.
export function heardNothing(result) {
  return !result || !Array.isArray(result.heard) || result.heard.length === 0;
}

// The longest a try may run before Speak stops it by itself. Long tries score slowly on a phone.
export const MAX_SECONDS = 4;
// Shorter than this, it was a tap, not a word.
export const MIN_SECONDS = 0.35;
