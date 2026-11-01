// The app shell (iiSurf): the band, one screen at a time, the tabs, the looks, and Your colors.
// Each part plugs its screens in with registerScreen() (PLAN.md, "Screens, and the hooks the tour needs").
// Addresses: #/words, #/practice/read, #/practice/listen, #/practice/speak, #/progress, #/colors.
import { html, raw } from "./html.js";
import { LOOKS, byId, lookFor } from "./looks.js";
import { MODES, load, save } from "./store.js";

const state = load();
const screens = new Map();
const app = document.getElementById("app");
const phoneDark = matchMedia("(prefers-color-scheme: dark)");
let started = false;

const ICONS = {
  words: '<span class="aa" aria-hidden="true">Aa</span>',
  practice: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  progress: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="3.5" y="12" width="4.5" height="9" rx="1.6"/><rect x="9.75" y="7" width="4.5" height="14" rx="1.6"/><rect x="16" y="3" width="4.5" height="18" rx="1.6"/></svg>',
};
const MODE_NAMES = { read: "Read", listen: "Listen", speak: "Speak" };

// Plug a screen in by name: "words", "read", "listen", "speak", "fix", "progress".
export function registerScreen(name, screen) {
  screens.set(name, screen);
  if (started) show();
}

// What every screen gets from the rest of the app. More arrives as the parts are built (PLAN.md).
function context() {
  return {
    state,
    save: () => save(state),
    go: (name, params = {}) => { location.hash = `#/${name}${params.word ? `/${encodeURIComponent(params.word)}` : ""}`; },
    tour: { did() {} },
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
  return { page: ["words", "practice", "progress", "colors"].includes(page) ? page : "words", sub: decodeURIComponent(sub) };
}

function show() {
  started = true;
  const look = applyLook();
  const { page, sub } = where();
  const tab = page === "colors" ? "" : page;
  const tabLink = (id) => (id === "practice" ? `#/practice/${state.mode}` : `#/${id}`);
  app.innerHTML = String(html`
    <header class="band">
      <div class="band-in">
        ${page === "colors"
          ? html`<a class="back" href="#/words" aria-label="Back">‹</a><h1 class="brand">Your colors</h1>`
          : html`<h1 class="brand">Articulate</h1><a class="pair" href="#/colors" aria-label="Your language and colors: Ukrainian to English">UA → EN</a>`}
      </div>
      ${raw(look.art())}
    </header>
    <main class="main" id="main"></main>
    <nav class="tabs" aria-label="Main">
      ${["words", "practice", "progress"].map((id) => html`<a href="${tabLink(id)}" class="${id === tab ? "on" : ""}"
        ${id === tab ? raw('aria-current="page"') : ""}>${raw(ICONS[id])}<span>${id[0].toUpperCase() + id.slice(1)}</span></a>`)}
    </nav>`);
  const main = document.getElementById("main");
  if (page === "colors") yourColors(main);
  else if (page === "practice") practice(main, sub);
  else screen(main, page);
}

// A plugged-in screen, or a plain note while it's being built.
function screen(container, name, title = name) {
  const s = screens.get(name);
  if (s) s.render(container, context());
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
    </section>`);
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

phoneDark.addEventListener("change", show);
window.addEventListener("hashchange", show);
show();
