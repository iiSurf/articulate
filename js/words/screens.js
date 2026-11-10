// Home and the word page (iiSurf's Words part): #/words and #/words/<word>. The redesign of November 9
// (design/redesign.html): Home is a blue banner with the word to keep going with and one big button, a switch for
// "out loud" or "quiet", the hardest sound, and your words as tiles. A word's page has everything for that word on one
// screen: hear it, say it (the big button), how to make its hardest sound (js/words/mouth.js), and words with the
// same sound. The learner never sees sound symbols.
import { registerScreen } from "../app.js";
import { html, raw } from "../html.js";
import { hardestSounds, wordStatus } from "../progress.js";
import { normalizeWord } from "./cmudict.js";
import { loadDictionary, lookUpIn } from "./lookup.js";
import { POSES, panel, sideView } from "./mouth.js";
import { canSpeak, say } from "./speech.js";
import { loadTips, soundToTeach } from "./tips.js";

// Words to start with when they're not sure: the hard sounds for a Ukrainian speaker (docs/needs.md).
const STARTERS = ["three", "world", "very", "thirty", "weather", "think"];
const today = () => new Date().toISOString().slice(0, 10);
const ICON = {
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  ear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9h4l5.5-4.5v15L7.5 15h-4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  slow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9h4l5.5-4.5v15L7.5 15h-4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  hush: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 13v4a2 2 0 0 0 2 2h1v-6H4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  puzzle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4a2.5 2.5 0 1 1 5 0h4v4a2.5 2.5 0 1 1 0 5v4H4z" fill="currentColor"/></svg>',
  chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
};
// Just the mouth, for a small picture in a row.
const thumb = (key, label = "") => (POSES[key] ? sideView({ ...POSES[key], air: null, voice: false }, { crop: "40 86 170 128", label }) : "");
let names = null; // the tips file, for the names of sounds ("th"), once loaded
const nameOf = (key) => names?.sounds?.[key]?.title.split(" as in ")[0] ?? null;
const sentence = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
let pending = null; // a note (and undo) to show on Home the next time it's drawn, after a word is removed on its page

registerScreen("words", {
  render(container, ctx) {
    if (ctx.param) wordPage(container, ctx, normalizeWord(ctx.param));
    else {
      const p = pending;
      pending = null;
      loadTips().catch(() => null).then((tips) => {
        names = tips;
        if (container.isConnected) home(container, ctx, p?.note ?? "", p?.undo ?? null);
      });
    }
  },
});

