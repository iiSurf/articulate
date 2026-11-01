// The seven looks from Ukraine (design/themes.html, picked October 30) and which one shows right now.
// Each look's colors are in css/looks.css; here are its name, the colors for its tile in Your colors, and the
// picture in its band. The four grade colors never change with the look.

let uid = 0; // pattern and gradient ids must be unique on the page

// Strips keep their height and repeat across the band at any width, so they look the same on a phone and a computer.
const strip = (color, h) => `<svg class="strip" width="100%" height="${h}" aria-hidden="true"><rect width="100%" height="${h}" fill="${color}"/></svg>`;

function crossStitch(red, black, height) {
  const id = `stitch-${++uid}`, u = 2, n = 11, rects = [];
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
    const d = Math.abs(x - 5) + Math.abs(y - 5);
    const fill = d === 4 ? red : d <= 1 ? black : (y === 0 || y === n - 1) && x % 2 === 0 ? black : null;
    if (fill) rects.push(`<rect x="${x * u}" y="${y * u}" width="${u}" height="${u}" fill="${fill}"/>`);
  }
  return `<svg class="strip" width="100%" height="${height}" aria-hidden="true">
    <defs><pattern id="${id}" width="${n * u}" height="${n * u}" patternUnits="userSpaceOnUse">${rects.join("")}</pattern></defs>
    <rect width="100%" height="${height}" fill="url(#${id})"/></svg>`;
}

function teeth(dark, gold) {
  const id = `teeth-${++uid}`;
  return `<svg class="strip" width="100%" height="16" aria-hidden="true">
    <defs><pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><polygon points="0,16 8,3 16,16" fill="${gold}"/></pattern></defs>
    <rect width="100%" height="16" fill="${dark}"/><rect width="100%" height="16" fill="url(#${id})"/></svg>`;
}

const star = (gold, center) => `<svg class="icon" viewBox="0 0 60 60" aria-hidden="true">
  <rect x="17" y="17" width="26" height="26" fill="${gold}"/><rect x="17" y="17" width="26" height="26" fill="${gold}" transform="rotate(45 30 30)"/>
  <circle cx="30" cy="30" r="6" fill="${center}"/></svg>`;

function flower() {
  const colors = ["#E2412B", "#F28C28", "#E2412B", "#F28C28", "#E2412B"];
  const petals = colors.map((c, i) => `<ellipse cx="66" cy="16" rx="7.5" ry="13" fill="${c}" transform="rotate(${i * 72} 66 31)"/>`).join("");
  return `<svg class="icon" viewBox="0 0 100 62" aria-hidden="true">
    <ellipse cx="34" cy="40" rx="6" ry="16" fill="#4C9A2A" transform="rotate(-55 34 40)"/>
    <ellipse cx="44" cy="50" rx="5" ry="12" fill="#6DB33F" transform="rotate(-80 44 50)"/>
    ${petals}<circle cx="66" cy="31" r="7" fill="#F5C518"/>
    <ellipse cx="92" cy="48" rx="4.5" ry="9" fill="#F5C518" transform="rotate(35 92 48)"/></svg>`;
}

function sunflower() {
  let petals = "";
  for (let i = 0; i < 12; i++) petals += `<ellipse cx="36" cy="14" rx="5" ry="11" fill="#E39A0B" transform="rotate(${i * 30} 36 31)"/>`;
  const seeds = [[32, 27], [36, 26], [40, 27], [30, 31], [34, 31], [38, 31], [42, 31], [32, 35], [36, 36], [40, 35]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#7A5527"/>`).join("");
  return `<svg class="icon" viewBox="0 0 74 62" aria-hidden="true">${petals}<circle cx="36" cy="31" r="11" fill="#3E2C14"/>${seeds}</svg>`;
}

function berries() {
  const b = [[52, 24], [64, 20], [76, 24], [58, 34], [70, 33], [64, 45], [82, 37]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#FF4B57"/><circle cx="${x - 2}" cy="${y - 2.2}" r="1.8" fill="#FFFFFF" opacity=".75"/>`).join("");
  return `<svg class="icon" viewBox="0 0 96 62" aria-hidden="true">
    <ellipse cx="28" cy="30" rx="8" ry="17" fill="#3E8A4B" transform="rotate(-50 28 30)"/>
    <ellipse cx="34" cy="46" rx="6" ry="12" fill="#2F6B3A" transform="rotate(-95 34 46)"/>${b}</svg>`;
}

function glow(gold) {
  const id = `glow-${++uid}`;
  return `<svg class="strip" width="100%" height="14" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${gold}" stop-opacity="0"/><stop offset="1" stop-color="${gold}" stop-opacity=".35"/></linearGradient></defs>
    <rect width="100%" height="10" fill="url(#${id})"/><rect y="10" width="100%" height="4" fill="${gold}"/></svg>`;
}

// Five for the day, two for night. band and bandInk color each look's tile in Your colors.
export const LOOKS = [
  { id: "sky", name: "Sky over wheat", band: "#0057B7", bandInk: "#FFFFFF", art: () => strip("#FFD500", 8) },
  { id: "vyshyvanka", name: "Vyshyvanka", band: "#F8F4EC", bandInk: "#1B1B1B", art: () => crossStitch("#C8102E", "#1B1B1B", 22) },
  { id: "pysanka", name: "Pysanka", band: "#6E0F1E", bandInk: "#FFF1DC", art: () => star("#E39B12", "#6E0F1E") + teeth("#1E0F0B", "#E39B12") },
  { id: "sunflower", name: "Sunflower field", band: "#F6C324", bandInk: "#2E2110", art: () => sunflower() },
  { id: "kalyna", name: "Kalyna", band: "#9B1B30", bandInk: "#FFF3F0", art: () => berries() },
  { id: "petrykivka", name: "Petrykivka", dark: true, band: "#16110E", bandInk: "#F7EFE4", art: () => flower() },
  { id: "night", name: "Night flag", dark: true, band: "#0B1526", bandInk: "#EAF1FB", art: () => glow("#FFD500") },
];

// What a new learner starts with: both from the flag, and switching with the phone.
export const DEFAULT_LOOKS = { day: "sky", night: "night", followDark: true };

export const byId = (id) => LOOKS.find((l) => l.id === id) || LOOKS[0];

// The look to show: the night look when the phone is dark and they want it to follow, otherwise the day look.
export function lookFor(prefs, phoneIsDark) {
  return prefs.followDark && phoneIsDark ? prefs.night : prefs.day;
}
