// Read (the teammate's Practice part): puzzles on screen, with no sound at all, for the bus or a quiet room.
// Three kinds take turns: find the strong part, spot the small "uh", and same sound?
// Puzzles use the learner's own words when they fit, and the lists in lists.js when they don't.
import { html, raw } from "../html.js";
import { STRONG_WORDS, UH_WORDS, SAME_SOUND } from "./lists.js";
import { vowelParts, canStrong, canUh, uhParts, checkUh, sameSound, soundsOf, READ_KINDS } from "./puzzles.js";

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffled = (list) => [...list].sort(() => Math.random() - 0.5);

export const read = {
  render(container, ctx) {
    const root = document.createElement("div");
    root.className = "practice read";
    container.append(root);
    const own = ctx.state.words.map((w) => w.text);
    const tally = { right: 0, tries: 0 };
    let turn = Math.floor(Math.random() * READ_KINDS.length);
    let puzzle = null;
    let last = "";

    // Their own words that fit this kind of puzzle, then the list, without repeating the last word.
    async function wordFor(fits, list) {
      for (const w of shuffled(own)) {
        if (w === last) continue;
        const f = await ctx.lookUp(w).catch(() => null);
        if (fits(f) && Math.random() < 0.6) return f;
      }
      for (const w of shuffled(list)) {
        if (w === last) continue;
        const f = await ctx.lookUp(w).catch(() => null);
        if (fits(f)) return f;
      }
      return null;
    }

    async function next() {
      root.innerHTML = String(html`<section class="card"><p class="hint" role="status">Getting a puzzle ready…</p></section>`);
      const kind = READ_KINDS[turn++ % READ_KINDS.length];
      try {
        if (kind === "strong") puzzle = { kind, found: await wordFor(canStrong, STRONG_WORDS) };
        if (kind === "uh") puzzle = { kind, found: await wordFor(canUh, UH_WORDS), tapped: [] };
        if (kind === "same") {
          const [a, la, b, lb] = pick(SAME_SOUND.filter(([x, , y]) => `${x} ${y}` !== last));
          const [fa, fb] = await Promise.all([ctx.lookUp(a), ctx.lookUp(b)]);
          puzzle = { kind, a: fa, la, b: fb, lb, same: sameSound(fa, la, fb, lb) };
        }
      } catch {
        puzzle = null;
      }
      if (!puzzle || (puzzle.kind !== "same" && !puzzle.found) || (puzzle.kind === "same" && puzzle.same === null)) {
        root.innerHTML = String(html`<section class="card"><p>Couldn't load the word list. Check your connection and try again.</p>
          <button type="button" class="btn primary wide" id="retry">Try again</button></section>`);
        root.querySelector("#retry").addEventListener("click", next);
        return;
      }
      last = puzzle.kind === "same" ? `${puzzle.a.word} ${puzzle.b.word}` : puzzle.found.word;
      puzzle.answer = null;
      draw();
      root.querySelector("[data-tap], [data-same]")?.focus();
    }

    function finish(right) {
      puzzle.answer = right;
      tally.tries++;
      if (right) tally.right++;
      draw();
      root.querySelector("#next")?.focus();
    }

    function draw() {
      root.innerHTML = String(html`<section class="card read-card" data-tour="read-puzzle" aria-labelledby="read-q">
        ${puzzle.kind === "strong" ? strongView(puzzle) : puzzle.kind === "uh" ? uhView(puzzle) : sameView(puzzle)}
        ${puzzle.answer !== null ? html`<button type="button" class="btn primary wide" id="next">Next puzzle</button>` : ""}
        ${tally.tries ? html`<p class="tally hint">${tally.right} of ${tally.tries} right this time</p>` : ""}
      </section>`);
      wire();
    }

    function wire() {
      root.querySelector("#next")?.addEventListener("click", next);
      if (puzzle.kind === "strong") {
        root.querySelectorAll("[data-tap]").forEach((b) => b.addEventListener("click", () => {
          puzzle.tappedOne = Number(b.dataset.tap);
          finish(puzzle.tappedOne === puzzle.found.strong);
        }));
      }
      if (puzzle.kind === "uh") {
        root.querySelectorAll("[data-tap]").forEach((b) => b.addEventListener("click", () => {
          const i = Number(b.dataset.tap);
          puzzle.tapped = puzzle.tapped.includes(i) ? puzzle.tapped.filter((x) => x !== i) : [...puzzle.tapped, i];
          draw();
          root.querySelector(`[data-tap="${i}"]`)?.focus();
        }));
        root.querySelector("#check")?.addEventListener("click", () => finish(checkUh(puzzle.found, puzzle.tapped)));
      }
      if (puzzle.kind === "same") {
        root.querySelectorAll("[data-same]").forEach((b) => b.addEventListener("click", () => {
          puzzle.said = b.dataset.same === "yes";
          finish(puzzle.said === puzzle.same);
        }));
      }
    }

    next();
  },
};

