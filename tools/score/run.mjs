// The scoring test (PLAN.md): can a free speech model color each sound of a word right?
//
//   node tools/score/run.mjs
//
// 1. Makes recordings of word pairs with the Mac's own American voices (`say`), in .tmp/score/wav/.
//    Each pair is a target word and a look-alike that differs in one sound, like think and sink.
// 2. Scores each target word against its own recording (every sound should be right) and against the
//    look-alike's recording (the swapped sound should be wrong, and should sound like the swap).
// 3. Picks the color cuts on three voices, then checks them on three other voices, so the result isn't
//    graded on the same recordings that set the cuts.
// 4. Writes .tmp/score/report.md and .tmp/score/results.json.
//
// The recordings use Apple's voices, which are fine for testing on this Mac but not for publishing, so they
// stay in .tmp/, and the test only runs on a Mac. Needs the model (npm run get-model); the dictionary is in
// data/words/.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readWav } from "../../js/score/audio.js";
import { CMU_TO_MODEL, targets } from "../../js/score/phones.js";
import { logSoftmax, prepare, readVocab, scoreWord } from "../../js/score/gop.js";
import { parseCmudict } from "../../js/words/cmudict.js";
import { loadModel } from "./model.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(repo, ".tmp", "score");

// Voices: the cuts are picked on TUNE and checked on CHECK. Both have men's and women's voices.
const TUNE = ["Eddy (English (US))", "Flo (English (US))", "Sandy (English (US))"];
const CHECK = ["Samantha", "Reed (English (US))", "Shelley (English (US))"];

// Target word, then a look-alike that swaps one sound. Mostly the swaps a Ukrainian speaker tends to make.
const PAIRS = `
think sink, thank sank, thick sick, path pass, mouth mouse, thumb some,
three tree, thin tin, thought taught, both boat, three free, thought fought,
this dis, they day, then den, those doze, there dare, breathe breeze, seethe seize,
west vest, wine vine, wet vet, while vile, worse verse, wail veil, vest west, vine wine,
sheep ship, leave live, seat sit, feel fill, green grin, eat it,
bad bed, man men, sad said, pan pen, sat set,
fool full, pool pull, suit soot,
coat caught, boat bought, low law, so saw,
pin bin, pear bear, pie buy, pack back,
tie die, ten den, time dime, town down,
sing sin, thing thin, wing win, rang ran,
right light, road load, rice lice, pray play`
  .split(",").map((s) => s.trim().split(/\s+/)).filter((p) => p.length === 2);

function readDictionary() {
  return parseCmudict(readFileSync(join(repo, "data", "words", "cmudict.dict"), "utf8"));
}

// The pronunciations of the two words that differ in exactly one sound the model can tell apart.
function swapOf(dict, target, spoken) {
  const bare = (p) => p.replace(/[0-9]/g, "");
  for (const a of dict.get(target) || []) for (const b of dict.get(spoken) || []) {
    if (a.length !== b.length) continue;
    const diff = a.map((p, i) => i).filter((i) => bare(a[i]) !== bare(b[i]));
    if (diff.length === 1 && CMU_TO_MODEL[bare(a[diff[0]])] !== CMU_TO_MODEL[bare(b[diff[0]])]) {
      return { phones: a, at: diff[0], from: bare(a[diff[0]]), to: bare(b[diff[0]]) };
    }
  }
  return null;
}

function record(voice, word) {
  const file = join(out, "wav", voice.split(" ")[0], `${word}.wav`);
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    execFileSync("say", ["-v", voice, "-o", file, "--file-format=WAVE", "--data-format=LEI16@16000", word]);
  }
  return file;
}

const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : "–");
const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * (s.length - 1))))]; };

if (process.platform !== "darwin") {
  console.error("The scoring test makes its recordings with the Mac's voices (`say`), so it only runs on a Mac.");
  console.error("Everything else works here: npm test, npm start, npm run score-speed.");
  process.exit(1);
}

const dict = readDictionary();
const pairs = [];
for (const [target, spoken] of PAIRS) {
  const swap = swapOf(dict, target, spoken);
  if (swap) pairs.push({ target, spoken, ...swap });
  else console.log(`skipped ${target}/${spoken}: not one clear swap in the dictionary`);
}
console.log(`${pairs.length} pairs, ${TUNE.length + CHECK.length} voices`);

const model = await loadModel(repo);
const v = readVocab(model.vocab);
const cache = new Map(), runTimes = [], scoreTimes = [];
async function prepFor(voice, word) {
  const key = `${voice}|${word}`;
  if (!cache.has(key)) {
    const samples = readWav(readFileSync(record(voice, word)));
    const t0 = performance.now();
    const raw = await model.run(samples);
    runTimes.push({ ms: performance.now() - t0, seconds: samples.length / 16000 });
    cache.set(key, prepare(logSoftmax(raw), v));
  }
  return cache.get(key);
}

