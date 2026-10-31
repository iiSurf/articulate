// Runs the scoring model on a recording, in Node, with the same WebAssembly engine the browser uses.
// It reads the copy that `npm run get-model` puts in .models/speako/.
import { existsSync } from "node:fs";
import { join } from "node:path";
import * as ort from "onnxruntime-web";
import { normalize } from "../../js/score/audio.js";
import { MODEL, VOCAB } from "../../js/score/source.js";

// One thread, the way it will run on GitHub Pages (which can't send the headers threads need).
ort.env.wasm.numThreads = 1;

export async function loadModel(repo) {
  const file = join(repo, ".models", "speako", ...MODEL.file.split("/"));
  if (!existsSync(file)) throw new Error("The sound model isn't here yet. Run: npm run get-model");
  const session = await ort.InferenceSession.create(file);
  const [input] = session.inputNames, [output] = session.outputNames;
  return {
    vocab: VOCAB,
    // samples: 16 kHz, between -1 and 1. Returns the model's raw scores, one row per 20 ms.
    async run(samples) {
      const x = normalize(samples);
      const out = await session.run({ [input]: new ort.Tensor("float32", x, [1, x.length]) });
      const t = out[output], [, frames, size] = t.dims;
      return Array.from({ length: frames }, (_, f) => t.data.subarray(f * size, (f + 1) * size));
    },
  };
}
