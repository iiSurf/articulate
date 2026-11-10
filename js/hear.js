// Which did you hear? (iiSurf): the quiet cousin of Say it round, for a sound the learner struggles with. #/hear/TH.
// The phone says one word of a pair that differs by that sound (think or sink), and the learner taps which it was.
// No microphone, no download, so it works on the bus, and it trains the ear before the mouth. It doesn't grade
// speaking, so it never moves the boards: only Speak and Say it round do. Eight questions, a streak, then a way into
// the spoken round for the same sound. The pairs come from data/tips/uk-en.json (hearQuestions in js/progress.js).
import { registerScreen } from "./app.js";
import { html, raw } from "./html.js";
import { loadTips } from "./words/tips.js";
import { panel } from "./words/mouth.js";
import { canSpeak, say } from "./words/speech.js";
import { hearQuestions } from "./progress.js";

const EAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9h4l5.5-4.5v15L7.5 15h-4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

registerScreen("hear", {
  async render(root, ctx) {
    root.innerHTML = String(html`<section class="card"><p>Getting the words ready…</p></section>`);
    let tips;
    try { tips = await loadTips(); } catch { return message(root, "The word lists didn't load. Check the connection and try again."); }
    const sound = ctx.param;
    const entry = tips.sounds?.[sound];
    const short = entry?.title.split(" as in ")[0];
    const make = () => hearQuestions(tips, ctx.state, sound);
    let questions = make();
    if (!entry || !questions.length) return message(root, "There's no listening game for that sound yet.");
    if (!canSpeak()) return message(root, "This phone can't say words out loud, so this game can't play here. Read has silent puzzles instead.", "#/practice/read", "Go to Read");
    if (!root.isConnected) return;

    // i is the question (questions.length means it's over), picked is { word, ok } once answered.
    const r = { i: 0, picked: null, right: 0, streak: 0, best: 0 };
    const q = () => questions[r.i];
    const here = () => root.isConnected && location.hash.startsWith("#/hear");

    function draw() {
      root.innerHTML = String(r.i >= questions.length ? doneView() : questionView());
      if (r.i >= questions.length) {
        root.querySelector("#again").addEventListener("click", () => { questions = make(); Object.assign(r, { i: 0, picked: null, right: 0, streak: 0, best: 0 }); draw(); });
        return;
      }
      root.querySelector("#play").addEventListener("click", () => say(q().said));
      root.querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => choose(b.dataset.choice)));
      root.querySelector("#both")?.addEventListener("click", () => say(q().said).then(() => here() && say(q().pair.find((w) => w !== q().said))));
      root.querySelector("#next")?.addEventListener("click", () => { r.i++; r.picked = null; draw(); if (r.i < questions.length) { say(q().said); root.querySelector("#play").focus(); } });
      (r.picked ? root.querySelector("#next") : root.querySelector("#play"))?.focus();
    }

    function choose(word) {
      if (r.picked) return;
      const ok = word === q().said;
      r.picked = { word, ok };
      r.streak = ok ? r.streak + 1 : 0;
      r.best = Math.max(r.best, r.streak);
      if (ok) r.right++;
      draw();
    }

    function questionView() {
      const { pair, said, flip } = q(), p = r.picked;
      const choices = flip ? [pair[1], pair[0]] : pair;
      const last = r.i === questions.length - 1;
      return html`<div class="hear"><section class="card center">
        <h2 class="label">Question ${r.i + 1} of ${questions.length}</h2>
        <div class="dots" role="img" aria-label="Question ${r.i + 1} of ${questions.length}">${questions.map((_, i) => html`<i class="${i < r.i ? "done" : i === r.i ? "now" : ""}"></i>`)}</div>
        <div class="streak" aria-live="polite">${r.streak}<small>in a row</small></div>
        <button type="button" class="btn primary wide" id="play">${raw(EAR)}${p ? "Play it again" : "Play the word"}</button>
        <div class="hear-choices" role="group" aria-label="Which did you hear?">${choices.map((w) => {
          const tone = !p ? "" : w === said ? " right" : w === p.word ? " wrong" : "";
          return html`<button type="button" class="hear-choice${tone}" data-choice="${w}" ${p ? raw("disabled") : ""}>${w}${tone === " right" ? raw('<span aria-hidden="true"> ✓</span>') : tone === " wrong" ? raw('<span aria-hidden="true"> ✕</span>') : ""}</button>`;
        })}</div>
        ${p ? html`<p class="hint" role="status">${p.ok ? `Yes, ${said}.` : `It was ${said}, not ${p.word}.`}</p>
          ${p.ok ? "" : html`<div class="note how">${raw(panel(tips, sound))}</div>`}
          <div class="row"><button type="button" class="btn" id="both">${raw(EAR)}Hear both</button><button type="button" class="btn primary" id="next">${last ? "See results" : "Next word"}</button></div>`
          : html`<p class="hint">Tap the word you heard. You can play it as many times as you like.</p>`}
      </section></div>`;
    }

    function doneView() {
      return html`<div class="hear"><section class="card center">
        <h2 class="label">Round done</h2>
        <p class="bigcount"><b>${r.right} of ${questions.length}</b> right</p>
        <p class="hint">Longest streak: ${r.best} in a row.</p>
        <p>${r.right === questions.length ? "Your ear caught every one. Now try saying them." : r.right >= questions.length * 0.6 ? "Your ear is getting it. A few more rounds will help." : "These sounds are hard to hear at first. Play it again, and listen to the tongue and lips in the tip."}</p>
        <div class="row"><a class="btn primary" href="#/round/${sound}">Say ${short} out loud</a></div>
        <div class="row"><button type="button" class="btn" id="again">Play again</button><a class="btn" href="#/progress">Back to Progress</a></div>
      </section></div>`;
    }
    draw();
  },
});

function message(root, text, href = "#/progress", label = "Back to Progress") {
  root.innerHTML = String(html`<section class="card"><p>${text}</p><div class="row"><a class="btn primary" href="${href}">${label}</a></div></section>`);
}
