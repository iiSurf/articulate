// My words and the word page (iiSurf's Words part): #/words and #/words/<word>.
import { registerScreen } from "../app.js";
import { html } from "../html.js";
import { CMU_TO_MODEL } from "../score/phones.js";
import { normalizeWord } from "./cmudict.js";
import { loadDictionary, lookUpIn } from "./lookup.js";
import { canSpeak, say } from "./speech.js";

// Words to start with when they're not sure: the hard sounds for a Ukrainian speaker (docs/needs.md).
const STARTERS = ["three", "world", "very", "thirty", "weather", "think"];
const today = () => new Date().toISOString().slice(0, 10);
const ipa = (phones) => phones.map((p) => CMU_TO_MODEL[p.replace(/\d/g, "")]).join(" ");

registerScreen("words", {
  render(container, ctx) {
    if (ctx.param) wordPage(container, ctx, normalizeWord(ctx.param));
    else myWords(container, ctx);
  },
});

function myWords(container, ctx, note = "", undo = null) {
  const { words } = ctx.state;
  const starters = STARTERS.filter((w) => !words.some((x) => x.text === w));
  container.innerHTML = String(html`
    <section class="card">
      <h2 class="label">My words</h2>
      <form class="add" id="add">
        <label class="visually-hidden" for="new-word">A word to practice</label>
        <input id="new-word" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="Type a word" maxlength="40">
        <button class="btn primary">Add</button>
      </form>
      <p class="hint" id="note" aria-live="polite">${note}${undo ? html` <button type="button" class="link" id="undo">Undo</button>` : ""}</p>
      ${words.length
        ? html`<ul class="word-list">${words.map((w) => html`<li>
            <a class="word-name" href="#/words/${encodeURIComponent(w.text)}">${w.text}</a>
            <button type="button" class="btn" data-practice="${w.text}">Practice</button>
            <button type="button" class="remove" data-remove="${w.text}" aria-label="Remove ${w.text}">×</button>
          </li>`)}</ul>`
        : html`<p>You haven't added any words yet. Add a word you use often, or one people sometimes ask you to repeat.</p>`}
      ${starters.length ? html`<p class="sub">Not sure? Start with one of these:</p>
        <div class="chips">${starters.map((w) => html`<button type="button" class="chip" data-add="${w}">${w}</button>`)}</div>` : ""}
    </section>`);

  const add = async (typed) => {
    const text = normalizeWord(typed);
    if (!text) return;
    if (words.some((w) => w.text === text)) return myWords(container, ctx, `"${text}" is already in your words.`);
    container.querySelector("#note").textContent = "Looking it up…";
    let found;
    try {
      found = lookUpIn(await loadDictionary(), text);
    } catch {
      return myWords(container, ctx, "The word list didn't load. Check the connection and try again.");
    }
    if (!found) return myWords(container, ctx, `"${text}" isn't in our word list yet. Try another word.`);
    words.push({ text, added: today() });
    ctx.save();
    myWords(container, ctx, `Added "${text}".`);
  };

  container.querySelector("#add").addEventListener("submit", (e) => {
    e.preventDefault();
    add(container.querySelector("#new-word").value);
  });
  container.querySelector("#undo")?.addEventListener("click", () => {
    words.splice(Math.min(undo.at, words.length), 0, undo.word);
    if (undo.wasCurrent) ctx.state.current = undo.word.text;
    ctx.save();
    myWords(container, ctx, `"${undo.word.text}" is back.`);
  });
  container.querySelector("section").addEventListener("click", (e) => {
    const t = e.target.closest("[data-add], [data-practice], [data-remove]");
    if (!t) return;
    if (t.dataset.add) add(t.dataset.add);
    if (t.dataset.practice) practice(ctx, t.dataset.practice);
    if (t.dataset.remove) {
      const at = words.findIndex((w) => w.text === t.dataset.remove);
      const [word] = words.splice(at, 1);
      const wasCurrent = ctx.state.current === word.text;
      if (wasCurrent) ctx.state.current = null;
      ctx.save();
      myWords(container, ctx, `Removed "${word.text}".`, { word, at, wasCurrent });
    }
  });
}

function practice(ctx, word) {
  ctx.state.current = word;
  ctx.save();
  ctx.go("practice", "speak");
}

async function wordPage(container, ctx, word) {
  container.innerHTML = String(html`<a class="back-link" href="#/words">‹ My words</a><section class="card" aria-busy="true"><p>Looking it up…</p></section>`);
  let found;
  try {
    found = lookUpIn(await loadDictionary(), word);
  } catch {
    found = undefined;
  }
  const card = container.querySelector(".card");
  card.removeAttribute("aria-busy");
  if (!found) {
    card.innerHTML = String(found === null
      ? html`<p>"${word}" isn't in our word list yet.</p>`
      : html`<p>The word list didn't load. Check the connection and try again.</p>`);
    return;
  }
  const strong = found.parts[found.strong]?.letters;
  card.innerHTML = String(html`
    <h2 class="label">Your word</h2>
    <p class="big-word" aria-label="${found.word}">${found.parts.map((p, i) =>
      html`<span class="${i === found.strong ? "strong" : ""}${p.sounds.length ? "" : " silent"}">${p.letters}</span>`)}</p>
    <p class="sounds">Its sounds: <span class="ipa">${ipa(found.phones)}</span></p>
    ${strong ? html`<p class="hint">The strong part is "${strong}".</p>` : ""}
    ${found.parts.some((p) => !p.sounds.length) ? html`<p class="hint">Letters in light gray are silent.</p>` : ""}
    ${canSpeak() ? html`<div class="row">
      <button type="button" class="btn" id="hear">Hear it</button>
      <button type="button" class="btn" id="slowly">Slowly</button>
    </div>` : html`<p class="hint">This browser can't say words out loud.</p>`}
    <button type="button" class="btn primary wide" id="practice">Practice it</button>`);
  card.querySelector("#hear")?.addEventListener("click", () => say(found.word));
  card.querySelector("#slowly")?.addEventListener("click", () => say(found.word, { slow: true }));
  card.querySelector("#practice").addEventListener("click", () => {
    if (!ctx.state.words.some((w) => w.text === found.word)) ctx.state.words.push({ text: found.word, added: today() });
    practice(ctx, found.word);
  });
}
