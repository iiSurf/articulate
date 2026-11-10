// The "How to make it" pictures move by themselves (js/words/mouth.js): wherever a picture is on screen, it shows the
// Ukrainian sound, slides to the English one, holds it, slides back, and starts again, with no button to press. A
// label over the picture lights up which sound is showing. Only pictures on screen move (an IntersectionObserver),
// so nothing runs out of sight. A small pause button stops it (moving content must be stoppable).
//
// The move is the lesson itself, not decoration, so it keeps moving when the phone asks for less motion (that is the
// exception the accessibility guidelines make for essential motion). Decorative motion (confetti, the springy
// presses) still follows the phone's setting.
import { stateView } from "../words/mouth.js";

// One loop: hold the Ukrainian sound, slide to the English one, hold it, slide back. Milliseconds.
export const LOOP = { start: 1000, move: 1600, end: 2200, back: 900 };
const TOTAL = LOOP.start + LOOP.move + LOOP.end + LOOP.back;
const ease = (x) => x * x * (3 - 2 * x);

// Where in the loop a time falls: k (0 the Ukrainian sound, 1 the English one) and which label is lit.
export function loopAt(ms) {
  const t = ((ms % TOTAL) + TOTAL) % TOTAL;
  if (t < LOOP.start) return { k: 0, phase: "from" };
  if (t < LOOP.start + LOOP.move) return { k: ease((t - LOOP.start) / LOOP.move), phase: "move" };
  if (t < LOOP.start + LOOP.move + LOOP.end) return { k: 1, phase: "to" };
  return { k: 1 - ease((t - LOOP.start - LOOP.move - LOOP.end) / LOOP.back), phase: "move" };
}

const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
const running = new Map(); // panel -> { raf, first, last }

function draw(panel, k, phase) {
  const fig = panel.querySelector("[data-mouth-fig]");
  if (!fig) return;
  const state = k <= 0 ? "start" : k >= 1 ? "target" : k;
  fig.innerHTML = stateView(panel.dataset.mouth, panel.dataset.start, state);
  panel.dataset.phase = phase;
}

function start(panel) {
  if (running.has(panel) || panel.dataset.paused === "true" || !panel.dataset.start) return;
  const run = { raf: 0, first: null, last: null };
  running.set(panel, run);
  const step = (now) => {
    if (!panel.isConnected) return stop(panel);
    run.first ??= now;
    const { k, phase } = loopAt(now - run.first);
    const key = `${phase}:${Math.round(k * 200)}`;
    if (key !== run.last) { draw(panel, k, phase); run.last = key; } // the holds draw once
    run.raf = requestAnimationFrame(step);
  };
  run.raf = requestAnimationFrame(step);
}

function stop(panel, { settle = false } = {}) {
  const run = running.get(panel);
  if (run) cancelAnimationFrame(run.raf);
  running.delete(panel);
  if (settle && panel.isConnected) draw(panel, 1, "to");
}

let seen = null;
function watch(panel) {
  if (!panel.dataset.start || panel.dataset.watched) return;
  panel.dataset.watched = "1";
  if (seen) seen.observe(panel);
  else start(panel);
}

let installed = false;
export function installMouth(doc = document) {
  if (installed) return;
  installed = true;
  if (typeof IntersectionObserver !== "undefined") {
    seen = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? start(e.target) : stop(e.target);
    }, { threshold: 0.15 });
  }
  // Pictures appear whenever a screen draws one: watch for them.
  new MutationObserver((changes) => {
    for (const c of changes) for (const n of c.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches?.(".mouth-panel")) watch(n);
      n.querySelectorAll?.(".mouth-panel").forEach(watch);
    }
  }).observe(doc.body, { childList: true, subtree: true });
  doc.querySelectorAll(".mouth-panel").forEach(watch);
  // The pause button.
  doc.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-mouth-pause]");
    const panel = b?.closest(".mouth-panel");
    if (!panel) return;
    const pause = panel.dataset.paused !== "true";
    panel.dataset.paused = String(pause);
    b.setAttribute("aria-pressed", String(pause));
    b.setAttribute("aria-label", pause ? "Play the moving picture" : "Pause the moving picture");
    b.innerHTML = pause ? PLAY : PAUSE;
    if (pause) stop(panel, { settle: true });
    else start(panel);
  });
}

