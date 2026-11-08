// The teammate's own short word lists for Listen and Read, until iiSurf's real lists land (PLAN.md, "Still to
// come from iiSurf"). The sounds come from docs/needs.md: the ones Ukrainian speakers most often find hard.
// Every word is checked against the dictionary in tests/practice/lists.test.js.

// Listen: two words that differ by one hard sound. `sound` names the difference, and `tip` says how to hear it.
export const PAIRS = [
  { sound: "th or t", tip: "For th, the tongue rests lightly between the teeth and air keeps flowing. A t stops the air for a moment.", words: [["thin", "tin"], ["three", "tree"], ["thank", "tank"], ["both", "boat"]] },
  { sound: "th or s", tip: "A th is softer and flatter than s, with the tongue at the teeth, not behind them.", words: [["think", "sink"], ["thick", "sick"], ["path", "pass"], ["mouth", "mouse"]] },
  { sound: "th or d", tip: "The th in this and they buzzes, with the tongue at the teeth. A d taps once behind them.", words: [["they", "day"], ["then", "den"], ["though", "dough"], ["breathe", "breed"]] },
  { sound: "w or v", tip: "A w is made with round lips and no teeth. A v has the top teeth on the bottom lip.", words: [["west", "vest"], ["wine", "vine"], ["wet", "vet"], ["while", "vile"]] },
  { sound: "ee or i", tip: "The ee in sheep is long, with a smile. The i in ship is short and relaxed.", words: [["sheep", "ship"], ["leave", "live"], ["seat", "sit"], ["feel", "fill"], ["beat", "bit"]] },
  { sound: "e or a", tip: "The a in bad opens the mouth wider than the e in bed.", words: [["bed", "bad"], ["pen", "pan"], ["men", "man"], ["said", "sad"]] },
  { sound: "long or short oo", tip: "The oo in fool is long, with round lips. The u in full is short and relaxed.", words: [["fool", "full"], ["pool", "pull"]] },
  { sound: "p or b", tip: "An English p at the start of a word comes with a little puff of air.", words: [["pin", "bin"], ["pea", "bee"], ["pack", "back"]] },
  { sound: "ng or n", tip: "For ng, the back of the tongue touches the roof of the mouth, and there's no g at the end.", words: [["thing", "thin"], ["wing", "win"], ["sing", "sin"]] },
  { sound: "oh or aw", tip: "The oh in coat glides into a w at the end. The aw in caught stays still.", words: [["coat", "caught"], ["boat", "bought"], ["low", "law"]] },
];

// Read, "Find the strong part": words of two or more parts, used when the learner's own words don't have enough.
export const STRONG_WORDS = ["photography", "banana", "today", "about", "computer", "important", "tomorrow", "remember", "vegetable", "hotel", "develop", "comfortable"];

// Read, "Spot the small uh": words with at least one unstressed "uh" (AH0 in the dictionary).
export const UH_WORDS = ["banana", "about", "today", "sofa", "lemon", "support", "problem", "family", "chocolate", "pizza", "salad", "camera"];

// Read, "Same sound?": two words with the letters to compare. The answer is worked out from the dictionary,
// so it can't be wrong in this list.
export const SAME_SOUND = [
  ["bread", "ea", "bead", "ea"],
  ["food", "oo", "good", "oo"],
  ["said", "ai", "paid", "ai"],
  ["come", "o", "home", "o"],
  ["cow", "ow", "low", "ow"],
  ["put", "u", "but", "u"],
  ["head", "ea", "bed", "e"],
  ["blue", "ue", "shoe", "oe"],
  ["meat", "ea", "meet", "ee"],
  ["sweater", "ea", "better", "e"],
  ["break", "ea", "steak", "ea"],
  ["lose", "o", "nose", "o"],
];
