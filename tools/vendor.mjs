// Copies the browser files of onnxruntime-web (the engine that runs the scoring model) from node_modules into
// vendor/, where the app loads them. They are committed, so the app works on GitHub Pages and from a fresh clone
// without npm. The version is the one package-lock.json pins.
//
//   npm run vendor        (after npm install, and after any update of onnxruntime-web)
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(repo, "node_modules", "onnxruntime-web");
const to = join(repo, "vendor", "onnxruntime-web");
// The module the app imports, the glue it loads, and the WebAssembly engine itself (one thread, no WebGPU).
const FILES = ["ort.wasm.min.mjs", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"];

const { version, license } = JSON.parse(readFileSync(join(from, "package.json"), "utf8"));
mkdirSync(to, { recursive: true });
for (const f of FILES) copyFileSync(join(from, "dist", f), join(to, f));
writeFileSync(join(to, "LICENSE"), `MIT License

Copyright (c) Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);
writeFileSync(join(to, "README.md"), `# onnxruntime-web ${version}

The engine that runs the scoring model in the browser, by Microsoft (${license} license, in LICENSE).
Copied unchanged from the npm package by \`npm run vendor\` (tools/vendor.mjs): ${FILES.map((f) => `\`${f}\``).join(", ")}.
Don't edit these files. To update, change the version in package.json, run \`npm install\`, then \`npm run vendor\`.
`);
console.log(`vendor/onnxruntime-web: version ${version}, ${FILES.length} files`);
