// A small local web server for this repository, so the app and the drafts can be opened in a browser.
//
//   npm start                 (http://localhost:8000)
//   PORT=8080 npm start
//
// The app needs a server, not file://, because it loads its modules and data with fetch. This one answers only on
// this computer, never caches (a change shows on reload), and serves only files inside this folder. Microphones
// work on localhost, so Out loud can be tried here; a phone on the same Wi-Fi can't use the microphone over
// plain http, so try phones on GitHub Pages instead. Works on a Mac, Windows, and Linux.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".dict": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".wasm": "application/wasm", ".onnx": "application/octet-stream",
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg",
};

export function startServer({ port = 0, host = "127.0.0.1" } = {}) {
  const server = createServer((req, res) => {
    let file = normalize(join(repo, decodeURIComponent(new URL(req.url, "http://localhost").pathname)));
    if (file !== repo && !file.startsWith(repo + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, host, () =>
    resolve({ url: `http://${host === "127.0.0.1" ? "localhost" : host}:${server.address().port}`, close: () => server.close() })));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { url } = await startServer({ port: Number(process.env.PORT) || 8000 });
  console.log(`Serving this folder at ${url}  (Ctrl-C to stop)`);
  console.log(`  The theme drafts: ${url}/design/themes.html`);
}
