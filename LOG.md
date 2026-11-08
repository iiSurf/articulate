# Articulate log (iiSurf)

What iiSurf (with Claude Code) planned and what changed, oldest first. The teammate keeps their own log, `LOG-<their GitHub name>.md`. Together the two files are the team's record.

## 2026-10-30 (Friday): the idea, the person, and the team plan

### Plan

TCSS 490 Artifact 4, "For Someone Else": build something in a team of two for a person outside the team, find out what they need by asking, and hand it over by Sunday, November 8. The Portfolio card has to show where we are by Sunday, November 1.

### How the idea was picked

- iiSurf's idea: an English app for a friend who grew up speaking Ukrainian, speaks English very well, and has a strong accent. Not a general language app: pronunciation, sounding closer to native speech, and learning more words through similar words.
- Three shapes were offered:
  - A: sound by sound. One hard sound at a time, a listening game, then say it.
  - B: a word explorer. Any word gets a page and a web of similar words.
  - C: sentences to say along with a voice, with rhythm and melody pictures.

  Recommended: B, with A as the daily path.
- The friend's answers settled it (given by iiSurf, because the app is a surprise; see docs/needs.md). They add their own words first, then pick from suggestions of similar words, and they want to see on screen how close their try was. They use a Samsung Android phone, practice many times a day, and want an American accent.

### Decisions

- Phone first, for Chrome on Android. Plain HTML, CSS, and JavaScript, with no server and no accounts. The friend's words and recordings stay on their phone.
- American pronunciations come from the CMU Pronouncing Dictionary. Code finds three kinds of similar words: sound-alikes, words with the same hard sound, and word families where the stress moves.
- "How close" is shown as pictures we can back up, not one score:
  - the beat: syllable sizes, which shows the strong syllable and the small "uh",
  - the melody: the pitch line.

  Speech recognition is an extra the learner turns on, because on Android Chrome sends the recording to Google.
- No paid API and no key. Claude Code helps build it. The app on the phone runs no AI model, and the voice clips are made ahead of time.
- Two parts with one owner each (PLAN.md): iiSurf owns the app shell and Words, and the teammate owns Practice.
- Each person works on their own branch. Pull requests go into `main`, the other person approves, and iiSurf merges with a merge commit.
- Each person keeps their own log file, so the logs never collide. This was iiSurf's idea: one shared `LOG.md` would conflict whenever both of us add to its end.

### Changed

- New: `PLAN.md`, `CLAUDE.md`, `docs/needs.md`, this log, `.gitignore`, and `.github/pull_request_template.md`. Rewrote `README.md`.
- No app code.

### Verified

- Every link between the documents points at a file that exists.
- No names, contact details, or anything else that identifies the friend.

### Not verified

- Nothing runs yet.
- Kokoro (the voice model) has not been tried.
- Speech recognition in the friend's browser has not been tried.
- The friend's answers came from iiSurf and are not confirmed with them.
- The teammate has not read or approved the plan yet.

## 2026-10-30 (Friday, later): Quiet practice and colored letters

### Plan

iiSurf added two needs. Speaking out loud is often not an option (public transportation, a quiet room with others), so the friend needs a way to train pronunciation silently, in their head. Where speaking is fine, they want each part of the word colored by how it went (green, yellow, orange, red), then a little practice on that one part with words that sound the same there, and then a retry of the word.

### Decisions

