// Five minutes (iiSurf, the redesign's phase 2): the plan for one short practice, chosen by the app so the learner
// never has to decide what to do next. Pure logic, tested. js/session-screen.js runs it.
//
// The order is listen, look, say: first the ear (which did you hear, think or sink?), then how to make the sound (the
// picture, from the Ukrainian sound), then saying words with it, the learner's own word first. Quiet mode has no
// saying: more listening instead. A phone that can't speak words has no listening steps.
import { hearQuestions, hardestSounds, roundWords, wordStatus } from "./progress.js";
import { soundToTeach } from "./words/tips.js";

export const HEAR_STEPS = 3; // listening questions out loud; quiet mode gets QUIET_HEAR_STEPS
export const QUIET_HEAR_STEPS = 5;
export const SAY_STEPS = 3;

// The sound to work on: the hardest one so far (that the tips know), else the word's own hardest sound, else none.
export function focusSound(tips, state, wordSound = null) {
  const hard = hardestSounds(state, 99).find((h) => tips?.sounds?.[h.sound]);
  return hard?.sound ?? (wordSound && tips?.sounds?.[wordSound] ? wordSound : null);
}

// { sound, steps, preview } or null when there's nothing to practice yet (no words and no history).
//   steps: { kind: "hear", pair, said, flip } | { kind: "look", sound } | { kind: "say", word }
//   preview: the lines Home shows before Start, [{ kind, text }], in the order they'll happen.
// word is the learner's current word; wordSound its hardest sound (soundToTeach). rng is for the tests.
export function planSession({ tips, state, word = null, wordSound = null, quiet = false, speech = true, rng = Math.random }) {
  const sound = focusSound(tips, state, wordSound);
  if (!sound && !word) return null;
  const entry = sound ? tips.sounds[sound] : null;
  const name = entry ? entry.title.split(" as in ")[0] : "";
  const hear = sound && speech ? hearQuestions(tips, state, sound, quiet ? QUIET_HEAR_STEPS : HEAR_STEPS, rng).map((q) => ({ kind: "hear", ...q })) : [];
  const look = sound ? [{ kind: "look", sound }] : [];
  const sayWords = quiet ? [] : [word, ...(sound ? roundWords(tips, state, sound) : [])].filter((w, i, all) => w && all.indexOf(w) === i).slice(0, SAY_STEPS);
  const say = sayWords.map((w) => ({ kind: "say", word: w }));
  const steps = [...hear, ...look, ...say];
  if (!steps.length) return null;
  const list = (ws) => (ws.length < 3 ? ws.join(" and ") : `${ws.slice(0, -1).join(", ")}, and ${ws.at(-1)}`);
  const preview = [
    hear.length ? { kind: "hear", text: `Hear the difference: ${hear[0].pair.join(" · ")}` } : null,
    look.length ? { kind: "look", text: `See how to make the ${name}` } : null,
    say.length ? { kind: "say", text: `Say ${list(sayWords)}` } : null,
  ].filter(Boolean);
  return { sound, name, steps, preview };
}

// The summary at the end: each word said, its score before this practice and its best now, and the listening count.
// before is { word: score or null } taken when the practice started; best is { word: score } from this practice.
export function summary(plan, { before = {}, best = {}, heardRight = 0 } = {}) {
  const said = plan.steps.filter((s) => s.kind === "say").map((s) => ({ word: s.word, before: before[s.word] ?? null, now: best[s.word] ?? null }));
  const heard = plan.steps.filter((s) => s.kind === "hear").length;
  return { said, heard, heardRight, steps: plan.steps.length };
}

// The word to keep going with: the one picked, if it's still in their words, else the newest one (the same as Home).
export const currentWord = (state) => (state.current && state.words.some((w) => w.text === state.current) ? state.current : state.words.at(-1)?.text ?? null);

// The plan for this learner right now. ctx.lookUp gives the current word's sounds, so a new learner with no history
// works on their own word's hardest sound.
export async function planFor(ctx, tips, { quiet = false, speech = true } = {}) {
  const word = currentWord(ctx.state);
  let wordSound = null;
  if (word) {
    try {
      const found = await ctx.lookUp(word);
      wordSound = found ? soundToTeach(tips, found.phones, wordStatus(ctx.state, word)?.spot?.sound) : null;
    } catch { /* the word list didn't load: plan without the word's sound */ }
  }
  return planSession({ tips, state: ctx.state, word, wordSound, quiet, speech });
}

// Home previews a plan, and Start runs that same plan: Home keeps it here, the practice screen takes it once.
let kept = null;
export const keepPlan = (plan) => { kept = plan; };
export const takePlan = () => { const p = kept; kept = null; return p; };
