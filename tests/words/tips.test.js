// The Ukrainian tips: every example word and pair is checked against the real dictionary, and the lookup is tested.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCmudict } from "../../js/words/cmudict.js";
import { TEACH_ORDER, fixTip, loadTips, positionOf, segments, soundKey, soundToTeach } from "../../js/words/tips.js";
import { CMU_TO_MODEL } from "../../js/score/phones.js";

const data = JSON.parse(readFileSync(new URL("../../data/tips/uk-en.json", import.meta.url), "utf8"));
const dict = parseCmudict(readFileSync(new URL("../../data/words/cmudict.dict", import.meta.url), "utf8"));
const bare = (p) => p.replace(/\d/g, "");

test("the file says which language it is, and that a Ukrainian speaker hasn't checked it yet", () => {
  assert.equal(data.language, "uk");
  assert.match(data.review, /not been checked by a Ukrainian speaker/);
});

test("every sound has a title and a tip written in plain words, and a tip is short", () => {
  assert.ok(Object.keys(data.sounds).length >= 20);
  for (const [key, s] of Object.entries(data.sounds)) {
    assert.ok(s.title && s.tip, key);
    assert.ok(s.tip.length > 40 && s.tip.length < 260, `${key}: ${s.tip.length} characters`);
    assert.doesNotMatch(s.tip, /[ɪɛæɑəʊɝðθŋʃʧʤɹɾ]/, `${key}: the learner never sees IPA`);
  }
});

test("a sound with a Ukrainian comparison names the Ukrainian letter and word, and the tip uses them", () => {
  for (const [key, s] of Object.entries(data.sounds)) {
    if (!s.uk) continue;
    assert.match(s.uk.letter, /^[Ѐ-ӿ]$/, key);
    assert.match(s.uk.word, /^[Ѐ-ӿ]+$/, key);
    assert.ok(s.tip.includes(s.uk.letter), `${key}: the tip mentions ${s.uk.letter}`);
  }
});

test("every example word really has the sound, in the spot it's filed under", () => {
  let checked = 0;
  for (const [key, s] of Object.entries(data.sounds)) {
    for (const [spot, words] of Object.entries(s.words)) {
      for (const w of words) {
        const ways = dict.get(w);
        assert.ok(ways, `${w} is in the dictionary`);
        const fits = ways.some((phones) => phones.some((p, i) => {
          const same = key === "AH0" ? p === "AH0" : key === "AH1" ? /^AH[12]$/.test(p) : bare(p) === key;
          return same && (spot === "start" ? i === 0 : spot === "end" ? i === phones.length - 1 : i > 0 && i < phones.length - 1);
        }));
        assert.ok(fits, `${w} has ${key} at its ${spot}`);
        checked++;
      }
    }
  }
  assert.ok(checked > 200, `${checked} words checked`);
});

test("every pair of words differs by one sound the learner could mix up (or one that gets left out)", () => {
  let checked = 0;
  for (const [key, s] of Object.entries(data.sounds)) {
    for (const [a, b] of s.pairs) {
      const A = dict.get(a), B = dict.get(b);
      assert.ok(A && B, `${a} and ${b} are in the dictionary`);
      const one = A.some((x) => B.some((y) => {
        if (x.length === y.length) return x.filter((p, i) => bare(p) !== bare(y[i])).length === 1;
        const [long, short] = x.length > y.length ? [x, y] : [y, x];
        return long.length - short.length === 1 && long.some((_, i) => long.filter((__, j) => j !== i).every((p, k) => bare(p) === bare(short[k])));
      }));
      assert.ok(one, `${a} / ${b} differ by exactly one sound`);
      if (key !== "AH0" && key !== "AH1") assert.ok(A.concat(B).some((phones) => phones.some((q) => bare(q) === key)), `${a} or ${b} has ${key}`);
      checked++;
    }
  }
  assert.ok(checked > 40, `${checked} pairs checked`);
});

test("every 'you said…' tip is for a real sound and a sound the model can hear", () => {
  const heardSounds = new Set(Object.values(CMU_TO_MODEL));
  for (const key of Object.keys(data.swaps)) {
    const [target, heard] = key.split(">");
    assert.ok(data.sounds[target], `${key}: there is a tip for ${target}`);
    assert.ok(heardSounds.has(heard), `${key}: the model can hear ${heard}`);
    assert.match(data.swaps[key], /^You (said|glided)/, key);
  }
  assert.ok(Object.keys(data.swaps).length >= 18);
});

test("the hard sounds from docs/needs.md all have a tip and a swap", () => {
  for (const key of ["TH", "DH", "W", "V", "R", "NG", "AH0", "IH", "IY", "UW", "UH", "OW", "AE", "EH", "P", "T", "K", "HH"]) assert.ok(data.sounds[key], key);
  for (const key of ["TH>s", "TH>t", "TH>f", "DH>d", "DH>z", "W>v", "V>w", "IY>ɪ", "IH>i", "AE>ɛ", "UW>ʊ", "P>b"]) assert.ok(data.swaps[key], key);
});

