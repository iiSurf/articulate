// The app shell's logic: safe markup, the looks, and what's saved on the phone.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { escape, html, raw } from "../../js/html.js";
import { DEFAULT_LOOKS, LOOKS, byId, lookFor } from "../../js/looks.js";
import { KEY, fresh, load, sanitize, save } from "../../js/store.js";

test("typed text is escaped, so it can never become markup", () => {
  const word = `<img src=x onerror="alert(1)">`;
  assert.equal(String(html`<li>${word}</li>`), "<li>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</li>");
  assert.equal(escape(`a & b's`), "a &amp; b&#39;s");
});

test("lists and html inside html are kept; raw is only for our own markup", () => {
  const list = html`<ul>${["a", "<b>"].map((w) => html`<li>${w}</li>`)}</ul>`;
  assert.equal(String(list), "<ul><li>a</li><li>&lt;b&gt;</li></ul>");
  assert.equal(String(html`${raw("<svg></svg>")}${null}${false}${undefined}${0}`), "<svg></svg>0");
});

test("seven looks: five for the day, two for night, each with a name, colors, and a band picture", () => {
  assert.equal(LOOKS.length, 7);
  assert.equal(LOOKS.filter((l) => l.dark).length, 2);
  assert.equal(new Set(LOOKS.map((l) => l.id)).size, 7);
  for (const l of LOOKS) {
    assert.ok(l.name && /^#[0-9A-F]{6}$/i.test(l.band) && /^#[0-9A-F]{6}$/i.test(l.bandInk), l.id);
    assert.match(l.art(), /^<svg/);
  }
});

test("every look has its colors in css/looks.css", () => {
  const css = readFileSync(new URL("../../css/looks.css", import.meta.url), "utf8");
  for (const l of LOOKS) assert.ok(css.includes(`[data-look="${l.id}"]`), l.id);
});

test("which look shows: night when the phone is dark and it should follow, otherwise day", () => {
  assert.equal(lookFor(DEFAULT_LOOKS, false), "sky");
  assert.equal(lookFor(DEFAULT_LOOKS, true), "night");
  assert.equal(lookFor({ ...DEFAULT_LOOKS, followDark: false }, true), "sky");
  assert.equal(byId("nope").id, "sky");
});

test("a fresh start, and a broken save, both give the starting values", () => {
  assert.deepEqual(sanitize(null), fresh());
  assert.deepEqual(sanitize("nonsense"), fresh());
  const s = sanitize({ words: "x", mode: "shout", looks: { day: "night", night: "sky", followDark: "yes" }, tour: { step: 99 }, tipsSeen: [1] });
  assert.deepEqual(s, fresh());
});

test("words are kept lowercase, trimmed, once each", () => {
  const s = sanitize({ words: [{ text: " Weather ", added: "2026-11-01T10:00" }, { text: "weather" }, { text: "" }, { nope: 1 }, { text: "think" }] });
  assert.deepEqual(s.words, [{ text: "weather", added: "2026-11-01" }, { text: "think", added: "" }]);
});

test("settings that make sense are kept", () => {
  const s = sanitize({ mode: "read", looks: { day: "kalyna", night: "petrykivka", followDark: false }, tour: { step: 3, done: true }, tipsSeen: ["read", "read", "listen"] });
  assert.equal(s.mode, "read");
  assert.deepEqual(s.looks, { day: "kalyna", night: "petrykivka", followDark: false });
  assert.deepEqual(s.tour, { step: 3, done: true });
  assert.deepEqual(s.tipsSeen, ["read", "listen"]);
});

test("saving and loading go through one key, and a browser that won't save is told apart", () => {
  const box = new Map();
  const storage = { getItem: (k) => box.get(k) ?? null, setItem: (k, v) => box.set(k, v) };
  const s = fresh();
  s.words.push({ text: "weather", added: "2026-11-01" });
  assert.equal(save(s, storage), true);
  assert.ok(KEY.startsWith("articulate."));
  assert.deepEqual(load(storage), s);
  const full = { getItem: () => "{broken", setItem: () => { throw new Error("full"); } };
  assert.equal(save(s, full), false);
  assert.deepEqual(load(full), fresh());
});