// Every scored sound: whether it was said right, and its score.
const rows = [];
for (const voice of [...TUNE, ...CHECK]) {
  const group = TUNE.includes(voice) ? "tune" : "check";
  for (const p of pairs) {
    const word = targets(p.phones);
    for (const [recording, swapped] of [[p.target, false], [p.spoken, true]]) {
      const prep = await prepFor(voice, recording);
      const t0 = performance.now();
      const result = scoreWord(prep, word, v, { green: Infinity, yellow: Infinity, orange: Infinity });
      scoreTimes.push(performance.now() - t0);
      result.forEach((r, i) => rows.push({
        group, voice: voice.split(" ")[0], pair: `${p.target}/${p.spoken}`, recording, sound: r.cmu,
        right: !(swapped && i === p.at), score: r.score, heard: r.heard, expectHeard: swapped && i === p.at ? CMU_TO_MODEL[p.to] : null,
      }));
    }
  }
  console.log(`scored ${voice}`);
}

// Picking the cuts on the tune voices.
const tune = rows.filter((r) => r.group === "tune");
const rightTune = tune.filter((r) => r.right).map((r) => r.score);
const wrongTune = tune.filter((r) => !r.right).map((r) => r.score);
const orange = quantile(rightTune, 0.05); // below this is red: about 1 in 20 right sounds, at most
let yellow = orange, best = -Infinity;
for (const c of [...new Set([...rightTune, ...wrongTune])].filter((c) => c >= orange).sort((a, b) => a - b)) {
  const j = wrongTune.filter((s) => s < c).length / wrongTune.length - rightTune.filter((s) => s < c).length / rightTune.length;
  if (j > best) { best = j; yellow = c; }
}
const green = Math.max(yellow, quantile(rightTune, 0.2));
const cuts = { green, yellow, orange };

// Checking them on the other voices.
const grade = (s) => (s >= cuts.green ? "green" : s >= cuts.yellow ? "yellow" : s >= cuts.orange ? "orange" : "red");
const check = rows.filter((r) => r.group === "check");
const right = check.filter((r) => r.right), wrong = check.filter((r) => !r.right);
const wrongCaught = wrong.filter((r) => ["orange", "red"].includes(grade(r.score))).length;
const rightRed = right.filter((r) => grade(r.score) === "red").length;
const rightGreen = right.filter((r) => grade(r.score) === "green").length;
const heardRight = wrong.filter((r) => r.heard === r.expectHeard).length;
const median = (xs) => quantile(xs, 0.5);

const byPair = new Map();
for (const r of wrong) {
  if (!byPair.has(r.pair)) byPair.set(r.pair, []);
  byPair.get(r.pair).push(r);
}

const report = [
  "# Scoring test results",
  "",
  `Pairs: ${pairs.length}. Tune voices: ${TUNE.map((x) => x.split(" ")[0]).join(", ")}. Check voices: ${CHECK.map((x) => x.split(" ")[0]).join(", ")}.`,
  "",
  `Cuts picked on the tune voices (natural-log units): green ≥ ${cuts.green.toFixed(2)}, yellow ≥ ${cuts.yellow.toFixed(2)}, orange ≥ ${cuts.orange.toFixed(2)}, red below.`,
  "",
  "## On the check voices",
  "",
  `- Swapped sound turned orange or red: ${wrongCaught} of ${wrong.length} (${pct(wrongCaught, wrong.length)}). Pass rule: at least 80%.`,
  `- Sound said right turned red: ${rightRed} of ${right.length} (${pct(rightRed, right.length)}). Pass rule: at most 10%.`,
  `- Sound said right turned green: ${rightGreen} of ${right.length} (${pct(rightGreen, right.length)}).`,
  `- Swapped sound, "sounded like" named the swap: ${heardRight} of ${wrong.length} (${pct(heardRight, wrong.length)}).`,
  "",
  "## Speed on this Mac (one thread)",
  "",
  `- The model on one word: median ${median(runTimes.map((t) => t.ms)).toFixed(0)} ms for a median ${median(runTimes.map((t) => t.seconds)).toFixed(2)} s recording.`,
  `- The scoring on one word: median ${median(scoreTimes).toFixed(1)} ms.`,
  "",
  "## Each swap, on the check voices",
  "",
  "| Pair | Swap | Scores | Grades | Sounded like |",
  "| --- | --- | --- | --- | --- |",
  ...[...byPair].map(([pair, rs]) => {
    const p = pairs.find((x) => `${x.target}/${x.spoken}` === pair);
    return `| ${pair} | ${p.from} → ${p.to} | ${rs.map((r) => r.score.toFixed(1)).join(", ")} | ${rs.map((r) => grade(r.score)).join(", ")} | ${rs.map((r) => r.heard || "(left out)").join(", ")} |`;
  }),
  "",
  "## Sounds said right that turned red, on the check voices",
  "",
  ...right.filter((r) => grade(r.score) === "red").map((r) => `- ${r.voice}, ${r.pair}, recording "${r.recording}": ${r.sound} scored ${r.score.toFixed(1)}, sounded like ${r.heard || "(left out)"}`),
];
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "report.md"), report.join("\n") + "\n");
writeFileSync(join(out, "results.json"), JSON.stringify({ cuts, pairs, rows, runTimes, scoreTimes }, null, 1));
console.log(report.slice(0, 18).join("\n"));
