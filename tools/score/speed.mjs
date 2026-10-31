// How fast the scoring runs in Chrome, at full speed and with the processor slowed down to stand in for phones.
//
//   npm run score-speed
//
// Serves this repository on this computer only (tools/serve.mjs), opens tools/score/speed.html in headless Chrome,
// loads the model the way the app does (js/score/model.js), then times recordings of three lengths at each speed.
// Chrome's "slow the processor down" setting is a rough stand-in for a phone: 4 times slower is about a mid-range
// phone, 6 times about a cheap one. The real answer is the friend's phone. Works on a Mac, Windows, or Linux.
// Writes .tmp/score/speed.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openChrome } from "../chrome.mjs";
import { startServer } from "../serve.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PHONES = ["TH", "IH1", "NG", "K"]; // think
const LENGTHS = [0.6, 1.0, 2.0]; // a short word with no silence, a word with a little, a word with a lot
const RATES = [1, 4, 6];

const server = await startServer();
const chrome = await openChrome();
const lines = ["# Scoring speed in Chrome", "", "One thread. Each time is the second run of a recording of that length (the first warms up).", ""];
try {
  await chrome.send("Page.enable");
  await chrome.send("Page.navigate", { url: `${server.url}/tools/score/speed.html` });
  for (let i = 0; i < 50 && !(await chrome.evaluate("window.ready === true")); i++) await new Promise((r) => setTimeout(r, 200));
  const load = await chrome.evaluate("loadModel()");
  const where = { local: "the copy in .models/", saved: "the browser's saved copy", download: "Hugging Face" }[load.from];
  lines.push(`Loading the model at full speed, from ${where}: ${(load.ms / 1000).toFixed(1)} s.`, "");
  lines.push(`| Speed | ${LENGTHS.map((s) => `${s} s recording`).join(" | ")} |`, `| --- |${LENGTHS.map(() => " --- |").join("")}`);
  for (const rate of RATES) {
    await chrome.send("Emulation.setCPUThrottlingRate", { rate });
    const cells = [];
    for (const seconds of LENGTHS) {
      await chrome.evaluate(`timeRecording(${seconds}, ${JSON.stringify(PHONES)})`);
      const t = await chrome.evaluate(`timeRecording(${seconds}, ${JSON.stringify(PHONES)})`);
      cells.push(`${((t.modelMs + t.scoreMs) / 1000).toFixed(2)} s`);
    }
    lines.push(`| ${rate === 1 ? "full (this computer)" : `${rate}× slower`} | ${cells.join(" | ")} |`);
    console.log(lines.at(-1));
  }
} finally {
  await chrome.close();
  server.close();
}
mkdirSync(join(repo, ".tmp", "score"), { recursive: true });
writeFileSync(join(repo, ".tmp", "score", "speed.md"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
