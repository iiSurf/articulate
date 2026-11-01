# Articulate

A pronunciation practice app for one person: a friend who grew up speaking Ukrainian, speaks English very well, and wants to sound closer to an American accent. They add the words they want to work on, and Articulate suggests similar words to practice alongside them. Then they practice in whichever way fits where they are:

- **Read** (on a bus, in a quiet room): puzzles on screen that train the ear in your head. No sound.
- **Listen** (with headphones): hear each word, normal and slow, and pick which word you heard. No speaking.
- **Speak:** say the word and see each part of it turn green, yellow, orange, or red. Then practice that one part with words that share its sound, and go back to the word.

The app asks "Right now I can…" and the three buttons answer it: Read, Listen, Speak.

Built by a team of two with Claude Code for TCSS 490, Artifact 4 ("For Someone Else").

**Status (November 1, 2026):** planning, design drafts, the scoring test (passed, details in [docs/scoring-test.md](docs/scoring-test.md)), and a try-it page for the scoring. The app's screens are not built yet.

## Getting started

Everything works from a fresh clone, on a Mac, Windows, or Linux. You need Node 22 or newer, and Chrome.

```bash
npm install
```

```bash
npm test
```

```bash
npm start
```

- `npm install` gets the tools the tests and scripts use. The app itself needs nothing from npm.
- `npm test` runs every test. They need no downloads.
- `npm start` serves this folder at http://localhost:8000, for example http://localhost:8000/design/themes.html. Leave it running and reload the page after a change.
- **Try the scoring:** http://localhost:8000/tools/score/try.html, or on any phone at https://iisurf.github.io/articulate/tools/score/try.html once it's on `main`. Pick a word, tap Record, say it, and see each sound colored, what it sounded like, and how long scoring took on that device. Nothing is saved or sent.

**The sound model** (355 MB) is the one thing too big for GitHub:

- The app downloads it from Hugging Face the first time Speak is used, and the browser keeps it, so there is nothing to set up.
- While developing, run `npm run get-model` once. It saves a checked copy in `.models/` (git ignores it), and with `npm start` the app uses that copy, so it isn't downloaded again.
- The Node tools need that copy too.

| Command | What it does | Where it runs |
| --- | --- | --- |
| `npm run get-model` | Downloads the sound model into `.models/` and checks its checksum | Anywhere |
| `npm run score-speed` | Times the model in Chrome, at full speed and slowed down as a stand-in for phones | Anywhere |
| `npm run score-test` | The scoring test: colors on word pairs said by the Mac's voices | Mac only, because it uses the Mac's `say` voices |
| `npm run score-try` | Checks the try-it page end to end in Chrome, with a stand-in microphone playing the scoring test's recordings | Mac only (it needs those recordings) |
| `npm run vendor` | Copies the browser engine from `node_modules` into `vendor/`, after updating it | Anywhere |

## Where things are

- [PLAN.md](PLAN.md): the team plan. What we are building, who owns which part, how we keep our work from colliding, and the timeline. Both of us, and both of our Claude Code agents, work from it.
- [docs/needs.md](docs/needs.md): what we know about the person it is for, and what each answer means for the app.
- [docs/scoring-test.md](docs/scoring-test.md): whether a free speech model can color each sound of a word right, and how fast. The method, the results, and what is still unproven.
- [CLAUDE.md](CLAUDE.md): the rules every Claude Code agent on this repository follows.
- [LOG.md](LOG.md): iiSurf's log. The teammate keeps their own log next to it, `LOG-<their GitHub name>.md`. Together they are the record of what we planned and what changed.
- [design/themes.html](design/themes.html): drafts of the look. It shows the seven Ukrainian color themes picked from ten, and Your colors, the screen for choosing a look for the day and one for night.
- [data/words/](data/words/): the CMU Pronouncing Dictionary (BSD license, kept with it), where every word's sounds come from.
- [vendor/onnxruntime-web/](vendor/onnxruntime-web/): the engine that runs the sound model in the browser (Microsoft, MIT license). It is copied from npm and committed, so the app works on GitHub Pages without npm.
- `.github/pull_request_template.md`: the checklist every pull request starts with.

### Scoring (iiSurf)

- [js/score/source.js](js/score/source.js): where the sound model comes from. It is pinned to one version on Hugging Face with its size and checksum, and the app looks for it in order: the local copy, then the browser's saved copy, then a download.
- [js/score/model.js](js/score/model.js): loads the model in the browser and runs it on a recording.
- [js/score/score.js](js/score/score.js): from a recording to a grade for each sound. It cuts the silence, runs the model, grades each sound, and says what the model heard overall and how long it took.
- [js/score/phones.js](js/score/phones.js): matches the dictionary's 39 sounds to the 38 sounds the model hears. The quick American "t" in "water" counts as a right t or d.
- [js/score/gop.js](js/score/gop.js): grades each sound of a word from the model's output. It asks whether the word as written fits the recording better than the same word with that one sound swapped or left out. The gap is the score, the score picks the color, and the best other sound is what it "sounded like".
- [js/score/audio.js](js/score/audio.js): turns a recording into 16 kHz samples, cuts the silence before and after the word, scales it the way the model expects, and reads WAV files for the tools.
- [tools/score/try.html](tools/score/try.html): the try-it page, described in Getting started. `try-check.mjs` checks it end to end.
- [tools/score/](tools/score/): also the scoring test (`run.mjs`), the speed test (`speed.mjs` with `speed.html`), and the model in Node (`model.mjs`).

### Words (iiSurf)

- [js/words/cmudict.js](js/words/cmudict.js): reads the dictionary and looks up a typed word (phone keyboards' curly apostrophes included).

### Tools

- [tools/serve.mjs](tools/serve.mjs): the local server behind `npm start`.
- [tools/get-model.mjs](tools/get-model.mjs) and [tools/vendor.mjs](tools/vendor.mjs): behind `npm run get-model` and `npm run vendor`.
- [tools/shot.mjs](tools/shot.mjs): takes a screenshot of a page at an exact width (360, 390, or 1280), with headless Chrome. This is how screens get checked at phone and desktop sizes. For example: `node tools/shot.mjs .tmp/home.png 390 844 http://localhost:8000/design/themes.html 1`
- [tools/bake.mjs](tools/bake.mjs): saves what a draft page's script draws into the page itself, so it also shows in previews that don't run JavaScript.
- [tools/chrome.mjs](tools/chrome.mjs): finds and starts headless Chrome for the tools above (set `CHROME` if it's somewhere unusual), with its profile kept in `.tmp/`.

## Privacy

Everything the learner adds (their words and their recordings) stays in the browser on their own phone. No accounts, no server, no analytics, and no paid services. The only outside request is downloading the sound model from Hugging Face, which sends nothing about the learner.
