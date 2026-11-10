// Five minutes (iiSurf, the redesign's phase 2): one short practice the app plans (js/session.js), run one step at a
// time: listen (which did you hear?), look (how to make the sound, from the Ukrainian one), say (the learner's own word
// first, scored by the real model), then a summary. #/session, started from Home's Start button.
// Every try goes through ctx.score, so the boards move. It uses the teammate's recorder and wording helpers
// (js/practice/recorder.js, feedback.js), like Say it round.
import { registerScreen } from "./app.js";
import { html, raw } from "./html.js";
import { loadTips } from "./words/tips.js";
import { canSpeak, say } from "./words/speech.js";
import { panel } from "./words/mouth.js";
import { canRecord, micProblem, startRecording } from "./practice/recorder.js";
import { GRADES, MAX_SECONDS, MIN_SECONDS, headline, heardNothing, heardSentence } from "./practice/feedback.js";
import { openModelDialog, toast } from "./ui/modeldialog.js";
import { scoreOf, wordStatus, toneOf } from "./progress.js";
import { planFor, summary, takePlan } from "./session.js";

const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>';
const EAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9h4l5.5-4.5v15L7.5 15h-4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.3 4.3L19 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

registerScreen("session", {
  async render(root, ctx) {
    root.innerHTML = String(html`<section class="card"><p>Getting your practice ready…</p></section>`);
    let tips;
    try { tips = await loadTips(); } catch { return message(root, "The word lists didn't load. Check the connection and try again."); }
    const quiet = ctx.state.mode !== "speak";
    const plan = takePlan() ?? await planFor(ctx, tips, { quiet, speech: canSpeak() });
    if (!root.isConnected) return;
    if (!plan) return message(root, "Add a word on Home first, and your practice will be ready.");

    // i is the step (steps.length means it's over). before: each word's score before this practice; best: during it.
    const r = { i: 0, plan, picked: null, heardRight: 0, before: {}, best: {}, result: null, phase: "start", problem: null, recording: null, partial: null, ready: true };
    for (const s of plan.steps) if (s.kind === "say") r.before[s.word] = wordStatus(ctx.state, s.word)?.recent ?? null;
    const here = () => root.isConnected && location.hash.startsWith("#/session");
    const step = () => r.plan.steps[r.i];

    // Saying needs the sound model. Without it: get it, or skip saying today.
    if (plan.steps.some((s) => s.kind === "say")) {
      const [where, partial] = await Promise.all([ctx.model.saved().catch(() => null), ctx.model.partial().catch(() => null)]);
      if (!where) { r.ready = false; r.partial = partial; }
    }
    if (!root.isConnected) return;

    function next() {
      r.i++;
      r.picked = null; r.result = null; r.problem = null; r.phase = "start";
      draw();
      if (step()?.kind === "hear") say(step().said);
    }

    function draw() {
      const s = step();
      root.innerHTML = String(html`<div class="session">
        ${r.i < r.plan.steps.length ? html`<div class="steps-bar" role="img" aria-label="Step ${r.i + 1} of ${r.plan.steps.length}">${r.plan.steps.map((_, i) => html`<i class="${i < r.i ? "done" : i === r.i ? "now" : ""}"></i>`)}</div>` : ""}
        ${!r.ready ? needView() : !s ? doneView() : s.kind === "hear" ? hearView(s) : s.kind === "look" ? lookView(s) : sayView(s)}
      </div>`);
      if (!r.ready) {
        root.querySelector("#get-model")?.addEventListener("click", () => openModelDialog({
          partial: r.partial,
          load: (options) => ctx.model.load(options),
          go: (hash) => { location.hash = hash; },
          onReady: () => { toast("Ready. Let's practice."); r.ready = true; if (here()) draw(); },
        }));
        root.querySelector("#skip-say")?.addEventListener("click", () => {
          r.plan = { ...r.plan, steps: r.plan.steps.filter((x) => x.kind !== "say") };
          r.ready = true;
          if (!r.plan.steps.length) return message(root, "Nothing to practice without speaking yet. Try Quiet on Home.");
          draw();
          if (step()?.kind === "hear") say(step().said);
        });
        return;
      }
      root.querySelector("#next")?.addEventListener("click", next);
      root.querySelector("#again")?.addEventListener("click", () => dispatchEvent(new HashChangeEvent("hashchange"))); // already on #/session: draw it again, with a new plan
      if (!s) return;
      if (s.kind === "hear") {
        root.querySelector("#play").addEventListener("click", () => say(s.said));
        root.querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => {
          if (r.picked) return;
          r.picked = b.dataset.choice;
          if (r.picked === s.said) r.heardRight++;
          draw();
          root.querySelector("#next")?.focus();
        }));
        root.querySelector("#both")?.addEventListener("click", () => say(s.said).then(() => here() && say(s.pair.find((w) => w !== s.said))));
      }
      if (s.kind === "say") {
        root.querySelector("#record").addEventListener("click", () => (r.phase === "recording" ? r.recording?.stop() : record(s.word)));
        root.querySelector("#hear-first")?.addEventListener("click", () => say(s.word));
      }
    }

    function needView() {
      return html`<section class="card center">
        <h2 class="label">Saying words needs one download</h2>
        <p>Part of this practice is saying words, and the app needs its sound model to hear you. It's a one-time download that stays on this phone.</p>
        <div class="row"><button type="button" class="btn primary" id="get-model">Get the sound model</button></div>
        <p><button type="button" class="link" id="skip-say">Skip saying words today</button></p>
      </section>`;
    }

    function hearView(s) {
      const p = r.picked, choices = s.flip ? [s.pair[1], s.pair[0]] : s.pair;
      return html`<section class="card center step-card">
        <h2 class="label">Which did you hear?</h2>
        <button type="button" class="play-big" id="play" aria-label="${p ? "Play it again" : "Play the word"}">${raw(EAR)}</button>
        <p class="hint">${p ? "Play it again" : "Tap to hear it again"}</p>
        <div class="hear-choices" role="group" aria-label="Which did you hear?">${choices.map((w) => {
          const tone = !p ? "" : w === s.said ? " right" : w === p ? " wrong" : "";
          return html`<button type="button" class="hear-choice${tone}" data-choice="${w}" ${p ? raw("disabled") : ""}>${w}${tone === " right" ? raw('<span aria-hidden="true"> ✓</span>') : tone === " wrong" ? raw('<span aria-hidden="true"> ✕</span>') : ""}</button>`;
        })}</div>
        ${p ? html`<p class="verdict" role="status">${p === s.said ? `Yes, ${s.said}.` : `It was ${s.said}, not ${p}.`}</p>
          <div class="row"><button type="button" class="btn" id="both">${raw(EAR)}Hear both</button><button type="button" class="btn primary" id="next">Next</button></div>` : ""}
      </section>`;
    }

    function lookView(s) {
      return html`<section class="card step-card">${raw(panel(tips, s.sound))}
        <button type="button" class="btn primary wide" id="next">I'm ready</button>
      </section>`;
    }

    function sayView(s) {
      const parts = r.result?.parts, recording = r.phase === "recording", checking = r.phase === "checking";
      const hint = checking ? "Checking how it went…" : r.result ? `${headline(parts)} ${heardSentence(parts)}`.trim() : "Tap the microphone, say the word, then tap it again.";
      return html`<section class="say-step center">
        <p class="prompt">Say this word</p>
        <div class="say-word" lang="en">${parts
          ? parts.map((p) => { const g = GRADES[p.grade]; return g
            ? html`<span class="pt ${g.tone}" role="img" aria-label="${p.letters} ${g.word}"><span class="l">${p.letters}</span><span class="m" aria-hidden="true">${g.mark}</span></span>`
            : html`<span class="pt silent"><span class="l">${p.letters}</span></span>`; })
          : html`<span class="pt"><span class="l">${s.word}</span></span>`}</div>
        <p class="hint" aria-live="polite">${hint}</p>
        ${problemView(r.problem)}
        <button type="button" class="mic-btn huge${recording ? " live" : ""}" id="record" ${checking ? raw("disabled") : ""}>${raw(recording ? STOP : MIC)}<span class="mic-label">${recording ? "Stop" : r.result ? "Say it again" : "Say it"}</span></button>
        ${recording ? html`<progress class="rec-time" id="rec-time" max="1" value="0" aria-label="Time left"></progress>` : ""}
        <div class="row">
          ${canSpeak() ? html`<button type="button" class="btn" id="hear-first">${raw(EAR)}Hear it</button>` : ""}
          <button type="button" class="btn${r.result ? " primary" : ""}" id="next" ${recording || checking ? raw("disabled") : ""}>${r.result ? "Next" : "Skip"}</button>
        </div>
      </section>`;
    }

    function doneView() {
      const sum = summary(r.plan, { before: r.before, best: r.best, heardRight: r.heardRight });
      return html`<section class="card center done-card">
        <span class="done-badge">${raw(CHECK)}</span>
        <h2 class="done-title">Nice work!</h2>
        <p class="hint">${sum.steps} steps${r.plan.name ? `, all about the ${r.plan.name}` : ""}.</p>
        <ul class="sum">
          ${sum.said.map((w) => html`<li><span>${w.word}</span><span class="sum-v">${w.now === null ? "skipped" : w.before === null ? html`<b class="${toneOf(w.now)}">${w.now}</b>` : html`${w.before} → <b class="${toneOf(w.now)}">${w.now}</b>`}</span></li>`)}
          ${sum.heard ? html`<li><span>${r.plan.name ? `${r.plan.name} by ear` : "By ear"}</span><span class="sum-v"><b>${sum.heardRight} of ${sum.heard}</b> right</span></li>` : ""}
        </ul>
        <a class="btn primary wide" href="#/words">Done</a>
        <p><button type="button" class="link" id="again">One more round</button></p>
      </section>`;
    }

    async function record(word) {
      if (!canRecord()) { r.problem = "none"; return draw(); }
      r.problem = null;
      try {
        r.recording = await startRecording({ onTick: (sec) => { const bar = root.querySelector("#rec-time"); if (bar) bar.value = sec / MAX_SECONDS; } });
      } catch (err) {
        r.problem = micProblem(err);
        return draw();
      }
      r.phase = "recording";
      draw();
      root.querySelector("#record")?.focus();
      const { blob, seconds } = await r.recording.done.catch(() => ({ blob: null, seconds: 0 }));
      r.recording = null;
      if (!here()) return; // they left while it was recording: nothing is scored
      if (!blob || seconds < MIN_SECONDS || blob.size < 1000) { r.phase = "start"; r.problem = "short"; return draw(); }
      r.phase = "checking";
      draw();
      try {
        const result = await ctx.score(blob, word);
        if (heardNothing(result)) r.problem = "quiet";
        else {
          r.result = result;
          const score = scoreOf(result.parts);
          if (score !== null) r.best[word] = Math.max(r.best[word] ?? 0, score);
        }
      } catch {
        r.problem = "score";
      }
      if (!here()) return;
      r.phase = "start";
      draw();
      root.querySelector(r.result ? "#next" : "#record")?.focus();
    }

    draw();
    if (r.ready && step()?.kind === "hear") say(step().said);
  },
});

function message(root, text) {
  root.innerHTML = String(html`<section class="card"><p>${text}</p><div class="row"><a class="btn primary" href="#/words">Back to Home</a></div></section>`);
}

// When something got in the way, in plain words (the same ones Speak uses), with a way forward.
function problemView(problem) {
  const note = (text, warn = false) => html`<div class="note${warn ? " warn" : ""}"><p>${text}</p></div>`;
  switch (problem) {
    case "blocked": return note("The microphone is turned off for this site. Allow it in your browser's site settings (the icon next to the address), then try again.", true);
    case "none": return note("No microphone found. Switch to Quiet on Home to practice without one.", true);
    case "other": return note("The microphone didn't start. Try again in a moment.", true);
    case "short": return note("That was very short. Tap the microphone, say the whole word, then tap it again.");
    case "quiet": return note("I didn't hear a word. Try again, a little closer to the phone.");
    case "score": return note("Something went wrong checking that try. Please try again.", true);
    default: return "";
  }
}
