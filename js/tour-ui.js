// Draws the first visit (design/tutorial.html): the welcome, the step card, the ring around the next thing to tap,
// the one-time tips, and Show me around again. The steps and their words are in js/tour.js. All text here is
// written in our own code, so it goes in with raw(); nothing the learner types is ever used.
import { html, raw } from "./html.js";
import * as T from "./tour.js";

const MARKS = {
  green: ["good", '<path d="M5 12.5l4.3 4.3L19 7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'],
  yellow: ["close", '<path d="M4.5 9.5c2.4-2.2 4.6-2.2 7.5 0s5.1 2.2 7.5 0M4.5 15.5c2.4-2.2 4.6-2.2 7.5 0s5.1 2.2 7.5 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'],
  orange: ["a little off", '<path d="M12 4.5v9" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/><circle cx="12" cy="19" r="2.1" fill="currentColor"/>'],
  red: ["needs work", '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>'],
};
const TONE = { green: "good", yellow: "close", orange: "off", red: "work" };
const key = () => html`<div class="tour-key">${Object.entries(MARKS).map(([g, [name, mark]]) =>
  html`<span class="${TONE[g]}"><i><svg viewBox="0 0 24 24" aria-hidden="true">${raw(mark)}</svg></i>${name}</span>`)}</div>`;

