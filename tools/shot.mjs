// Screenshots a page at an exact width, the way a phone or a desktop would lay it out, with headless Chrome.
// A plain `chrome --window-size=390,...` can't do this: Chrome won't make a window that narrow.
//
//   node tools/shot.mjs <out.png> <width> <height> <url> [full=0] [scale=1] [regions]
//   node tools/shot.mjs .tmp/shots/home-390.png 390 844 "file://$PWD/design/themes.html" 1
//
// full=1 grows the shot to the page's whole height. regions is optional JavaScript, run in the page, that returns a
// list of { x, y, width, height } in page pixels: each one is saved as its own picture (out-1.png, out-2.png, ...).
// Chrome's profile goes in .tmp/ (CLAUDE.md: never the system's temporary folder). Set CHROME if Chrome is not in
// the usual macOS place. For checking screens, not part of the app.
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [out, width, height, url, full = "0", scale = "1", regions = ""] = process.argv.slice(2);
if (!out || !width || !height || !url) {
  console.error("usage: node tools/shot.mjs <out.png> <width> <height> <url> [full=0] [scale=1] [regions]");
  process.exit(2);
}
const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 9400 + Math.floor(Math.random() * 400);
const profile = join(repo, ".tmp", `chrome-${port}`);
mkdirSync(profile, { recursive: true });
const chrome = spawn(process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"],
  { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
try {
  let page;
  for (let i = 0; i < 50 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {}
    if (!page) await sleep(200);
  }
  if (!page) throw new Error("Chrome did not start");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); waiting.get(d.id)?.(d); waiting.delete(d.id); };
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

  const size = (h) => send("Emulation.setDeviceMetricsOverride", { width: +width, height: h, deviceScaleFactor: +scale, mobile: +width < 768 });
  await send("Page.enable");
  await size(+height);
  await send("Page.navigate", { url });
  await sleep(1200);
  if (full === "1") {
    const m = await send("Page.getLayoutMetrics");
    await size(Math.ceil(m.result.cssContentSize.height));
    await sleep(400);
  }
  const wide = await send("Runtime.evaluate", { expression: "document.documentElement.scrollWidth", returnByValue: true });
  const sw = wide.result.result.value;
  const note = sw > +width ? ` (the page is ${sw}px wide: it scrolls sideways)` : "";
  mkdirSync(dirname(out), { recursive: true });
  if (regions) {
    const r = await send("Runtime.evaluate", { expression: regions, returnByValue: true });
    const list = r.result.result.value || [];
    for (const [i, clip] of list.entries()) {
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...clip, scale: 1 } });
      const file = out.replace(/\.png$/, `-${i + 1}.png`);
      writeFileSync(file, Buffer.from(shot.result.data, "base64"));
      console.log(`saved ${file}${note}`);
    }
  } else {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(out, Buffer.from(shot.result.data, "base64"));
    console.log(`saved ${out}${note}`);
  }
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
