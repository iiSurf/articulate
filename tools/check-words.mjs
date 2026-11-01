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
  check("a suggestion is added with one tap", JSON.stringify(await words()) === '["weather","three"]');
  await type("weather");
  check("a word that's already there says so", (await note()).includes("already"), await note());
  await type("zzqxv");
  check("a word that isn't in the word list says so", (await note()).includes("isn't in our word list"), await note());
  await type("<img src=x onerror=alert(1)>");
  check("typed markup stays text", !(await c.evaluate(`!!document.querySelector("#note img, .word-list img")`)) && (await words()).length === 2, await note());
  await c.evaluate(`document.querySelector('[data-remove="weather"]').click()`); await sleep(200);
  check("removing a word takes it off", JSON.stringify(await words()) === '["three"]', await note());
  await c.evaluate(`document.getElementById("undo").click()`); await sleep(200);
  check("undo puts it back where it was", JSON.stringify(await words()) === '["weather","three"]', await note());
  await c.evaluate(`document.querySelector('.word-name').click()`);
  for (let i = 0; i < 30 && !(await c.evaluate(`!!document.querySelector(".big-word")`)); i++) await sleep(150);
  const page = await c.evaluate(`({ parts: [...document.querySelectorAll(".big-word span")].map((s) => s.textContent + (s.classList.contains("strong") ? "*" : "") + (s.classList.contains("silent") ? "~" : "")).join("|"), sounds: document.querySelector(".sounds .ipa")?.textContent })`);
  check("the word page shows its parts, with the strong one marked", page.parts === "w|ea*|th|er" && page.sounds === "w ɛ ð ɝ", JSON.stringify(page));
  await c.evaluate(`document.getElementById("practice").click()`); await sleep(300);
  const saved = JSON.parse(await c.evaluate(`localStorage.getItem("articulate.v1")`));
  check("Practice it opens Speak with the word", (await c.evaluate("location.hash")) === "#/practice/speak" && saved.current === "weather", JSON.stringify({ hash: await c.evaluate("location.hash"), current: saved.current }));
  await c.send("Page.navigate", { url: `${server.url}/#/words/write` });
  for (let i = 0; i < 30 && !(await c.evaluate(`!!document.querySelector(".big-word")`)); i++) await sleep(150);
  check("silent letters are shown as silent", (await c.evaluate(`[...document.querySelectorAll(".big-word .silent")].map((s) => s.textContent).join()`)) === "e");
  await c.send("Page.reload"); await sleep(900);
  const after = JSON.parse(await c.evaluate(`localStorage.getItem("articulate.v1")`));
  check("the words are still there after a reload", JSON.stringify(after.words.map((w) => w.text)) === '["weather","three"]');
} finally {
  await c.close();
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
