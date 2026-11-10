// Say it round (iiSurf): five words with the sound the learner struggles with most, said out loud and scored by the
// real model, stars for the round, then a recap. #/round/TH. Started from the Progress tab ("Practice th").
// The words come from js/progress.js (roundWords): the learner's own trouble word first, so it can climb the boards,
// then words with that sound from data/tips/uk-en.json. Every try goes through ctx.score, so it is remembered like
// any try in Speak. Nothing is recorded or sent anywhere: the voice is scored on the phone and thrown away.
// It uses the teammate's recorder and wording helpers (js/practice/recorder.js, feedback.js) so a round sounds and
// behaves like Speak.
import { registerScreen } from "./app.js";
import { html, raw } from "./html.js";
import { loadTips, soundKey } from "./words/tips.js";
import { panel } from "./words/mouth.js";
import { canSpeak, say } from "./words/speech.js";
import { canRecord, micProblem, startRecording } from "./practice/recorder.js";
import { GRADES, MAX_SECONDS, MIN_SECONDS, headline, heardNothing, heardSentence } from "./practice/feedback.js";
import { openModelDialog, toast } from "./ui/modeldialog.js";
import { GOOD_ENOUGH, ownWordFor, roundWords, scoreOf, stars, toneOf } from "./progress.js";
import { play } from "./ui/sounds.js";
import { celebrate } from "./ui/celebrate.js";

const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>';
const EAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9h4l5.5-4.5v15L7.5 15h-4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const BY_TONE = Object.fromEntries(Object.values(GRADES).map((g) => [g.tone, g]));
const today = () => new Date().toISOString().slice(0, 10);

