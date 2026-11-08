// Speak (the teammate's Practice part): say the word, then see each part of it colored by how close it was.
// Plugs in with registerScreen("speak", speak) in index.js. Everything it needs comes from ctx (js/app.js).
// The recording is scored in the page and dropped: it is never saved or sent anywhere.
import { html, raw } from "../html.js";
import { say, canSpeak } from "../words/speech.js";
import { segments } from "../words/tips.js";
import { GRADES, heardSentence, headline, heardNothing, plainSound, likeSound, MIN_SECONDS, MAX_SECONDS } from "./feedback.js";
import { canRecord, micProblem, startRecording } from "./recorder.js";

const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>';
const EAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9h4l5.5-4.5v15L7.5 15h-4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

const UNSURE_NOTE = "The app has a hard time telling some vowels apart (like bed and bad), so those parts never show better than close.";

export const speak = {
  render(container, ctx) {
    const view = { phase: "start", result: null, problem: null, open: null, progress: 0, seconds: 0, found: null, recording: null };
    const root = document.createElement("div");
    root.className = "speak";
    container.append(root);

    const word = ctx.word;
    if (!word) return pickWord(root, ctx);

    ctx.lookUp(word).then((found) => {
      view.found = found;
      draw();
      ctx.model.saved().then((where) => { if (!where) { view.phase = "download"; draw(); } }).catch(() => {});
    }).catch(() => { view.problem = "lookup"; draw(); });

    function draw() {
      root.innerHTML = String(html`
        <section class="card speak-card" aria-labelledby="speak-word">
          <h2 class="label" id="speak-word">Say this word</h2>
          ${wordView(view, word)}
          ${view.result && !view.problem ? resultView(view) : ""}
          <p class="status hint" role="status" aria-live="polite">${statusText(view)}</p>
          ${problemView(view)}
          ${view.phase === "download" ? downloadView(view) : controls(view)}
        </section>
        ${view.open !== null && view.result ? fixView(view, word) : ""}
        <p class="speak-switch"><a href="#/words">Pick another word</a></p>`);
      wire();
    }

    function wire() {
      root.querySelector("#record")?.addEventListener("click", () => (view.phase === "recording" ? view.recording?.stop() : record()));
      root.querySelector("#hear")?.addEventListener("click", () => say(word));
      root.querySelector("#slow")?.addEventListener("click", () => say(word, { slow: true }));
      root.querySelector("#fix-slow")?.addEventListener("click", () => say(word, { slow: true }));
      root.querySelector("#get-model")?.addEventListener("click", getModel);
      root.querySelector("#close-fix")?.addEventListener("click", () => {
        view.open = null;
        draw();
        ctx.tour.did("fixed");
        root.querySelector("#record")?.focus();
      });
      root.querySelectorAll("[data-part]").forEach((b) => b.addEventListener("click", () => {
        const i = Number(b.dataset.part);
        view.open = view.open === i ? null : i;
        draw();
        root.querySelector(view.open === null ? `[data-part="${i}"]` : "#fix")?.focus();
        // The tip for this sound (iiSurf's Words part, data/tips/uk-en.json), filled in when it has loaded.
        if (view.open === i) ctx.tips(view.result.parts[i], word).then((tip) => {
          const box = root.querySelector("#fix-tips");
          if (!tip || !box || view.open !== i) return;
          box.innerHTML = String(tipView(tip));
          box.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => say(b.dataset.say)));
          box.querySelectorAll("[data-say-pair]").forEach((b) => b.addEventListener("click", () => { const [x, y] = b.dataset.sayPair.split(" "); say(x).then(() => say(y)); }));
        }).catch(() => {});
      }));
    }

    async function getModel() {
      view.phase = "downloading";
      view.progress = 0;
      draw();
      try {
        await ctx.model.load({ onProgress: (x) => { view.progress = x; const bar = root.querySelector("#dl"); if (bar) bar.value = x; const t = root.querySelector("#dl-text"); if (t) t.textContent = `${Math.round(x * 100)}%`; } });
        view.phase = "start";
      } catch {
        view.phase = "download";
        view.problem = "download";
      }
      draw();
    }

    async function record() {
      if (!canRecord()) { view.problem = "none"; return draw(); }
      view.problem = null;
      view.open = null;
      try {
        view.recording = await startRecording({ onTick: (s) => { const bar = root.querySelector("#rec-time"); if (bar) bar.value = s / MAX_SECONDS; } });
      } catch (err) {
        view.problem = micProblem(err);
        return draw();
      }
      view.phase = "recording";
      draw();
      root.querySelector("#record")?.focus();
      const { blob, seconds } = await view.recording.done.catch(() => ({ blob: null, seconds: 0 }));
      view.recording = null;
      if (!blob || seconds < MIN_SECONDS || blob.size < 1000) {
        view.phase = "start";
        view.problem = "short";
        return draw();
      }
      view.phase = "checking";
      draw();
      try {
        const result = await ctx.score(blob, word, { onProgress: (x) => { view.progress = x; } });
        if (heardNothing(result)) {
          view.problem = "quiet";
        } else {
          view.result = result;
          ctx.tour.did("said");
        }
      } catch {
        view.problem = "score";
      }
      view.phase = "start";
      draw();
      root.querySelector("#record")?.focus();
    }
  },
};

