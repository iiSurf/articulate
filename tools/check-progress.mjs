// Checks the Progress tab in headless Chrome with a made-up history: the three boards, the sounds that cause trouble,
// the empty page, tapping a word, and that nothing scrolls sideways at 360, 390 and 1280 wide. No model needed.
// Takes pictures in .tmp/shots/.
//
//   npm run check-progress
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

// Each word's tries, oldest first, and the part that went wrong in the ones under 80.
const WORDS = {
  three: [[60, "TH", "red", "th"], [96], [90]], world: [[54, "W", "orange", "w"], [92]], very: [[57, "V", "orange", "v"], [88]],
  thirty: [[57, "TH", "red", "th"], [84]], think: [[22, "TH", "red", "th"], [22, "TH", "red", "th"]],
  this: [[38, "DH", "red", "th"], [38, "DH", "red", "th"]], weather: [[45, "W", "orange", "w"], [45, "W", "orange", "w"]],
};
const history = Object.fromEntries(Object.entries(WORDS).map(([word, tries]) => [word,
  tries.map(([score, sound, grade, letters], i) => ({ at: `2026-11-08T10:0${i}:00.000Z`, score, bad: sound ? [[sound, grade, letters]] : [] }))]));
const saved = (extra = {}) => JSON.stringify({ tour: { step: 0, done: true }, tipsSeen: ["speak", "words", "read", "listen", "progress"], ...extra });

const server = await startServer();
const chrome = await openChrome();
const text = (sel) => chrome.evaluate(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, " ").trim() ?? null`);
const rows = () => chrome.evaluate(`[...document.querySelectorAll(".ranks li")].map((li) => li.querySelector(".w").textContent + " " + li.querySelector(".num2").childNodes[0].textContent)`);
const visit = async (data) => {
  await chrome.send("Page.navigate", { url: `${server.url}/` });
  await sleep(700);
  await chrome.evaluate(`localStorage.setItem("articulate.v1", ${JSON.stringify(data)}); location.hash = "#/progress"`);
  await chrome.send("Page.reload");
  await sleep(900);
};
const shot = async (name) => writeFileSync(join(out, `${name}.png`), Buffer.from((await chrome.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
const size = (width) => chrome.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });

try {
  await chrome.send("Page.enable");
  await chrome.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  await size(390);

  await visit(saved());
  check("with no tries, the page says nothing is here yet and points to Speak", /Nothing here yet/.test(await text("main")) && (await chrome.evaluate(`document.querySelector('main a.btn')?.getAttribute("href")`)) === "#/practice/speak", await text("main"));

  await visit(saved({ history }));
  check("Top words starts selected", (await chrome.evaluate(`document.querySelector(".boards .on")?.textContent`)) === "Top words");
  check("Top words: the best of the last three tries, highest first, only 60 and up", JSON.stringify(await rows()) === JSON.stringify(["three 96", "world 92", "very 88", "thirty 84"]), JSON.stringify(await rows()));
  await shot("progress-top-390");

  await chrome.evaluate(`document.querySelector('[data-board="needs"]').click()`);
  await sleep(300);
  check("Needs work: lowest first, with the part that went wrong", JSON.stringify(await rows()) === JSON.stringify(["think 22", "this 38", "weather 45", "thirty 71", "very 73"]), JSON.stringify(await rows()));
  const firstSpot = await text(".ranks li .spot");
  check("the worst word shows its part, th, with a mark", /✕\s*th/.test(firstSpot ?? ""), firstSpot);
  const hard = await text("section:last-of-type");
  check("Where you struggle most: the th of think is first", /th as in think/.test(hard ?? "") && /Practice th/.test(hard ?? ""), hard);
  check("the sound is named in plain words, never IPA", !/[ɪɛæɑəʊɝðθŋʃʧʤɹɾ]/.test((await text("main")) ?? ""));
  await sleep(200);
  await shot("progress-needs-390");

  await chrome.evaluate(`document.querySelector('[data-board="better"]').click()`);
  await sleep(300);
  check("Most improved: the biggest jump first, with where it started", JSON.stringify(await rows()) === JSON.stringify(["world +38", "very +31", "three +30", "thirty +27"]), JSON.stringify(await rows()));
  check("it shows 54 → 92 for world", /54 → 92/.test((await text(".ranks li")) ?? ""), await text(".ranks li"));
  await shot("progress-better-390");

  await chrome.evaluate(`document.querySelector('[data-board="top"]').click()`);
  await sleep(200);
  await chrome.evaluate(`document.querySelector('.ranks li:nth-child(2) a').click()`);
  await sleep(500);
  const now = JSON.parse(await chrome.evaluate(`localStorage.getItem("articulate.v1")`));
  check("tapping a word makes it the word to practice and opens Speak", now.current === "world" && (await chrome.evaluate("location.hash")) === "#/practice/speak", `${now.current} ${await chrome.evaluate("location.hash")}`);

  await visit(saved({ history }));
  await chrome.evaluate(`document.querySelector('[data-board="needs"]').click()`);
  await sleep(300);
  await chrome.evaluate(`document.querySelector('[data-round]').click()`);
  await sleep(300);
  check("Practice th goes to the round for TH", (await chrome.evaluate("location.hash")) === "#/round/TH", await chrome.evaluate("location.hash"));

  await visit(saved({ history }));
  await chrome.evaluate(`document.querySelector('[data-board="needs"]').click()`);
  for (const width of [360, 390, 1280]) {
    await size(width);
    await sleep(300);
    check(`at ${width} wide the page doesn't scroll sideways`, (await chrome.evaluate("document.documentElement.scrollWidth")) <= width, String(await chrome.evaluate("document.documentElement.scrollWidth")));
    await shot(`progress-needs-${width}`);
  }
  await size(390);
  await chrome.evaluate(`document.documentElement.dataset.look = "night"`);
  await chrome.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await sleep(300);
  await shot("progress-needs-night-390");
} catch (err) {
  results.push(`✗ the check stopped: ${err.message}`);
} finally {
  await chrome.close();
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