registerScreen("round", {
  async render(root, ctx) {
    root.innerHTML = String(html`<section class="card"><p>Getting the words ready…</p></section>`);
    let tips;
    try { tips = await loadTips(); } catch { return message(root, "The word lists didn't load. Check the connection and try again."); }
    const sound = ctx.param;
    const entry = tips.sounds?.[sound];
    const words = roundWords(tips, ctx.state, sound);
    if (!entry || !words.length) return message(root, "There's no round for that sound yet.");
    if (!root.isConnected) return;

    const own = ownWordFor(ctx.state, sound);
    // i is the word being said (words.length means the round is over); best is each word's best score, null if skipped.
    const r = { i: 0, best: words.map(() => null), spots: words.map(() => null), result: null, phase: "start", problem: null, recording: null, last: ctx.state.rounds[sound] ?? null, added: null, ready: false, intro: true };
    const short = entry.title.split(" as in ")[0];
    const here = () => root.isConnected && location.hash.startsWith("#/round");

    const needModel = async () => {
      const [where, partial] = await Promise.all([ctx.model.saved().catch(() => null), ctx.model.partial().catch(() => null)]);
      if (where) { r.ready = true; return draw(); }
      r.partial = partial;
      draw();
    };

    function draw() {
      root.classList.toggle("wide", r.ready && !r.intro && r.i < words.length); // room for the picture on the side
      root.innerHTML = String(!r.ready ? needView() : r.intro ? introView() : r.i >= words.length ? doneView() : wordView());
      if (r.ready && r.intro) {
        root.querySelector("#begin").addEventListener("click", () => { r.intro = false; draw(); root.querySelector("#record")?.focus(); });
        return;
      }
      if (!r.ready) {
        root.querySelector("#get-model")?.addEventListener("click", () => openModelDialog({
          partial: r.partial,
          load: (options) => ctx.model.load(options),
          go: (hash) => { location.hash = hash; },
          onReady: () => { toast("Ready. Let's say some words."); r.ready = true; if (here()) draw(); },
        }));
      } else if (r.i < words.length) {
        root.querySelector("#record").addEventListener("click", () => (r.phase === "recording" ? r.recording?.stop() : record()));
        root.querySelector("#hear")?.addEventListener("click", () => say(words[r.i]));
        root.querySelector("#slow")?.addEventListener("click", () => say(words[r.i], { slow: true }));
        root.querySelector("#next").addEventListener("click", () => { r.i++; r.result = null; r.problem = null; if (r.i >= words.length) endRound(); draw(); });
      } else {
        root.querySelector("#add")?.addEventListener("click", addWords);
        root.querySelector("#again")?.addEventListener("click", () => { Object.assign(r, { i: 0, best: words.map(() => null), spots: words.map(() => null), result: null, problem: null, added: null, last: ctx.state.rounds[sound] ?? null }); draw(); });
        root.querySelector("#say")?.addEventListener("click", () => { ctx.state.current = sayAgain(); ctx.save(); ctx.go("practice", "speak"); });
      }
    }

    // The word to say again in Speak: their own trouble word, or the word of this round that went worst.
    const sayAgain = () => own ?? words.filter((_, i) => r.best[i] !== null).sort((a, b) => r.best[words.indexOf(a)] - r.best[words.indexOf(b)])[0] ?? words[0];

    // The lesson opens with how to make the sound, before any word is tried.
    function introView() {
      return html`<div class="round"><section class="card intro-card">
        <h2 class="label">First, how to make the ${short}</h2>
        ${raw(panel(tips, sound, { heading: false }))}
        <button type="button" class="btn primary wide" id="begin">Start: ${words.length} words</button>
      </section></div>`;
    }

    function needView() {
      return html`<section class="card round-need">
        <h2 class="label">${short} round</h2>
        <p>A round is five words with <b>${entry.title}</b>, said out loud. It needs the sound model, a one-time download that stays on this phone.</p>
        <div class="row"><button type="button" class="btn primary" id="get-model">Get the sound model</button></div>
        <p class="hint">Can't talk right now? <a href="#/practice/listen">Listen</a> and <a href="#/practice/read">Read</a> work with no download.</p>
      </section>`;
    }

    function wordView() {
      const word = words[r.i], parts = r.result?.parts;
      const recording = r.phase === "recording", checking = r.phase === "checking";
      const hint = r.result ? `${headline(r.result.parts)} ${heardSentence(r.result.parts)}`.trim() : "Tap the microphone, say the word, then tap Stop.";
      const last = r.i === words.length - 1;
      // After a try, the picture also shows what the sound came out as (the part with this sound that wasn't green).
      const spot = parts?.find((p) => p.focusPhone && soundKey(p.focusPhone) === sound && p.grade && p.grade !== "green");
      return html`<div class="round side">
        <section class="card center">
          <h2 class="label">Word ${r.i + 1} of ${words.length}</h2>
          <div class="dots" role="img" aria-label="Word ${r.i + 1} of ${words.length}">${words.map((_, i) => html`<i class="${i < r.i ? "done" : i === r.i ? "now" : ""}"></i>`)}</div>
          <div class="bigword" lang="en">${parts
            ? parts.map((p) => { const g = GRADES[p.grade]; return g
              ? html`<span class="part ${g.tone}" role="img" aria-label="${p.letters} ${g.word}"><span class="l">${p.letters}</span><span class="m" aria-hidden="true">${g.mark}</span></span>`
              : html`<span class="part silent"><span class="l">${p.letters}</span><span class="m blank"></span></span>`; })
            : html`<span class="part"><span class="l">${word}</span></span>`}</div>
          <p class="hint" aria-live="polite">${checking ? "Checking how it went…" : hint}</p>
          ${problemView(r.problem)}
          <button type="button" class="btn primary wide record${recording ? " live" : ""}" id="record" ${checking ? raw("disabled") : ""}>${raw(recording ? STOP : MIC)}${recording ? "Stop" : r.result ? "Say it again" : "Say it"}</button>
          ${recording ? html`<progress class="rec-time" id="rec-time" max="1" value="0" aria-label="Time left"></progress>` : ""}
          ${canSpeak() ? html`<div class="row"><button type="button" class="btn" id="hear">${raw(EAR)}Hear it</button><button type="button" class="btn" id="slow">${raw(EAR)}Slowly</button></div>` : ""}
          <button type="button" class="btn wide${r.result ? " primary" : ""}" id="next" ${recording || checking ? raw("disabled") : ""}>${r.result ? (last ? "See results" : "Next word") : "Skip this word"}</button>
        </section>
        <section class="card how">${raw(panel(tips, sound, { said: spot?.heard }))}</section>
      </div>`;
    }

    function doneView() {
      const n = stars(words.map((w, i) => ({ word: w, score: r.best[i] ?? 0 })));
      const fresh = words.filter((w) => !ctx.state.words.some((x) => x.text === w));
      return html`<div class="round"><section class="card center">
        <h2 class="label">Round done</h2>
        <div class="stars" role="img" aria-label="${n} of ${words.length} stars">${words.map((_, i) => html`<span class="${i < n ? "on" : "off"}" aria-hidden="true">★</span>`)}</div>
        <p><b>${n} of ${words.length} words came out good.</b>${r.last ? ` Last round: ${r.last.stars} of ${words.length}.` : ""}</p>
        <div class="recap">${words.map((w, i) => {
          const done = r.best[i] !== null, good = done && r.best[i] >= GOOD_ENOUGH, spot = !good && r.spots[i];
          const g = !done ? null : good ? BY_TONE.good : spot ? GRADES[spot.grade] : BY_TONE[toneOf(r.best[i])];
          return html`<div class="${g ? g.tone : ""}"><span>${w}</span><span class="st">${!g ? "skipped" : spot ? `${spot.letters} ${g.was} ${g.mark}` : `${g.word} ${g.mark}`}</span></div>`; })}</div>
        ${r.added !== null ? html`<p class="hint" role="status">${r.added ? `Added ${r.added} ${r.added === 1 ? "word" : "words"} to My words.` : "They're all in My words already."}</p>` : ""}
        <div class="row">
          ${fresh.length && r.added === null ? html`<button type="button" class="btn" id="add">Add these words</button>` : ""}
          <button type="button" class="btn primary" id="say">Say ${sayAgain()} again</button>
        </div>
        <div class="row"><button type="button" class="btn" id="again">Play again</button><a class="btn" href="#/progress">Back to Progress</a></div>
      </section></div>`;
    }

    function addWords() {
      const fresh = words.filter((w) => !ctx.state.words.some((x) => x.text === w));
      for (const text of fresh) ctx.state.words.push({ text, added: today() });
      ctx.save();
      r.added = fresh.length;
      draw();
    }

    async function record() {
      if (!canRecord()) { r.problem = "none"; return draw(); }
      r.problem = null;
      const word = words[r.i];
      try {
        r.recording = await startRecording({ onTick: (s) => { const bar = root.querySelector("#rec-time"); if (bar) bar.value = s / MAX_SECONDS; } });
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
          if (score !== null && score >= (r.best[r.i] ?? -1)) { r.best[r.i] = score; r.spots[r.i] = worstPart(result.parts); } // the recap tells about the best try
          if (score >= GOOD_ENOUGH) play("right"); // a chime for a word that came out good
        }
      } catch {
        r.problem = "score";
      }
      if (!here()) return;
      r.phase = "start";
      draw();
      root.querySelector("#record")?.focus();
    }

    // The round's result is saved once, the moment it ends, so the next round can say "Last round: 1 of 5".
    function endRound() {
      // A celebration first: how many came out good and how many are still to work on (skipped words don't count).
      const tried = r.best.filter((b) => b !== null), good = tried.filter((b) => b >= GOOD_ENOUGH).length;
      if (tried.length) setTimeout(() => celebrate({ right: good, wrong: tried.length - good, note: `The ${short} round`, onClose: () => root.querySelector("#say")?.focus() }), 0);
      r.last = ctx.state.rounds[sound] ?? null; // what it was before this round
      ctx.state.rounds[sound] = { at: new Date().toISOString(), stars: stars(words.map((w, i) => ({ word: w, score: r.best[i] ?? 0 }))) };
      ctx.save();
    }
    needModel();
  },
});

