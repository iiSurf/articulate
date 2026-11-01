// Starts a headless Chrome and talks to it over the DevTools protocol. Used by the screenshot and speed tools.
// Chrome's profile goes in .tmp/ (CLAUDE.md: never the system's temporary folder) and is deleted on close.
// Finds Chrome in the usual place on a Mac, Windows, or Linux; set CHROME to its path if it's somewhere else.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const env = process.env;
  const places = {
    darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"],
    win32: [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA].filter(Boolean)
      .map((base) => join(base, "Google", "Chrome", "Application", "chrome.exe")),
    linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
  }[process.platform] || [];
  const found = places.find((p) => existsSync(p));
  if (!found) throw new Error("Can't find Chrome. Set CHROME to the path of Chrome on this computer.");
  return found;
}

// args: more Chrome switches, like a stand-in microphone that plays a file (see tools/score/try-check.mjs).
export async function openChrome({ args = [] } = {}) {
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = join(repo, ".tmp", `chrome-${port}`);
  mkdirSync(profile, { recursive: true });
  const chrome = spawn(chromePath(),
    ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, ...args, "about:blank"],
    { stdio: "ignore" });
  const close = async (ws) => {
    try { ws?.close(); } catch {}
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  };

  let page;
  for (let i = 0; i < 50 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {}
    if (!page) await sleep(200);
  }
  if (!page) { await close(); throw new Error("Chrome did not start"); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); waiting.get(d.id)?.(d); waiting.delete(d.id); };
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  // Runs JavaScript in the page and returns its value (awaiting promises). Throws if the page threw.
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  return { send, evaluate, close: () => close(ws) };
}
