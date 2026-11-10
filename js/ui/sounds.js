// Little sounds (iiSurf): a soft tap when a button is pressed, a chime for a right answer, a gentle low note for a
// wrong one, and a short fanfare when a lesson is done. Made in the browser with Web Audio (no sound files, nothing
// downloaded). Turned off in Your colors ("Sounds"). The microphone button never taps, so no click ends up in a recording.
let on = true;
let ctx = null;

export const setSoundsOn = (value) => { on = !!value; };
export const soundsOn = () => on;

// One note: a frequency, when it starts (seconds from now), how long, how loud, and its shape.
function note(ac, freq, at, dur, gain, type = "sine", slideTo = null) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime + at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + at + dur);
  g.gain.setValueAtTime(0.0001, ac.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
  o.connect(g).connect(ac.destination);
  o.start(ac.currentTime + at);
  o.stop(ac.currentTime + at + dur + 0.02);
}

const SOUNDS = {
  tap: (ac) => note(ac, 640, 0, 0.06, 0.05, "sine", 420),
  right: (ac) => { note(ac, 660, 0, 0.14, 0.09, "triangle"); note(ac, 990, 0.09, 0.22, 0.09, "triangle"); },
  wrong: (ac) => { note(ac, 330, 0, 0.16, 0.07, "sine"); note(ac, 262, 0.12, 0.24, 0.07, "sine"); },
  cheer: (ac) => {
    [523, 659, 784, 1047].forEach((f, i) => note(ac, f, i * 0.09, 0.2, 0.08, "triangle"));
    [523, 659, 784].forEach((f) => note(ac, f, 0.42, 0.6, 0.05, "sine"));
  },
};

// Plays a sound by name. It needs a tap first (browsers only allow sound after one), which every call here follows.
export function play(name) {
  if (!on || !SOUNDS[name]) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    SOUNDS[name](ctx);
  } catch { /* no sound on this device: nothing to do */ }
}

// The press sound on every button, through one listener. Answers make their own sounds, and the microphone none.
const PRESSABLE = "button, a.btn, .chip, a.wtile, a.sound-card, a.row-card, a.act, .tabs a, .back, .back-link, summary";
const SILENT = ".mic-btn, #record, .hear-choice, [data-choice], [data-no-tap]";
let installed = false;
export function installSounds(doc = document) {
  if (installed) return;
  installed = true;
  doc.addEventListener("click", (e) => {
    const t = e.target.closest?.(PRESSABLE);
    if (!t || t.closest(SILENT) || t.disabled) return;
    play("tap");
  }, true);
}
