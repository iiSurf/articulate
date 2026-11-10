// The app shell (iiSurf): the band, one screen at a time, the tabs, the looks, and Your colors.
// Each part plugs its screens in with registerScreen() (PLAN.md, "Screens, and the hooks the tour needs").
// Addresses: #/words, #/practice/read, #/practice/listen, #/practice/speak, #/progress, #/round/<sound>, #/hear/<sound>, #/session, #/sound/<sound>, #/colors.
import { html, raw } from "./html.js";
import { LOOKS, byId, lookFor } from "./looks.js";
import { MODES, load, save } from "./store.js";
import { lookUp } from "./words/lookup.js";
import { createTour } from "./tour-ui.js";
import { tipFor } from "./tour.js";
import { milestone, recordTry } from "./progress.js";
import { installMouth } from "./ui/mouthui.js";
import { openModelDialog, toast } from "./ui/modeldialog.js";

const state = load();
const screens = new Map();
const app = document.getElementById("app");
const phoneDark = matchMedia("(prefers-color-scheme: dark)");
let started = false;
let askedAboutModel = false; // the download window opens at most once per visit
const tour = createTour({ state, save: () => save(state), go: (hash) => { location.hash = hash; }, app });

const ICONS = {
  words: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7v9a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" fill="currentColor"/></svg>',
  practice: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  progress: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="3.5" y="12" width="4.5" height="9" rx="1.6"/><rect x="9.75" y="7" width="4.5" height="14" rx="1.6"/><rect x="16" y="3" width="4.5" height="18" rx="1.6"/></svg>',
};
const MODE_NAMES = { read: "Read", listen: "Listen", speak: "Speak" };

// Plug a screen in by name: "words", "read", "listen", "speak", "fix", "progress".
// Redraws only if that screen is the one showing, and at most once for several screens plugged in together,
// so a screen being used (a recording, typed text) isn't wiped.
let redraw = null;
export function registerScreen(name, screen) {
  screens.set(name, screen);
  if (started && name === showing() && !redraw) redraw = queueMicrotask(() => { redraw = null; show(); }) ?? true;
}

// The name of the screen in the address: "words", "read", "listen", "speak", "progress", or "colors".
function showing() {
  const { page, sub } = where();
  return page === "practice" ? (MODES.includes(sub) ? sub : state.mode) : page;
}

// What every screen gets from the rest of the app (PLAN.md, "Screens, and the hooks the tour needs").
// The scoring code and its engine load only when a screen first scores or loads the model.
function context(param = "") {
  return {
    state,
    param, // what follows the screen's name in the address: the word, in #/words/weather
    word: state.current, // the word being practiced, picked in My words
    save: () => save(state),
    lookUp, // lookUp(word) → its sounds, the letters for each, its stress, and its strong part (js/words/lookup.js)
    // score(recording, word, { onProgress }) → each part's letters with a grade (js/score/score.js, scoreRecording)
    score: async (recording, word, options = {}) => {
      const [{ scoreRecording }, { loadModel }] = await Promise.all([import("./score/score.js"), import("./score/model.js")]);
      const result = await scoreRecording(recording, word, { lookUp, loadModel, ...options });
      // Every graded try is remembered (js/progress.js) for the boards on Progress. It stays on this phone.
      const before = [...(state.history[result.word] ?? [])];
      if (recordTry(state, result)) {
        save(state);
        const cheer = milestone(result.word, before, state.history[result.word] ?? []);
        if (cheer) toast(cheer); // a word coming out good for the first time, or improving
      }
      return result;
    },
    // The sound model: saved() says whether it's already here ("local", "saved", or null), load() gets it ready.
    model: {
      saved: async () => (await import("./score/source.js")).modelSaved(),
      load: async (options) => (await import("./score/model.js")).loadModel(options),
      partial: async () => (await import("./score/source.js")).partialDownload(), // { done, total } kept from an interrupted download, or null
    },
    // tips(part, word): the tip for Fix this part. part is one of score()'s parts. Gives { title, uk, tip, swap, words, pairs },
    // or null when there's nothing to say (js/words/tips.js, data/tips/uk-en.json)
    // Each tip also brings its picture: how to make the sound, from the Ukrainian one, and what they said (js/words/mouth.js).
    tips: async (part, word) => {
      const [t, m] = await Promise.all([import("./words/tips.js"), import("./words/mouth.js")]);
      const data = await t.loadTips();
      const tip = t.fixTip(data, part, word);
      if (tip) tip.picture = m.panel(data, tip.sound, { said: part?.heard, withTip: false, heading: false });
      return tip;
    },
    go: (name, param = "") => { location.hash = `#/${name}${param ? `/${encodeURIComponent(param)}` : ""}`; },
    tour: { did: (event) => tour.did(event) }, // the first visit moves on when a screen says what happened
    lookArt: () => byId(lookFor(state.looks, phoneDark.matches)).art(), // the look's stripe, for Home's banner
  };
}

