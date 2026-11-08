// The Progress tab (iiSurf): three personal boards (Top words, Needs work, Most improved) and the sounds that cause the
// most trouble, with a button that starts a Say it round for a sound (js/round.js). The math is in js/progress.js; this
// file only draws it. The boards rank the learner's own words against each other, and nothing leaves the phone.
// It borrows the grade marks from the teammate's js/practice/feedback.js (a plain list: ✓ ≈ ! ✕).
import { registerScreen } from "./app.js";
import { html } from "./html.js";
import { loadTips } from "./words/tips.js";
import { GRADES } from "./practice/feedback.js";
import { hardestSounds, mostImproved, needsWork, toneOf, topWords } from "./progress.js";

const BOARDS = [
  { id: "top", name: "Top words", title: "Your best words", empty: "Words you say well show up here. Say a word in Speak, and keep going: 60 out of 100 gets a word on this board." },
  { id: "needs", name: "Needs work", title: "Needs the most work", empty: "Nothing needs work right now. Nice! Say a new word in Speak and it will show up here if it's tricky." },
  { id: "better", name: "Most improved", title: "Most improved", empty: "Say a word a few times. When it gets better, it shows up here with how far it came." },
];
const TONE_MARK = Object.fromEntries(Object.values(GRADES).map((g) => [g.tone, g.mark]));
let board = "top"; // the board last looked at, kept while the app is open

registerScreen("progress", {
  render(container, ctx) {
    let tips = null;
    const draw = () => {
      container.innerHTML = String(page(ctx.state, tips));
      container.firstElementChild.addEventListener("click", (e) => {
        const b = e.target.closest("[data-board]");
        if (b) {
          board = b.dataset.board;
          draw();
          container.querySelector(`[data-board="${board}"]`).focus();
          return;
        }
        const word = e.target.closest("[data-word]");
        if (word) { ctx.state.current = word.dataset.word; ctx.save(); return; } // the link goes on to Speak
        const hard = e.target.closest("[data-round]");
        if (hard) ctx.go("round", hard.dataset.round);
      });
    };
    draw();
    // The sounds' names come from the tips file; the screen is drawn first and filled in when it arrives.
    loadTips().then((t) => { tips = t; if (container.isConnected) draw(); }).catch(() => {});
  },
});

function page(state, tips) {
  if (!Object.keys(state.history).length) {
    return html`<section class="card">
      <h2 class="label">Progress</h2>
      <p>Nothing here yet. Say a word in Speak, and this page keeps score: your best words, the ones that need work, and the ones that got better.</p>
      <div class="row"><a class="btn primary" href="#/practice/speak">Go to Speak</a></div>
    </section>`;
  }
  const b = BOARDS.find((x) => x.id === board) ?? BOARDS[0];
  const rows = b.id === "top" ? topWords(state).map((w) => row(w, w.best, "good", w.best))
    : b.id === "needs" ? needsWork(state).map((w) => row(w, w.recent, toneOf(w.recent), w.recent, spot(w.spot)))
    : mostImproved(state).map((w) => row(w, `+${w.gain}`, toneOf(w.latest), w.latest, html`<span class="hint up">${w.first} → ${w.latest}</span>`, `up ${w.gain}, from ${w.first} to ${w.latest}`));
  return html`<div class="progress">
    <div class="boards" role="group" aria-label="Boards">
      ${BOARDS.map((x) => html`<button type="button" data-board="${x.id}" class="${x.id === b.id ? "on" : ""}" aria-pressed="${x.id === b.id}">${x.name}</button>`)}
    </div>
    <section class="card">
      <h2 class="label">${b.title}</h2>
      ${rows.length ? html`<ol class="ranks">${rows}</ol><p class="how">Updates after every try. Tap a word to practice it.</p>` : html`<p>${b.empty}</p>`}
    </section>
    ${b.id === "needs" ? hardest(state, tips) : ""}
  </div>`;
}

// One line of a board. score is the big number, tone its color, fill how much of the bar is filled.
function row(w, big, tone, fill, extra = "", spoken = "") {
  return html`<li class="${tone}"><a class="rank-link" href="#/practice/speak" data-word="${w.word}">
    <span class="rank" aria-hidden="true"></span>
    <span class="mid"><span class="w">${w.word}</span>${extra}<span class="meter" aria-hidden="true"><i style="width:${Math.max(4, Math.min(100, fill))}%"></i></span></span>
    <span class="num2">${big}<small>${typeof big === "number" ? "out of 100" : ""}</small></span>
    <span class="visually-hidden">${spoken || `${w.word}, ${big} out of 100`}. Practice this word.</span>
  </a></li>`;
}

// Which part of the word went worst last time, with its mark so color isn't the only signal.
function spot(s) {
  if (!s) return "";
  const tone = s.grade === "red" ? "work" : "off";
  return html`<span class="spot ${tone}"><i aria-hidden="true">${TONE_MARK[tone]}</i>${s.letters}<span class="visually-hidden"> went ${tone === "work" ? "wrong" : "a little off"} last time</span></span>`;
}

// The sounds that went orange or red most often, with a button to practice each, the first one the main button.
function hardest(state, tips) {
  const sounds = hardestSounds(state);
  if (!sounds.length) return "";
  const top = sounds[0].misses;
  const name = (s) => tips?.sounds?.[s.sound]?.title ?? s.sound.toLowerCase();
  const short = (s) => name(s).split(" as in ")[0];
  const can = (s) => !!tips?.sounds?.[s.sound]; // a round needs the words from the tips file
  return html`<section class="card">
    <h2 class="label">Where you struggle most</h2>
    <ul class="hard">${sounds.map((s) => html`<li>
      <span class="snd">${name(s)}</span>
      <span class="bar" aria-hidden="true"><i style="width:${Math.round((100 * s.misses) / top)}%"></i></span>
      <span class="n">${s.misses} ${s.misses === 1 ? "miss" : "misses"}</span>
    </li>`)}</ul>
    ${can(sounds[0]) ? html`<div class="row"><button type="button" class="btn primary" data-round="${sounds[0].sound}">Practice ${short(sounds[0])}</button></div>
      <p class="hint">A round is five words with this sound, said out loud.</p>` : ""}
  </section>`;
}
