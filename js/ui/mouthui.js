// The buttons on a "How to make it" panel (js/words/mouth.js): show the Ukrainian sound, the English one, or the
// move from one to the other. One listener for the whole page, so a panel works wherever it's drawn, even inside
// another screen's markup. Without motion (prefers-reduced-motion), the move shows the start, then the end.
// playMove(panel) also lets a screen start the move by itself, when a lesson opens with the picture.
import { stateView } from "../words/mouth.js";

let installed = false;

const press = (panel, which) => panel.querySelectorAll('[data-mouth-show="start"], [data-mouth-show="target"]')
  .forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mouthShow === which)));

// Slides the picture from the Ukrainian sound to the English one, and stops on the English one.
export function playMove(panel, { delay = 0 } = {}) {
  const fig = panel?.querySelector("[data-mouth-fig]");
  if (!fig || !panel.dataset.start) return;
  const key = panel.dataset.mouth, letter = panel.dataset.start;
  cancelAnimationFrame(Number(panel.dataset.anim || 0));
  clearTimeout(Number(panel.dataset.wait || 0));
  press(panel, "target");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fig.innerHTML = stateView(key, letter, "start");
    panel.dataset.wait = setTimeout(() => { if (fig.isConnected) fig.innerHTML = stateView(key, letter, "target"); }, 1100 + delay);
    return;
  }
  let first = null;
  const step = (now) => {
    if (!fig.isConnected) return;
    first ??= now;
    const t = Math.min(1, (now - first) / 2000);
    const k = t < 0.3 ? 0 : (t - 0.3) / 0.7; // hold the start for a moment, then move
    fig.innerHTML = t < 1 ? stateView(key, letter, k * k * (3 - 2 * k)) : stateView(key, letter, "target");
    if (t < 1) panel.dataset.anim = requestAnimationFrame(step);
  };
  fig.innerHTML = stateView(key, letter, "start");
  panel.dataset.wait = setTimeout(() => { panel.dataset.anim = requestAnimationFrame(step); }, delay);
}

export function installMouth(doc = document) {
  if (installed) return;
  installed = true;
  doc.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-mouth-show]");
    const panel = b?.closest(".mouth-panel");
    const fig = panel?.querySelector("[data-mouth-fig]");
    if (!fig) return;
    const show = b.dataset.mouthShow;
    if (show === "move") return playMove(panel);
    cancelAnimationFrame(Number(panel.dataset.anim || 0));
    clearTimeout(Number(panel.dataset.wait || 0));
    press(panel, show);
    fig.innerHTML = stateView(panel.dataset.mouth, panel.dataset.start, show);
  });
}
