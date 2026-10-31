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

### Not verified

- Not seen on a real Samsung phone.
- The drafts use the phone's own font, not a chosen one.
- Only the Out loud screen is drawn. At 360 wide, "Say it again" wraps inside the drawn phone frame, which is narrower than a real phone screen.