// ---- Home ------------------------------------------------------------------------------------------------------
function home(container, ctx, note = "", undo = null) {
  const { words } = ctx.state;
  const quiet = ctx.state.mode !== "speak";
  const word = ctx.state.current && words.some((w) => w.text === ctx.state.current) ? ctx.state.current : words.at(-1)?.text ?? null;
  const status = word ? wordStatus(ctx.state, word) : null;
  const hard = hardestSounds(ctx.state, 1)[0] ?? null;
  const starters = STARTERS.filter((w) => !words.some((x) => x.text === w));
  const sub = !word ? "A word you use often, or one people ask you to repeat."
    : !status ? "You haven't said it yet."
    : status.spot ? html`Last time, the <b>${status.spot.letters}</b> ${status.spot.grade === "red" ? "needed work" : "was a little off"}.`
    : `Last time: ${status.recent} out of 100.`;
  const tip = container.querySelector(":scope > .tip"); // the one-time tip the shell put here (js/tour-ui.js), kept on a redraw
  container.innerHTML = String(html`
    <section class="hero" aria-labelledby="hero-word">
      <div class="hero-in">
        <div class="hero-top">
          <span class="hero-hello" lang="uk">Привіт!</span>
          <div class="quiet" role="group" aria-label="How you can practice right now">
            <button type="button" data-quiet="loud" aria-pressed="${!quiet}">${raw(ICON.mic)}Out loud</button>
            <button type="button" data-quiet="quiet" aria-pressed="${quiet}">${raw(ICON.hush)}Quiet</button>
          </div>
        </div>
        <div class="hero-main">
        <div class="hero-text">
        <p class="hero-kicker">${word ? "Keep going with" : "Start here"}</p>
        ${word ? html`<a class="hero-word" id="hero-word" href="#/words/${encodeURIComponent(word)}">${word}</a>` : html`<p class="hero-word" id="hero-word">Add a word</p>`}
        <p class="hero-sub">${sub}</p>
        </div>
        ${!word ? "" : quiet
          ? html`<div class="hero-actions">
              <a class="btn primary" href="#/practice/listen">${raw(ICON.ear)}Listen</a>
              <a class="btn on-band" href="#/practice/read">${raw(ICON.puzzle)}Puzzles</a>
            </div>`
          : html`<button type="button" class="mic-btn on-hero" id="say-now" aria-label="Say ${word}">${raw(ICON.mic)}<span class="mic-label">Say it</span></button>`}
        </div>
      </div>
      ${raw(ctx.lookArt?.() ?? "")}
    </section>
    <div class="home-body">
    ${hard && POSES[hard.sound] && nameOf(hard.sound) ? html`<a class="card row-card" href="#/round/${hard.sound}">
      <span class="row-thumb">${raw(thumb(hard.sound))}</span>
      <span class="rc-text"><b>Hardest sound: ${nameOf(hard.sound)}</b><span>${hard.misses} ${hard.misses === 1 ? "miss" : "misses"} · in ${hard.words.slice(0, 2).join(", ")}</span></span>
      <span class="rc-go">Practice ${raw(ICON.chev)}</span>
    </a>` : ""}
    <section class="words-sec" aria-labelledby="your-words">
      <h2 class="label" id="your-words">Your words</h2>
      <form class="add" id="add">
        <label class="visually-hidden" for="new-word">A word to practice</label>
        <input id="new-word" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="Type a word" maxlength="40">
        <button class="btn primary" data-tour="add">${raw(ICON.plus)}Add</button>
      </form>
      <p class="hint" id="note" aria-live="polite">${note}${undo ? html` <button type="button" class="link" id="undo">Undo</button>` : ""}</p>
      ${words.length ? html`<ul class="tiles-w">${[...words].reverse().map((w) => { const st = wordStatus(ctx.state, w.text); return html`<li>
          <a class="wtile" data-tour="word-link" href="#/words/${encodeURIComponent(w.text)}">
            <b class="word-name${w.text.length > 9 ? " long" : ""}">${w.text}</b>
            ${st ? html`<span class="meter" role="img" aria-label="${st.recent} out of 100"><i class="${st.tone}" style="width:${Math.max(6, st.recent)}%"></i></span>` : html`<span class="new">New</span>`}
          </a></li>`; })}</ul>` : ""}
      ${starters.length ? html`<p class="sub">${words.length ? "More to try:" : "Not sure? Start with one of these:"}</p>
        <div class="chips">${starters.map((w) => html`<button type="button" class="chip" data-add="${w}">${raw(ICON.plus)}${w}</button>`)}</div>` : ""}
    </section>
    </div>`);

  if (tip) container.querySelector(".home-body").prepend(tip); // below the banner

  const add = async (typed) => {
    const text = normalizeWord(typed);
    if (!text) return;
    if (words.some((w) => w.text === text)) return home(container, ctx, `"${text}" is already in your words.`);
    container.querySelector("#note").textContent = "Looking it up…";
    let found;
    try {
      found = lookUpIn(await loadDictionary(), text);
    } catch {
      return home(container, ctx, "The word list didn't load. Check the connection and try again.");
    }
    if (!found) return home(container, ctx, `"${text}" isn't in our word list yet. Try another word.`);
    words.push({ text, added: today() });
    ctx.state.current = text; // the new word is the one to keep going with
    ctx.save();
    home(container, ctx, `Added "${text}".`);
    ctx.tour.did("added");
  };

  container.querySelector("#add").addEventListener("submit", (e) => {
    e.preventDefault();
    add(container.querySelector("#new-word").value);
  });
  container.querySelector("#undo")?.addEventListener("click", () => {
    words.splice(Math.min(undo.at, words.length), 0, undo.word);
    if (undo.wasCurrent) ctx.state.current = undo.word.text;
    ctx.save();
    home(container, ctx, `"${undo.word.text}" is back.`);
  });
  container.querySelector("#say-now")?.addEventListener("click", () => practice(ctx, word));
  container.onclick = (e) => { // one handler, however many times Home is drawn
    const q = e.target.closest("[data-quiet]");
    if (q) {
      ctx.state.mode = q.dataset.quiet === "loud" ? "speak" : ctx.state.mode === "read" ? "read" : "listen";
      ctx.save();
      home(container, ctx);
      container.querySelector(`[data-quiet="${q.dataset.quiet}"]`)?.focus();
      return;
    }
    const a = e.target.closest("[data-add]");
    if (a) add(a.dataset.add);
  };
}

function practice(ctx, word) {
  ctx.state.current = word;
  ctx.save();
  ctx.tour.did("practice");
  ctx.go("practice", "speak");
}