// state: the saved settings. save(): saves them. go(hash): opens an address. app: the element the page is drawn in.
export function createTour({ state, save, go, app }) {
  let watching = null; // the observer that keeps the ring on a screen that redraws itself
  let route = { hash: "", kind: "other" };
  let drawing = 0; // which drawing of the card is current, so an old one can't put a ring back

  const changed = () => { save(); refresh(); };
  // When the tour ends, the screen is drawn again, so the tip it was holding back can show.
  const ended = () => { save(); dispatchEvent(new HashChangeEvent("hashchange")); };

  function did(event) {
    if (T.did(state.tour, event)) changed();
  }

  function restart() {
    T.begin(state.tour);
    save();
    const { hash } = T.address(1, state);
    if (location.hash === hash) refresh(); else go(hash);
  }

  // The welcome: the first thing a new learner sees.
  function welcome() {
    app.querySelector(".welcome")?.remove();
    if (!T.needsWelcome(state.tour)) return;
    app.insertAdjacentHTML("beforeend", String(html`
      <div class="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <div class="welcome-band"><span class="brand">Articulate</span></div>
        <div class="welcome-body">
          <p class="greet" lang="uk" aria-hidden="true">Привіт!</p>
          <h2 id="welcome-title">Welcome to Articulate.</h2>
          <div class="card">
            <p>Let's practice your first word together. It takes about a minute.</p>
            <ul class="bullets">
              <li><span class="ok">✓</span>Practice the words you use every day.</li>
              <li><span class="ok">✓</span>Practice anywhere, even on the bus.</li>
              <li><span class="ok">✓</span>Your voice stays on this phone.</li>
            </ul>
          </div>
          <button type="button" class="btn primary big tour-ring" id="welcome-start">Let's start</button>
          <button type="button" class="link" id="welcome-skip">Skip. I'll look around on my own.</button>
        </div>
      </div>`));
    const start = app.querySelector("#welcome-start");
    start.addEventListener("click", () => { T.begin(state.tour); save(); app.querySelector(".welcome")?.remove(); const { hash } = T.address(1, state); if (location.hash === hash) refresh(); else go(hash); });
    app.querySelector("#welcome-skip").addEventListener("click", () => { T.skip(state.tour); ended(); });
    start.focus();
  }

  // The step card above the tabs, and the ring on what to tap.
  function card() {
    app.querySelector(".coach")?.remove();
    document.querySelectorAll(".tour-ring").forEach((el) => !el.closest(".welcome") && el.classList.remove("tour-ring"));
    watching?.disconnect();
    const mine = ++drawing;
    if (!T.isActive(state.tour)) return;
    const step = state.tour.step;
    const here = T.onRoute(step, route.kind, state);
    const c = T.copy(step, route.kind);
    const finish = step === T.FINISH;
    const stepWord = finish ? "All done" : `Step ${step} of ${T.STEPS.length}`;
    const dots = html`<span class="dots" aria-hidden="true">${Array.from({ length: T.STEPS.length }, (_, i) => html`<i class="${i < Math.min(step, T.STEPS.length) ? "on" : ""}"></i>`)}</span>`;
    app.querySelector(".tabs").insertAdjacentHTML("beforebegin", String(html`
      <section class="coach" aria-label="The tour">
        <div class="step"><span>${stepWord}</span>${dots}</div>
        ${c.title ? html`<h2 class="coach-title">${c.title}</h2>` : ""}
        <div role="status" aria-live="polite">
          <p>${raw(here ? c.text : "This step happens somewhere else. I'll take you there.")}</p>
          ${here && c.key ? key() : ""}
          ${here && c.more ? html`<p>${raw(c.more)}</p>` : ""}
          ${c.list ? html`<ul>${c.list.map((t) => html`<li>${t}</li>`)}</ul>` : ""}
        </div>
        <div class="coach-foot">
          ${finish ? html`<span></span>` : html`<button type="button" class="link" id="tour-skip">Skip the tour</button>`}
          ${finish ? html`<button type="button" class="btn primary" id="tour-done">Done</button>`
            : !here ? html`<button type="button" class="btn primary" id="tour-there">Take me there</button>`
            : html`<button type="button" class="btn primary" id="tour-next" hidden>Next</button>`}
        </div>
      </section>`));
    app.querySelector("#tour-skip")?.addEventListener("click", () => { T.skip(state.tour); ended(); });
    app.querySelector("#tour-done")?.addEventListener("click", () => { T.finish(state); ended(); });
    app.querySelector("#tour-there")?.addEventListener("click", () => {
      const to = T.address(step, state);
      if (to.word) { state.current = to.word; save(); }
      if (location.hash === to.hash) { dispatchEvent(new HashChangeEvent("hashchange")); } else go(to.hash);
    });
    app.querySelector("#tour-next")?.addEventListener("click", () => { if (T.advance(state.tour)) changed(); });
    if (!here) return;
    const apply = () => {
      let found = 0;
      for (const sel of c.targets) {
        const el = app.querySelector(`#main ${sel}`);
        if (el) { el.classList.add("tour-ring"); found++; }
      }
      // Step 4 with every part green has nothing to practice, so Next appears.
      const next = app.querySelector("#tour-next");
      if (next) next.hidden = !(step === 4 && !app.querySelector('#main button[data-tour="part"]:not([data-grade="green"])') && app.querySelector('#main [data-tour="part"]'));
      return found;
    };
    apply();
    // Screens like Speak redraw themselves, so the ring is put back after each redraw.
    const main = app.querySelector("#main");
    if (main) {
      let queued = false;
      watching = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; if (mine === drawing) apply(); });
      });
      watching.observe(main, { childList: true, subtree: true });
    }
  }

  // The one-time tip for a screen, in main, unless the tour or the welcome is showing. after: put it below this.
  function tip(main, id, after = null) {
    if (!id || T.isActive(state.tour) || T.needsWelcome(state.tour) || T.tipSeen(state, id)) return;
    const el = document.createElement("section");
    el.className = "tip";
    el.setAttribute("role", "note");
    el.innerHTML = String(html`<div class="t">Tip</div><p>${raw(T.TIPS[id])}</p><button type="button" class="btn primary got">Got it</button>`);
    el.querySelector(".got").addEventListener("click", () => { state.tipsSeen.push(id); save(); el.remove(); });
    if (after) after.after(el); else main.prepend(el);
  }

  // Draws everything that depends on where the learner is. Called after every screen is drawn.
  function refresh(where = route.where) {
    if (where) route = { where, hash: location.hash, kind: T.routeKind(location.hash, state.mode) };
    const nav = app.querySelector(".tabs");
    if (nav) document.documentElement.style.setProperty("--tabs-h", `${nav.offsetHeight}px`);
    welcome();
    card();
  }

  return { did, restart, tip, refresh };
}
