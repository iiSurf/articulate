// Saves what a draft page's script draws into the page itself, so it still shows in previews that don't run
// JavaScript (the Claude app shows a local page as a still snapshot). The script stays in the page and redraws the
// same thing when JavaScript does run. Run it after every change to a draft page's script.
//
//   node tools/bake.mjs design/themes.html
//
// Chrome's profile goes in .tmp/ (CLAUDE.md: never the system's temporary folder) and is deleted afterwards.
// Finds Chrome the same way the other tools do (tools/chrome.mjs). For design drafts, not part of the app.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromePath } from "./chrome.mjs";

const page = process.argv[2];
if (!page) {
  console.error("usage: node tools/bake.mjs <page.html>");
  process.exit(2);
}
const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const profile = join(repo, ".tmp", `chrome-bake-${process.pid}`);
mkdirSync(profile, { recursive: true });
try {
  const dom = execFileSync(chromePath(),
    ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, "--dump-dom", pathToFileURL(resolve(page)).href],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
  if (!dom.includes("</html>")) throw new Error("Chrome returned no page");
  // Chrome adds a blank line before </body> each time, so tidy it to keep a second bake from changing anything.
  const html = dom.trim().replace(/^<!doctype html>\s*/i, "").replace(/\s*<\/body>/, "\n</body>");
  writeFileSync(page, "<!doctype html>\n" + html + "\n");
  console.log(`baked ${page} (${Math.round(dom.length / 1024)} KB)`);
} finally {
  rmSync(profile, { recursive: true, force: true });
}