// No word picked yet: their own words to pick from, or a way to My words.
function pickWord(root, ctx) {
  const words = ctx.state.words.slice(-8).reverse();
  root.innerHTML = String(html`
    <section class="card">
      <h2 class="label">Speak</h2>
      <p>Pick a word to say.</p>
      ${words.length
        ? html`<div class="chips">${words.map((w) => html`<button type="button" class="chip" data-pick="${w.text}">${w.text}</button>`)}</div>`
        : html`<p class="hint">You don't have any words yet.</p>`}
      <a class="btn wide" href="#/words">${words.length ? "Add a word" : "Go to My words"}</a>
    </section>`);
  root.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => {
    ctx.state.current = b.dataset.pick;
    ctx.save();
    dispatchEvent(new HashChangeEvent("hashchange"));
  }));
}

// The word, split into its spelled parts. After a try, each part is a button with its grade and mark.
function wordView(view, word) {
  const parts = view.result?.parts || view.found?.parts?.map((p) => ({ letters: p.letters, grade: undefined })) || [{ letters: word }];
  const graded = !!view.result;
  return html`<p class="sr-only">${word}</p>
    <div class="speak-word${graded ? " graded" : ""}${word.length > 10 ? " longer" : word.length > 7 ? " long" : ""}" aria-hidden="${graded ? "false" : "true"}">
      ${parts.map((p, i) => {
        const g = GRADES[p.grade];
        if (!graded || !g) return html`<span class="part${p.grade === null ? " silent" : ""}"><span class="l">${p.letters}</span>${graded ? raw('<span class="m blank"></span>') : ""}</span>`;
        const label = `${p.letters}: ${g.word}${p.heard ? `. It sounded like ${plainSound(p.heard)}` : p.heard === "" ? ". It was left out" : ""}`;
        const tappable = p.grade !== "green";
        return tappable
          ? html`<button type="button" class="part ${g.tone}${view.open === i ? " open" : ""}" data-part="${i}" data-tour="part" data-grade="${p.grade}" aria-label="${label}. Tap to practice this part." aria-expanded="${view.open === i}"><span class="l">${p.letters}</span><span class="m">${g.mark}</span></button>`
          : html`<span class="part ${g.tone}" data-tour="part" data-grade="${p.grade}" role="img" aria-label="${label}"><span class="l">${p.letters}</span><span class="m">${g.mark}</span></span>`;
      })}
    </div>`;
}

function resultView(view) {
  const parts = view.result.parts;
  const sentence = heardSentence(parts);
  const unsure = parts.some((p) => p.unsure && p.grade === "yellow");
  const tappable = parts.some((p) => p.grade && p.grade !== "green");
  return html`<div class="speak-result">
    <p class="headline">${headline(parts)}</p>
    ${sentence ? html`<p class="heard">${sentence}</p>` : ""}
    ${tappable ? html`<p class="hint">Tap a colored part to practice just that part.</p>` : ""}
    ${unsure ? html`<p class="hint unsure">${UNSURE_NOTE}</p>` : ""}
  </div>`;
}

function statusText(view) {
  if (view.phase === "recording") return "Listening… say the word, then tap Stop.";
  if (view.phase === "checking") return "Checking how it went…";
  if (view.phase === "downloading") return "Getting the sound file ready…";
  return "";
}

// When something got in the way, in plain words, with a way forward.
function problemView(view) {
  switch (view.problem) {
    case "blocked":
      return html`<div class="note warn"><p><b>The microphone is turned off for this site.</b> To use Speak, allow the microphone in your browser's site settings (the icon next to the address), then try again.</p><p>Can't talk right now? Practice with <a href="#/practice/listen">Listen</a> or <a href="#/practice/read">Read</a> instead.</p></div>`;
    case "none":
      return html`<div class="note warn"><p><b>No microphone found.</b> Speak needs one. You can still practice with <a href="#/practice/listen">Listen</a> or <a href="#/practice/read">Read</a>.</p></div>`;
    case "other":
      return html`<div class="note warn"><p>The microphone didn't start. Try again in a moment.</p></div>`;
    case "short":
      return html`<div class="note"><p>That was very short. Tap Record, say the whole word, then tap Stop.</p></div>`;
    case "quiet":
      return html`<div class="note"><p>I didn't hear a word. Try again, a little closer to the phone.</p></div>`;
    case "score":
      return html`<div class="note warn"><p>Something went wrong checking that try. Please try again.</p></div>`;
    case "download":
      return html`<div class="note warn"><p>The download stopped. Check your connection and try again.</p></div>`;
    case "lookup":
      return html`<div class="note warn"><p>Couldn't load the word list. Check your connection and try again.</p></div>`;
    default:
      return "";
  }
}