function applyLook() {
  const look = byId(lookFor(state.looks, phoneDark.matches));
  const root = document.documentElement;
  root.dataset.look = look.id;
  root.classList.toggle("dark", !!look.dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", look.band);
  return look;
}

function where() {
  const [page = "words", sub = ""] = location.hash.replace(/^#\/?/, "").split("/");
  return { page: ["words", "practice", "progress", "round", "hear", "session", "sound", "colors"].includes(page) ? page : "words", sub: decode(sub) };
}

// A stray % (#/words/50%) would make decodeURIComponent throw and leave a blank app.
export function decode(text) {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function show() {
  started = true;
  const look = applyLook();
  const { page, sub } = where();
  // Two tabs: Home (your words, and the ways to practice) and Progress. Practice and a word's page belong to Home.
  const tab = page === "colors" ? "" : page === "round" || page === "hear" ? "progress" : page === "practice" || page === "session" || page === "sound" ? "words" : page;
  const home = page === "words" && !sub; // Home draws its own blue banner, joined to the band
  // Opening Practice from an address picks its way too, so the tip is for that way, not the last one used.
  const tipId = tipFor(page, page === "practice" && MODES.includes(sub) ? sub : state.mode, sub);
  const tabLink = (id) => (id === "practice" ? `#/practice/${state.mode}` : `#/${id}`);
  app.innerHTML = String(html`
    <header class="band${home ? " home" : ""}">
      <div class="band-in">
        ${["colors", "round", "hear", "session", "sound"].includes(page)
          ? html`<a class="back" href="${page === "round" || page === "hear" ? "#/progress" : "#/words"}" aria-label="${page === "session" ? "Stop and go Home" : "Back"}">${page === "session" ? "×" : "‹"}</a><h1 class="brand">${{ round: "Say it round", hear: "Which did you hear?", session: "Five minutes", sound: "How to make it", colors: "Your colors" }[page]}</h1>`
          : html`<h1 class="brand">Articulate</h1><a class="pair" href="#/colors" aria-label="Your language and colors: Ukrainian to English">UA → EN</a>`}
        ${tipId ? html`<button type="button" class="help" id="help" aria-label="Help for this screen">?</button>` : ""}
      </div>
      ${home ? "" : raw(look.art())}
    </header>
    <main class="main${home ? " home" : ""}" id="main"></main>
    <nav class="tabs" aria-label="Main">
      ${["words", "progress"].map((id) => html`<a href="${tabLink(id)}" class="${id === tab ? "on" : ""}"
        ${id === tab ? raw('aria-current="page"') : ""}>${raw(ICONS[id])}<span>${{ words: "Home", progress: "Progress" }[id]}</span></a>`)}
    </nav>`);
  const main = document.getElementById("main");
  if (page === "colors") yourColors(main);
  else if (page === "practice") practice(main, sub);
  else screen(main, page, page, sub);
  tour.tip(main, tipId, page === "practice" ? main.querySelector(".modes") : null);
  document.getElementById("help")?.addEventListener("click", () => {
    state.tipsSeen = state.tipsSeen.filter((t) => t !== tipId); // bring this screen's tip back
    save(state);
    show();
  });
  tour.refresh(true);
  if (page === "practice" && state.mode === "speak") askAboutModel();
}

// Reaching Speak without the sound model: a closeable window explains the one-time download and lets them choose.
function askAboutModel() {
  if (askedAboutModel) return;
  Promise.all([context().model.saved(), context().model.partial()]).then(([where, partial]) => {
    const onSpeak = location.hash.replace(/^#\/?/, "").startsWith("practice/speak") || (location.hash.replace(/^#\/?/, "") === "practice" && state.mode === "speak");
    if (where || askedAboutModel || !onSpeak) return;
    askedAboutModel = true;
    openModelDialog({
      partial,
      load: (options) => context().model.load(options),
      go: (hash) => { location.hash = hash; },
      onReady: () => {
        toast("Speak is ready. You can record now.");
        dispatchEvent(new HashChangeEvent("hashchange")); // draw Speak again, now that the model is here
      },
    });
  }).catch(() => {});
}

// A plugged-in screen, or a plain note while it's being built.
function screen(container, name, title = name, param = "") {
  const s = screens.get(name);
  if (s) s.render(container, context(param));
  else container.insertAdjacentHTML("beforeend", String(html`<section class="card"><h2 class="label">${title}</h2><p>This part is being built.</p></section>`));
}

function practice(main, sub) {
  if (MODES.includes(sub) && sub !== state.mode) { state.mode = sub; save(state); }
  main.innerHTML = String(html`
    <p class="modes-label" id="modes-label">Right now I can…</p>
    <nav class="modes" aria-labelledby="modes-label">
      ${MODES.map((m) => html`<a href="#/practice/${m}" class="${m === state.mode ? "on" : ""}" ${m === state.mode ? raw('aria-current="true"') : ""}>${MODE_NAMES[m]}</a>`)}
    </nav>`);
  screen(main, state.mode, MODE_NAMES[state.mode]);
}

function yourColors(main) {
  const tile = (look, which) => {
    const on = state.looks[which] === look.id;
    return html`<button type="button" class="tile${on ? " on" : ""}" aria-pressed="${on}" data-for="${which}" data-id="${look.id}" style="--tb:${look.band};--ti:${look.bandInk}">
      <span class="mini">${raw(look.art())}<b>Aa</b></span><span class="name">${look.name}</span>${on ? raw('<span class="tick" aria-hidden="true">✓</span>') : ""}</button>`;
  };
  main.innerHTML = String(html`
    <section class="card">
      <h2 class="label">First language</h2>
      <div class="lang-row"><span class="lang-name">Ukrainian<span lang="uk">українська</span></span></div>
      <p class="hint">Your colors come from home. Ukraine has seven. More languages can come later.</p>
    </section>
    <section class="card">
      <h2 class="label">Day look</h2>
      <div class="tiles">${LOOKS.filter((l) => !l.dark).map((l) => tile(l, "day"))}</div>
    </section>
    <section class="card">
      <h2 class="label">Night look</h2>
      <div class="tiles">${LOOKS.filter((l) => l.dark).map((l) => tile(l, "night"))}</div>
      <label class="toggle"><span>Switch when my phone goes dark</span><input type="checkbox" id="follow" ${state.looks.followDark ? raw("checked") : ""}></label>
    </section>
    <section class="card">
      <h2 class="label">Help</h2>
      <p><button type="button" class="btn" id="tour-again">Show me around again</button></p>
      <p class="hint">Practice one word again, step by step.</p>
    </section>`);
  main.querySelector("#tour-again").addEventListener("click", () => tour.restart());
  main.addEventListener("click", (e) => {
    const t = e.target.closest("[data-for]");
    if (!t) return;
    state.looks[t.dataset.for] = t.dataset.id;
    save(state);
    show();
    document.querySelector(`[data-for="${t.dataset.for}"][data-id="${t.dataset.id}"]`)?.focus();
  });
  main.querySelector("#follow").addEventListener("change", (e) => {
    state.looks.followDark = e.target.checked;
    save(state);
    show();
    document.getElementById("follow")?.focus();
  });
}

// The phone switching between light and dark: change the look, and keep the screen as it is.
// Your colors shows which look is on, so it's drawn again.
phoneDark.addEventListener("change", () => (where().page === "colors" ? show() : applyLook()));
installMouth(); // the buttons on every "How to make it" picture
window.addEventListener("hashchange", show);
show();

// The Practice screens (the teammate's part) plug themselves in from js/practice/index.js, which calls
// registerScreen() for each one. Until that file exists, those screens say "This part is being built".
import("./practice/index.js").catch(() => {});

// My words and the word page (iiSurf's Words part).
import("./words/screens.js");

// The Progress tab: the boards, and where to start a Say it round.
import("./progress-screen.js");
// Say it round: five words with a hard sound, from the Progress tab.
import("./round.js");
// Which did you hear?: the quiet listening game for a sound, also from the Progress tab.
import("./hear.js");
// Five minutes (the practice Home starts) and a sound's own page.
import("./session-screen.js");
import("./sound-screen.js");
