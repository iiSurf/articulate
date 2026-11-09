// Writes design/tips-review.html: a plain, printable sheet of every Ukrainian tip in data/tips/uk-en.json, for a Ukrainian
// speaker to read and mark. It is made from the file, so it is never out of date. Nothing in it names the app's
// purpose or a person.
//
//   npm run tips-review
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(repo, "data", "tips", "uk-en.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const uk = (s) => esc(s).replace(/([Ѐ-ӿ]+(?:[ '’-][Ѐ-ӿ]+)*)/g, '<span lang="uk">$1</span>');
const rows = Object.entries(data.sounds).map(([key, s]) => {
  const swaps = Object.entries(data.swaps).filter(([k]) => k.startsWith(`${key}>`)).map(([, v]) => `<li>${uk(v)}</li>`).join("");
  const words = Object.values(s.words ?? {}).flat().slice(0, 6).join(", ");
  return `<tr>
    <th scope="row">${esc(s.title)}<small>${esc(words)}</small></th>
    <td>${s.uk ? `<span lang="uk" class="big">${esc(s.uk.letter)}</span> (${uk(s.uk.word)})` : "<em>no match</em>"}</td>
    <td>${uk(s.tip)}${swaps ? `<ul>${swaps}</ul>` : ""}</td>
    <td class="mark"><span>OK</span><span>Change</span></td>
  </tr>`;
}).join("\n");
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ukrainian tips to review</title>
<style>
  body { font: 16px/1.45 system-ui, sans-serif; max-width: 980px; margin: 0 auto; padding: 24px 16px 48px; color: #0E1E36; }
  h1 { font-size: 26px; margin: 0 0 8px; } p { margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; }
  th, td { text-align: left; vertical-align: top; padding: 10px 8px; border-top: 1px solid #C9D3E3; }
  th small { display: block; font-weight: 400; color: #4A5A73; margin-top: 3px; }
  thead th { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #4A5A73; border-top: 0; }
  td ul { margin: 6px 0 0; padding-left: 18px; color: #3A4A63; } .big { font-size: 26px; font-weight: 700; }
  .mark span { display: inline-block; border: 2px solid #8895AC; border-radius: 6px; padding: 2px 8px; margin: 0 4px 4px 0; font-size: 13px; }
  @media print { body { max-width: none; } tr { break-inside: avoid; } }
</style></head><body>
<h1>Ukrainian tips to review</h1>
<p>These are short tips that help someone who speaks Ukrainian make English sounds, by starting from a Ukrainian sound they already have. They were written by a program, <b>not by a Ukrainian speaker</b>, and have never been checked.</p>
<p>Please read as a native speaker. For each row, mark <b>OK</b> or write what is wrong: a Ukrainian sound that isn't really close, a word that sounds unnatural, or a sentence that would confuse.</p>
<table>
<thead><tr><th>English sound</th><th>Ukrainian sound to start from</th><th>The tip, and what to say if they said another sound</th><th>Your mark</th></tr></thead>
<tbody>
${rows}
</tbody></table>
<p><b>Also</b> (shown when a sound is left out): ${esc(data.missing)}</p>
</body></html>
`;
writeFileSync(join(repo, "design", "tips-review.html"), page);
console.log(`Wrote design/tips-review.html (${Object.keys(data.sounds).length} sounds).`);
