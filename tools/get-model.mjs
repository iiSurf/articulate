// Downloads the scoring model into .models/speako/ (git ignores it), on a Mac, Windows, or Linux.
//
//   npm run get-model
//
// The app doesn't need this: it downloads the model itself the first time Out loud is used, and the browser keeps
// it. This copy is for the tools that run the model in Node (the scoring test), and while developing with
// npm start the app uses it too, so it isn't downloaded twice. 355 MB from Hugging Face, pinned to one version
// and checked against its checksum (js/score/source.js).
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL, remoteUrl } from "../js/score/source.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(repo, ".models", "speako", ...MODEL.file.split("/"));

async function sha256(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

if (existsSync(file) && statSync(file).size === MODEL.bytes && (await sha256(file)) === MODEL.sha256) {
  console.log(`The sound model is already here and checks out: ${file}`);
  process.exit(0);
}

mkdirSync(dirname(file), { recursive: true });
const part = file + ".part";
const res = await fetch(remoteUrl());
if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
console.log(`Downloading the sound model (${Math.round(MODEL.bytes / 1e6)} MB) from Hugging Face...`);
const out = createWriteStream(part), hash = createHash("sha256");
let got = 0, shown = 0;
for await (const chunk of res.body) {
  hash.update(chunk);
  if (!out.write(chunk)) await new Promise((r) => out.once("drain", r));
  got += chunk.length;
  const pct = Math.floor((100 * got) / MODEL.bytes);
  if (pct >= shown + 10) { shown = pct - (pct % 10); console.log(`  ${shown}%`); }
}
await new Promise((r, j) => out.end((e) => (e ? j(e) : r())));
if (got !== MODEL.bytes || hash.digest("hex") !== MODEL.sha256) {
  rmSync(part, { force: true });
  throw new Error("The download didn't match the expected checksum, so it was thrown away. Try again.");
}
renameSync(part, file);
console.log(`Done, and the checksum matches: ${file}`);
