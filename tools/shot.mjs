// Screenshots a page at an exact width, the way a phone or a desktop would lay it out, with headless Chrome.
// A plain `chrome --window-size=390,...` can't do this: Chrome won't make a window that narrow.
//
//   node tools/shot.mjs <out.png> <width> <height> <url> [full=0] [scale=1] [regions]
//   node tools/shot.mjs .tmp/shots/home-390.png 390 844 "file://$PWD/design/themes.html" 1
//   node tools/shot.mjs .tmp/shots/colors-390.png 390 844 "/#/colors"
//
// An address starting with "/" opens this repository through the local server (tools/serve.mjs), which the app
// needs. COLOR_SCHEME=dark makes the page think the phone is in dark mode.
//
// full=1 grows the shot to the page's whole height. regions is optional JavaScript, run in the page, that returns a
// list of { x, y, width, height } in page pixels: each one is saved as its own picture (out-1.png, out-2.png, ...).
// For checking screens, not part of the app.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { openChrome } from "./chrome.mjs";
import { startServer } from "./serve.mjs";

const [out, width, height, url, full = "0", scale = "1", regions = ""] = process.argv.slice(2);
if (!out || !width || !height || !url) {
  console.error("usage: node tools/shot.mjs <out.png> <width> <height> <url> [full=0] [scale=1] [regions]");
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = url.startsWith("/") ? await startServer() : null;
const chrome = await openChrome();
try {
  const { send, evaluate } = chrome;
  const size = (h) => send("Emulation.setDeviceMetricsOverride", { width: +width, height: h, deviceScaleFactor: +scale, mobile: +width < 768 });
  await send("Page.enable");
  await size(+height);
  if (process.env.COLOR_SCHEME) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: process.env.COLOR_SCHEME }] });
  await send("Page.navigate", { url: server ? server.url + url : url });
  await sleep(1200);
  if (full === "1") {
    const m = await send("Page.getLayoutMetrics");
    await size(Math.ceil(m.result.cssContentSize.height));
    await sleep(400);
  }
  const sw = await evaluate("document.documentElement.scrollWidth");
  const note = sw > +width ? ` (the page is ${sw}px wide: it scrolls sideways)` : "";
  mkdirSync(dirname(out), { recursive: true });
  if (regions) {
    const list = (await evaluate(regions)) || [];
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
  await chrome.close();
  server?.close();
}
