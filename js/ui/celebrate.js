// The end of a lesson (iiSurf): a celebration with confetti in the look's own colors, a fanfare, "Lesson complete!",
// and how many the learner got right and how many are still to work on, for this lesson only. Nothing is saved.
// Without motion (prefers-reduced-motion), it's the same card with no confetti and no pop.
import { html, raw } from "../html.js";
import { play } from "./sounds.js";

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/></svg>';

// right and wrong are counts for this lesson. note: one short line under the counts. Returns the overlay element.
export function celebrate({ title = "Lesson complete!", right = 0, wrong = 0, note = "", onClose = null } = {}) {
  document.querySelector(".cele")?.remove();
  const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.createElement("div");
  el.className = "cele";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "cele-title");
  const bits = motion ? Array.from({ length: 42 }, (_, i) => {
    const x = (i * 37) % 100, d = (i * 53) % 900, r = (i * 71) % 360, s = 8 + ((i * 13) % 8), c = ["a", "b", "c"][i % 3];
    return `<i class="bit ${c}" style="--x:${x}%;--d:${d}ms;--r:${r}deg;--s:${s}px"></i>`;
  }).join("") : "";
  const total = right + wrong;
  el.innerHTML = String(html`<div class="cele-bits" aria-hidden="true">${raw(bits)}</div>
    <div class="cele-card">
      <span class="cele-badge">${raw(STAR)}</span>
      <h2 id="cele-title">${title}</h2>
      ${total ? html`<p class="cele-sub">${right === total ? "Every one right. Clean finish!" : right >= total / 2 ? "Well done. Keep going!" : "You made it to the end. That's how it gets easier."}</p>` : ""}
      <div class="cele-counts">
        <span class="cc right"><b>${right}</b> right</span>
        <span class="cc wrong"><b>${wrong}</b> to work on</span>
      </div>
      ${note ? html`<p class="cele-note">${note}</p>` : ""}
      <button type="button" class="btn primary wide" id="cele-go">Continue</button>
    </div>`);
  document.body.append(el);
  if (motion) requestAnimationFrame(() => el.classList.add("go"));
  play("cheer");
  const close = () => { el.remove(); document.removeEventListener("keydown", esc); onClose?.(); };
  const esc = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", esc);
  el.querySelector("#cele-go").addEventListener("click", close);
  el.querySelector("#cele-go").focus();
  return el;
}