- **Where are you right now?** One tap picks Quiet (puzzles on screen, no sound), Headphones (listen, no speaking), or Out loud.
- **Quiet puzzles** come from the dictionary, so the app is always right about them: find the strong part, spot the small "uh", same sound, odd one out, and mouth it. Ukrainian is spelled almost the way it sounds and English is not, so these train what a Ukrainian speaker needs most.
- **Colored letters** need a model that recognizes English sounds. A free one built for the browser exists ([speako-phoneme-recognizer](https://huggingface.co/robg/speako-phoneme-recognizer), Apache 2.0). It is about 355 MB, and its speed on a phone is unknown. It runs on the phone, so the recording never leaves it, and the Google speech recognition idea is dropped.
- **The scoring test comes first:** one day, with a pass rule written in PLAN.md (speed on an Android phone, and how often deliberate mistakes turn red). If it fails, Out loud shows the beat instead and colored letters move to Later.
- **Fix this part:** the tip, the slow model, words with the same sound in the same spot, a sound-alike pair, then back to the word.
- **Ownership:** iiSurf takes Scoring, because it is the riskiest part and has to start before the teammate joins. The teammate's Practice now covers all three ways to practice, using a stand-in for the colors until the real scoring lands. The handshake gained `parts` (which letters make which sound), `sameSound`, `soundAlikes`, and `score`.
- **Moved down:** the melody line moved to Later, and the beat is now the fallback for Out loud.

### Changed

- `PLAN.md`: how it works, Quiet, Out loud, the scoring test, Must, Stretch and Later, data, ownership, the handshake, and the timeline.
- `docs/needs.md`: the two new needs and what they mean for the app.
- `CLAUDE.md` and `README.md`: the three ways to practice, Scoring in iiSurf's part, and the sound model as the only outside request.

### Verified

- Links between the documents still point at files that exist.
- No names or anything else that identifies the friend.

### Not verified

- The sound model has not been run anywhere yet. Its size comes from its model page, not from a download.
- Nobody has an answer yet on whether a smaller sound model exists.
- The teammate has not seen the new split.

## 2026-10-30 (Friday, night): GitHub rules, and ten theme drafts

### Plan

iiSurf turned on the GitHub rules for `main`, with one change from the plan: 0 required approvals instead of 1, so neither of us waits on the other to merge. Then: rough drafts of the look. iiSurf wants the colors to follow the learner's home country, starting with Ukraine, and asked for ten to choose from.

### Changed

- `PLAN.md`:
  - Merging now matches GitHub: whoever opened a pull request merges it once the tests pass. Changes to `PLAN.md` or the handshake still wait for the other person's OK, because that file is our agreement.
  - "Colors from home" joins how it works. One Ukraine theme is a Must, and choosing between themes is a Stretch.
  - `design/` joins iiSurf's part.
- `CLAUDE.md`: "your person merges" instead of "iiSurf merges". Agents still never merge.
- New: `design/themes.html`, ten themes on the same screen (Out loud, after saying "weather"):
  - 1 Sky over wheat, 2 Golden domes, 3 Vyshyvanka, 4 Petrykivka (dark), 5 Pysanka
  - 6 Sunflower field, 7 Carpathians, 8 Black Sea, 9 Kalyna, 10 Night flag (dark)

  The four grade colors stay the same in every theme, each with its own mark (✓, ≈, !, ✕). The page uses no outside requests.
- New: `tools/shot.mjs` takes a screenshot at an exact width. Plain headless Chrome can't make a window narrower than about 500 pixels, so the first 390-wide shot was wrong. Chrome's profile goes in `.tmp/` and is deleted afterwards.

### Verified

- The drafts at 360, 390, and 1280 wide, in headless Chrome: no sideways scrolling, and the phones line up in rows at 1280.
- Fixed after the first look: the Ukrainian з looked like the digit 3, so the tip now says "the з in зуб".
- iiSurf saw only text at first. The app's preview shows a local page as a still snapshot without running its JavaScript, and the page drew its phones with JavaScript. The ten phones are now drawn into the page ahead of time (the script redraws the same thing). Checked with the script removed: all ten phones and the key still show.
- `tools/shot.mjs` can now save parts of a page as separate pictures. It was used to send iiSurf sharp pictures of each row of drafts.

## 2026-10-30 (Friday, late): seven looks, and changing between them

### Plan

iiSurf picked seven of the ten themes and wants all of them in the app, with a way to change between them:

- 1 Sky over wheat, 3 Vyshyvanka, 4 Petrykivka, 5 Pysanka
- 6 Sunflower field, 9 Kalyna, 10 Night flag

### Decisions

- **Your colors** opens from the "UA → EN" tag in the band. It holds the first language (Ukrainian) and the looks that come with it, so a learner from another country would get their own set.
- The learner picks a **day look** (five light ones) and a **night look** (the two dark ones), and the app switches when the phone goes dark. It starts with Sky over wheat and Night flag, both from the flag.
- Seven looks with a picker is now a Must; the old Stretch, "choose between a few themes", is folded into it.

### Changed

- `design/themes.html`, round two: Your colors drawn twice (daytime with the starting choices, and night with Vyshyvanka and Petrykivka chosen). Round one is still below it, with the seven marked "Picked" and the other three faded.
- New: `tools/bake.mjs` saves what a draft page's script draws into the page itself, so the page shows in the app's preview, which doesn't run JavaScript. A second bake now changes nothing (Chrome added a blank line each time, so the tool tidies it).
- `PLAN.md`: how it works item 5, and the Must list.

### Verified

- At 360, 390, and 1280 wide, in headless Chrome: no sideways scrolling, and the Your colors screen fits.
- Fixed after the first look: the check mark sat on top of the flower in the Petrykivka tile and was hard to see on the blue Sky over wheat tile, so it moved to the tile's name row. "Ukrainian · українська" broke onto two lines in the middle, so the Ukrainian name now sits on its own line.

### Not verified

- Not seen on a real phone.
- Switching with the phone's dark mode is only drawn, not built.

## 2026-10-31 (Saturday): the Portfolio checkpoint card

### Plan

By Sunday, November 1, the Portfolio's Artifact 4 card has to show where Articulate is.

### Changed

- In the Portfolio repository (`cards.js`, pushed as 539f4ae):
  - The Artifact 4 card is now "Articulate". It stays an idea card, because the app is in progress.
  - Its button, "See the plan and drafts", opens this repository on `nicks-branch`.
  - The text covers what the app is, how two people and two agents share one repository, what is done, and what is next.
  - Scripts and styles are at `?v=20261030`, and the Portfolio's own log has an entry.
- `README.md` here now lists the theme drafts and the two screenshot tools, since the card's button lands on it (386b3f1).

### Verified

- Live, after GitHub Pages published it: https://iisurf.github.io/Portfolio/#artifact-4 at 390 and 1280 wide shows the new title, the button, and the text. Nothing scrolls sideways.
- The button's address (the `nicks-branch` page on GitHub) answers.

### Not verified

- A real phone, Safari, or Firefox.
- The Portfolio's own log still says the live check is to come. It gets updated with the next Portfolio change, so no change is left waiting in that repository.
- Once the plan is merged into `main`, the card's link should point at the repository itself.

## 2026-10-31 (Saturday): the scoring test

### Plan

Answer PLAN.md's question before building Out loud: can a free speech model, running in the browser, color each sound of a word right, and fast enough for a phone?

### Changed

- New, the scoring code:
  - `js/score/phones.js`: the dictionary's sounds mapped to the model's.
  - `js/score/gop.js`: the scoring.
  - `js/score/audio.js`: reading and scaling audio.
- New, the tests: `tests/score/`, 13 of them, with made-up model output.
- New, the test tools:
  - `tools/score/run.mjs`: colors, on word pairs said by the Mac's voices.
  - `tools/score/speed.mjs` and `tools/score/speed.html`: Chrome at full speed and slowed down.
  - `tools/score/model.mjs`: the model in Node.
- New: `package.json`, so `npm test` runs the tests. It lists onnxruntime-web 1.31.1 as a tool for development.
- `tools/chrome.mjs` now holds the headless Chrome code that `tools/shot.mjs` had, so the speed test can share it.
- New: `docs/scoring-test.md`, the results.
- `PLAN.md`: the result, the decision, and two new Must details: cut the silence off before scoring, and keep the weak vowels at yellow at most.
- `README.md`: the scoring files, and how to run the tests and the scoring test.
- Downloads, with iiSurf's OK, into folders git ignores:
  - the model, 355 MB, into `.models/`. Its checksum matched Hugging Face's.
  - onnxruntime-web, into `node_modules/`, with npm's cache in `.tmp/`.
  - the CMU dictionary, into `.models/`.

### Result

**Passed, on the Mac's own voices.** The color cuts were picked on three voices (Eddy, Flo, Sandy) and checked on three others (Samantha, Reed, Shelley):

- Swapped sounds caught (orange or red): 163 of 183, or 89%. The rule asks for 80%.
- Right sounds turned red: 25 of 915, or 3%. The rule allows 10%.
- Right sounds green: 86%.
- "Sounded like" named the swap: 81%.
- th mistakes were caught 35 of 36 times.
- Weak spots: bad/bed was caught 8 of 15 times, and fool/full 5 of 9.
- Speed in Chrome, one thread: 0.45 s per short word at full speed, 1.84 s slowed down 4 times, and 2.77 s slowed down 6 times. Scoring adds 2 to 10 ms.

### Verified

- `npm test`: 13 of 13 pass.
- Both test tools ran from start to finish.
- The screenshot tool still works after moving its Chrome code into `tools/chrome.mjs`.

### Not verified

- Real voices. Every recording came from the Mac's voices, and every mistake was a whole swapped sound, never an in-between one like a real accent makes.
- A real Android phone. Chrome slowed down is only a stand-in.
- The 355 MB download on a phone.
- A smaller model. None was tried.

## 2026-10-31 (Saturday, later): everything works from a fresh clone

### Plan

iiSurf asked whether the teammate can use what was downloaded. They couldn't: the model, the browser engine, and the dictionary were only on this Mac, in folders git ignores. The teammate needs everything working on their side too, on whatever computer they have.

### Changed

- **The dictionary is in the repository:** `data/words/cmudict.dict`, unchanged, with its BSD license and a note on where it came from (commit 0f8072f).
- **The browser engine is in the repository:** `vendor/onnxruntime-web/` (15 MB), copied from npm by `npm run vendor`, with its MIT license. The app loads it from there, so it works on GitHub Pages and from a fresh clone without npm.
- **The app gets the model itself:**
  - New: `js/score/source.js`. It pins the model to one version on Hugging Face, with its size and checksum, and it keeps the model's vocabulary in the app so that doesn't need fetching.
  - The app looks for the model in order: the local copy, then the browser's saved copy, then a download, which it then saves.
  - New: `js/score/model.js` loads it in the browser.
- **One command for the local copy:** `npm run get-model` (`tools/get-model.mjs`) downloads the model on a Mac, Windows, or Linux, and checks its checksum. If the copy is already there and checks out, it does nothing.
- **A local server:** `npm start` (`tools/serve.mjs`), localhost only, no caching, and nothing outside the folder. The speed test uses it too.
- **Tools that work on other computers:**
  - `tools/chrome.mjs` finds Chrome on a Mac, Windows, or Linux. The screenshot, bake, and speed tools all use it.
  - The speed test no longer needs the Mac's voices, since speed depends only on how long a recording is.
  - The scoring test says plainly that it needs a Mac.
- `package.json` has scripts for all of this and asks for Node 22 or newer.
- New tests: `tests/score/source.test.js`, 8 of them, on where the app finds the model, with stand-ins for fetch and the browser's storage.
- Docs:
  - `README.md`: a "Getting started" section.
  - `CLAUDE.md`: a "Setup" section for both agents, plus the npm cache rule for this Mac.
  - `PLAN.md`: where the data and the engine come from, and a row for the shared tools.
  - `docs/scoring-test.md`: speed by recording length.

### Verified

- **A fresh copy:** only the files a clone would get (18 MB, with no model and no `node_modules`), in `.tmp/fresh`:
  - `npm install` and `npm test` (21 of 21) passed.
  - `npm start` served the drafts, the engine (`application/wasm`), the scoring code, and the dictionary.
  - The server refused a path that tried to leave the folder.
  - `npm run get-model` recognized a good copy.
  - `npm run score-speed` loaded the model through the app's own loader and the vendored engine in Chrome, and ran it.
- **Hugging Face** allows the download from https://iisurf.github.io and from http://localhost:8000. Checked with a request header, not by downloading again.
- The app's kept vocabulary matches the model's vocab.json exactly.
- **Speed by length:** a 0.6 s word takes 2.5 s with Chrome slowed down 6 times, and a 2 s recording takes 8.3 s. So cutting the silence is a Must.
- **The scoring test, rerun** with the dictionary in its new place: the same results (89% caught, 3% right sounds red, 86% green).

### Not verified

- The browser downloading the full model from Hugging Face. Only the permission header was checked, to avoid another 355 MB download, and the download logic is covered by the tests.
- Windows and Linux themselves. The tools look for Chrome in the usual places there, but neither was tried.

## 2026-10-31 (Saturday, later still): the card opens the repository

### Plan

iiSurf merged the plan into `main` (pull request #2), so the Portfolio card's button can open the repository itself instead of `nicks-branch`.

### Changed

- In the Portfolio (688daa2):
  - The button opens https://github.com/iiSurf/articulate.
  - The progress line now includes the scoring test, which passed, and "Next: building the app."
  - Scripts and styles are at `?v=20261031`, and the Portfolio's own log has an entry.
- Here, before committing the scoring test: `nicks-branch` was brought up to date with `main` (a fast-forward to iiSurf's merge, with no file changes).

### Verified

- Live, after GitHub Pages published it: the card at 390 and 1280 wide shows the new text, and its button's address is https://github.com/iiSurf/articulate, which answers.

### Not verified

- A real phone, Safari, or Firefox.
- The Portfolio's own log still says the live check is to come. It gets updated with the next Portfolio change.

### Not verified

- Not seen on a real Samsung phone.
- The drafts use the phone's own font, not a chosen one.
- Only the Out loud screen is drawn. At 360 wide, "Say it again" wraps inside the drawn phone frame, which is narrower than a real phone screen.

## 2026-11-01 (Sunday): the try-it page

### Plan

The scoring test passed on the Mac's voices, but two things were still unproven: real voices, and real phones. The answer is a test page anyone can open and say a word into. It's a tool for building the app, not part of it, and not a tutorial (that comes next, after the screens exist).

### Changed

- New, the page: `tools/score/try.html`.
  - Pick or type a word. Tap Record, say it, and tap again; it stops by itself after 4 seconds.
  - It shows each sound colored with its mark, its score, and what it sounded like, plus what the model heard overall, a playback of the recording, and how long scoring took on that device.
  - It keeps a list of tries, with a button to copy them.
  - It loads the model the way the app will: the local copy, then the browser's saved copy, then a download with a progress bar, after asking first.
  - Nothing is saved or sent. `?word=` opens it with a word.
- New: `js/score/score.js`, `scoreSounds()`. It takes a recording to graded sounds, cuts the silence, runs the model, says what the model heard, and times it.
- `js/score/audio.js`:
  - `trimSilence()` keeps the word with a quarter second on each side, so a quiet "th" at the start isn't cut off.
  - `decodeRecording()` turns a phone's recording into 16 kHz samples.
  - `resample()` changes the rate when the browser can't do it itself.
- `js/score/source.js`: `modelSaved()` tells whether the model is already here, without downloading it.
- New: `js/words/cmudict.js`, the dictionary reader for the page and the scoring test. It also turns a phone's curly apostrophe into a straight one.
- New: `tools/score/try-check.mjs` (`npm run score-try`) checks the page end to end in Chrome with a stand-in microphone.
  - Headless Chrome's own fake microphone sent no sound, whatever the file. Plain 16 kHz and 48 kHz WAVs were tried too.
  - So the page's "open the microphone" call is swapped for one that plays a recording through the browser's audio.
  - `tools/chrome.mjs` takes extra Chrome switches for this.
- Fixed while testing: opening the microphone can take a few seconds, and a second tap during that wait started a second recording. The page now says "Starting the microphone…" and ignores taps until it's open.
- New tests: 12 of them, for trimming, rate change, the dictionary reader, `scoreSounds` with a stand-in model, and `modelSaved`. 33 in all.
- `PLAN.md`:
  - The try-it page is where the real-voice and phone checks happen.
  - A short first-run tour is now a Must, planned with drafts first.
- `README.md`, `CLAUDE.md`, and `docs/scoring-test.md`: the try-it page.

### Verified

- `npm test`: 33 of 33 pass.
- `npm run score-try`, 4 of 4 as expected:
  - think, said right: all green.
  - sink, scored as think: th red, "like s".
  - vest, scored as west: w orange, "like v".
  - ship, scored as sheep: ee orange, "like ɪ".
  - Each was scored in 0.6 to 0.8 s on this Mac, after cutting about a quarter of each recording.
- Trimming on the Mac's recordings, padded with 1.5 s of quiet on each side: about 3.8 s cut to about 0.8 s.
  - 97 of 108 sounds kept their color.
  - Of the 11 that changed, 8 went up to green, and 2 went down: the th in "both" and the a in "path", green to orange.
- The scoring test, rerun with the shared dictionary reader: the same results.
- The page at 360, 390, and 1280 wide, with a result showing: nothing scrolls sideways.

### Not verified

- A real microphone. Only the stand-in has been tried; the real one needs a person.
- A real phone, and the page on GitHub Pages: it isn't on `main` yet.
- The playback shows "0:00 / 0:00" until it's played. Chrome doesn't know a fresh recording's length, but it plays.

## 2026-11-01 (Sunday, later): the tutorial's shape, and plainer words

### Plan

Pick how the app teaches itself, and fix wording iiSurf found awkward on the try-it page.

### Decisions

- **The tutorial: learn by doing, plus tips** (iiSurf picked B with C's tips, out of three shapes):
  - A: a spotlight tour like MySkate's.
  - B: learning by doing with your own first word.
  - C: one-time tips on each screen.

  On the first visit, the learner adds their own first word, hears it, says it, sees the colors, fixes the part that isn't green, and says it again. Every other screen shows a one-line tip the first time it opens, and has a "?" for more. There's always a Skip, and a way to replay it. It is drawn as drafts first, and built once the screens exist. PLAN.md has the steps.
- **New names for the three ways to practice:** "Quiet", "Headphones", and "Out loud" are hard to understand as buttons, so they will change. Options went to iiSurf.

### Changed

- `tools/score/try.html`: every sentence rewritten in plain English.
  - "Try the scoring" became "Check your sounds".
  - "like s" became "sounded like s", and a missing sound says "missing".
  - "The model heard" became "What the app heard".
  - The note about the numbers now says plainly that the number shows how sure the app is that you said that sound, that higher is better, and that below −2 the sound came out closer to a different one.
  - The dictionary codes after the word's sounds are gone.
- `PLAN.md`: the tutorial in the Must list.

### Verified

- `npm run score-try`: 4 of 4 as expected after the wording changes.
- New pictures at 360, 390, and 1280 wide.

### Not verified

- A real microphone or phone (unchanged from the last entry).

## 2026-11-01 (Sunday, later still): Read, Listen, Speak

### Plan

Give the three ways to practice names anyone understands. iiSurf found "Quiet" awkward to select, and "Headphones" and "Out loud" not much better. Three sets were offered:

1. "Right now I can…" Read, Listen, Speak
2. Look, Hear, Say
3. No sound, Listen only, Out loud

iiSurf picked 1.

### Changed

- The app asks **"Right now I can…"**, and the three buttons answer it: **Read** (puzzles on screen, no sound), **Listen** (hearing words, no speaking), and **Speak** (say it and see the colors).
- Renamed everywhere they describe the app:
  - `PLAN.md`: how it works, its section titles, the Must list, the tutorial, the scoring test, the data, and who owns what.
  - `README.md`, `CLAUDE.md` (which now tells both agents to use these three names everywhere), `docs/needs.md`, and `docs/scoring-test.md`.
- The interview questions in `docs/needs.md` keep their old wording, because that is what was asked. Earlier log entries keep the old names, because that is what was decided then.
- `design/themes.html`: every phone now shows "Right now I can…" above Read · Listen · Speak. Re-baked.

### Verified

- No "Quiet", "Headphones", or "Out loud" left in the drafts, and in the docs only where they say what was asked or replaced.
- The drafts at 390 and 1280 wide, in a light look (Sky over wheat) and a dark one (Night flag).

## 2026-11-01 (Sunday, evening): tutorial drafts

### Plan

Draw the tutorial iiSurf picked: the first visit teaches by doing with the learner's own word, plus a one-time tip on each other screen. Draw it before building it, the same way the looks were picked.

### Changed

- New: `design/tutorial.html`, ten phones in the Sky over wheat look (one in Night flag), baked so it shows without JavaScript.
  - **Welcome:** "Привіт! Welcome to Articulate.", three short promises, Let's start, and a skip.
  - **Step 1:** add your own word.
  - **Step 2:** hear it, at normal speed and slowly.
  - **Step 3:** the one-time download of the sound model, with a note to warn on mobile data. Then say it, and the colors are explained.
  - **Step 4:** fix the red part: the tip from з in зуб, then words with th in the same spot.
  - **Step 5:** say it again ("Better! The th went from red to yellow."). The tour ends with Read, Listen, and Speak explained.
  - **Tips:** Read, Listen (in Night flag), and Your colors, with "Show me around again".
- The tour's own parts:
  - a step card at the bottom, with "Step 2 of 5", five dots, one sentence, and Skip the tour;
  - a ring around the next thing to tap;
  - a "?" on every screen;
  - tip cards with Got it.
- `PLAN.md` and `README.md` link to the drafts.

### Verified

- At 360, 390, and 1280 wide: nothing scrolls sideways, and no word is wider than its card.
- Fixed after the first look:
  - The step card's footer shared a style name with the page's footer, which added a big empty strip and indented "Skip the tour".
  - The ring around the red "th" touched the letters next to it.

### Not verified

- Not seen on a real phone.
- The ring's gentle pulse and the reading aloud by screen readers are described, not drawn.

## 2026-11-01 (Sunday, night): the app shell

### Plan

iiSurf approved the tutorial ("Build this one"), but it walks through screens that don't exist yet. So the build goes in this order, written into PLAN.md under "Building, in order":

1. The app shell.
2. Words.
3. Scoring hooked up.
4. The tour.
5. Words, finished.

PLAN.md also now proposes how screens plug in (`registerScreen`, with a `ctx`) and which `data-tour` names the Practice screens need, so the tour can point at them. It waits for the teammate's OK. The teammate has no branch on GitHub yet.

### Changed

- New, the app:
  - `index.html`.
  - `js/app.js`: the band, the tabs (Words, Practice, Progress), "Right now I can…" Read · Listen · Speak, and Your colors. Screens plug in with `registerScreen()`, and a screen that isn't plugged in says "This part is being built".
  - `js/looks.js` and `css/looks.css`: the seven looks, with the night look when the phone goes dark if the learner wants.
  - `js/store.js`: saved on the phone under `articulate.v1`, and checked on the way back in.
  - `js/html.js`: safe markup.
  - `css/app.css`.
- New: 9 tests in `tests/app/shell.test.js`, 42 tests in all.
- New: `npm run check-shell` (`tools/check-shell.mjs`) clicks through the shell in Chrome.
- `tools/shot.mjs`:
  - An address starting with "/" now starts the local server itself.
  - `COLOR_SCHEME=dark` or `light` fakes the phone's setting.
- `PLAN.md`, `README.md`, and `CLAUDE.md`: the build order, the screen plug-in, and the rules for markup and saving.
- The tutorial drafts were committed and pushed first (9b27923), as iiSurf approved them.

### Verified

- `npm test`: 42 of 42.
- `npm run check-shell`, 10 of 10:
  - It starts with Sky over wheat, and switches to Night flag when the phone goes dark.
  - Tapping a look shows it.
  - The switch turned off keeps the day look in dark mode.
  - Read · Listen · Speak is remembered, and so is the Practice tab.
  - Everything survives a reload.
  - The only key saved is `articulate.v1`.
  - Markup typed into the address doesn't become markup.
- Your colors and Speak at 360, 390, and 1280, in light and dark: nothing scrolls sideways.
- Fixed after looking:
  - At 1280 the glowing line under the Night flag band grew to 50 px, because the band pictures stretched with the screen. They now keep their height and repeat.
  - In the tiles, the "Aa" sat on top of the Vyshyvanka and Pysanka strips.

### Not verified

- A real phone.
- Words, Read, Listen, Speak, and Progress are placeholders. Read, Listen, and Speak are the teammate's part in PLAN.md.

## 2026-11-01 (Sunday, late night): keeping the plan, and the teammate's brief

### Plan

The teammate hasn't started Practice (Read, Listen, Speak, Fix). iiSurf was offered three choices:

1. Move Speak and Fix to iiSurf.
2. Keep the plan.
3. Have iiSurf build everything.

iiSurf chose to **keep the plan** and asked for a message telling the teammate what's needed to stay on track. The message should be encouraging, helpful, and excited.

### Changed

- `js/app.js` loads `js/practice/index.js`, the teammate's own file, when it exists, so Practice screens plug in with `registerScreen()` without anyone editing iiSurf's files. PLAN.md says so.
- New: `docs/practice-brief.md`, the teammate's brief:
  - setup in about 15 minutes;
  - what to build, in order: Speak, Fix this part, Listen, Read;
  - the scoring result's shape;
  - how screens plug in, with example code;
  - what `ctx` gives now, and what iiSurf adds by Monday night: `lookUp`, `score`, the word, the tips, and the word lists;
  - the `data-tour` names;
  - the rules that keep us from colliding;
  - a schedule to Friday, with pull requests Tuesday night and Thursday night.
- `CLAUDE.md` points the teammate's agent at the brief. `README.md` links it.
- iiSurf got a short message to send the teammate, in the conversation, not the repository. Claude doesn't send messages.

### Verified

- A stand-in `js/practice/index.js`, in a throwaway copy of the app, plugged a Speak screen in, and screens it didn't register still said "This part is being built".
- `npm run check-shell`: 10 of 10.

### Not verified

- That the teammate has the GitHub invite. iiSurf sends it from Settings, Collaborators.
- iiSurf's Monday deliveries (`ctx.lookUp`, `ctx.score`, My words, and the tips and word lists) are promised in the brief and not built yet.

## 2026-11-01 (Sunday, late night): what Practice needs, and My words

### Plan

iiSurf said to start on what the teammate needs, but without a deadline. So the brief no longer promises iiSurf's pieces "by Monday night". It says they come next, and the teammate's own schedule stays.

### Changed

- **Which letters make which sound** (`js/words/align.js`):
  - It cuts a word into pieces, one per sound, by the cheapest usual spelling: w|ea|th|er, kn|igh|t, ph|o|t|o|g|r|a|ph|y.
  - Silent letters stand alone: the e in write, the s in island.
  - A few spellings make two sounds: x in box, o in one, qu in queen.
- **Looking a word up** (`js/words/lookup.js`): the word's sounds, letters, stress, and strong part. The dictionary loads once.
- **The scoring hooked up** (`scoreRecording` in `js/score/score.js`):
  - It gives each part as it's spelled, with its grade and what it sounded like.
  - The vowels the model hears poorly never show better than yellow and are marked unsure, as PLAN.md says.
- **Everything Practice needs from `ctx`:** `score`, `lookUp`, `model.saved` and `model.load`, `word`, and `param`. The scoring engine loads only when it's first used.
- **My words** (`js/words/screens.js`):
  - Add a typed word or a suggested one.
  - If a word is already there or isn't in the word list, it says so.
  - Remove a word, with Undo.
  - Practice it opens Speak with the word.
- **The word page:** its letters, with the strong part underlined and silent letters in gray, its sounds, Hear it and Slowly with the phone's voice (`js/words/speech.js`), and Practice it.
- `js/store.js`: `current`, the word being practiced. It's an optional field with a default, so no new version.
- New: `npm run check-words` (`tools/check-words.mjs`).
- Docs:
  - `docs/practice-brief.md`: what `ctx` gives now.
  - `PLAN.md`: build steps 2 and 3 are done.
  - `README.md`: the Words files.
- Fixed while building: My words added its click handler to the screen again every time it redrew, so a tap would have counted more than once. The handler is now on the card, which is drawn fresh each time.

### Verified

- `npm test`: 50 of 50, with these new tests:
  - letters lined up for 20 words, plus a check that 1,000 words spell themselves exactly;
  - looking words up;
  - scoring by parts, including the unsure vowel;
  - the saved current word.
- `npm run check-words`, 12 of 12:
  - adding a typed word and a suggested one;
  - a word that's already there, one that isn't in the list, and typed markup;
  - remove, and Undo putting it back in place;
  - the word page as w|ea*|th|er, with the sounds w ɛ ð ɝ;
  - Practice it opening Speak with the word;
  - write's silent e;
  - surviving a reload.
- `npm run check-shell`: 10 of 10.
- My words and the word page at 360, 390, and 1280 wide: nothing scrolls sideways.

### Not verified

- Hear it and Slowly were not heard. Headless Chrome has no voices, so they need a real phone.
- `ctx.score` hasn't run with a real recording inside the app. Its parts are the same code the try-it page uses, and the parts-by-letters step has tests.
- Still to come from iiSurf: the Ukrainian tips, same-sound words, and sound-alike pairs. Then the tour.

## 2026-11-08 (Sunday): the tour

### Plan

The first-visit tour from the tutorial drafts, now that the screens it points at exist (your teammate's Speak, Listen, and Read merged into `main` this morning).

### Changed

- New, the tour's logic (`js/tour.js`): the five steps, the finish, which event moves each step on, where each step happens, what each card says, and the one-time tips.
- New, the drawing (`js/tour-ui.js`, `css/tour.css`):
  - **Welcome:** "Привіт! Welcome to Articulate", with Let's start and Skip.
  - **Step card** above the tabs: "Step 2 of 5", five dots, one sentence, Skip the tour. A ring on the next thing to tap pulses gently, and stands still when motion is turned off.
  - **Step 4** shows the four colors with their marks.
  - **The finish:** "You did it!", with Read, Listen, and Speak explained.
  - **One-time tips,** with Got it. The "?" in the band brings a screen's tip back.
  - **Your colors** has Help, with Show me around again.
  - **Away from the step,** the card says so and has Take me there.
  - **Step 4 with every part green** shows a Next button instead.
- The steps move on from the hooks in the plan: My words says `added` and `practice`, and your teammate's Speak says `said` and `fixed`. The tour finds controls by the `data-tour` names in the code. A test checks every name the tour points at still exists.
- `js/app.js`: the tour is hooked in (`ctx.tour.did`, the "?", the tips), and the saved tour can now reach the finish step, 6. `js/store.js` allows it. It's an optional field, so no new version.
- New: `npm run check-tour` (`tools/check-tour.mjs`).

### Verified

- `npm test`: 79 of 79, with 13 new tests for the tour.
- `npm run check-tour`, 28 of 28, three runs in a row. It walks the whole tour for real: the real sound model scored a stand-in microphone playing "sink" for the word "think", the th came out red ("The th sounded like an s"), the tour pointed at it, and "Back to the word" and a second try reached the finish. It also covers:
  - skipping at the welcome, and Skip the tour in the middle;
  - Take me there;
  - Show me around again;
  - the tips and the "?";
  - no recording in storage after it all.
- `npm run check-shell` (10) and `npm run check-words` (12) still pass.
- Pictures of every moment at 390, and step 4 at 360 and 1280: nothing scrolls sideways.
- Bugs found by the check, and fixed:
  - the Next button showed on every step, because `hidden` lost to the button's style;
  - the ring came back on Add for a moment after step 1;
  - opening Read from an address showed the tip for the screen used last;
  - after skipping, the screen's tip didn't show until the next screen.

### Not verified

- A real phone, and a real microphone. The microphone was a stand-in that plays a recording.
- Hearing "Hear it" in step 2. Headless Chrome has no voices.
- The tour with a real learner. Your friend is the one to try it.

## 2026-11-08 (Sunday, evening): a window that asks before the download

### Plan

iiSurf is worried about the 355 MB sound model download, and wants people to be able to decide: a window that opens when someone reaches the page that needs it, that can be closed, and that says how big the file is, what it's for, how it's used, and that nothing leaves their phone. The first answer to "can it work with no download?": most of the app already does (Read, Listen, My words, Your colors, and the tour need nothing), and only Speak's colored letters need the model. No smaller ready-made model exists. The browser's own speech recognition would send recordings to Google or Samsung, so it was not chosen.

### Changed

- New: `js/ui/modeldialog.js`, a window that opens the first time someone reaches Speak without the model:
  - **What it is:** a small listening model, 355 MB, downloaded once and kept by the browser.
  - **What it's for:** it hears each sound, so each part can turn green, yellow, orange, or red.
  - **How it's used:** it runs inside the app on the phone, and the recording is thrown away.
  - **Your privacy:** the voice never leaves the phone, nothing is sent to anyone, and the words and settings stay on the phone. The file comes from Hugging Face, which can see that the phone asked for it and nothing about the person or their voice.
  - Two buttons, **Download (355 MB)** and **Not now**, and a line saying Read and Listen need no download, with links to both.
  - On mobile data, it adds a note to use Wi-Fi.
  - After Download: a progress bar and a percentage, and it can be closed while the download goes on. When it finishes, a message says "Speak is ready." and Speak redraws.
  - If the download stops: it says so, says nothing was saved or shared, and offers Try again.
- `js/app.js` opens it (`askAboutModel`): at most once per visit, only on Speak, and never when the model is already here. Escape closes it too.
- Speak (the teammate's file) is untouched. Its own "Get it (355 MB)" card stays as the fallback, so the download is always available there after closing the window.
- New: `npm run check-download` (`tools/check-download.mjs`), and `tools/chrome.mjs` can now answer a page's network requests, so tests can pretend the model isn't here without downloading anything.
- Styles in `css/app.css`: the window, its buttons pinned to the bottom, and a message bar.

### Verified

- `npm run check-download`, 16 of 16, ten runs in a row:
  - opens without the model, says each of the four things above, and closes with Escape and with Not now;
  - doesn't open twice in a visit, comes back the next visit;
  - a failed download says so and offers Try again, which tries again;
  - the Read link closes it and opens Read;
  - a stand-in download shows 42%, then closes and says Speak is ready;
  - doesn't open when the model is already here.
- `npm test` 79 of 79, `check-shell` 10, `check-words` 12, `check-tour` 28.
- At 390, 844 by 390 (a phone held sideways), and 1280, in light and dark.
- Two things found by looking and by running it many times:
  - The first version filled the whole phone screen, with the buttons cut off at the bottom. It's tighter now, with the buttons pinned.
  - The check failed about one run in six, and the cause was the check, not the app: it reloaded before the new address had settled, and sometimes landed on the front page. It now waits.

### Not verified

- A real download of the real file inside the window. Every download here was a stand-in, to avoid fetching 355 MB again. The same download code is covered by `tests/score/source.test.js`.
- A real phone, and the mobile data note: Chrome on Android reports the connection type, but Safari doesn't.
- Resuming a download that broke halfway: it starts over. Making it resumable is the next step.

### Same evening: the download is resumable

iiSurf asked for the resumable download, the next step after the window.

### Changed

- `js/score/source.js` downloads the model in 43 pieces of 8 MB instead of one stream:
  - Each piece is asked for with a range request, checked against its own checksum (the 43 checksums are in `source.js`), and only then kept in the browser (Cache Storage, in a separate cache from the finished copy).
  - If the connection breaks or the page closes, the next try asks **only for the pieces that are missing**, and progress starts where it stopped.
  - A piece that fails is tried again by itself three times, waiting 1.5, 4, and 9 seconds. Then it gives up with a plain message: the error code, or "the connection dropped, it picks up where it stopped", or "came through damaged".
  - A damaged piece is thrown away and never kept.
  - When every piece is in, they're joined, saved whole as before, and the pieces are cleared.
  - The checksum is per piece, not for the whole file, so a phone never has to hold a second 355 MB copy to check it.
- It copes with trouble:
  - A server that ignores ranges and sends the whole file still works, and is checked piece by piece.
  - A browser with no Cache Storage, or one that refuses it (some private windows do), keeps pieces in memory so "Try again" still resumes in the same visit.
  - Where a page can't compute checksums, pieces are checked by size.
- `keepStorage()` asks the browser to keep what's been saved, when the download starts and when it finishes, so it isn't deleted when the phone runs low on space.
- The download window: after an interrupted download it says "You already have 47% of it (168 MB). The rest picks up where it stopped." and its button reads "Continue (187 MB left)". It tells people during the download that a dropped connection is retried by itself, and after a failure that what came through is kept.
- `ctx.model.partial()` (new): how much is already kept.
- New: `npm run check-resume` (`tools/check-resume.mjs`).

### Verified

- Before building it, I checked that Hugging Face allows this: range requests work from a page in Chrome, cross origin, from the first byte to the last, and `Content-Range` is readable.
- `npm test`: 88 of 88, with 9 more tests for the download (fresh, break and resume, retry with waits, last-try messages, a damaged piece, a kept piece of the wrong size, a server that ignores ranges, no Cache Storage, a refused cache, no checksums, the browser asked to keep the file), and one that checks all 43 piece checksums against the real model file.
- `npm run check-resume`, 10 of 10, with the real model and the real download code in Chrome, answering each request from the local copy:
  - the first try broke at piece 20, after 4 tries, with a plain message, and the 20 pieces were kept;
  - on the next visit the window said "You already have 47%" and offered Continue;
  - the second try asked for exactly the 23 missing pieces;
  - the finished model was saved whole, the pieces were cleared, and the model loaded and ran.
- `npm run check-download`, 16 of 16, six runs in a row. `check-shell` 10, `check-words` 12, `check-tour` 28.
- Found by running it: a damaged whole file from a server that ignores ranges was being retried as if the network had dropped, and reported with the wrong message. It's reported as damaged at once now.

### Not verified

- The real internet. Every piece in `check-resume` came from the local copy. Range requests to the real server were checked with small ranges only.
- A real phone: whether the browser actually grants "keep this file" depends on the browser and the phone, and Chrome decides by how much the site is used. If it doesn't, the file can still be deleted when storage runs low, and the window then offers to download again.
- Safari and Firefox.
