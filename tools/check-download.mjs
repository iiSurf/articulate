// Checks the window that asks before the sound model download, in headless Chrome:
//   - it opens when Speak is reached without the model, says what the file is, and can be closed
//   - it doesn't open again in the same visit, and doesn't open at all when the model is already here
//   - a failed download says so and offers Try again; "Read" and "Listen" links work
//   - the happy path (a stand-in download): progress, then ready, with a message
// The real file is 355 MB, so the test answers the request itself (the model "isn't here" and the download fails).
// Takes a picture of the window in .tmp/shots/.
//
//   npm run check-download
//
// Runs anywhere Chrome and Node are. Exits with an error if any check fails.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openChrome } from "./chrome.mjs";
import { startServer } from "./serve.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(repo, ".tmp", "shots");
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = await startServer();
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : `: ${detail}`}`);

// A browser where the model isn't local and Hugging Face "fails" (so nothing is ever downloaded).
async function noModelBrowser() {
  const c = await openChrome();
  await c.send("Page.enable");
  await c.send("Fetch.enable", { patterns: [{ urlPattern: "*/.models/*" }, { urlPattern: "*huggingface.co*" }] });
  c.on("Fetch.requestPaused", (p) => {
    const status = p.request.url.includes("huggingface.co") ? 503 : 404;
    c.send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: status, responseHeaders: [{ name: "Access-Control-Allow-Origin", value: "*" }], body: "" });
  });
  return c;
}
// (The headings are in capitals on the page, so words are compared in lowercase.)
// Goes to an address inside the app, waits until the address has really changed, then loads the page fresh (a reload
// sent too soon can land on the front page instead).
const visit = async (c, hash) => {
  await c.evaluate(`location.hash = ${JSON.stringify(hash)}`);
  for (let i = 0; i < 40 && (await c.evaluate("location.hash")) !== hash; i++) await sleep(50);
  await c.send("Page.reload");
  for (let i = 0; i < 80 && (await c.evaluate("document.readyState + location.hash")) !== "complete" + hash; i++) await sleep(50);
};
const dialogText = (c) => c.evaluate(`document.querySelector(".model-dialog")?.innerText.replace(/\\s+/g, " ").trim().toLowerCase() ?? null`);
// Waits (up to 6 s) for the window to open, since the app asks the browser first whether the model is here.
const opens = async (c) => { for (let i = 0; i < 40; i++) { if (await isOpen(c)) return true; await sleep(150); } return false; };
const isOpen = (c) => c.evaluate(`!!document.querySelector(".model-dialog[open]")`);
const settings = `localStorage.setItem("articulate.v1", JSON.stringify({ tour: { step: 0, done: true }, tipsSeen: ["speak", "words", "read", "listen"], mode: "speak", words: [{ text: "think", added: "2026-11-08" }], current: "think" }))`;
const shot = async (c, name, width, height = 844) => {
  await c.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });
  await sleep(300);
  const sw = await c.evaluate("document.documentElement.scrollWidth");
  if (sw > width) results.push(`✗ ${name} at ${width} scrolls sideways (${sw}px)`);
  writeFileSync(join(out, `download-${name}-${width}.png`), Buffer.from((await c.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
};

try {
  // 1. Without the model
  let c = await noModelBrowser();
  try {
    await c.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await c.send("Page.navigate", { url: `${server.url}/` });
    await sleep(800);
    await c.evaluate(settings);
    await visit(c, "#/practice/speak");
    check("the window opens when Speak is reached without the model", await opens(c));
    const text = await dialogText(c);
    check("it says what the file is, and its size", text?.includes("355 mb") && text.includes("what it is"), text);
    check("it says what it's for and how it's used", text?.includes("what it's for") && text.includes("how it's used") && text.includes("recording is thrown away"), text);
    check("it says the voice never leaves the phone, and who hosts the file", text?.includes("your voice never leaves your phone") && text.includes("nothing is sent to us or to anyone else") && text.includes("hugging face"), text);
    check("it says Read and Listen need no download", text?.includes("no download needed for read or listen"), text);
    await shot(c, "intro", 390);
    await shot(c, "intro", 1280, 800);
    await shot(c, "intro-landscape", 844, 390);
    await c.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

    await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await c.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await sleep(300);
    check("Escape closes it", !(await isOpen(c)));
    check("Speak's own download button is still there for later", await c.evaluate(`!!document.getElementById("get-model")`));

    await c.send("Page.navigate", { url: `${server.url}/#/words` });
    await sleep(300);
    await c.send("Page.navigate", { url: `${server.url}/#/practice/speak` });
    await sleep(900);
    check("it doesn't open again in the same visit", !(await isOpen(c)));

    await visit(c, "#/practice/speak");
    check("it comes back on the next visit", await opens(c));
    await c.evaluate(`document.getElementById("md-later").click()`);
    await sleep(300);
    check("Not now closes it", !(await isOpen(c)));

    // a failed download
    await visit(c, "#/practice/speak");
    await opens(c);
    await c.evaluate(`document.getElementById("md-download").click()`);
    await sleep(1500);
    const failed = await dialogText(c);
    check("a failed download says so, and nothing was shared", failed?.includes("the download stopped") && failed.includes("nothing was saved or shared"), failed);
    check("it offers Try again", await c.evaluate(`!!document.getElementById("md-retry")`));
    await shot(c, "failed", 390);
    await c.evaluate(`document.getElementById("md-retry").click()`);
    await sleep(1500);
    check("Try again tries again, and can fail again politely", (await dialogText(c))?.includes("the download stopped"));
    await c.evaluate(`document.getElementById("md-later").click()`);

    // the Read link
    await visit(c, "#/practice/speak");
    await opens(c);
    await c.evaluate(`document.querySelector("[data-md-go]").click()`);
    await sleep(500);
    check("the Read link closes the window and opens Read", !(await isOpen(c)) && (await c.evaluate("location.hash")) === "#/practice/read");

    // the happy path, with a stand-in download
    await c.send("Page.navigate", { url: `${server.url}/#/words` });
    await sleep(500);
    const happy = await c.evaluate(`(async () => {
      const m = await import("/js/ui/modeldialog.js");
      let ready = 0, shown = [];
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      m.openModelDialog({ load: async ({ onProgress }) => { onProgress(0.42); await sleep(120); shown.push(document.getElementById("md-percent")?.textContent); onProgress(1); await sleep(50); }, go: () => {}, onReady: () => { ready++; m.toast("Speak is ready. You can record now."); } });
      document.getElementById("md-download").click();
      await sleep(600);
      return { shown, ready, open: !!document.querySelector(".model-dialog"), toast: document.querySelector(".toast")?.textContent };
    })()`);
    check("a download shows its progress, then closes and says Speak is ready", happy.shown[0] === "42%" && happy.ready === 1 && !happy.open && happy.toast === "Speak is ready. You can record now.", JSON.stringify(happy));
    await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
    await visit(c, "#/practice/speak");
    await opens(c);
    await shot(c, "intro-dark", 390);
  } finally {
    await c.close();
  }

  // 2. With the model already here (the copy in .models/), it never asks
  c = await openChrome();
  try {
    await c.send("Page.enable");
    await c.send("Page.navigate", { url: `${server.url}/` });
    await sleep(800);
    await c.evaluate(settings);
    await visit(c, "#/practice/speak");
    await sleep(1800);
    const here = await c.evaluate(`fetch("/.models/speako/onnx/model_quantized.onnx", { method: "HEAD" }).then((r) => r.ok)`);
    check("with the model already here, it doesn't ask", here ? !(await isOpen(c)) : true, here ? "" : "(skipped: no local copy, run npm run get-model)");
  } finally {
    await c.close();
  }
} catch (err) {
  results.push(`✗ the check stopped: ${err.message}`);
} finally {
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
