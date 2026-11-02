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
