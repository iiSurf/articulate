// How to make a sound (iiSurf's Words part): a side view of the head, facing left, where the tongue, lips, jaw, and
// soft palate move for each sound, with the air and the buzz in the throat. Starting from a Ukrainian sound the learner
// already has, it shows the move to the English one, the lips from the front when they matter, a map of the mouth
// for vowels, and what they said next to what they wanted. Pure: everything returns markup as text, nothing touches
// the page (js/ui/mouthui.js does the buttons). Our own drawings. The shapes come from general phonetics knowledge and
// have not been checked by a teacher yet (design/mouth.html, LOG.md, November 9).
//
// Colors come from CSS custom properties (css/mouth.css), so every look sets them.
import { escape, html, raw } from "../html.js";

const R = (n) => Math.round(n * 10) / 10;
const pt = ([x, y]) => `${R(x)} ${R(y)}`;
const add = ([x, y], [dx, dy]) => [x + dx, y + dy];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const JAW = 22; // how far the jaw drops when it's wide open

// A smooth line through points (Catmull-Rom as cubic Béziers).
function smooth(pts) {
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${pt(p2)}`;
  }
  return d;
}

// ---- Poses ------------------------------------------------------------------------------------------------------
// tongue: points on its top surface, front to back (tip, blade, body, back; front is the underside near the tip).
// jaw: 0 (teeth together) to 1 (wide open). lips: rest, open, spread, slight (a little round), round, closed,
// teeth-on-lip, light-lip. nose: air through the nose. voice: a buzz. air: mouth, teeth, nose, puff, throat.
const T = (tip, blade, body, back, front) => ({ tip, blade, body, back, ...(front ? { front } : {}) });
const REST = T([93, 156], [110, 140], [150, 124], [194, 148]);
const TH_TONGUE = T([70, 150], [94, 140], [148, 126], [194, 150], [80, 160]);
const S_TONGUE = T([90, 151], [102, 120], [146, 120], [194, 148], [96, 160]);
const RIDGE = T([99, 106], [114, 122], [150, 124], [196, 150], [94, 140]); // tip on the ridge behind the top teeth
const DENTAL = T([91, 112], [110, 124], [150, 124], [196, 150], [92, 142]); // tip on the back of the top teeth
const VELAR = T([93, 158], [122, 138], [180, 104], [200, 130]); // back of the tongue up against the soft palate
const NG_TONGUE = T([93, 158], [122, 140], [184, 108], [200, 134]);
const R_TONGUE = T([116, 113], [130, 125], [160, 121], [196, 150], [104, 140]);
const U_TONGUE = T([95, 158], [118, 144], [172, 108], [199, 140]);

export const POSES = {
  // English, by the dictionary's name for the sound (the same keys as data/tips/uk-en.json)
  TH: { tongue: TH_TONGUE, jaw: 0.35, lips: "open", air: "teeth", say: "the tip of the tongue between the teeth, air blowing out softly over it, no buzz" },
  DH: { tongue: TH_TONGUE, jaw: 0.35, lips: "open", air: "teeth", voice: true, say: "the tip of the tongue between the teeth, air blowing out over it, with a buzz" },
  W: { tongue: U_TONGUE, jaw: 0.15, lips: "round", air: "mouth", voice: true, say: "lips round and pushed forward, teeth away from the lips, the back of the tongue up" },
  V: { tongue: REST, jaw: 0.05, lips: "teeth-on-lip", air: "teeth", voice: true, say: "the top teeth resting on the bottom lip, air buzzing through" },
  R: { tongue: R_TONGUE, jaw: 0.25, lips: "slight", air: "mouth", voice: true, say: "the tip of the tongue pulled up and back, touching nothing, lips a little round" },
  NG: { tongue: NG_TONGUE, jaw: 0.2, lips: "rest", nose: true, air: "nose", voice: true, say: "the back of the tongue up against the soft palate, air going out through the nose" },
  AE: { tongue: T([93, 162], [112, 150], [146, 138], [196, 154]), jaw: 0.7, lips: "open", voice: true, say: "the mouth open wide, the tongue low and forward" },
  EH: { tongue: T([93, 158], [110, 140], [142, 128], [195, 150]), jaw: 0.35, lips: "rest", voice: true, say: "the mouth half open, the tongue in the middle and forward" },
  IH: { tongue: T([92, 157], [110, 134], [148, 120], [195, 147]), jaw: 0.15, lips: "rest", voice: true, say: "the tongue high but relaxed, a little back from the ee spot, lips loose" },
  IY: { tongue: T([92, 154], [104, 116], [132, 100], [194, 140]), jaw: 0.05, lips: "spread", voice: true, say: "the tongue high and forward, close to the roof of the mouth, lips spread in a smile" },
  UH: { tongue: T([94, 158], [116, 142], [168, 116], [198, 144]), jaw: 0.2, lips: "slight", voice: true, say: "the back of the tongue fairly high and relaxed, lips a little round" },
  UW: { tongue: U_TONGUE, jaw: 0.1, lips: "round", voice: true, say: "the back of the tongue high, lips round" },
  OW: { tongue: U_TONGUE, jaw: 0.2, lips: "round", voice: true, say: "it ends with the lips round and the back of the tongue up, like у" },
  AO: { tongue: T([94, 162], [118, 150], [176, 130], [199, 154]), jaw: 0.5, lips: "slight", voice: true, say: "the mouth open, the tongue low and back, lips a little round and still" },
  AA: { tongue: T([94, 164], [118, 156], [168, 142], [198, 160]), jaw: 0.7, lips: "open", voice: true, say: "the mouth wide open, the tongue low and back" },
  AH1: { tongue: T([93, 160], [114, 146], [158, 130], [197, 152]), jaw: 0.45, lips: "rest", voice: true, say: "the mouth half open, the tongue low in the middle, relaxed" },
  AH0: { tongue: T([93, 158], [112, 142], [154, 126], [196, 150]), jaw: 0.25, lips: "rest", voice: true, say: "everything relaxed, the tongue resting in the middle of the mouth" },
  ER: { tongue: T([114, 116], [130, 126], [160, 122], [196, 150], [102, 142]), jaw: 0.2, lips: "slight", voice: true, say: "like an r you hold: the tip pulled back, touching nothing, lips a little round" },
  HH: { tongue: REST, jaw: 0.4, lips: "open", air: "throat", say: "the mouth open, a soft breath from the throat, no buzz" },
  P: { tongue: REST, jaw: 0.05, lips: "closed", air: "puff", say: "lips together, then open with a puff of air" },
  T: { tongue: RIDGE, jaw: 0.15, lips: "rest", air: "puff", say: "the tip of the tongue on the ridge behind the top teeth, then a puff of air" },
  K: { tongue: VELAR, jaw: 0.2, lips: "rest", air: "puff", say: "the back of the tongue up against the soft palate, then a puff of air" },
  // Sounds a learner may say instead (for "what you said")
  S: { tongue: S_TONGUE, jaw: 0.05, lips: "spread", air: "teeth", say: "the tongue behind the teeth, air hissing through" },
  Z: { tongue: S_TONGUE, jaw: 0.05, lips: "spread", air: "teeth", voice: true, say: "the tongue behind the teeth, air buzzing through" },
  F: { tongue: REST, jaw: 0.05, lips: "teeth-on-lip", air: "teeth", say: "the top teeth on the bottom lip, no buzz" },
  D: { tongue: RIDGE, jaw: 0.15, lips: "rest", voice: true, say: "the tip of the tongue tapping the ridge behind the top teeth, with a buzz" },
  B: { tongue: REST, jaw: 0.05, lips: "closed", voice: true, say: "lips together, with a buzz and no puff" },
  G: { tongue: VELAR, jaw: 0.2, lips: "rest", voice: true, say: "the back of the tongue up against the soft palate, with a buzz" },
  L: { tongue: RIDGE, jaw: 0.2, lips: "rest", air: "mouth", voice: true, say: "the tip of the tongue touching the ridge behind the top teeth" },
  N: { tongue: RIDGE, jaw: 0.15, lips: "rest", nose: true, air: "nose", voice: true, say: "the tip of the tongue on the ridge behind the top teeth, air through the nose" },
};

// The Ukrainian sounds the tips start from (data/tips/uk-en.json, "uk"), by letter.
export const UK_POSES = {
  с: { ...POSES.S, say: "Ukrainian с: the tongue behind the teeth, air hissing through" },
  з: { ...POSES.Z, say: "Ukrainian з: the tongue behind the teeth, with a buzz" },
  у: { tongue: U_TONGUE, jaw: 0.15, lips: "round", voice: true, say: "Ukrainian у: lips round, the back of the tongue up" },
  в: { tongue: REST, jaw: 0.1, lips: "light-lip", voice: true, say: "Ukrainian в: the bottom lip close to the top teeth, barely touching" },
  р: { tongue: T([100, 104], [114, 124], [150, 124], [196, 150], [96, 140]), jaw: 0.2, lips: "rest", voice: true, say: "Ukrainian р: the tip of the tongue tapping the ridge behind the top teeth" },
  н: { ...POSES.N, tongue: DENTAL, say: "Ukrainian н, as in ні: the tip of the tongue behind the top teeth, air through the nose" },
  е: { ...POSES.EH, jaw: 0.3, say: "Ukrainian е: the mouth half open, the tongue in the middle and forward" },
  и: { tongue: T([92, 157], [112, 136], [152, 121], [195, 147]), jaw: 0.15, lips: "rest", voice: true, say: "Ukrainian и: the tongue high but relaxed" },
  і: { ...POSES.IY, lips: "rest", say: "Ukrainian і: the tongue high and forward" },
  о: { tongue: T([94, 160], [118, 148], [174, 122], [199, 148]), jaw: 0.35, lips: "slight", voice: true, say: "Ukrainian о: the mouth half open, lips a little round, the tongue back" },
  а: { tongue: T([94, 163], [116, 152], [160, 140], [197, 157]), jaw: 0.7, lips: "open", voice: true, say: "Ukrainian а: the mouth wide open, the tongue low" },
  х: { tongue: T([93, 158], [120, 140], [178, 110], [200, 136]), jaw: 0.25, lips: "rest", air: "mouth", say: "Ukrainian х: the back of the tongue close to the soft palate, air scraping through" },
  п: { ...POSES.P, air: null, say: "Ukrainian п: lips together, then open with no puff" },
  т: { tongue: DENTAL, jaw: 0.15, lips: "rest", say: "Ukrainian т: the tip of the tongue on the back of the top teeth, no puff" },
  к: { ...POSES.K, air: null, say: "Ukrainian к: the back of the tongue against the soft palate, no puff" },
};

// What the model heard (js/score/phones.js), as the pose to show for "what you said".
export const HEARD = {
  s: "S", z: "Z", t: "T", d: "D", f: "F", v: "V", w: "W", l: "L", n: "N", ŋ: "NG", p: "P", b: "B", k: "K", g: "G",
  θ: "TH", ð: "DH", ɹ: "R", h: "HH", ɪ: "IH", i: "IY", ɛ: "EH", æ: "AE", ʊ: "UH", u: "UW", ɑ: "AA", oʊ: "OW",
  ə: "AH0", ɝ: "ER",
};
// Names for the extra sounds (the rest come from the tips' titles).
const NAMES = { S: "s", Z: "z", F: "f", D: "d", B: "b", G: "g", L: "l", N: "n" };
// Where the lips do the work, so they're shown from the front too.
const LIPS_MATTER = new Set(["W", "V", "F", "P", "B", "UW", "UH", "OW", "AO", "R", "ER", "IY"]);
// The vowel map: where the tongue is highest. Front of the mouth on the left, like the side view. [x, y]
const MAP = { IY: [58, 44], IH: [104, 80], EH: [102, 118], AE: [126, 148], AH1: [172, 116], AA: [222, 148], UH: [196, 78], UW: [224, 44], OW: [224, 44], AO: [214, 132], ER: [150, 92], AH0: [150, 104] };
const MAP_UK = { і: [44, 62], и: [90, 100], е: [92, 136], а: [172, 150], у: [208, 58], о: [210, 116] };
export const isVowel = (key) => key in MAP;

// ---- Drawing ----------------------------------------------------------------------------------------------------
function tonguePath(t, jy) {
  const tip = add(t.tip, [0, jy]), blade = add(t.blade, [0, jy * 0.85]), body = add(t.body, [0, jy * 0.5]), back = add(t.back, [0, jy * 0.25]);
  const front = add(t.front ?? [t.tip[0] + 7, t.tip[1] + 11], [0, jy]);
  const root = [203, 230];
  const under = [root, [172, 216 + jy * 0.3], [132, 200 + jy * 0.6], [106, 186 + jy], front, tip];
  return `${smooth([tip, blade, body, back, root])} ${smooth(under).replace(/^M[^C]*/, "")} Z`;
}

// Lips in the side view: upper { front, edge, inner }, lower { top, inner, front, bottom }. The lower lip moves with the jaw.
const LIPS = {
  rest: (j) => [{ front: [52, 126], edge: [58, 141], inner: [75, 141] }, { top: [58, 147 + j], inner: [76, 147 + j], front: [50, 160 + j], bottom: [62, 176 + j] }],
  open: (j) => [{ front: [52, 125], edge: [58, 139], inner: [75, 139] }, { top: [58, 150 + j], inner: [76, 150 + j], front: [50, 163 + j], bottom: [62, 178 + j] }],
  spread: (j) => [{ front: [57, 127], edge: [62, 140], inner: [76, 140] }, { top: [62, 147 + j], inner: [77, 147 + j], front: [56, 158 + j], bottom: [65, 173 + j] }],
  slight: (j) => [{ front: [47, 127], edge: [51, 140], inner: [72, 140] }, { top: [51, 148 + j], inner: [72, 148 + j], front: [45, 159 + j], bottom: [59, 176 + j] }],
  round: (j) => [{ front: [40, 128], edge: [44, 141], inner: [70, 141] }, { top: [44, 148 + j], inner: [70, 148 + j], front: [38, 160 + j], bottom: [57, 177 + j] }],
  closed: () => [{ front: [52, 127], edge: [57, 145], inner: [75, 145] }, { top: [57, 145], inner: [75, 145], front: [49, 159], bottom: [61, 176] }],
  "teeth-on-lip": () => [{ front: [52, 124], edge: [58, 137], inner: [74, 137] }, { top: [72, 148], inner: [83, 152], front: [60, 160], bottom: [64, 177] }],
  "light-lip": () => [{ front: [52, 125], edge: [58, 138], inner: [74, 138] }, { top: [68, 152], inner: [80, 155], front: [57, 162], bottom: [63, 177] }],
};
function lipsSide(kind, jy) {
  const [up, lo] = (LIPS[kind] ?? LIPS.rest)(jy);
  const upperEdge = `C60 114 ${pt(add(up.front, [2, -8]))} ${pt(up.front)} C${pt(add(up.front, [-1, 8]))} ${pt(add(up.edge, [-5, 0]))} ${pt(up.edge)} C${pt(add(up.edge, [6, 1]))} ${pt(add(up.inner, [-4, 0]))} ${pt(up.inner)}`;
  const lowerEdge = `M${pt(lo.inner)} C${pt(add(lo.inner, [-6, -1]))} ${pt(add(lo.top, [5, 0]))} ${pt(lo.top)} C${pt(add(lo.top, [-6, 1]))} ${pt(add(lo.front, [0, -7]))} ${pt(lo.front)} C${pt(add(lo.front, [0, 8]))} ${pt(add(lo.bottom, [-7, 0]))} ${pt(lo.bottom)}`;
  const chin = `C${pt(add(lo.bottom, [-2, 8]))} 58 ${204 + jy} 66 ${218 + jy} C76 ${232 + jy} 116 ${238 + jy * 0.5} 150 242 C166 248 172 268 176 300`;
  return {
    upper: `M67 112 ${upperEdge} L77 114 Z`,
    lower: `${lowerEdge} L${pt(add(lo.bottom, [17, 0]))} L${pt(add(lo.inner, [3, 6]))} Z`,
    outline: `M114 0 C102 26 76 54 46 80 C33 91 37 102 57 102 C64 102 68 106 67 112 ${upperEdge} ${lowerEdge} ${chin}`,
    bottom: lo.bottom,
  };
}

const PAUSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/></svg>';
let ids = 0;
// Just the mouth: lips, teeth, tongue, and the roof of the mouth, for the side-by-side pictures.
const CLOSE = "30 86 180 122";
// The side view for a pose, as an SVG string. ghost: another pose drawn as a dashed tongue. arrow: [from, to].
// label: what a screen reader says. crop: the part of the 300 by 300 drawing to show.
export function sideView(pose, { ghost = null, arrow = null, label = "", crop = "24 58 236 232" } = {}) {
  const jy = (pose.jaw ?? 0.15) * JAW;
  const lips = lipsSide(pose.lips, jy);
  const head = `M300 0 L114 0 C102 26 76 54 46 80 C33 91 37 102 57 102 C64 102 68 106 67 112 L80 116 L82 ${176 + jy} L${pt(lips.bottom)} C${pt(add(lips.bottom, [-2, 8]))} 58 ${204 + jy} 66 ${218 + jy} C76 ${232 + jy} 116 ${238 + jy * 0.5} 150 242 C166 248 172 268 176 300 L300 300 Z`;
  const air = [
    "M57 102 C58 96 62 90 72 86 C100 76 150 70 200 74 C222 77 233 86 235 102 L237 300 L207 300 L205 252",
    `C204 242 200 236 196 232 L170 ${218 + jy * 0.3} C140 ${206 + jy * 0.5} 112 ${194 + jy} 98 ${184 + jy}`,
    `L92 ${178 + jy} L84 ${158 + jy} L64 ${152 + jy} L62 128 L76 110 L94 106`,
    "C98 104 100 101 104 100 C116 96 130 94 150 93 C166 93 178 95 186 98",
    pose.nose ? "C194 104 199 118 197 132 C201 138 208 135 208 126 C208 114 207 102 205 92 C200 90 196 89 190 89"
              : "C200 104 212 108 222 108 C228 108 233 106 235 102 C230 93 214 89 190 89",
    "C160 88 120 90 96 94 C80 97 66 100 57 102 Z",
  ].join(" ");
  const tip = add(pose.tongue.tip, [0, jy]);
  const FLOWS = {
    mouth: "M218 262 C218 210 216 160 200 132 C176 110 126 112 96 132 C84 140 66 146 22 147",
    teeth: `M218 262 C218 210 216 160 200 132 C176 112 130 116 ${R(tip[0] + 22)} ${R(tip[1] - 9)} C${R(tip[0] + 8)} ${R(tip[1] - 5)} ${R(tip[0] - 2)} ${R(tip[1] - 4)} 22 ${R(tip[1] - 4)}`,
    nose: "M218 262 C218 210 222 150 222 116 C220 96 180 80 120 80 C90 80 64 88 36 96",
    puff: "M46 146 L20 146 M44 136 L22 128 M44 156 L22 164",
    throat: "M218 262 C218 210 216 160 200 132 C176 116 130 120 100 136 C86 143 66 148 22 149",
  };
  const id = `mo${++ids}`;
  const skin = 'fill="var(--mouth-skin)"';
  const line = 'stroke="var(--mouth-line)" stroke-width="2.5" stroke-linejoin="round"';
  return `<svg viewBox="${crop}" role="img" aria-label="${escape(label)}" xmlns="http://www.w3.org/2000/svg" class="mouth-svg">
<defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--mouth-flow)"/></marker></defs>
<path d="${head}" ${skin}/>
<path d="${air}" fill="var(--mouth-air)" ${line}/>
<path d="M78 ${152 + jy} L85 ${150 + jy} C91 ${160 + jy} 94 ${170 + jy} 94 ${181 + jy} L84 ${181 + jy} C82 ${170 + jy} 78 ${161 + jy} 78 ${152 + jy} Z" fill="var(--mouth-tooth)" stroke="var(--mouth-tooth-line)" stroke-width="2"/>
${ghost ? `<path d="${tonguePath(ghost.tongue, (ghost.jaw ?? 0.15) * JAW)}" fill="none" stroke="var(--mouth-ghost)" stroke-width="2.5" stroke-dasharray="5 5" opacity=".65"/>` : ""}
<path d="${tonguePath(pose.tongue, jy)}" fill="var(--mouth-tongue)" stroke="var(--mouth-tongue-line)" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M78 108 L92 107 C94 118 91 134 84 148 L76 147 C73 136 73 120 78 108 Z" fill="var(--mouth-tooth)" stroke="var(--mouth-tooth-line)" stroke-width="2"/>
<path d="${lips.upper}" ${skin}/><path d="${lips.lower}" ${skin}/>
<path d="${lips.outline}" fill="none" ${line} stroke-linecap="round"/>
${pose.air ? `<path d="${FLOWS[pose.air]}" fill="none" stroke="var(--mouth-flow)" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round" marker-end="url(#${id})"/>` : ""}
${pose.voice ? '<path d="M209 268 l5 -7 l5 7 l5 -7 l5 7 l5 -7" fill="none" stroke="var(--mouth-flow)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' : ""}
${arrow ? `<path d="M${pt(arrow[0])} L${pt(arrow[1])}" stroke="var(--mouth-flow)" stroke-width="3.5" stroke-linecap="round" marker-end="url(#${id})"/>` : ""}
</svg>`;
}

// The lips from the front, 120 by 80.
export function frontView(kind, label = "") {
  const lip = 'fill="var(--mouth-lip)" stroke="var(--mouth-line)" stroke-width="2.5" stroke-linejoin="round"';
  const dark = 'fill="var(--mouth-inside)"';
  const teeth = (y, h, w) => `<rect x="${60 - w / 2}" y="${y}" width="${w}" height="${h}" rx="3" fill="var(--mouth-tooth)" stroke="var(--mouth-tooth-line)" stroke-width="1.5"/>`;
  const SHAPES = {
    round: `<ellipse cx="60" cy="40" rx="27" ry="24" ${lip}/><ellipse cx="60" cy="40" rx="10" ry="9" ${dark}/>`,
    slight: `<ellipse cx="60" cy="40" rx="36" ry="22" ${lip}/><ellipse cx="60" cy="40" rx="20" ry="9" ${dark}/>`,
    spread: `<path d="M8 40 C30 22 90 22 112 40 C90 58 30 58 8 40 Z" ${lip}/><path d="M20 40 C40 32 80 32 100 40 C80 47 40 47 20 40 Z" ${dark}/>${teeth(33, 6, 60)}`,
    "teeth-on-lip": `<path d="M14 38 C34 18 86 18 106 38 C86 60 34 60 14 38 Z" ${lip}/><path d="M24 36 C44 30 76 30 96 36 L96 42 C76 44 44 44 24 42 Z" ${dark}/>${teeth(32, 13, 50)}`,
    "light-lip": `<path d="M14 38 C34 18 86 18 106 38 C86 60 34 60 14 38 Z" ${lip}/><path d="M24 36 C44 30 76 30 96 36 L96 44 C76 47 44 47 24 44 Z" ${dark}/>${teeth(32, 9, 50)}`,
    open: `<path d="M14 36 C34 12 86 12 106 36 C92 70 28 70 14 36 Z" ${lip}/><path d="M24 34 C44 24 76 24 96 34 C86 58 34 58 24 34 Z" ${dark}/>${teeth(28, 7, 46)}<path d="M38 52 C50 44 70 44 82 52 C70 58 50 58 38 52 Z" fill="var(--mouth-tongue)"/>`,
    closed: `<path d="M14 40 C34 20 86 20 106 40 C86 60 34 60 14 40 Z" ${lip}/><path d="M16 40 C40 38 80 38 104 40" stroke="var(--mouth-line)" stroke-width="2.5" fill="none"/>`,
    rest: `<path d="M14 40 C34 20 86 20 106 40 C86 60 34 60 14 40 Z" ${lip}/><path d="M24 40 C44 35 76 35 96 40 C76 44 44 44 24 40 Z" ${dark}/>`,
  };
  return `<svg viewBox="0 0 120 80" role="img" aria-label="${escape(label)}" class="mouth-lips" xmlns="http://www.w3.org/2000/svg">${SHAPES[kind] ?? SHAPES.rest}</svg>`;
}

// The vowel map: the English vowel as a dot with its word, the Ukrainian one it starts from as a circled letter,
// and an arrow between them. The other vowels are faint, for a sense of the whole mouth.
export function vowelMap(key, { word = "", uk = null } = {}) {
  const to = MAP[key], from = uk ? MAP_UK[uk] : null;
  const far = from && Math.hypot(to[0] - from[0], to[1] - from[1]) > 18;
  const id = `mo${++ids}`;
  const left = to[0] > 180;
  return `<svg viewBox="0 0 260 186" class="mouth-map" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--mouth-flow)"/></marker></defs>
