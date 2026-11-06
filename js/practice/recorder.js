// Recording one try from the microphone (the teammate's Practice part). The recording stays in this page: it's
// handed to ctx.score and then dropped. Nothing is saved or sent anywhere.
//
// The same microphone settings as the try-it page (tools/score/try.html), where the color cuts were checked:
// no echo cancelling, noise suppression, or automatic loudness, which change the sounds the model hears.
import { MAX_SECONDS } from "./feedback.js";

export const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");

// Why recording didn't start, in plain words, for the screen to show.
export function micProblem(err) {
  const name = err?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError") return "blocked";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "none";
  return "other";
}

// Starts recording. Returns { stop, done }: stop() ends it early, and done resolves with { blob, seconds } when
// it ends (by stop(), or by itself after MAX_SECONDS). Throws if the microphone can't be used.
export async function startRecording({ onTick } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const chunks = [];
  const recorder = new MediaRecorder(stream);
  const started = performance.now();
  let timer, ticker;
  const done = new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      clearTimeout(timer);
      clearInterval(ticker);
      stream.getTracks().forEach((t) => t.stop());
      resolve({ blob: new Blob(chunks, { type: chunks[0]?.type || recorder.mimeType || "audio/webm" }), seconds: (performance.now() - started) / 1000 });
    };
    recorder.onerror = (e) => { stream.getTracks().forEach((t) => t.stop()); reject(e.error || e); };
  });
  recorder.start();
  const stop = () => { if (recorder.state !== "inactive") recorder.stop(); };
  timer = setTimeout(stop, MAX_SECONDS * 1000);
  if (onTick) ticker = setInterval(() => onTick((performance.now() - started) / 1000), 100);
  return { stop, done };
}
