# Practice: your part of Articulate

Welcome aboard! Practice is the heart of the app. It's the part where our friend says a word out loud and watches each sound light up green, or sees exactly which sound to work on. Everything around it (the looks, the tabs, the scoring engine) is already in place, so you can go straight to the fun part.

Articulate is a surprise for our friend, so please keep it quiet. Who it's for, and what they asked for, is in [needs.md](needs.md).

## Getting set up (about 15 minutes)

1. Accept the GitHub invite to `iiSurf/articulate`, then clone it. You need Node 22 or newer, and Chrome. Mac, Windows, and Linux all work.
2. In the folder, run:
   - `npm install`
   - `npm run get-model`: the sound model, 355 MB, once. Wi-Fi is best.
   - `npm start`, then open http://localhost:8000/
3. Make your own branch from `main`, and name it after yourself. Then add it to PLAN.md, where it says "the teammate on theirs".
4. In your first commit, start your log: `LOG-<your GitHub name>.md`. Use the same format as `LOG.md`: what you planned, what changed, and what you checked.
5. Try the scoring yourself at http://localhost:8000/tools/score/try.html. Say "think", then say "sink" with "think" still picked, and watch the th turn red.

Your Claude Code reads `CLAUDE.md` and `PLAN.md` by itself. On any branch other than `nicks-branch`, it knows it's working for you. PLAN.md is our agreement, so read it too, and tell me if anything should change.

## What to build, in this order

The drafts show what each screen looks like:
- `design/themes.html`, the Speak screen in all seven looks;
- `design/tutorial.html`, the first visit, steps 3 to 5.

With `npm start` running, open them at http://localhost:8000/design/themes.html and http://localhost:8000/design/tutorial.html.

### 1. Speak (first, the most important)

- A **Record** button. Tap it, say the word, tap it again.
- The word, with **each part colored**:
  - **green**: good (✓)
  - **yellow**: close (≈)
  - **orange**: a little off (!)
  - **red**: needs work (✕)
- A line saying what any part that isn't green **sounded like**, for example "The th sounded like a d."
- **Hear it** and **Say it again**.
- **Tapping a part that isn't green opens Fix** for that part.
- Cut the quiet before and after each try. `scoreSounds()` already does this, and it keeps scoring fast on a phone.

`tools/score/try.html` already does recording, scoring, and showing the result in about 100 lines. It's your best example. The scoring result looks like this:

```js
{
  sounds: [ // one per sound of the word
    { cmu: "TH", sound: "θ", grade: "red", score: -7.2, heard: "s" }, // heard: what it sounded like (null when green)
    { cmu: "IH", sound: "ɪ", grade: "green", score: 2.7, heard: null },
    // ...
  ],
  heard: ["s", "ɪ", "ŋ", "k"], // what the app heard overall
  seconds: { recorded: 2.1, scored: 0.8 },
  ms: { model: 450, score: 2 },
}
```

The grades map to colors every look already has: `--good`, `--close`, `--off`, and `--work` for the letters, `--good-bar` (and the others) for the mark behind each part, and `--good-mark` (and the others) for the mark itself.

### 2. Fix this part

The screen opens when a part isn't green. It shows:
- the tip for that sound, which starts from a Ukrainian sound (the th starts from the з in зуб);
- **Hear it slowly**;
- a few words with the same sound in the same spot (feather, leather, together), each one you can say and see colored;
- **Back to the word**.

### 3. Listen

It works with headphones and no speaking. The app plays one word, and the learner taps which of two they heard (sheep or ship, west or vest). Use the phone's own voice for now: `speechSynthesis` with an `en-US` voice. Voice clips can come later.

### 4. Read

Puzzles on screen, with no sound:
- **Find the strong part**: pho·TOG·ra·phy.
- **Spot the small "uh"**: the first and last a in banana.
- **Same sound?** Do the marked letters in bread and bead sound the same?

## How your screens plug in

Your files go in `js/practice/`. The app loads `js/practice/index.js` by itself:

```js
// js/practice/index.js (yours)
import { registerScreen } from "../app.js";
import { speak } from "./speak.js";

registerScreen("speak", speak); // also "fix", "listen", "read"
```