<path d="M28 30 L238 30 L238 164 L100 164 Z" fill="var(--bg)" stroke="var(--muted)" stroke-width="2" stroke-linejoin="round"/>
<text x="28" y="20" font-size="12" font-weight="800" fill="var(--muted)">FRONT</text>
<text x="238" y="20" font-size="12" font-weight="800" fill="var(--muted)" text-anchor="end">BACK</text>
<text x="133" y="20" font-size="12" font-weight="800" fill="var(--muted)" text-anchor="middle">tongue high ▲</text>
<text x="169" y="180" font-size="12" font-weight="800" fill="var(--muted)" text-anchor="middle">tongue low, mouth open ▼</text>
${Object.entries(MAP).filter(([k]) => k !== key && k !== "OW").map(([, [x, y]]) => `<circle cx="${x}" cy="${y}" r="4" fill="var(--ink)" opacity=".25"/>`).join("")}
${Object.entries(MAP_UK).filter(([l]) => l !== uk).map(([, [x, y]]) => `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="var(--mouth-flow)" stroke-width="2" opacity=".3"/>`).join("")}
${far ? `<path d="M${pt(lerp(from, to, 0.22))} L${pt(lerp(from, to, 0.8))}" stroke="var(--mouth-flow)" stroke-width="3.5" stroke-linecap="round" marker-end="url(#${id})"/>` : ""}
${from ? `<circle cx="${from[0]}" cy="${from[1]}" r="12" fill="var(--surface)" stroke="var(--mouth-flow)" stroke-width="2.5"/><text x="${from[0]}" y="${from[1] + 5}" text-anchor="middle" font-size="16" font-weight="800" fill="var(--mouth-flow)" lang="uk">${escape(uk)}</text>` : ""}
<circle cx="${to[0]}" cy="${to[1]}" r="7" fill="var(--ink)"/><text x="${left ? to[0] - 11 : to[0] + 11}" y="${to[1] + 5}" font-size="15" font-weight="800" fill="var(--ink)" text-anchor="${left ? "end" : "start"}">${escape(word)}</text>
</svg>`;
}

// ---- The panel --------------------------------------------------------------------------------------------------
// The pose a Ukrainian start, an English sound, or a heard sound means.
export const startPose = (letter) => UK_POSES[letter] ?? null;
export const heardKey = (heard) => (heard ? HEARD[heard] ?? null : null);
const nameOf = (tips, key) => (tips?.sounds?.[key]?.title ?? NAMES[key] ?? key.toLowerCase()).split(" as in ")[0];
const exampleOf = (tips, key) => (tips?.sounds?.[key]?.title ?? "").split(" as in ")[1] ?? "";

// The point of the tongue that moves most between two poses, for the arrow.
function moveArrow(from, to) {
  const jf = (from.jaw ?? 0.15) * JAW, jt = (to.jaw ?? 0.15) * JAW;
  const keys = [["tip", 1], ["blade", 0.85], ["body", 0.5]];
  let best = null;
  for (const [k, w] of keys) {
    const a = add(from.tongue[k], [0, jf * w]), b = add(to.tongue[k], [0, jt * w]);
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d > 7 && (!best || d > best.d)) best = { d, a, b };
  }
  if (!best) return null;
  return [lerp(best.a, best.b, 0.1), lerp(best.a, best.b, 0.85)];
}

// The side view in one of three states: "start" (the Ukrainian sound), "target" (the English sound, with the start
// as a dashed tongue and an arrow), or t between 0 and 1 for the move from one to the other.
export function stateView(key, letter, state = "target") {
  const to = POSES[key], from = startPose(letter);
  const name = key;
  if (!to) return "";
  if (!from || state === "target") return sideView(to, { ghost: from, arrow: from ? moveArrow(from, to) : null, label: `Side view: ${to.say}${from ? `. The dashed line is the tongue for the Ukrainian ${letter}.` : "."}` });
  if (state === "start") return sideView(from, { label: `Side view: ${from.say}.` });
  const t = Math.max(0, Math.min(1, state));
  const mid = { ...to, jaw: (from.jaw ?? 0.15) + ((to.jaw ?? 0.15) - (from.jaw ?? 0.15)) * t, lips: t < 0.5 ? from.lips : to.lips, air: t < 0.5 ? from.air : to.air, voice: t < 0.5 ? from.voice : to.voice, nose: t < 0.5 ? from.nose : to.nose,
    tongue: Object.fromEntries(["tip", "blade", "body", "back", "front"].filter((k) => to.tongue[k] || from.tongue[k]).map((k) => [k, lerp(from.tongue[k] ?? to.tongue[k] ?? [0, 0], to.tongue[k] ?? from.tongue[k], t)])) };
  return sideView(mid, { ghost: from, label: `Moving from the Ukrainian ${letter} to ${name}` });
}

// "How to make th": the side view (B, with the move from the Ukrainian sound), the lips from the front when they
// matter (C), the vowel map for vowels (D), what they said next to what they wanted (C), and the tip (unless the
// screen shows the tip itself). tips is data/tips/uk-en.json. said is what the model heard (js/score/phones.js).
export function panel(tips, key, { said = null, withTip = true, heading = true } = {}) {
  const entry = tips?.sounds?.[key], to = POSES[key];
  if (!entry || !to) return "";
  const letter = entry.uk?.letter ?? null;
  const from = startPose(letter);
  const name = nameOf(tips, key), example = exampleOf(tips, key);
  const saidKey = heardKey(said);
  const compare = saidKey && saidKey !== key && POSES[saidKey] ? saidKey : null;
  const lips = LIPS_MATTER.has(key) || (compare && LIPS_MATTER.has(compare));
  const text = (s) => String(s).split(/([Ѐ-ӿ]+(?:[ '’-][Ѐ-ӿ]+)*)/).filter(Boolean).map((x) => (/[Ѐ-ӿ]/.test(x) ? html`<span lang="uk">${x}</span>` : x));
  const ukName = from ? html`<span lang="uk">${letter}</span> (<span lang="uk">${entry.uk.word}</span>)` : "";
  return String(html`<div class="mouth-panel" data-mouth="${key}" data-start="${letter ?? ""}" data-phase="to">
  ${heading ? html`<h3 class="mouth-title">How to make ${name}</h3>` : ""}
  ${from ? html`<div class="mouth-strip" aria-hidden="true"><span class="ms-from">${ukName}</span><span class="ms-arrow">→</span><span class="ms-to">${name}${example ? ` (${example})` : ""}</span></div>
  <p class="visually-hidden">The picture moves by itself, from the Ukrainian <span lang="uk">${letter}</span> to ${name}, over and over.</p>` : ""}
  <div class="mouth-row${lips && !compare ? " with-lips" : ""}">
    <div class="mouth-figwrap"><figure class="mouth-fig" data-mouth-fig>${raw(stateView(key, letter))}</figure>${from ? raw(`<button type="button" class="mouth-pause" data-mouth-pause aria-pressed="false" aria-label="Pause the moving picture">${PAUSE_SVG}</button>`) : ""}</div>
    ${lips && !compare ? html`<figure class="mouth-front">${raw(frontView(to.lips, `Lips from the front for ${name}`))}<figcaption>Lips</figcaption></figure>` : ""}
  </div>
  ${from ? html`<p class="mouth-key"><span class="mk-dash" aria-hidden="true"></span>Your tongue for <span lang="uk">${letter}</span><span class="mk-solid" aria-hidden="true"></span>For ${name}</p>` : ""}
  ${isVowel(key) ? html`<figure class="mouth-mapfig">${raw(vowelMap(key, { word: example || name, uk: letter }))}<figcaption><span class="mk-uk" aria-hidden="true">${letter ?? "у"}</span>Ukrainian <span class="mk-en" aria-hidden="true"></span>English: where your tongue is highest</figcaption></figure>` : ""}
  ${compare ? html`<div class="mouth-compare">
    <figure class="want"><figcaption><span class="mc-tag mc-want">Make: ${name}</span></figcaption>${raw(sideView(to, { label: `Side view for ${name}: ${to.say}`, crop: CLOSE }))}${lips ? raw(frontView(to.lips, `Lips for ${name}`)) : ""}</figure>
    <figure class="said"><figcaption><span class="mc-tag mc-said">You said: ${nameOf(tips, compare)}</span></figcaption>${raw(sideView(POSES[compare], { label: `Side view for what you said, ${nameOf(tips, compare)}: ${POSES[compare].say}`, crop: CLOSE }))}${lips ? raw(frontView(POSES[compare].lips, `Lips for ${nameOf(tips, compare)}`)) : ""}</figure>
  </div>` : ""}
  ${withTip ? html`<p class="mouth-tip">${text(entry.tip)}</p>` : ""}
</div>`);
}
