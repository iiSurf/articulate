// Clicks through My words and the word page in headless Chrome: adding (typed and from the suggestions), a word
// that's already there, one that isn't in the word list, typed markup, removing and undoing, the word page, and
// Practice it.
//
//   npm run check-words
//
// Runs anywhere Chrome and Node are. Exits with an error if any check fails.
import { openChrome } from "./chrome.mjs";
import { startServer } from "./serve.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = await startServer();
const c = await openChrome();
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "✓" : "✗"} ${name}${detail ? `: ${detail}` : ""}`);
try {
  await c.send("Page.enable");
  await c.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await c.send("Page.navigate", { url: `${server.url}/#/words` });
  await sleep(900);
  const note = () => c.evaluate(`document.getElementById("note")?.textContent.trim()`);
  const words = () => c.evaluate(`[...document.querySelectorAll(".word-name")].map((a) => a.textContent)`);
  const type = async (w) => {
    await c.evaluate(`(() => { const i = document.getElementById("new-word"); i.value = ${JSON.stringify(w)}; i.form.requestSubmit(); })()`);
    for (let i = 0; i < 40 && (await note()) === "Looking it up…"; i++) await sleep(150);
    await sleep(150);
  };
  check("it starts empty, with words to start from", (await words()).length === 0 && (await c.evaluate(`document.querySelectorAll("[data-add]").length`)) === 6);
  await type("  Weather ");
  check("a typed word is added, lowercase", JSON.stringify(await words()) === '["weather"]', await note());
  await c.evaluate(`document.querySelector('[data-add="three"]').click()`);
  for (let i = 0; i < 20 && !(await words()).includes("three"); i++) await sleep(150);
  check("a suggestion is added with one tap, and the newest word comes first", JSON.stringify(await words()) === '["three","weather"]');
  for (let i = 0; i < 20 && !(await c.evaluate(`!!document.querySelector(".plan-list")`)); i++) await sleep(150);
  const plan = await c.evaluate(`({ title: document.getElementById("hero-title")?.textContent, lines: [...document.querySelectorAll(".plan-list li")].map((l) => l.textContent.trim()), start: !document.getElementById("start")?.disabled })`);
  check("Home offers five minutes of practice on the newest word's sound, with Start", plan.title === "5 minutes" && plan.start && plan.lines.at(-1) === "Say three, thank, and thin" && plan.lines.some((l) => l === "See how to make the th"), JSON.stringify(plan));
  await type("weather");
  check("a word that's already there says so", (await note()).includes("already"), await note());
  await type("zzqxv");
  check("a word that isn't in the word list says so", (await note()).includes("isn't in our word list"), await note());
  await type("<img src=x onerror=alert(1)>");
  check("typed markup stays text", !(await c.evaluate(`!!document.querySelector("#note img, .tiles-w img")`)) && (await words()).length === 2, await note());
  const openWord = async (w) => {
    await c.evaluate(`document.querySelector('a.wtile[href="#/words/${w}"]').click()`);
    for (let i = 0; i < 30 && !(await c.evaluate(`!!document.querySelector(".big-word")`)); i++) await sleep(150);
  };
  await openWord("weather");
  await c.evaluate(`document.getElementById("remove").click()`); await sleep(400);
  check("removing a word on its page takes it off and goes Home", JSON.stringify(await words()) === '["three"]' && (await c.evaluate("location.hash")) === "#/words", await note());
  await c.evaluate(`document.getElementById("undo").click()`); await sleep(200);
  check("undo puts it back where it was", JSON.stringify(await words()) === '["three","weather"]', await note());
  await openWord("weather");
  const page = await c.evaluate(`({ parts: [...document.querySelectorAll(".big-word span")].map((s) => s.textContent + (s.classList.contains("strong") ? "*" : "") + (s.classList.contains("silent") ? "~" : "")).join("|"), note: document.querySelector(".strong-note")?.textContent, text: document.querySelector("main").innerText })`);
  check("the word page shows its parts, with the strong one marked and named", page.parts === "w|ea*|th|er" && page.note === "Say the ea strongest", JSON.stringify(page.parts + " " + page.note));
  check("the learner never sees sound symbols on the word page", !/[ɪɛæɑəʊɝðθŋʃʧʤɹɾ]/.test(page.text));
  const how = await c.evaluate(`(() => { const d = document.querySelector(".how-card"); if (!d) return null; d.open = true; return { title: d.querySelector("summary b").textContent, picture: !!d.querySelector(".mouth-panel [data-mouth-fig] svg"), round: d.querySelector('a[href^="#/round/"]')?.getAttribute("href") }; })()`);
  check("How to make it explains the th of weather, with the picture and a round", how?.title === "How to make th" && how.picture && how.round === "#/round/DH", JSON.stringify(how));
  const moved = await c.evaluate(`(async () => { const seen = new Set(), end = performance.now() + 6200; while (performance.now() < end) { const l = document.querySelector(".how-card [data-mouth-fig] svg")?.getAttribute("aria-label") ?? ""; seen.add(/^Moving/.test(l) ? "moving" : /^Side view: Ukrainian/.test(l) ? "з" : "th"); await new Promise((r) => setTimeout(r, 60)); } return [...seen].sort(); })()`);
  check("once the card is open, its picture moves by itself, from з to th", JSON.stringify(moved) === '["moving","th","з"]', JSON.stringify(moved));
  check("Same sound offers words with that th to hear", (await c.evaluate(`[...document.querySelectorAll("[data-say]")].map((b) => b.dataset.say)`)).includes("this"));
  await c.evaluate(`document.getElementById("practice").click()`); await sleep(300);
  const saved = JSON.parse(await c.evaluate(`localStorage.getItem("articulate.v1")`));
  check("Say it opens Speak with the word", (await c.evaluate("location.hash")) === "#/practice/speak" && saved.current === "weather", JSON.stringify({ hash: await c.evaluate("location.hash"), current: saved.current }));
  await c.send("Page.navigate", { url: `${server.url}/#/words/write` });
  for (let i = 0; i < 30 && !(await c.evaluate(`!!document.querySelector(".big-word")`)); i++) await sleep(150);
  check("silent letters are shown as silent", (await c.evaluate(`[...document.querySelectorAll(".big-word .silent")].map((s) => s.textContent).join()`)) === "e");
  await c.send("Page.reload"); await sleep(900);
  const after = JSON.parse(await c.evaluate(`localStorage.getItem("articulate.v1")`));
  check("the words are still there after a reload", JSON.stringify(after.words.map((w) => w.text)) === '["weather","three"]');
  await c.send("Page.navigate", { url: `${server.url}/#/words` }); await sleep(900);
  await c.evaluate(`document.querySelector('[data-quiet="quiet"]').click()`); await sleep(200);
  await sleep(500);
  const quiet = await c.evaluate(`({ mode: JSON.parse(localStorage.getItem("articulate.v1")).mode, lines: [...document.querySelectorAll(".plan-list li")].map((l) => l.textContent.trim()), read: !!document.querySelector('.hero a[href="#/practice/read"]') })`);
  check("Quiet makes the practice listening and looking only, offers the puzzles, and is remembered", quiet.mode === "listen" && quiet.read && quiet.lines.length === 2 && !quiet.lines.some((l) => l.startsWith("Say")), JSON.stringify(quiet));
  await c.evaluate(`document.querySelector('[data-quiet="loud"]').click()`); await sleep(500);
  check("Out loud puts saying back in", (await c.evaluate(`[...document.querySelectorAll(".plan-list li")].some((l) => l.textContent.trim().startsWith("Say"))`)) && JSON.parse(await c.evaluate(`localStorage.getItem("articulate.v1")`)).mode === "speak");
} finally {
  await c.close();
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