// The part that went worst in a try (red, then orange, then yellow), or null when every graded part was green.
function worstPart(parts) {
  const rank = { red: 0, orange: 1, yellow: 2 };
  return parts.filter((p) => p.grade in rank).sort((a, b) => rank[a.grade] - rank[b.grade])[0] ?? null;
}

function message(root, text) {
  root.innerHTML = String(html`<section class="card"><p>${text}</p><div class="row"><a class="btn primary" href="#/progress">Back to Progress</a></div></section>`);
}

// When something got in the way, in plain words (the same ones Speak uses), with a way forward.
function problemView(problem) {
  const note = (text, warn = false) => html`<div class="note${warn ? " warn" : ""}"><p>${text}</p></div>`;
  switch (problem) {
    case "blocked": return note("The microphone is turned off for this site. Allow it in your browser's site settings (the icon next to the address), then try again.", true);
    case "none": return note("No microphone found. A round needs one. Listen and Read work without it.", true);
    case "other": return note("The microphone didn't start. Try again in a moment.", true);
    case "short": return note("That was very short. Tap Say it, say the whole word, then tap Stop.");
    case "quiet": return note("I didn't hear a word. Try again, a little closer to the phone.");
    case "score": return note("Something went wrong checking that try. Please try again.", true);
    default: return "";
  }
}
