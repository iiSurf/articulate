// Puts text on the page safely. Everything the learner types and anything read back from storage is escaped, so
// it shows as text and can never run as code. Build all markup with it (CLAUDE.md).
//
//   el.innerHTML = html`<li>${word}</li>`;                       word is escaped
//   html`<ul>${words.map((w) => html`<li>${w}</li>`)}</ul>`       lists, and html inside html, are kept as they are
//   html`<div>${raw(svg)}</div>`                                  raw() only for markup written in our own code

class Safe {
  constructor(text) { this.text = text; }
  toString() { return this.text; }
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ESC[c]);

function piece(value) {
  if (value instanceof Safe) return value.text;
  if (Array.isArray(value)) return value.map(piece).join("");
  if (value === null || value === undefined || value === false) return "";
  return escape(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => { out += piece(value) + strings[i + 1]; });
  return new Safe(out);
}

export const raw = (text) => new Safe(String(text));