// A word as tappable parts: the vowel parts are buttons, the rest plain letters.
function partsView(found, { tappable, state }) {
  const vowels = new Set(vowelParts(found).map((p) => p.i));
  return html`<div class="read-word">${found.parts.map((p, i) =>
    vowels.has(i) && tappable
      ? html`<button type="button" class="tap${state(i)}" data-tap="${i}" aria-pressed="${state(i).includes("picked")}">${p.letters}</button>`
      : html`<span class="plain${state(i)}">${p.letters}</span>`)}</div>`;
}

function strongView(pz) {
  const done = pz.answer !== null;
  const state = (i) => (done && i === pz.found.strong ? " is-target" : done && i === pz.tappedOne ? " is-wrong" : "");
  return html`<h2 class="label" id="read-q">Find the strong part</h2>
    <p>Which part of <b>${pz.found.word}</b> is said the strongest, the loudest and longest?</p>
    ${partsView(pz.found, { tappable: !done, state })}
    <div role="status" aria-live="polite">${done ? html`<p class="headline">${pz.answer ? "Yes!" : "Not quite."} The strong part is ${spelled(pz.found, [pz.found.strong])}.</p>
      <p class="hint">English stresses one part of a word and squashes the others. Getting the strong part right makes a word easy to recognize, even with other sounds off.</p>` : ""}</div>`;
}

function uhView(pz) {
  const done = pz.answer !== null;
  const want = new Set(uhParts(pz.found));
  const state = (i) => (done ? (want.has(i) ? " is-target" : pz.tapped.includes(i) ? " is-wrong" : "") : pz.tapped.includes(i) ? " picked" : "");
  return html`<h2 class="label" id="read-q">Spot the small "uh"</h2>
    <p>Tap every part of <b>${pz.found.word}</b> that's said as a quick, small <b>uh</b>, like the a in about.</p>
    ${partsView(pz.found, { tappable: !done, state })}
    ${!done ? html`<button type="button" class="btn primary wide" id="check" ${pz.tapped.length ? "" : raw("disabled")}>Check</button>` : ""}
    <div role="status" aria-live="polite">${done ? html`<p class="headline">${pz.answer ? "Yes!" : "Not quite."} ${want.size === 1 ? "The small uh is" : "The small uhs are"} ${spelled(pz.found, [...want])}.</p>
      <p class="hint">In English, the parts that aren't strong often shrink to "uh", whatever letter they're spelled with. Saying them in full is one of the clearest signs of an accent.</p>` : ""}</div>`;
}

function sameView(pz) {
  const done = pz.answer !== null;
  const mark = (found, letters) => {
    const { i } = soundsOf(found, letters);
    return html`<span class="read-word small">${found.parts.map((p, k) => (k === i ? html`<mark>${p.letters}</mark>` : html`<span>${p.letters}</span>`))}</span>`;
  };
  return html`<h2 class="label" id="read-q">Same sound?</h2>
    <p>Do the marked letters sound the same?</p>
    <div class="same-pair">${mark(pz.a, pz.la)}<span class="vs" aria-hidden="true">and</span>${mark(pz.b, pz.lb)}</div>
    ${!done ? html`<div class="row"><button type="button" class="btn" data-same="yes">Same</button><button type="button" class="btn" data-same="no">Different</button></div>` : ""}
    <div role="status" aria-live="polite">${done ? html`<p class="headline">${pz.answer ? "Yes!" : "Not quite."} They sound ${pz.same ? "the same" : "different"}.</p>
      <p class="hint">${pz.same ? "Different spellings, same sound: English spelling often hides that." : "Same spelling, different sound: English spelling often hides that."}</p>` : ""}</div>`;
}

// The word with some parts marked: "the o in imp[o]rtant". Marked, not capitals: a capital I looks like an l.
function spelled(found, marked) {
  const set = new Set(marked);
  const which = [...set].map((i) => found.parts[i].letters);
  const name = which.length === 1 ? `the ${which[0]}` : `the ${which.slice(0, -1).join(", the ")} and the ${which.at(-1)}`;
  return html`${name} in <span class="hl-word">${found.parts.map((p, i) => (set.has(i) ? html`<mark>${p.letters}</mark>` : p.letters))}</span>`;
}
