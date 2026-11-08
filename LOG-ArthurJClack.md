# Articulate log (ArthurJClack)

What ArthurJClack, the teammate, planned with Claude Code, and what changed, oldest first. iiSurf keeps their own log in `LOG.md`. Together the two files are the team's record.

## 2026-11-01 (Sunday, evening): my branch, known issues, and a dialects idea

### Plan

- Start my branch, `arthurs-branch`, and keep it up to date with `main`. `main` is currently the newest branch, since `nicks-branch` is fully merged into it.
- Ask two questions:
  - Could the app let the learner pick an American dialect?
  - Could it install like an app and update itself?
- Gather the known issues and future ideas in one place in PLAN.md, so both agents see them.

### Changed

- `PLAN.md`:
  - My branch name is in "Branches, pull requests, and merging".
  - New section: "Known issues and future features". It gathers known issues from `docs/scoring-test.md` and the open items from the "Not verified" lists in `LOG.md`, plus two ideas: American dialects, and install with auto-update.
  - This is a suggested change, so it waits for iiSurf's OK.
- New: `docs/dialects.md` and `docs/dialects.patch`, a proposal for Scoring. Scoring is iiSurf's part, so it's a patch iiSurf can apply, not a change to `js/score/`.
- No Practice code yet. That starts next, from `docs/practice-brief.md`.

### How we got here

The first try at dialects was built straight into `js/score/` on a branch called `dialects`, along with my own try-it page. A check before pushing found three problems:

1. Those files are iiSurf's.
2. iiSurf had already merged a better try-it page.
3. The plan now uses the names Read, Listen, and Speak.

So none of it was pushed. It was rebuilt here from the newest `main` instead.

### Verified

- `npm test` passes on this branch.
- `docs/dialects.patch` applies cleanly to the newest `main`, and all 59 tests pass with it applied (50 existing and 9 new), in a separate copy of the repository.
- A review by a separate agent found nothing blocking. Its smaller points were fixed: wording in PLAN.md, "fire" now gets the Southern flat i, and each left-out r is decided on its own ("hardware"), with tests for both.

### Not verified

- The dialect scoring on real recordings or with the real model. It was only checked with made-up model output in the tests.
- Install and auto-update. They're only written up, not built.

## 2026-11-01 (Sunday, night): dialects that change the scores, with regional notes

### Plan

Make a picked dialect actually change the scores, not just stop its forms from being marked wrong, and give each region notes the learner can read.

### Changed

- `docs/dialects.patch` (still a proposal for Scoring, nothing in `js/` changes):
  - The picked dialect is the target. Its way of saying a sound is green, and the General American way is yellow, with `general: true`.
  - A left-out r is green, and a kept one is yellow.
  - Each difference is a feature with a note (a title, words to try, and a tip), and `notesFor()` gives the notes for one word.
  - Added Pittsburgh ("dahn" for down) and Upper Midwest and Pacific Northwest ("bayg" for bag, and thank).
- `docs/dialects.md`: rewritten for the new scoring, with a table of every dialect's notes.
- `PLAN.md` (suggested): the dialects idea, updated.

### Verified

- The patch applies cleanly to the newest `main`.
- With it applied, all 66 tests pass (50 existing and 16 new), in a separate copy of the repository. The new tests cover:
  - green for the dialect's way and yellow for the General American way, in Southern, Boston, and Pittsburgh;
  - red for a sound that's neither;
  - General American unchanged.
- `npm test` passes on this branch.

### Not verified

- Real recordings and the real model.
- How the notes and the yellow "General American way" look in the app. That needs a picker and screens, which are iiSurf's files.


## 2026-11-01 (Sunday, night): every platform, no accounts, and a save file

### Plan

Accounts and syncing across devices came up, but they would break the app's rules. So I chose to keep the rules: no accounts, no server, no paid services, and recordings never leave the phone. The app should still work on many platforms, each device on its own, with a simple save file to move the words between them.

### Changed

- `PLAN.md` (suggested), "Future features and ideas": a new item, "On every platform, separately, with no accounts". It covers three things:
  - installing and updating as a web app;
  - a save file, made with "Save my words" and read with "Open a save", through `sanitize()`, with "Add these words" or "Replace everything";
  - maybe later, a small Android app file.

