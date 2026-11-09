// What Articulate keeps on the phone: one entry in the browser's storage. Every iisurf.github.io site shares that
// storage, so the key starts with "articulate." (CLAUDE.md). Nothing here is ever sent anywhere.
// Changing the shape of what's saved means a new VERSION and a step in sanitize() that upgrades older saves.
import { DEFAULT_LOOKS, LOOKS } from "./looks.js";

export const KEY = "articulate.v1";
export const VERSION = 1;
export const MODES = ["read", "listen", "speak"];
const DAY = new Set(LOOKS.filter((l) => !l.dark).map((l) => l.id));
const NIGHT = new Set(LOOKS.filter((l) => l.dark).map((l) => l.id));

export function fresh() {
  return { version: VERSION, words: [], current: null, mode: "speak", looks: { ...DEFAULT_LOOKS }, tour: { step: 0, done: false }, tipsSeen: [], history: {}, rounds: {} };
}

// Everything read back from storage goes through here. Whatever is missing or wrong becomes the starting value,
// so a broken or old save can never break the app.
export function sanitize(saved) {
  const s = fresh();
  if (!saved || typeof saved !== "object") return s;
  if (Array.isArray(saved.words)) {
    const seen = new Set();
    for (const w of saved.words) {
      const text = typeof w?.text === "string" ? w.text.trim().toLowerCase().slice(0, 40) : "";
      if (!text || seen.has(text)) continue;
      seen.add(text);
      s.words.push({ text, added: typeof w.added === "string" ? w.added.slice(0, 10) : "" });
    }
  }
  // The word being practiced right now: one of their words, or nothing.
  if (typeof saved.current === "string" && s.words.some((w) => w.text === saved.current)) s.current = saved.current;
  if (MODES.includes(saved.mode)) s.mode = saved.mode;
  const looks = saved.looks && typeof saved.looks === "object" ? saved.looks : {};
  if (DAY.has(looks.day)) s.looks.day = looks.day;
  if (NIGHT.has(looks.night)) s.looks.night = looks.night;
  if (typeof looks.followDark === "boolean") s.looks.followDark = looks.followDark;
  const tour = saved.tour && typeof saved.tour === "object" ? saved.tour : {};
  if (Number.isInteger(tour.step) && tour.step >= 0 && tour.step <= 6) s.tour.step = tour.step;
  if (typeof tour.done === "boolean") s.tour.done = tour.done;
  if (Array.isArray(saved.tipsSeen)) s.tipsSeen = [...new Set(saved.tipsSeen.filter((t) => typeof t === "string"))];
  // What each graded try left behind (js/progress.js). Anything that isn't shaped right is dropped, not repaired.
  if (saved.history && typeof saved.history === "object" && !Array.isArray(saved.history)) {
    for (const [word, tries] of Object.entries(saved.history).slice(0, 200)) {
      if (!/^[a-z' -]{1,40}$/.test(word) || !Array.isArray(tries)) continue;
      const kept = tries.filter((t) => t && typeof t.at === "string" && Number.isFinite(t.score) && t.score >= 0 && t.score <= 100 && Array.isArray(t.bad))
        .slice(-30).map((t) => ({
          at: t.at.slice(0, 30), score: Math.round(t.score),
          bad: t.bad.filter((b) => Array.isArray(b) && typeof b[0] === "string" && ["orange", "red"].includes(b[1])).slice(0, 12)
            .map((b) => [b[0].slice(0, 4), b[1], typeof b[2] === "string" ? b[2].slice(0, 12) : ""]),
        }));
      if (kept.length) s.history[word] = kept;
    }
  }
  // How many stars the last round of each sound got (js/round.js), to say "Last round: 1 of 5".
  if (saved.rounds && typeof saved.rounds === "object" && !Array.isArray(saved.rounds)) {
    for (const [sound, r] of Object.entries(saved.rounds).slice(0, 40)) {
      if (/^[A-Z]{1,2}[01]?$/.test(sound) && r && Number.isInteger(r.stars) && r.stars >= 0 && r.stars <= 5 && typeof r.at === "string") s.rounds[sound] = { at: r.at.slice(0, 30), stars: r.stars };
    }
  }
  return s;
}

export function load(storage = globalThis.localStorage) {
  try {
    return sanitize(JSON.parse(storage.getItem(KEY)));
  } catch {
    return fresh(); // storage turned off, or something unreadable in it
  }
}

// Returns false when the browser won't save (private browsing, or storage full), so the app can say so.
export function save(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
