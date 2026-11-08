// The first visit (iiSurf, design/tutorial.html): the logic only, with no page, so it can be tested.
// js/tour-ui.js draws it. The tour teaches by doing with the learner's own first word:
//   welcome (step 0) → 1 add a word → 2 open it and hear it → 3 say it → 4 fix a part → 5 say it again → 6 the finish
// State is { step, done } in the saved settings (js/store.js). done means finished or skipped.

export const STEPS = [
  { id: "add", on: "added" }, // 1: a word was added in My words
  { id: "open", on: "practice" }, // 2: Practice it was tapped on the word
  { id: "say", on: "said" }, // 3: a try was graded in Speak
  { id: "fix", on: "fixed" }, // 4: Back to the word was tapped in Speak's practice panel
  { id: "again", on: "said" }, // 5: a second try was graded
];
export const FINISH = STEPS.length + 1;

export const isActive = (tour) => !tour.done && tour.step >= 1 && tour.step <= FINISH;
export const needsWelcome = (tour) => !tour.done && tour.step === 0;

export function begin(tour) { tour.step = 1; tour.done = false; }
export function skip(tour) { tour.done = true; }

// A screen says something happened (ctx.tour.did("said")). Returns true if the tour moved on.
export function did(tour, event) {
  if (!isActive(tour) || tour.step > STEPS.length || STEPS[tour.step - 1].on !== event) return false;
  tour.step++;
  return true;
}

// The Next button, for a step with nothing to tap (all parts green in step 4).
export function advance(tour) {
  if (!isActive(tour) || tour.step > STEPS.length) return false;
  tour.step++;
  return true;
}

// Where in the app the learner is: "words" (My words), "word" (a word page), "speak", or "other".
export function routeKind(hash, mode) {
  const [page, sub = ""] = hash.replace(/^#\/?/, "").split("/");
  if (!page || page === "words") return sub ? "word" : "words";
  if (page === "practice" && (sub || mode) === "speak") return "speak";
  return "other";
}

// The word to practice: the one picked, or else the newest one they added.
export const wordFor = (state) => state.current || state.words.at(-1)?.text || null;

// Is the learner where this step happens?
export function onRoute(step, kind, state) {
  if (step === 1) return kind === "words";
  if (step === 2) return kind === "words" || kind === "word";
  if (step >= 3 && step <= STEPS.length) return kind === "speak" && !!state.current;
  return true;
}

// "Take me there": the address for a step, and the word it needs to be practicing (null if none).
export function address(step, state) {
  const word = wordFor(state);
  if (step === 1 || !word) return { hash: "#/words", word: null };
  if (step === 2) return { hash: `#/words/${encodeURIComponent(word)}`, word: null };
  return { hash: "#/practice/speak", word };
}

// What a step's card says and which controls it points at (selectors; the first match of each gets the ring).
// Every [data-tour="..."] name here must exist in the code: tests/app/tour.test.js checks.
export function copy(step, kind) {
  switch (step) {
    case 1:
      return { text: "Type a word you use often, or one people sometimes ask you to repeat. Then tap <b>Add</b>.", targets: ['[data-tour="add"]'] };
    case 2:
      return kind === "word"
        ? { text: "Tap <b>Hear it</b> to listen, and <b>Slowly</b> to hear each sound. Then tap <b>Practice it</b>.", targets: ['[data-tour="hear"]', '[data-tour="practice"]'] }
        : { text: "Tap your word to open it.", targets: ['[data-tour="word-link"]'] };
    case 3:
      return { text: "Tap <b>Record</b>, say your word, then tap <b>Stop</b>. The first time, Articulate downloads its sound model once (355 MB, Wi-Fi is best).", targets: ['[data-tour="record"]', "#get-model"] };
    case 4:
      return { text: "Here's how it went. Each part of the word got a color and a mark:", key: true,
        more: "Tap a part that isn't green to practice it, then tap <b>Back to the word</b>.",
        targets: ['button[data-tour="part"]:not([data-grade="green"])', '[data-tour="fix-back"]'] };
    case 5:
      return { text: "Now say it again, and see what changes. Tap <b>Record</b>.", targets: ['[data-tour="record"]'] };
    default:
      return { title: "You did it!", text: "You practiced your first word. Next time, choose how you want to practice:",
        list: ["Read: no sound, works anywhere", "Listen: with headphones", "Speak: out loud, with colors"], targets: [] };
  }
}

// The one-time tips: one line for each screen the first time it opens. The "?" in the band brings one back.
export const TIPS = {
  words: "Add the words you want to work on, or tap one of the suggestions. Tap a word to see how it's said.",
  read: "<b>Read</b> is practice with no sound, so it works anywhere. Each puzzle is about how English words sound.",
  listen: "<b>Listen</b> works best with headphones. Hear a word, then tap the one you heard.",
  speak: "<b>Speak</b>: say the word, and each part of it turns green, yellow, orange, or red. Tap a part that isn't green to practice it.",
  colors: "Pick a look for the day and one for night. Articulate switches when your phone goes dark.",
};
export const tipFor = (page, mode, sub) => {
  const id = page === "practice" ? mode : page === "words" && sub ? null : page;
  return TIPS[id] ? id : null;
};
export const tipSeen = (state, id) => state.tipsSeen.includes(id);

// The tour told the learner about these two screens already, so their tips don't repeat it.
export function finish(state) {
  state.tour.done = true;
  for (const id of ["words", "speak"]) if (!state.tipsSeen.includes(id)) state.tipsSeen.push(id);
}
