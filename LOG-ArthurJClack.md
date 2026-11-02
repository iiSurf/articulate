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
