// Which letters make which sound: "weather" + W EH DH ER → w | ea | th | er. The screens color letters, not sound
// symbols, so this lines a word's spelling up with its sounds from the dictionary.
//
// It tries every way of cutting the word into pieces, one piece per sound, and keeps the cheapest. A piece is
// cheap when it's a usual spelling of that sound (th for TH, ee for IY), costs more when it's an unusual one,
// and a letter can also be silent (the e in write, the k in knight), which costs a little. A few spellings make
// two sounds at once (x in box is K S, o in one is W AH).

// The usual spellings of each sound, most usual first.
const SPELL = {
  AA: "o a ah au aw al ough augh ow", AE: "a ai au", AH: "u o a e i ou oo oe y io ai ia eo",
  AO: "o a au aw ough augh oa al ou", AW: "ou ow au ough", AY: "i y ie igh ei ai uy eye ye",
  B: "b bb", CH: "ch tch t c", D: "d dd ed", DH: "th", EH: "e ea a ai ie ue eo u ay",
  ER: "er ir ur or ear our ar yr r re", EY: "a ai ay ei ey ea eigh e et", F: "f ff ph gh",
  G: "g gg gh gu gue", HH: "h wh j", IH: "i y e ui ee o u ie a", IY: "e ee ea ie ei y i ey eo ae oe ay",
  JH: "j g dg dge gg d ge", K: "c k ck ch cc q qu x cq que kh", L: "l ll", M: "m mm mb mn lm",
  N: "n nn kn gn pn", NG: "ng n", OW: "o oa ow oe ough ou eau ew", OY: "oi oy", P: "p pp",
  R: "r rr wr rh", S: "s ss c sc ce ps st", SH: "sh ti ci s ch ss si sci ce", T: "t tt ed th pt",
  TH: "th", UH: "oo u ou o", UW: "oo u ew ue o ou ui ough oe wo", V: "v f ph", W: "w u wh o",
  Y: "y i j", Z: "z s zz x ss", ZH: "s si g z ge",
};
// Spellings that make two sounds at once.
const PAIRS = {
  "K S": "x", "G Z": "x", "Y UW": "u ew eu ue iew", "Y UH": "u", "Y ER": "ur", "Y AH": "u", "W AH": "o",
  "K W": "qu", "AH L": "le", "HH W": "wh",
};
// What a silent letter costs. Silent e is the most usual; any letter not listed costs the most.
const SILENT = { "'": 0.5, e: 2.5, h: 3, k: 3, w: 3, b: 3, u: 3, g: 3.5, l: 3.5, t: 3.5, p: 3.5, c: 3.5, d: 4, s: 4, n: 4, i: 4, a: 4, o: 4 };
const UNUSUAL = 8; // one letter for a sound it doesn't usually spell

const table = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.split(" ")]));
const SPELLINGS = table(SPELL), PAIRINGS = table(PAIRS);
const bare = (p) => p.replace(/\d/g, "");

function cost(sound, letters) {
  const rank = (SPELLINGS[sound] || []).indexOf(letters);
  if (rank >= 0) return 1 + 0.15 * rank;
  return letters.length === 1 ? UNUSUAL : Infinity;
}

// word: as typed in the dictionary ("weather"). phones: its sounds ("W", "EH1", "DH", "ER0").
// Returns the pieces in order: { letters, sounds } where sounds are indexes into phones ([] for a silent letter).
// The pieces' letters always spell the whole word.
export function align(word, phones) {
  const L = [...word], P = phones.map(bare), n = L.length, m = P.length;
  const best = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  const back = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
  best[0][0] = 0;
  const step = (i, j, k, used, c) => {
    const total = best[i][j] + c;
    if (total < best[i + k][j + used]) {
      best[i + k][j + used] = total;
      back[i + k][j + used] = { i, j, letters: L.slice(i, i + k).join(""), sounds: Array.from({ length: used }, (_, x) => j + x) };
    }
  };
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (best[i][j] === Infinity) continue;
      for (let k = 1; k <= 4 && i + k <= n; k++) {
        const letters = L.slice(i, i + k).join("");
        if (j < m) {
          const c = cost(P[j], letters);
          if (c < Infinity) step(i, j, k, 1, c);
        }
        if (j + 1 < m && k <= 3 && (PAIRINGS[`${P[j]} ${P[j + 1]}`] || []).includes(letters)) step(i, j, k, 2, 1.5);
      }
      if (i < n) step(i, j, 1, 0, SILENT[L[i]] ?? 6);
    }
  }
  if (best[n][m] === Infinity) return [{ letters: word, sounds: phones.map((_, x) => x) }]; // no sensible cut: one piece
  const parts = [];
  for (let i = n, j = m; i > 0 || j > 0;) {
    const b = back[i][j];
    parts.unshift({ letters: b.letters, sounds: b.sounds });
    i = b.i;
    j = b.j;
  }
  return parts;
}
