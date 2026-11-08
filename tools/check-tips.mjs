// Checks the tips in Fix this part, end to end in headless Chrome, with the REAL sound model: a stand-in microphone
// plays a recording of "sink" for the word "think" (and "vest" for "west"), the real model scores it, the red part is
// tapped, and the panel is read. It needs the tips to be hooked into Speak's panel, which is docs/fix-tips.patch (Speak
// is the teammate's file), so this check only passes once that patch is applied. Takes pictures in .tmp/shots/.
//
//   npm run check-tips
//
// Needs the model (npm run get-model) and the scoring test's recordings (npm run score-test, Mac only).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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

// What was "said" for each word typed, and what the panel should then say about the first part that isn't green.
const CASES = [
  { word: "think", plays: "Samantha/sink", part: "th", title: "th as in think", has: ["Ukrainian с", "You said s", "Same sound, same spot", "Hear the difference"], words: ["thank", "thin"], pair: "think · sink" },
  { word: "west", plays: "Reed/vest", part: "w", title: "w as in wet", has: ["short у", "You said v"], words: ["wine", "wet"] },
];

const microphone = (url) => `navigator.mediaDevices.getUserMedia = async () => {
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(await (await fetch(${JSON.stringify(url)})).arrayBuffer());
  const source = ctx.createBufferSource(), dest = ctx.createMediaStreamDestination();
  source.buffer = buffer; source.connect(dest); source.start(ctx.currentTime + 0.4);
  return dest.stream;
};`;

const server = await startServer();
try {
  for (const c of CASES) {
    const wav = `/.tmp/score/wav/${c.plays}.wav`;
    if (!existsSync(join(repo, wav))) throw new Error(`Missing ${wav}. Run npm run score-test first, on a Mac.`);
    const chrome = await openChrome({ args: ["--autoplay-policy=no-user-gesture-required"] });
    const text = (sel) => chrome.evaluate(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, " ").trim() ?? null`);
    try {
      await chrome.send("Page.enable");
      await chrome.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
      await chrome.send("Page.addScriptToEvaluateOnNewDocument", { source: microphone(wav) });
      await chrome.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      await chrome.send("Page.navigate", { url: `${server.url}/` });
      await sleep(900);
      await chrome.evaluate(`localStorage.setItem("articulate.v1", JSON.stringify({ tour: { step: 0, done: true }, tipsSeen: ["speak", "words", "read", "listen"], mode: "speak", words: [{ text: ${JSON.stringify(c.word)}, added: "2026-11-08" }], current: ${JSON.stringify(c.word)} }))`);
      await chrome.evaluate(`location.hash = "#/practice/speak"`);
      await sleep(300);
      await chrome.send("Page.reload");
      for (let i = 0; i < 80 && !(await chrome.evaluate(`!!document.getElementById("record") && !document.getElementById("record").disabled`)); i++) await sleep(150);
      await chrome.evaluate(`document.getElementById("record").click()`);
      for (let i = 0; i < 60 && (await text("#record")) !== "stop"; i++) { if ((await text("#record"))?.toLowerCase().includes("stop")) break; await sleep(100); }
      await sleep(2300);
      await chrome.evaluate(`document.getElementById("record").click()`);
      for (let i = 0; i < 200 && !(await chrome.evaluate(`!!document.querySelector('button[data-tour="part"]:not([data-grade="green"])')`)); i++) await sleep(250);
      const grade = await chrome.evaluate(`document.querySelector('button[data-tour="part"]:not([data-grade="green"])')?.dataset.grade ?? null`);
      check(`"${c.word}" said as ${c.plays.split("/")[1]}: a part isn't green`, !!grade, "nothing was graded");
      await chrome.evaluate(`document.querySelector('button[data-tour="part"]:not([data-grade="green"])').click()`);
      let panel = null;
      for (let i = 0; i < 60 && !(panel = await text("#fix-tips")); i++) await sleep(150);
      check(`the tips appear in the panel for the ${c.part}`, !!panel, "the panel stayed empty (is docs/fix-tips.patch applied?)");
      if (panel) {
        check(`it names the sound: ${c.title}`, panel.includes(c.title), panel);
        for (const want of c.has) check(`it says "${want}"`, panel.includes(want), panel);
        const words = await chrome.evaluate(`[...document.querySelectorAll("#fix-tips [data-say]")].map((b) => b.dataset.say)`);
        check("it offers words with the same sound, not the word itself", c.words.every((w) => words.includes(w)) && !words.includes(c.word), JSON.stringify(words));
        if (c.pair) check(`it offers the pair ${c.pair}`, (await chrome.evaluate(`[...document.querySelectorAll("#fix-tips [data-say-pair]")].map((b) => b.textContent)`)).includes(c.pair));
        check("the Ukrainian letters are marked lang=uk", (await chrome.evaluate(`document.querySelectorAll('#fix-tips [lang="uk"]').length`)) >= 1);
        check("the learner never sees IPA in the panel", !/[ɪɛæɑəʊɝðθŋʃʧʤɹɾ]/.test(panel), panel);
        for (const width of c.word === "think" ? [360, 390, 1280] : [390]) {
          await chrome.send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });
          await sleep(300);
          const m = await chrome.send("Page.getLayoutMetrics");
          if ((await chrome.evaluate("document.documentElement.scrollWidth")) > width) results.push(`✗ at ${width} wide the page scrolls sideways`);
          await chrome.evaluate(`document.getElementById("fix")?.scrollIntoView({ block: "center" })`);
          await sleep(200);
          writeFileSync(join(out, `tips-${c.word}-${width}.png`), Buffer.from((await chrome.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
        }
        await chrome.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
        await chrome.evaluate(`document.getElementById("close-fix").click()`);
        await sleep(300);
        check("Back to the word closes the panel", !(await chrome.evaluate(`!!document.getElementById("fix")`)));
      }
    } finally {
      await chrome.close();
    }
  }
} catch (err) {
  results.push(`✗ the check stopped: ${err.message}`);
} finally {
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
