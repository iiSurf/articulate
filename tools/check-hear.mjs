// Checks Which did you hear? in headless Chrome. The phone's voice is a stand-in that records which word it was asked
// to say, so the check knows the right answer. No model or microphone needed. Takes pictures in .tmp/shots/.
//
//   npm run check-hear
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openChrome } from "./chrome.mjs";
import { startServer } from "./serve.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(repo, ".tmp", "shots");
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : `: ${detail}`}`);

const stub = `(() => {
  window.__said = [];
  const speak = (u) => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); };
  Object.defineProperty(window, "speechSynthesis", { value: { speak, cancel() {}, getVoices: () => [] }, configurable: true });
})()`;
const history = {
  tin: [{ at: "2026-11-08T09:00:00.000Z", score: 30, bad: [["TH", "red", "th"]] }, { at: "2026-11-08T09:05:00.000Z", score: 30, bad: [["TH", "red", "th"]] }],
  about: [{ at: "2026-11-08T09:00:00.000Z", score: 30, bad: [["AH0", "red", "a"]] }],
};
const saved = (h = history) => JSON.stringify({ tour: { step: 0, done: true }, tipsSeen: ["speak", "words", "read", "listen", "progress"], history: h });

const server = await startServer();
const chrome = await openChrome();
const text = (sel) => chrome.evaluate(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, " ").trim() ?? null`);
const said = () => chrome.evaluate("window.__said");
const shot = async (name) => writeFileSync(join(out, `${name}.png`), Buffer.from((await chrome.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
const size = (width) => chrome.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });
const choices = () => chrome.evaluate(`[...document.querySelectorAll("[data-choice]")].map((b) => b.dataset.choice)`);
const click = async (sel) => { await chrome.evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(120); };
try {
  await chrome.send("Page.enable");
  await chrome.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  await chrome.send("Page.addScriptToEvaluateOnNewDocument", { source: stub });
  await size(390);
  await chrome.send("Page.navigate", { url: `${server.url}/` });
  await sleep(800);
  await chrome.evaluate(`localStorage.setItem("articulate.v1", ${JSON.stringify(saved())}); location.hash = "#/progress"`);
  await chrome.send("Page.reload");
  await sleep(900);

  await click('[data-board="needs"]');
  check("Needs work offers Hear the difference for th, next to Practice th", /Hear the difference/.test((await text("section:last-of-type")) ?? "") && !!(await chrome.evaluate(`document.querySelector("[data-round]")`)));
  await click("[data-hear]");
  check("it opens the game for the th", (await chrome.evaluate("location.hash")) === "#/hear/TH");
  await sleep(300);
  check("the band says Which did you hear?, with a way back, and Progress stays lit", (await text(".band .brand")) === "Which did you hear?" && (await chrome.evaluate(`document.querySelector(".band .back")?.getAttribute("href")`)) === "#/progress" && (await text(".tabs a.on")) === "Progress");
  check("question 1 of 8, no streak yet", /question 1 of 8/i.test((await text(".hear .label")) ?? "") && (await text(".streak")) === "0 in a row", await text(".hear"));

  const play = async () => { await click("#play"); const s = await said(); return s.at(-1); };
  let word = await play();
  let pair = await choices();
  check("the phone says one of the two words on the buttons", pair.length === 2 && pair.includes(word), `${word} / ${pair}`);
  check("their own word's pair (thin, tin) comes first", pair.includes("thin") && pair.includes("tin"), pair.join());

  // Question 1: right. Question 2: wrong. Then every question right.
  await click(`[data-choice="${word}"]`);
  check("a right answer says Yes, shows ✓, and the streak is 1", (await text(".hear .hint")) === `Yes, ${word}.` && /✓/.test((await text(".hear-choice.right")) ?? "") && (await text(".streak")) === "1 in a row", await text(".hear .hint"));
  const before = (await said()).length;
  await click("#next");
  check("Next word plays the next word by itself", (await said()).length === before + 1 && /question 2 of 8/i.test((await text(".hear .label")) ?? ""));
  word = (await said()).at(-1);
  pair = await choices();
  const other = pair.find((w) => w !== word);
  await click(`[data-choice="${other}"]`);
  check("a wrong answer says what it was, shows ✕, resets the streak, and shows the tip", (await text(".hear .hint")) === `It was ${word}, not ${other}.` && /✕/.test((await text(".hear-choice.wrong")) ?? "") && (await text(".streak")) === "0 in a row" && /Ukrainian/.test((await text(".hear .note")) ?? "") && (await chrome.evaluate(`document.querySelectorAll('.hear [lang="uk"]').length`)) >= 1, await text(".hear"));
  const n = (await said()).length;
  await click("#both");
  await sleep(200);
  const both = (await said()).slice(n);
  check("Hear both says the word and then the other one", both.length === 2 && both[0] === word && both[1] === other, JSON.stringify(both));
  await shot("hear-wrong-390");
  const disabled = await chrome.evaluate(`[...document.querySelectorAll("[data-choice]")].every((b) => b.disabled)`);
  check("after answering, the two word buttons are off", disabled);
  for (let i = 3; i <= 8; i++) {
    await click("#next");
    const w = (await said()).at(-1);
    await click(`[data-choice="${w}"]`);
  }
  check("question 8's button says See results", (await text("#next")) === "See results");
  await click("#next");
  check("the round ends: 7 of 8 right and the longest streak", /7 of 8 right/.test((await text(".hear")) ?? "") && /Longest streak: 6 in a row/.test((await text(".hear")) ?? ""), await text(".hear"));
  check("it offers saying them out loud, in the round for the same sound", (await chrome.evaluate(`document.querySelector('.hear a.btn.primary')?.getAttribute("href")`)) === "#/round/TH");
  await shot("hear-done-390");
  for (const width of [360, 390, 1280]) {
    await size(width);
    await sleep(250);
    check(`at ${width} wide the end doesn't scroll sideways`, (await chrome.evaluate("document.documentElement.scrollWidth")) <= width);
  }
  await size(390);
  await shot("hear-done-390b");
  await click("#again");
  check("Play again starts over at question 1", /question 1 of 8/i.test((await text(".hear .label")) ?? "") && (await text(".streak")) === "0 in a row");

  const stored = JSON.parse(await chrome.evaluate(`localStorage.getItem("articulate.v1")`));
  check("listening doesn't touch the boards: the history is as it was", JSON.stringify(stored.history) === JSON.stringify(history));

  await chrome.evaluate(`location.hash = "#/hear/AH0"`);
  await sleep(400);
  check("a sound with no pairs says there's no game, with a way back", /no listening game/.test((await text("main")) ?? "") && !!(await chrome.evaluate(`document.querySelector('main a[href="#/progress"]')`)));
  await chrome.evaluate(`location.hash = "#/progress"`);
  await sleep(300);
  await click('[data-board="needs"]');
  const aboutOnly = { about: history.about };
  await chrome.evaluate(`(() => { const s = JSON.parse(localStorage.getItem("articulate.v1")); s.history = ${JSON.stringify(aboutOnly)}; localStorage.setItem("articulate.v1", JSON.stringify(s)); })()`);
  await chrome.send("Page.reload");
  await sleep(900);
  await click('[data-board="needs"]');
  check("the small uh has no pairs, so no Hear the difference, but it still offers a round", !(await chrome.evaluate(`!!document.querySelector("[data-hear]")`)) && !!(await chrome.evaluate(`!!document.querySelector("[data-round]")`)));
  // The phone can't speak at all: the game says so.
  await chrome.evaluate(`Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true })`);
  await chrome.evaluate(`location.hash = "#/hear/TH"`);
  await sleep(400);
  check("a phone that can't speak gets a plain note and a way to Read", /can't say words out loud/.test((await text("main")) ?? "") && !!(await chrome.evaluate(`document.querySelector('main a[href="#/practice/read"]')`)), await text("main"));
} catch (err) {
  results.push(`✗ the check stopped: ${err.message}`);
} finally {
  await chrome.close();
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
