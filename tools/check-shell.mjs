// Clicks through the app shell in headless Chrome and checks it works: the looks, the phone's dark mode, the
// switch in Your colors, Read · Listen · Speak, saving, and that typed text can't become markup.
//
//   npm run check-shell
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
  const media = (v) => c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: v }] });
  const look = () => c.evaluate("document.documentElement.dataset.look");
  await media("light");
  await c.send("Page.navigate", { url: `${server.url}/#/colors` });
  await sleep(800);
  check("a new learner starts with Sky over wheat by day", (await look()) === "sky");
  await media("dark"); await sleep(300);
  check("the phone going dark switches to Night flag", (await look()) === "night");
  await media("light"); await sleep(300);
  await c.evaluate(`document.querySelector('[data-for="day"][data-id="kalyna"]').click()`); await sleep(200);
  check("tapping Kalyna shows Kalyna", (await look()) === "kalyna");
  await c.evaluate(`document.querySelector('[data-for="night"][data-id="petrykivka"]').click()`); await sleep(200);
  await media("dark"); await sleep(300);
  check("the night look is now Petrykivka", (await look()) === "petrykivka");
  await c.evaluate(`(() => { const t = document.getElementById("follow"); t.click(); })()`); await sleep(300);
  check("turning off the switch keeps the day look in dark mode", (await look()) === "kalyna");
  await c.send("Page.navigate", { url: `${server.url}/#/practice/read` }); await sleep(600);
  check("Read is chosen", (await c.evaluate(`document.querySelector(".modes a.on")?.textContent`)) === "Read");
  await c.send("Page.navigate", { url: `${server.url}/#/progress` }); await sleep(400);
  await c.evaluate(`document.querySelector('.tabs a[href^="#/practice"]').click()`); await sleep(400);
  check("the Practice tab goes back to Read", (await c.evaluate("location.hash")) === "#/practice/read");
  await c.send("Page.reload"); await sleep(800);
  const saved = JSON.parse(await c.evaluate(`localStorage.getItem("articulate.v1")`));
  check("all of it is still there after a reload", (await look()) === "kalyna" && saved.mode === "read" && saved.looks.followDark === false,
    JSON.stringify({ look: await look(), mode: saved.mode, looks: saved.looks }));
  check("the only key saved starts with articulate.", (await c.evaluate("Object.keys(localStorage).join(',')")) === "articulate.v1");
  check("a word typed into the hash can't become markup", await c.evaluate(`(async () => { location.hash = "#/practice/<img src=x onerror=alert(1)>"; await new Promise((r) => setTimeout(r, 300)); return !document.querySelector("img"); })()`));
} finally { await c.close(); server.close(); }
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
