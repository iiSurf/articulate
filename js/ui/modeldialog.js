// The window that asks before the one-time download of the sound model (355 MB), the first time someone reaches Speak
// without it. It says what the file is, what it's for, how it's used, and what happens to their voice. It can always
// be closed ("Not now"), so Read and Listen stay open to them, and the download can be started any time later.
// Everything in it is our own text, so it goes in with raw(); nothing the learner typed is used here.
import { html, raw } from "../html.js";

const SIZE = "355 MB";

// load(options): starts the download (ctx.model.load). go(hash): opens an address. onReady(): the model is ready.
// partial: { done, total } in bytes when an earlier try was interrupted (ctx.model.partial), else null.
export function openModelDialog({ load, go, onReady, partial = null }) {
  if (document.querySelector(".model-dialog")) return null;
  const d = document.createElement("dialog");
  d.className = "model-dialog";
  d.setAttribute("aria-labelledby", "md-title");
  document.body.append(d);

  const mb = (bytes) => Math.round(bytes / 1e6);
  const percent = partial ? Math.round((100 * partial.done) / partial.total) : 0;
  const cellular = !!navigator.connection && (navigator.connection.type === "cellular" || navigator.connection.saveData === true);

  function intro() {
    d.innerHTML = String(html`
      <h2 id="md-title">A one-time download for Speak</h2>
      <p class="md-lead">${partial ? `You already have ${percent}% of it (${mb(partial.done)} MB). The rest picks up where it stopped.` : `Speak needs a helper file (${SIZE}). Read it first, then choose.`}</p>
      ${cellular ? html`<p class="md-warn" role="note">It looks like you're on mobile data. A file this big is best on Wi-Fi.</p>` : ""}
      <dl class="md-facts">
        <div><dt>What it is</dt><dd>A small listening model, ${SIZE}, like a very big photo album. You download it once, and your browser keeps it.</dd></div>
        <div><dt>What it's for</dt><dd>It hears each sound in your word, so each part can turn green, yellow, orange, or red.</dd></div>
        <div><dt>How it's used</dt><dd>It runs inside this app, on your phone. You say a word, it checks the sounds right there, and your recording is thrown away.</dd></div>
        <div class="md-private"><dt>Your privacy</dt><dd><b>Your voice never leaves your phone.</b> Nothing is sent to us or to anyone else, and your words and settings stay on your phone too. The file comes from Hugging Face, a website that hosts models. It can see that your phone asked for the file, and nothing about you or your voice.</dd></div>
      </dl>
      <p class="md-hint">No download needed for <a href="#/practice/read" data-md-go>Read</a> or <a href="#/practice/listen" data-md-go>Listen</a>. You can come back to Speak and download any time.</p>
      <div class="md-buttons">
        <button type="button" class="btn primary" id="md-download">${partial ? `Continue (${mb(partial.total - partial.done)} MB left)` : `Download (${SIZE})`}</button>
        <button type="button" class="btn" id="md-later">Not now</button>
      </div>`);
    d.querySelector("#md-download").addEventListener("click", start);
    d.querySelector("#md-later").addEventListener("click", () => d.close());
    d.querySelectorAll("[data-md-go]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); d.close(); go(a.getAttribute("href")); }));
    d.querySelector("#md-download").focus();
  }

  function downloading() {
    d.innerHTML = String(html`
      <h2 id="md-title">Downloading…</h2>
      <p class="md-lead">This happens once. You can close this window and keep using the app. It keeps going.</p>
      <p class="md-hint">If your connection drops, it tries again by itself and keeps what it already has.</p>
      <progress id="md-bar" max="1" value="0" aria-label="Download progress"></progress>
      <p class="md-percent" id="md-percent" role="status" aria-live="polite">0%</p>
      <div class="md-buttons"><button type="button" class="btn" id="md-close">Close</button></div>`);
    d.querySelector("#md-close").addEventListener("click", () => d.close());
    d.querySelector("#md-close").focus();
  }

  function failed(message) {
    d.innerHTML = String(html`
      <h2 id="md-title">The download stopped</h2>
      <p class="md-lead">${message}</p>
      <p class="md-hint">What already came through is kept, so Try again picks up where it stopped. Nothing about you or your voice was shared.</p>
      <div class="md-buttons">
        <button type="button" class="btn primary" id="md-retry">Try again</button>
        <button type="button" class="btn" id="md-later">Not now</button>
      </div>`);
    d.querySelector("#md-retry").addEventListener("click", start);
    d.querySelector("#md-later").addEventListener("click", () => d.close());
    d.querySelector("#md-retry").focus();
  }

  async function start() {
    downloading();
    try {
      await load({
        onProgress: (x) => {
          if (!d.isConnected) return;
          const bar = d.querySelector("#md-bar"), pct = d.querySelector("#md-percent");
          if (bar) bar.value = x;
          if (pct) pct.textContent = `${Math.round(x * 100)}%`;
        },
      });
    } catch (err) {
      if (d.isConnected) failed(err?.message || "Something went wrong.");
      return;
    }
    if (d.open) d.close();
    onReady();
  }

  d.addEventListener("close", () => d.remove());
  intro();
  d.showModal();
  return d;
}

// A short message at the bottom of the screen that goes away by itself.
export function toast(text) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = text;
  document.body.append(t);
  setTimeout(() => t.remove(), 6000);
}
