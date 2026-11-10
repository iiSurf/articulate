// Walks the whole first visit in headless Chrome, for real: the welcome, adding a word, opening it, saying it (the
// real sound model scores a stand-in microphone that plays "sink" for the word "think"), fixing the red part,
// saying it again, and the finish. Then the other ways through: skipping, "Take me there", Show me around again, and
// the one-time tips. Takes a picture of each moment in .tmp/shots/.
//
//   npm run check-tour
//
// Needs the sound model (npm run get-model) and the scoring test's recordings (npm run score-test, Mac only).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openChrome } from "./chrome.mjs";
import { startServer } from "./serve.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const wav = "/.tmp/score/wav/Samantha/sink.wav";
if (!existsSync(join(repo, wav))) throw new Error("Missing the scoring test's recordings. Run npm run score-test first, on a Mac.");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = join(repo, ".tmp", "shots");
mkdirSync(out, { recursive: true });

// Replaces the microphone with a stream that plays the recording 0.4 s after it opens (headless Chrome's own fake
// microphone sends no sound).
const standInMicrophone = `navigator.mediaDevices.getUserMedia = async () => {
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(await (await fetch(${JSON.stringify(wav)})).arrayBuffer());
  const source = ctx.createBufferSource(), dest = ctx.createMediaStreamDestination();
  source.buffer = buffer; source.connect(dest); source.start(ctx.currentTime + 0.4);
  return dest.stream;
};`;