// ---- A word's page ---------------------------------------------------------------------------------------------
async function wordPage(container, ctx, word) {
  container.onclick = null;
  container.innerHTML = String(html`<a class="back-link" href="#/words">‹ Home</a><section class="word-top" aria-busy="true"><p>Looking it up…</p></section>`);
  let found, tips = null;
  try {
    [found, tips] = await Promise.all([loadDictionary().then((d) => lookUpIn(d, word)), loadTips().catch(() => null)]);
  } catch {
    found = undefined;
  }
  if (!container.isConnected) return;
  const top = container.querySelector(".word-top");
  top.removeAttribute("aria-busy");
  if (!found) {
    top.innerHTML = String(found === null
      ? html`<p>"${word}" isn't in our word list yet.</p>`
      : html`<p>The word list didn't load. Check the connection and try again.</p>`);
    return;
  }
  const mine = ctx.state.words.some((w) => w.text === found.word);
  const strong = found.parts[found.strong]?.letters;
  const status = wordStatus(ctx.state, found.word);
  const key = tips ? soundToTeach(tips, found.phones, status?.spot?.sound) : null;
  const entry = key ? tips.sounds[key] : null;
  const name = entry?.title.split(" as in ")[0];
  const same = entry ? ["start", "middle", "end"].flatMap((s) => entry.words?.[s] ?? []).filter((w, i, all) => w !== found.word && all.indexOf(w) === i).slice(0, 6) : [];
  container.innerHTML = String(html`
    <a class="back-link" href="#/words">‹ Home</a>
    <section class="word-top">
      <h2 class="visually-hidden">${found.word}</h2>
      <p class="big-word" aria-label="${found.word}">${found.parts.map((p, i) =>
        html`<span class="${i === found.strong ? "strong" : ""}${p.sounds.length ? "" : " silent"}">${p.letters}</span>`)}</p>
      ${strong ? html`<p class="strong-note">Say the <b>${strong}</b> strongest</p>` : ""}
      ${found.parts.some((p) => !p.sounds.length) ? html`<p class="hint">Letters in light gray are silent.</p>` : ""}
      <div class="trio">
        ${canSpeak() ? html`<button type="button" class="round-btn" id="hear" data-tour="hear"><span>${raw(ICON.ear)}</span>Hear it</button>` : ""}
        <button type="button" class="mic-btn big" id="practice" data-tour="practice" aria-describedby="say-label">${raw(ICON.mic)}<span class="mic-label" id="say-label">Say it</span></button>
        ${canSpeak() ? html`<button type="button" class="round-btn" id="slowly"><span>${raw(ICON.slow)}</span>Slowly</button>` : ""}
      </div>
      ${canSpeak() ? "" : html`<p class="hint">This browser can't say words out loud.</p>`}
      ${status ? html`<p class="hint">Your last tries: ${status.recent} out of 100${status.tries > 1 ? `, over ${status.tries} tries` : ""}.</p>` : ""}
    </section>
    ${entry ? html`<details class="card how-card">
      <summary><span class="row-thumb">${raw(thumb(key))}</span><span class="rc-text"><b>How to make ${name}</b><span>${sentence(POSES[key]?.say ?? entry.title)}.</span></span><span class="chev" aria-hidden="true">${raw(ICON.chev)}</span></summary>
      ${raw(panel(tips, key, { heading: false }))}
      <p><a class="btn" href="#/round/${key}">Practice ${name}: 5 words</a></p>
    </details>` : ""}
    ${same.length ? html`<section class="card">
      <h2 class="label">Same sound${name ? `: ${name}` : ""}</h2>
      <p class="hint">Tap to hear.</p>
      <div class="chips">${same.map((w) => html`<button type="button" class="chip" data-say="${w}">${w}</button>`)}</div>
    </section>` : ""}
    ${mine ? html`<p class="remove-row"><button type="button" class="link" id="remove">Remove "${found.word}" from my words</button></p>` : ""}`);
  container.querySelector("#hear")?.addEventListener("click", () => say(found.word));
  container.querySelector("#slowly")?.addEventListener("click", () => say(found.word, { slow: true }));
  container.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => say(b.dataset.say)));
  container.querySelector("#practice").addEventListener("click", () => {
    if (!ctx.state.words.some((w) => w.text === found.word)) ctx.state.words.push({ text: found.word, added: today() });
    practice(ctx, found.word);
  });
  container.querySelector("#remove")?.addEventListener("click", () => {
    const words = ctx.state.words;
    const at = words.findIndex((w) => w.text === found.word);
    const [removed] = words.splice(at, 1);
    const wasCurrent = ctx.state.current === removed.text;
    if (wasCurrent) ctx.state.current = null;
    ctx.save();
    pending = { note: `Removed "${removed.text}".`, undo: { word: removed, at, wasCurrent } };
    ctx.go("words");
  });
}
