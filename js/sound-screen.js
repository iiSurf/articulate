// A sound's own page (iiSurf, the redesign's phase 2, direction C): #/sound/TH. How to make it (the picture, from the
// Ukrainian sound), the two ways to practice it (say five words, or hear the difference), the learner's own words that
// have it, and more words with it to hear. Reached from Home's hardest sound, a word's page, and Progress.
import { registerScreen } from "./app.js";
import { html, raw } from "./html.js";
import { loadTips, soundKey } from "./words/tips.js";
import { canSpeak, say } from "./words/speech.js";
import { loadDictionary, lookUpIn } from "./words/lookup.js";
import { panel } from "./words/mouth.js";
import { hardestSounds, wordStatus } from "./progress.js";

const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const EAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.5 9h4l5.5-4.5v15L7.5 15h-4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

registerScreen("sound", {
  async render(root, ctx) {
    root.innerHTML = String(html`<section class="card"><p>Getting it ready…</p></section>`);
    let tips, dict = null;
    try { tips = await loadTips(); } catch { return message(root, "The word lists didn't load. Check the connection and try again."); }
    const key = ctx.param;
    const entry = tips.sounds?.[key];
    if (!entry) return message(root, "There's no page for that sound yet.");
    try { dict = await loadDictionary(); } catch { /* their words just won't be listed */ }
    if (!root.isConnected) return;
    const [name, example] = entry.title.split(" as in ");
    const misses = hardestSounds(ctx.state, 99).find((h) => h.sound === key)?.misses ?? 0;
    // Their own words that have this sound, with how each has been going.
    const mine = dict ? ctx.state.words.map((w) => w.text).filter((w) => lookUpIn(dict, w)?.phones.some((p) => soundKey(p) === key)) : [];
    const more = ["start", "middle", "end"].flatMap((s) => entry.words?.[s] ?? []).filter((w, i, all) => all.indexOf(w) === i && !mine.includes(w)).slice(0, 8);
    const pairs = (entry.pairs?.length ?? 0) > 0 && canSpeak();
    root.innerHTML = String(html`<div class="sound-page">
      <h2 class="sound-title">${name}${example ? html`<span>, as in ${example}</span>` : ""}</h2>
      ${misses ? html`<p class="hint">${misses} ${misses === 1 ? "miss" : "misses"} so far. It gets easier.</p>` : ""}
      <section class="card">${raw(panel(tips, key, { heading: false }))}</section>
      <div class="two-acts">
        <a class="act yellow" href="#/round/${key}">${raw(MIC)}<b>Say 5 words</b><span>with the ${name}</span></a>
        ${pairs ? html`<a class="act" href="#/hear/${key}">${raw(EAR)}<b>Hear the difference</b><span>no microphone</span></a>` : ""}
      </div>
      ${mine.length ? html`<section class="card">
        <h2 class="label">Your words with ${name}</h2>
        <ul class="mine">${mine.map((w) => { const st = wordStatus(ctx.state, w); return html`<li><a href="#/words/${encodeURIComponent(w)}"><b>${w}</b>
          ${st ? html`<span class="meter" role="img" aria-label="${st.recent} out of 100"><i class="${st.tone}" style="width:${Math.max(6, st.recent)}%"></i></span>` : html`<span class="new">New</span>`}</a></li>`; })}</ul>
      </section>` : ""}
      ${more.length ? html`<section class="card">
        <h2 class="label">More words with ${name}</h2>
        <p class="hint">Tap to hear.</p>
        <div class="chips">${more.map((w) => html`<button type="button" class="chip" data-say="${w}">${w}</button>`)}</div>
      </section>` : ""}
    </div>`);
    root.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => say(b.dataset.say)));
  },
});

function message(root, text) {
  root.innerHTML = String(html`<section class="card"><p>${text}</p><div class="row"><a class="btn primary" href="#/words">Back to Home</a></div></section>`);
}