const server = await startServer();
const c = await openChrome({ args: ["--autoplay-policy=no-user-gesture-required"] });
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : `: ${detail}`}`);
const q = (sel) => c.evaluate(`!!document.querySelector(${JSON.stringify(sel)})`);
// (The step card's headings are in capitals on the page, so words are compared in lowercase.)
const text = (sel) => c.evaluate(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, " ").trim().toLowerCase() ?? null`);
const click = (sel) => c.evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`);
const until = async (fn, tries = 80) => { for (let i = 0; i < tries; i++) { if (await fn()) return true; await sleep(150); } return false; };
const saved = async () => JSON.parse((await c.evaluate(`localStorage.getItem("articulate.v1")`)) || "{}");
const ringed = () => c.evaluate(`[...document.querySelectorAll("#main .tour-ring")].map((e) => e.id || e.dataset.tour || e.className)`);
const stepOf = async () => (await saved()).tour?.step;
const shot = async (name, width = 390) => {
  await c.send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });
  await sleep(250);
  const sw = await c.evaluate("document.documentElement.scrollWidth");
  if (sw > width) results.push(`✗ ${name} at ${width} scrolls sideways (${sw}px)`);
  writeFileSync(join(out, `tour-${name}-${width}.png`), Buffer.from((await c.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
};
const record = async () => {
  await click("#record");
  await until(async () => (await text("#record"))?.includes("stop"), 60);
  await sleep(2200);
  await click("#record");
};

try {
  await c.send("Page.enable");
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  await c.send("Page.addScriptToEvaluateOnNewDocument", { source: standInMicrophone });
  await c.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await c.send("Page.navigate", { url: `${server.url}/` });
  await sleep(1000);
  await c.evaluate(`localStorage.clear()`);
  await c.send("Page.reload");
  await sleep(1000);

  // The welcome
  check("a new learner sees the welcome", await q(".welcome") && (await text("#welcome-title")) === "welcome to articulate.");
  check("the welcome says hello in Ukrainian", (await text(".greet")) === "привіт!");
  await shot("1-welcome");
  await click("#welcome-start");
  await sleep(300);

  // Step 1: add a word
  check("step 1: the card says to add a word", (await text(".coach")).includes("step 1 of 5") && (await text(".coach")).includes("tap add"), await text(".coach"));
  check("step 1: the ring is on Add", JSON.stringify(await ringed()) === '["add"]', JSON.stringify(await ringed()));
  check("the welcome is gone, and no tip shows during the tour", !(await q(".welcome")) && !(await q(".tip")));
  await shot("2-add");
  await c.evaluate(`(() => { const i = document.getElementById("new-word"); i.value = "think"; i.form.requestSubmit(); })()`);
  await until(async () => (await stepOf()) === 2);

  // Step 2: open it, hear it
  check("step 2: the card says to open the word", (await text(".coach")).includes("step 2 of 5") && (await text(".coach")).includes("tap your word"), await text(".coach"));
  check("step 2: the ring is on the word", JSON.stringify(await ringed()) === '["word-link"]', JSON.stringify(await ringed()));
  await click(".word-name");
  await until(() => q(".big-word"));
  await sleep(200);
  check("step 2: on the word page the card points at Hear it and Say it", (await text(".coach")).includes("hear it") && JSON.stringify(await ringed()) === '["hear","practice"]', JSON.stringify(await ringed()));
  await shot("3-hear");
  await click("#practice");
  await until(async () => (await stepOf()) === 3);

  // Step 3: say it, with the real model
  await until(() => q("#record"));
  await sleep(300);
  check("step 3: Speak opens on the word, and the ring is on Record", (await text(".coach")).includes("step 3 of 5") && JSON.stringify(await ringed()) === '["record"]', JSON.stringify(await ringed()));
  await shot("4-say");
  await record();
  const graded = await until(async () => (await stepOf()) === 4, 200);
  check("step 3: a graded try moves the tour on", graded, `step ${await stepOf()}: ${await text(".speak .status")} ${await text(".speak .problem")}`);
  await sleep(300);

  // Step 4: fix the red part
  check("step 4: the card explains the four colors", (await text(".coach")).includes("step 4 of 5") && (await c.evaluate(`document.querySelectorAll(".coach .tour-key span").length`)) === 4);
  const part = await c.evaluate(`document.querySelector('#main button[data-tour="part"].tour-ring')?.dataset.grade`);
  check("step 4: the ring is on a part that isn't green", !!part && part !== "green", `grade ${part}`);
  await shot("5-colors");
  await shot("5-colors", 360);
  await shot("5-colors", 1280);
  await c.evaluate(`document.querySelector('#main button[data-tour="part"].tour-ring').click()`);
  await until(() => q("#close-fix"));
  await sleep(300);
  check("step 4: opening the part keeps the ring, now on Back to the word", (await ringed()).includes("close-fix"), JSON.stringify(await ringed()));
  await shot("6-fix");
  await click("#close-fix");
  await until(async () => (await stepOf()) === 5);

  // Step 5: say it again
  await sleep(300);
  check("step 5: the card says to say it again, ring on Record", (await text(".coach")).includes("step 5 of 5") && (await ringed()).includes("record"), JSON.stringify(await ringed()));
  await record();
  await until(async () => (await stepOf()) === 6, 200);
  await sleep(300);

  // The finish
  check("the finish says 'You did it!' and names the ways to practice: out loud, quiet, and the hardest sound", (await text(".coach-title")) === "you did it!" && (await text(".coach")).includes("out loud: say your words") && (await text(".coach")).includes("quiet: listen and puzzles"), await text(".coach"));
  await shot("7-done");
  await click("#tour-done");
  await sleep(300);
  let s = await saved();
  check("Done ends the tour, and the card goes away", s.tour.done === true && !(await q(".coach")));
  check("it remembers that Words and Speak were explained", JSON.stringify(s.tipsSeen) === '["words","speak"]', JSON.stringify(s.tipsSeen));
  check("nothing but the settings was saved: no recording", Object.keys(await c.evaluate(`Object.fromEntries(Object.entries(localStorage))`)).join() === "articulate.v1");

  // One-time tips and the "?"
  await c.send("Page.navigate", { url: `${server.url}/#/practice/read` });
  await sleep(900);
  check("Read shows its tip the first time", await q(".tip") && (await text(".tip")).includes("read is practice with no sound"), await text(".tip"));
  await shot("8-tip");
  await click(".tip .got");
  await c.send("Page.reload");
  await sleep(900);
  check("after Got it, the tip doesn't come back", !(await q(".tip")) && (await saved()).tipsSeen.includes("read"));
  await click("#help");
  await sleep(300);
  check("the ? brings the tip back", await q(".tip"));
  await c.send("Page.navigate", { url: `${server.url}/#/progress` });
  await sleep(500);
  check("Progress has no ?", !(await q("#help")));

  // Show me around again, and Take me there
  await c.send("Page.navigate", { url: `${server.url}/#/colors` });
  await sleep(700);
  check("Your colors has a tip and Help", (await text(".tip"))?.includes("pick a look") && (await q("#tour-again")));
  await click("#tour-again");
  await sleep(500);
  check("Show me around again starts at step 1 on My words", (await stepOf()) === 1 && (await c.evaluate("location.hash")) === "#/words" && (await text(".coach")).includes("step 1 of 5"));
  await c.evaluate(`document.querySelector('[data-add="three"]').click()`);
  await until(async () => (await stepOf()) === 2);
  await c.send("Page.navigate", { url: `${server.url}/#/colors` });
  await sleep(600);
  check("away from the step, the card offers to take you there", (await text(".coach")).includes("somewhere else") && (await q("#tour-there")) && !(await ringed()).length, await text(".coach"));
  await click("#tour-there");
  await sleep(500);
  check("Take me there goes to the step's screen", (await c.evaluate("location.hash")).startsWith("#/words/"), await c.evaluate("location.hash"));
  await click("#tour-skip");
  await sleep(300);
  check("Skip the tour ends it, and the tips come back", (await saved()).tour.done === true && !(await q(".coach")));

  // A fresh learner can skip at the welcome. (My words has a tip; a word's own page doesn't.)
  await c.send("Page.navigate", { url: `${server.url}/#/words` });
  await sleep(500);
  await c.evaluate(`localStorage.clear()`);
  await c.send("Page.reload");
  await sleep(900);
  await click("#welcome-skip");
  await sleep(300);
  s = await saved();
  check("skipping at the welcome goes straight to the app, with its tip", s.tour.done === true && !(await q(".welcome")) && (await q(".tip")));

  // Dark, and a long wait: the ring doesn't stay on after the tour
  await c.evaluate(`localStorage.clear()`);
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await c.send("Page.reload");
  await sleep(900);
  await shot("9-welcome-dark");
  await click("#welcome-start");
  await sleep(400);
  await shot("10-add-dark");
} catch (err) {
  results.push(`✗ the walk-through stopped: ${err.message}`);
} finally {
  await c.close();
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