```js
// js/practice/speak.js (yours)
import { html } from "../html.js"; // always build markup with html``, so typed words stay text
export const speak = {
  render(container, ctx) {
    container.insertAdjacentHTML("beforeend", String(html`<section class="card">…</section>`));
  },
};
```

- The app draws "Right now I can… Read · Listen · Speak" above your screen, so you only draw what's under it.
- Reuse the shared pieces in `css/app.css`: `card`, `label`, `btn`, `btn primary`, and `hint`.
- For anything new, make `js/practice/practice.css` and load it from your `index.js`. `css/` is iiSurf's folder.

**What `ctx` gives you:**
- `ctx.word`: the word being practiced. My words sets it when they tap Practice, and it's null if they haven't picked one, so show a way to My words.
- `ctx.score(recording, word, { onProgress })`: give it the recording (the Blob from `MediaRecorder`) and the word. You get back everything above, plus each part as it's spelled:
  `parts: [{ letters: "th", sounds: [2], grade: "red", heard: "d", unsure: false }, …]`
  Silent letters have grade `null`. `unsure` marks the vowels the app hears poorly (bad/bed, fool/full), which never show better than yellow, so say so on screen. `strong` is the part said strongest.
- `ctx.lookUp(word)`: the word's sounds, the letters for each one, its stress, and its strong part. You don't have to record anything to use it.
- `ctx.model.saved()`: is the sound model already here ("local", "saved", or null)? `ctx.model.load({ onProgress })` gets it ready. Use these to show the one-time 355 MB download before the first try. `design/tutorial.html`, phone 4, has the look.
- `ctx.go(name, param)`: opens another screen, for example `ctx.go("practice", "speak")`.
- `ctx.param`: what follows the screen's name in the address.
- `ctx.state` and `ctx.save()`: what's saved.
- `ctx.tour.did(...)`: tells the tour something happened.
- `say(word, { slow })`, from `js/words/speech.js`: says a word with the phone's voice. It's useful for Listen.
- **Coming next from iiSurf:** the Ukrainian tip for each sound, words with the same sound in the same spot, and sound-alike pairs. Until then, use a short list of your own, like feather, leather, together, or sheep/ship and west/vest, and swap it in when they land.

**The tour** points at your controls, so please give them these names:
- `data-tour="record"` on the Record button;
- `data-tour="part"` with `data-grade` on each colored part;
- `data-tour="fix-back"` on Back to the word;
- `data-tour="listen-play"` on Listen's play button;
- `data-tour="read-puzzle"` on the Read puzzle.

When a try has been graded, call `ctx.tour.did("said")`. When they tap Back to the word on Fix, call `ctx.tour.did("fixed")`. The table is in PLAN.md.

## Staying in sync

- Work only on your branch, and only in your files: `js/practice/`, `data/voice/`, `tools/voice/`, and `tests/practice/`. If you need something changed in mine, tell me or say so in your pull request.
- Open small pull requests often, at least every day or two, and merge with **Create a merge commit**. After anything merges, update your branch from `main`.
- Run `npm test` before committing. Put tests for your logic in `tests/practice/`.
- Check each screen at 360, 390, and 1280 wide, for example `node tools/shot.mjs .tmp/speak.png 390 844 "/#/practice/speak" 1`. Add `COLOR_SCHEME=dark` in front to see a night look.
- Recordings stay on the phone. Never save or send them anywhere.
- Words on screen are plain and friendly. The three ways to practice are always called Read, Listen, and Speak.
- Every animation needs an off switch for people who turn motion down.

## The schedule that gets us to the handover on Friday

| When | You |
| --- | --- |
| Mon Nov 2 | Set up, branch, log, start Speak against a stand-in |
| Tue Nov 3 | Speak working with the real scoring. **First pull request Tuesday night**, even if it's rough. |
| Wed Nov 4 | Fix this part |
| Thu Nov 5 | Listen and Read. **Pull request Thursday night.** |
| Fri Nov 6 | Hand it to our friend together |

Alongside, I'm building the word lookup, the scoring hookup, My words, the tips and word lists, and then the tour on top of your screens. I'll tell you as each piece lands.

If anything is unclear, or something of mine is in your way, message me right away. I'd much rather help early than find out late. Thanks for building this with me. It's going to be great to watch our friend use it.