// The one-time download of the sound file, before the first try.
function downloadView(view) {
  const conn = navigator.connection;
  const mobile = conn && (conn.saveData || conn.type === "cellular");
  return html`<div class="download">
    <p><b>One time only:</b> Speak needs a sound file to hear you. It's 355 MB, and it stays on this phone. Your voice never leaves it.</p>
    <p class="hint">${mobile ? "You seem to be on mobile data. Wi-Fi is better for this." : "Wi-Fi is best."}</p>
    <button type="button" class="btn primary wide" id="get-model">Get it (355 MB)</button>
  </div>`;
}

function controls(view) {
  if (view.phase === "downloading") {
    return html`<div class="download"><progress id="dl" max="1" value="${view.progress}"></progress><p class="hint" id="dl-text">${Math.round(view.progress * 100)}%</p></div>`;
  }
  const recording = view.phase === "recording";
  const checking = view.phase === "checking";
  return html`
    <button type="button" class="btn primary wide record${recording ? " live" : ""}" id="record" data-tour="record" ${checking ? raw("disabled") : ""}>
      ${raw(recording ? STOP : MIC)}${recording ? "Stop" : view.result ? "Say it again" : "Record"}
    </button>
    ${recording ? html`<progress class="rec-time" id="rec-time" max="1" value="0" aria-label="Time left"></progress>` : ""}
    ${canSpeak() ? html`<div class="row"><button type="button" class="btn" id="hear">${raw(EAR)}Hear it</button><button type="button" class="btn" id="slow">${raw(EAR)}Slowly</button></div>` : ""}`;
}

// Practicing one part: what it sounded like, hear it slowly, and back to the word. iiSurf's tips and
// same-sound word lists plug in here when they land (PLAN.md, "Still to come from iiSurf").
// The tip for a sound: how to make it, what they said instead, words to practice, and pairs to hear. Ukrainian letters are
// marked lang="uk" so a screen reader reads them in Ukrainian.
function tipView(t) {
  const text = (str) => segments(str).map((x) => (x.uk ? html`<span lang="uk">${x.text}</span>` : x.text));
  return html`<p><b>${t.title}</b></p><p>${text(t.tip)}</p>
    ${t.swap ? html`<p class="hint">${text(t.swap)}</p>` : ""}
    ${t.words.length ? html`<div class="sub">Same sound, same spot (tap to hear)</div><div class="chips">${t.words.map((w) => html`<button type="button" class="chip" data-say="${w}">${w}</button>`)}</div>` : ""}
    ${t.pairs.length ? html`<div class="sub">Hear the difference</div><div class="chips">${t.pairs.map(([a, b]) => html`<button type="button" class="chip" data-say-pair="${a} ${b}">${a} · ${b}</button>`)}</div>` : ""}`;
}

function fixView(view, word) {
  const p = view.result.parts[view.open];
  const g = GRADES[p.grade];
  return html`<section class="card fix" id="fix" tabindex="-1" aria-labelledby="fix-title">
    <h2 class="label" id="fix-title">Practice the ${p.letters}</h2>
    <p>The <b>${p.letters}</b> in <b>${word}</b> ${g.was}${p.heard ? html`: it sounded like <b>${likeSound(p.heard)}</b>` : p.heard === "" ? ": it was left out" : ""}.</p>
    ${p.unsure ? html`<p class="hint">${UNSURE_NOTE}</p>` : ""}
    <div id="fix-tips" aria-live="polite"></div>
    <p class="hint">Listen slowly, then say the whole word again.</p>
    <div class="row">
      ${canSpeak() ? html`<button type="button" class="btn" id="fix-slow">${raw(EAR)}Hear it slowly</button>` : ""}
      <button type="button" class="btn primary" id="close-fix" data-tour="fix-back">Back to the word</button>
    </div>
  </section>`;
}
