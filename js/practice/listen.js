// Listen (the teammate's Practice part): the phone says one word, and the learner taps which of two it was
// (sheep or ship). Headphones, no speaking. It uses the phone's own American voice until voice clips exist.
import { html, raw } from "../html.js";
import { say, canSpeak } from "../words/speech.js";
import { listenRound } from "./puzzles.js";

const EAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9h4l5.5-4.5v15L7.5 15h-4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

export const listen = {
  render(container, ctx) {
    const root = document.createElement("div");
    root.className = "practice listen";
    container.append(root);

    if (!canSpeak()) {
      root.innerHTML = String(html`<section class="card">
        <h2 class="label">Listen</h2>
        <p>This browser can't say words out loud, so Listen can't play anything here.</p>
        <p class="hint">Try Chrome on your phone, or practice with <a href="#/practice/read">Read</a> for now.</p>
      </section>`);
      return;
    }

    const own = ctx.state.words.map((w) => w.text);
    const tally = { right: 0, tries: 0 };
    let round = listenRound(own);
    let answer = null;
    let played = false;

    function draw() {
      const done = answer !== null;
      const right = done && answer === round.target;
      root.innerHTML = String(html`<section class="card listen-card" aria-labelledby="listen-q">
        <h2 class="label" id="listen-q">Which word did you hear?</h2>
        <p class="hint">Listen for the ${round.sound}. Headphones help.</p>
        <button type="button" class="btn primary wide" id="play" data-tour="listen-play">${raw(EAR)}${played ? "Play it again" : "Play the word"}</button>
        <div class="choices" role="group" aria-label="Your answer">
          ${round.words.map((w) => html`<button type="button" class="choice${done && w === round.target ? " is-target" : ""}${done && w === answer && !right ? " is-wrong" : ""}" data-word="${w}" ${!played || done ? raw("disabled") : ""}>${w}</button>`)}
        </div>
        <div class="feedback" role="status" aria-live="polite">${done ? html`
          <p class="headline">${right ? "Yes! " : ""}The word was <b>“${round.target}”</b>.</p>
          <p class="hint">${round.tip}</p>
          <div class="row">${round.words.map((w) => html`<button type="button" class="btn" data-hear="${w}">${raw(EAR)}${w}</button>`)}</div>
          <button type="button" class="btn primary wide" id="next">Next word</button>` : !played ? html`<p class="hint">Tap Play, listen, then pick a word.</p>` : ""}
        </div>
        ${tally.tries ? html`<p class="tally hint">${tally.right} of ${tally.tries} right this time</p>` : ""}
      </section>`);

      root.querySelector("#play").addEventListener("click", async () => {
        const first = !played;
        played = true;
        if (first) draw();
        await say(round.target);
        if (first) root.querySelector(".choice")?.focus();
      });
      root.querySelectorAll("[data-word]").forEach((b) => b.addEventListener("click", () => {
        answer = b.dataset.word;
        tally.tries++;
        if (answer === round.target) tally.right++;
        draw();
        root.querySelector("#next")?.focus();
      }));
      root.querySelectorAll("[data-hear]").forEach((b) => b.addEventListener("click", () => say(b.dataset.hear)));
      root.querySelector("#next")?.addEventListener("click", () => {
        const last = round.words.join();
        do round = listenRound(own); while (round.words.slice().sort().join() === last.split(",").sort().join() && Math.random() < 0.9);
        answer = null;
        played = false;
        draw();
        root.querySelector("#play").focus();
      });
    }
    draw();
  },
};