test("sounds are filed under the dictionary's name, and the small uh apart from the uh of cut", () => {
  assert.equal(soundKey("TH"), "TH");
  assert.equal(soundKey("IH1"), "IH");
  assert.equal(soundKey("AH0"), "AH0");
  assert.equal(soundKey("AH1"), "AH1");
  assert.equal(soundKey("AH2"), "AH1");
  assert.equal(positionOf(0, 4), "start");
  assert.equal(positionOf(3, 4), "end");
  assert.equal(positionOf(1, 4), "middle");
});

test("the tip for th said as s: the Ukrainian start, what they said, words from the same spot, and pairs", () => {
  const t = fixTip(data, { letters: "th", focusPhone: "TH", position: "start", heard: "s" }, "think");
  assert.equal(t.title, "th as in think");
  assert.equal(t.sound, "TH", "the key of the sound, so a screen can open its round");
  assert.equal(fixTip(data, { focusPhone: "AH0", position: "start", heard: "ɑ" }, "about").sound, "AH0");
  assert.deepEqual(t.uk, { letter: "с", word: "сам" });
  assert.match(t.tip, /Ukrainian с/);
  assert.match(t.swap, /^You said s/);
  assert.equal(t.words.length, 4);
  assert.ok(!t.words.includes("think"), "the word itself isn't offered");
  assert.ok(t.words.every((w) => data.sounds.TH.words.start.includes(w)), "the same spot comes first");
  assert.deepEqual(t.pairs[0], ["think", "sink"], "a pair with the word itself comes first");
  assert.equal(t.pairs.length, 2);
  assert.deepEqual(fixTip(data, { focusPhone: "TH", position: "start", heard: "s" }, "thank").pairs[0], ["thank", "tank"]);
  assert.deepEqual(fixTip(data, { focusPhone: "TH", position: "start", heard: "s" }, "thought").pairs, data.sounds.TH.pairs.slice(0, 2), "a word with no pair of its own gets the first pairs");
});

test("words from other spots fill in when a spot has too few, and the end of a word is its own spot", () => {
  const end = fixTip(data, { letters: "th", focusPhone: "TH", position: "end", heard: "t" }, "teeth");
  assert.deepEqual(end.words, ["both", "path", "mouth", "month"]);
  const w = fixTip(data, { letters: "w", focusPhone: "W", position: "end", heard: "v" }, "wow");
  assert.equal(w.words.length, 4, "no English word ends in w, so it borrows from the others");
  assert.ok(w.words.includes("west"));
});

test("a sound that was left out, one with no 'you said' tip, and one with no tip at all", () => {
  assert.equal(fixTip(data, { focusPhone: "TH", position: "start", heard: "" }, "think").swap, data.missing);
  assert.equal(fixTip(data, { focusPhone: "TH", position: "start", heard: "ʃ" }, "think").swap, null);
  assert.equal(fixTip(data, { focusPhone: "TH", position: "start", heard: null }, "think").swap, null);
  assert.equal(fixTip(data, { focusPhone: "M", position: "start", heard: "n" }, "mother"), null);
  assert.equal(fixTip(data, undefined, "x"), null);
});

test("the small uh and the uh of cut get different tips", () => {
  assert.notEqual(fixTip(data, { focusPhone: "AH0", position: "start", heard: "ɑ" }, "about").tip, fixTip(data, { focusPhone: "AH1", position: "middle", heard: "ɑ" }, "cut").tip);
  assert.equal(fixTip(data, { focusPhone: "AH0", position: "start", heard: "ɑ" }, "about").uk, null);
});

test("Ukrainian letters inside a sentence are marked, so a screen can read them in Ukrainian", () => {
  assert.deepEqual(segments("Start from the Ukrainian с (as in сам), then go."), [
    { text: "Start from the Ukrainian ", uk: false }, { text: "с", uk: true }, { text: " (as in ", uk: false }, { text: "сам", uk: true }, { text: "), then go.", uk: false },
  ]);
  assert.deepEqual(segments("no Ukrainian here"), [{ text: "no Ukrainian here", uk: false }]);
  assert.equal(segments("о-у").map((s) => s.text).join(""), "о-у");
});

test("the tips load once, and a failed load can be tried again", async () => {
  let calls = 0;
  await assert.rejects(loadTips(() => { calls++; return Promise.reject(new Error("offline")); }), /offline/);
  const got = await loadTips(() => { calls++; return Promise.resolve({ language: "uk" }); });
  assert.equal(got.language, "uk");
  await loadTips(() => { calls++; return Promise.resolve({}); });
  assert.equal(calls, 2);
});

test("the sound a word's page explains: the one that went wrong last time, else the hardest for a Ukrainian speaker", () => {
  assert.deepEqual([...TEACH_ORDER].sort(), Object.keys(data.sounds).sort(), "every sound with a tip is in the order, once");
  assert.equal(soundToTeach(data, ["TH", "IH1", "NG", "K"]), "TH");
  assert.equal(soundToTeach(data, ["W", "EH1", "DH", "ER0"]), "DH", "the th of weather comes before its w");
  assert.equal(soundToTeach(data, ["W", "EH1", "DH", "ER0"], "W"), "W", "unless the w went wrong last time");
  assert.equal(soundToTeach(data, ["TH", "IH1", "NG", "K"], "V"), "TH", "a sound the word doesn't have is ignored");
  assert.equal(soundToTeach(data, ["M", "S"]), null);
  assert.equal(soundToTeach(data, ["K", "AH1", "M"]), "AH1");
});
