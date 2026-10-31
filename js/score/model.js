// Loads the scoring model in the browser and runs it on a recording. Where the model comes from is in source.js.
// The engine is onnxruntime-web, kept in vendor/ (npm run vendor), on one thread: GitHub Pages can't send the
// headers that more threads need.
import * as ort from "../../vendor/onnxruntime-web/ort.wasm.min.mjs";
import { normalize } from "./audio.js";
import { modelBytes, VOCAB } from "./source.js";

let ready = null;

// Loads once, however often it's called. options go to modelBytes (onProgress, for a progress bar).
// Resolves to { from, vocab, run(samples) }: from says where the model came from ("local", "saved", "download"),
// and run takes 16 kHz samples between -1 and 1 and returns the model's raw scores, one row per 20 ms.
export function loadModel(options) {
  ready ??= (async () => {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = new URL("../../vendor/onnxruntime-web/", import.meta.url).href;
    const { bytes, from } = await modelBytes(options);
    const session = await ort.InferenceSession.create(bytes);
    const [input] = session.inputNames, [output] = session.outputNames;
    return {
      from,
      vocab: VOCAB,
      async run(samples) {
        const x = normalize(samples);
        const out = await session.run({ [input]: new ort.Tensor("float32", x, [1, x.length]) });
        const t = out[output], [, frames, size] = t.dims;
        return Array.from({ length: frames }, (_, f) => t.data.subarray(f * size, (f + 1) * size));
      },
    };
  })().catch((err) => {
    ready = null; // let the next try start over
    throw err;
  });
  return ready;
}
