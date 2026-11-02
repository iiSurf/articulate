# Dialects (a proposal for Scoring)

A proposal from the teammate (ArthurJClack) for iiSurf's Scoring part. It isn't part of PLAN.md's Must or Stretch lists. Nothing in `js/score/` changes unless iiSurf takes it.

The idea is to let the learner pick which American accent they're aiming for, and score their words against that accent.

## How it scores

With a dialect picked, **its own way of saying a word is the target**:

- Said the dialect's way, a sound is **green**.
- Said the General American way, it's **yellow**, with `general: true`, so the screen can say "close: that's the General American way".
- Anything else is graded as usual.

General American is the default, and with it nothing changes.

A sound the dialect leaves out (the r in "car" in Boston) is decided on its own for each sound, so "hardware" can drop one r and keep the other:

- Left out, it comes back green, with `dropped: true` and no score.
- Kept, it's yellow, with `general: true`.

## The dialects, and the notes the learner sees

Each difference is a **feature** with a note: a title, words to try, and a tip. `notesFor(phones, dialect)` gives the notes for one word, only for the features that change one of its sounds.

| Dialect | Where | Features (note title: words to try) |
| --- | --- | --- |
| General American | Most national news, and the model voice | none |
| Southern | Texas to Georgia to Tennessee | **pen sounds like pin**: pen, ten, when, remember. The e before m or n is said like the i in pin.<br>**time sounds like "tahm"**: time, ride, my, fire. The i is one long "ah". Before t, s, or k (right, ice, like) it keeps its slide. |
| Boston | Eastern New England | **No r after a vowel**: car, park, four, here. Carry and story keep their r.<br>**"er" becomes "uh"**: water, better, teacher, bird. |
| New York City | New York City and nearby | The same two as Boston. |
| Pittsburgh | Western Pennsylvania | **down sounds like "dahn"**: down, house, out, town. |
| Upper Midwest and Pacific Northwest | Minnesota, Wisconsin, Washington, Oregon | **bag sounds like "bayg"**: bag, flag, dragon, thank. The a before g or ng is said like the a in bake. |

Adding a dialect means adding a few features to `FEATURES` in `js/score/dialects.js` and listing them under the new dialect. No other code changes.

## What's ready

It's a working, tested change in [dialects.patch](dialects.patch). It applies to `main` as of November 1, and with it all 66 tests pass (50 existing and 16 new). To take it, run `git apply docs/dialects.patch` on `nicks-branch`. If `gop.js` or `phones.js` have changed since, try `git apply --3way docs/dialects.patch`. Once it's in, delete the patch and update this section.

The patch changes four things:

- **`js/score/dialects.js`** (new): `FEATURES`, `DIALECTS`, `changes()`, and `notesFor()`.
- **`targets(phones, dialect)`** in `phones.js`: the dialect's sound becomes `ok`, and General American's moves to `general`. A sound the dialect leaves out gets `drop: true`.
- **`scoreWord`** in `gop.js`: green for the dialect's way, yellow for General American's, and left-out sounds decided one by one.
- **`tests/score/dialects.test.js`** (new): 16 tests.

To hook it into the app:

- Pass the learner's pick through `scoreSounds` in `score.js` to `targets()`.
- Add a picker, perhaps in Your colors.
- Show `notesFor()` on the word page and in Fix this part.

These are all iiSurf's files, and a change to `ctx.score` changes the handshake in PLAN.md. A left-out sound comes back green, so `scoreRecording`'s worst-sound check works as it is.

## What it can't do

- **The model can only hear 38 sounds.** A dialect that only nudges its vowels can't be scored, so it isn't in the list. That includes the Northern Cities shift around Chicago, the California vowel shift, and the Pacific Northwest's other vowels. caught and cot are already one sound to the model, too.
- **There are no dialect voices.** The model voice and the phone's own voice are General American, so Listen, Hear it, and Slowly can't play a Southern or Boston version. The notes have to do that job, in words.
- **It hasn't been tried on real recordings,** only on made-up model output in the tests. The model learned from TIMIT, which has speakers from eight US regions, so it has heard these accents, but that's untested here.
- **The features are simplified.** Real speakers vary, and a feature like Southern "tahm" is stronger in some places than others. Yellow, not red, for General American keeps that gentle.

## Is it worth it for this learner?

Maybe not. They asked for "American", and General American is what most learners aim for and what every voice in the app speaks. Picking a regional accent matters most for someone who lives in that region. Ask at the handover before building a picker.
