// Checks the try-it page end to end in headless Chrome, with a stand-in microphone that "says" a recording.
//
//   node tools/score/try-check.mjs
//
// Before the page loads, its "open the microphone" call is swapped for one that plays one of the scoring test's
// recordings (after a short quiet, then quiet again). Headless Chrome's own fake microphone sends no sound, which
// is why. The script opens the page with the word, taps Record, waits, taps Stop, and reads the grades the page
// shows. So it tests everything after the microphone: recording, decoding, cutting the silence, the model, and the
// grading. The real microphone is tested by trying the page on real computers and phones.
// Saves a screenshot of each result at 390 wide in .tmp/shots/. Needs the model (npm run get-model) and the
// recordings from `npm run score-test`, which is why it runs on a Mac.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openChrome } from "../chrome.mjs";
import { startServer } from "../serve.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The word typed, the recording the microphone plays, and what should happen to the swapped sound.
const CASES = [
  { word: "think", plays: "Samantha/think", expect: "every sound green" },
  { word: "think", plays: "Samantha/sink", expect: "th not green, like s", at: 0, like: "s", widths: [360, 390, 1280] },
  { word: "west", plays: "Reed/vest", expect: "w not green, like v", at: 0, like: "v" },
  { word: "sheep", plays: "Shelley/ship", expect: "ee not green, like ɪ", at: 1, like: "ɪ" },
];

// Replaces getUserMedia with a stream that plays the recording at url, 0.4 s after it opens.
function standInMicrophone(url) {
  return `navigator.mediaDevices.getUserMedia = async () => {
    const ctx = new AudioContext();
    const buffer = await ctx.decodeAudioData(await (await fetch(${JSON.stringify(url)})).arrayBuffer());
    const source = ctx.createBufferSource(), out = ctx.createMediaStreamDestination();
    source.buffer = buffer;
    source.connect(out);
    source.start(ctx.currentTime + 0.4);
    return out.stream;
  };`;
}

const server = await startServer();
const out = join(repo, ".tmp", "shots");
mkdirSync(out, { recursive: true });
const lines = [];
let passed = 0;
try {
  for (const c of CASES) {
    const wav = join(repo, ".tmp", "score", "wav", `${c.plays}.wav`);
    if (!existsSync(wav)) throw new Error(`Missing ${wav}. Run npm run score-test first, on a Mac.`);
    const chrome = await openChrome({ args: ["--autoplay-policy=no-user-gesture-required"] });
    try {
      await chrome.send("Page.enable");
      await chrome.send("Page.addScriptToEvaluateOnNewDocument", { source: standInMicrophone(`/.tmp/score/wav/${c.plays}.wav`) });
      await chrome.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      await chrome.send("Page.navigate", { url: `${server.url}/tools/score/try.html?word=${c.word}` });
      for (let i = 0; i < 100 && !(await chrome.evaluate("!!window.tryPage?.ready && !document.getElementById('record').disabled")); i++) await sleep(200);
      await chrome.evaluate("document.getElementById('record').click()");
      // Opening the microphone can take a few seconds; the recording starts when the button says Stop.
      for (let i = 0; i < 100 && (await chrome.evaluate("document.getElementById('record').textContent")) !== "Stop"; i++) await sleep(100);
      await sleep(2500);
      await chrome.evaluate("document.getElementById('record').click()");
      let result = null;
      for (let i = 0; i < 100 && !(result = await chrome.evaluate("window.tryPage.lastResult")); i++) await sleep(200);
      if (!result) throw new Error(await chrome.evaluate("document.getElementById('say-status').textContent || 'no result'"));
      const grades = result.sounds.map((s) => `${s.sound} ${s.grade}${s.heard !== null ? ` (like ${s.heard || "nothing"})` : ""}`).join(", ");
      const ok = c.at === undefined
        ? result.sounds.every((s) => s.grade === "green")
        : result.sounds[c.at].grade !== "green" && result.sounds[c.at].heard === c.like;
      if (ok) passed++;
      lines.push(`${ok ? "✓" : "✗"} "${c.word}" said as ${c.plays}: ${grades} | heard ${result.heard.join(" ")} | `
        + `${result.seconds.recorded.toFixed(1)} s cut to ${result.seconds.scored.toFixed(1)} s, scored in ${((result.ms.model + result.ms.score) / 1000).toFixed(2)} s. Expected: ${c.expect}.`);
      console.log(lines.at(-1));
      // A picture of the result at each width (390 unless the case asks for more), the whole page tall.
      for (const width of c.widths || [390]) {
        await chrome.send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });
        await sleep(300);
        const m = await chrome.send("Page.getLayoutMetrics");
        const wide = await chrome.evaluate("document.documentElement.scrollWidth");
        if (wide > width) lines.push(`  at ${width} wide the page is ${wide}px wide: it scrolls sideways`);
        await chrome.send("Emulation.setDeviceMetricsOverride", { width, height: Math.ceil(m.result.cssContentSize.height), deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });
        await sleep(300);
        const shot = await chrome.send("Page.captureScreenshot", { format: "png" });
        writeFileSync(join(out, `try-${c.word}-${c.plays.replace("/", "-")}-${width}.png`), Buffer.from(shot.result.data, "base64"));
      }
    } finally {
      await chrome.close();
    }
  }
} finally {
  server.close();
}
console.log(`${passed} of ${CASES.length} as expected`);
process.exitCode = passed === CASES.length ? 0 : 1;