### Verified

- `js/store.js` already sends every save it reads through `sanitize()`, so a save file from another device can't break the app.

### Not verified

- Nothing is built yet. Install and the save file are both iiSurf's files (`index.html`, `js/store.js`), so they need iiSurf's OK, or a patch like the dialects one.

## 2026-11-06 (Friday, handover day): Speak

### Plan

Build Speak first, since it's the screen that matters most, with the improvements from the list built in. Fix this part, Listen, and Read come next.

### Changed

- New: `js/practice/`, the Practice part.
  - `index.js` plugs Speak in and loads `practice.css`.
  - `speak.js` is the Speak screen:
    - Record, then each part of the word colored, with a mark as well as a color (✓ ≈ ! ✕).
    - "The th sounded like a d", in plain words, never IPA.
    - Say it again, Hear it, and Slowly.
    - Tapping a part that isn't green opens a small practice panel under the word, with Hear it slowly and Back to the word.
  - It also covers the problem cases:
    - the one-time 355 MB download, with a mobile-data warning;
    - the microphone blocked or missing, with links to Listen and Read;
    - a try that's too short or too quiet;
    - recording stops by itself after 4 s;
    - the "hard to hear" note for unsure vowels;
    - no word picked, with the learner's own words to pick from.
  - It sets the tour names: `data-tour="record"`, `data-tour="part"` with `data-grade`, `data-tour="fix-back"`, plus `ctx.tour.did("said")` and `("fixed")`.
  - `recorder.js` records with the try-it page's microphone settings (no echo cancelling, noise suppression, or automatic loudness).
  - `feedback.js` holds the words Speak says. It has no page and no model, so it can be tested.
- New: `tests/practice/feedback.test.js`, 9 tests.

### Verified

- `npm test` passes: 59 of 59, 50 existing and 9 new.
- In headless Chrome, with a stand-in for the scoring:
  - no word, ready, download, mic blocked, a graded try, and the part panel;
  - at 360, 390, and 1280 wide, light and dark;
  - a long word (photography) fits at 360.

### Not verified

- A real recording with the real model. The model isn't downloaded in this workspace, and there's no microphone.
- A real Android phone.
- Fix this part as its own screen: the app has no route for "fix" yet, so the part panel sits inside Speak until iiSurf adds one.
- Listen and Read aren't built yet.

## 2026-11-06 (Friday, afternoon): Listen and Read

### Plan

Build the other two ways to practice, so all three of Read, Listen, and Speak work at the handover.

### Changed

- `js/practice/listen.js`, Listen:
  - The phone says one word, and the learner taps which of two it was.
  - The pairs cover the sounds from `docs/needs.md`: th or t, th or s, th or d, w or v, ee or i, e or a, long or short oo, p or b, ng or n, and oh or aw.
  - After answering, there's a tip on how to hear the difference, both words to replay, and Next word.
  - Pairs with the learner's own words come up more often.
  - If the browser can't speak, it says so in plain words and points to Read.
- `js/practice/read.js`, Read, with no sound at all. Three puzzles take turns:
  - **Find the strong part**: tap the part said strongest.
  - **Spot the small "uh"**: tap every part said as "uh", then Check.
  - **Same sound?**: do the marked letters in two words sound the same?
  - It uses the learner's own words when they fit. Answers are worked out from the dictionary, not typed by hand.
- `js/practice/lists.js` holds my own short lists until iiSurf's land, and `js/practice/puzzles.js` holds the logic, with no page.
- Tour names: `data-tour="listen-play"` and `data-tour="read-puzzle"`.
- New tests: `tests/practice/puzzles.test.js`, which checks every list word against the real dictionary.

### Verified

- `npm test` passes: 66 of 66.
- In headless Chrome:
  - each puzzle kind, answered right and wrong, plus Listen before and after answering;
  - at 360 and 1280 wide, and in dark;
  - in the real app at `#/practice/read` and `#/practice/listen`.

### Not verified

- Hearing the words. Headless Chrome has no voices, so the phone's voice wasn't heard, and Listen was checked with a stand-in voice.
- A real phone.
