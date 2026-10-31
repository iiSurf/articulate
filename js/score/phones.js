// The sounds the scoring model hears, and how the dictionary's sounds map onto them.
//
// The model (a wav2vec2 trained on TIMIT; PLAN.md, "The scoring test") hears 38 sounds, written in IPA.
// The CMU Pronouncing Dictionary writes 39 sounds in ARPAbet, with a stress number on each vowel.
// Some are one sound to the model: AO and AA (caught, cot), ZH and SH (measure, mesh), and AH, which
// covers both the strong vowel in "cut" and the small "uh" in "about".

export const CMU_TO_MODEL = {
  AA: "ɑ", AE: "æ", AH: "ə", AO: "ɑ", AW: "aʊ", AY: "aɪ", B: "b", CH: "ʧ", D: "d", DH: "ð",
  EH: "ɛ", ER: "ɝ", EY: "eɪ", F: "f", G: "g", HH: "h", IH: "ɪ", IY: "i", JH: "ʤ", K: "k",
  L: "l", M: "m", N: "n", NG: "ŋ", OW: "oʊ", OY: "ɔɪ", P: "p", R: "ɹ", S: "s", SH: "ʃ",
  T: "t", TH: "θ", UH: "ʊ", UW: "u", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʃ",
};

// American English often says t and d between vowels as a quick tap (water, ladder). That is right, not a
// mistake, so the tap counts as saying t or d.
const ALSO_RIGHT = { T: ["ɾ"], D: ["ɾ"] };

// For each dictionary sound of a word, the model sounds that count as saying it right.
// targets(["TH", "IH1", "NG", "K"]) → [{ cmu: "TH", ok: ["θ"] }, { cmu: "IH", ok: ["ɪ"] }, ...]
export function targets(cmuPhones) {
  return cmuPhones.map((p) => {
    const cmu = p.replace(/[0-9]/g, "");
    const sound = CMU_TO_MODEL[cmu];
    if (!sound) throw new Error(`Unknown sound: ${p}`);
    return { cmu, ok: [sound, ...(ALSO_RIGHT[cmu] || [])] };
  });
}
