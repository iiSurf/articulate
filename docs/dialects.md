# Dialects (a proposal for Scoring)

A proposal from the teammate (ArthurJClack) for iiSurf's Scoring part. It isn't part of PLAN.md's Must or Stretch lists. Nothing in `js/score/` changes unless iiSurf takes it.

The idea is to let the learner pick which American accent they're aiming for, so that their pick's own way of saying a word isn't marked as a mistake in Speak.

## What's ready

It's a working, tested change in [dialects.patch](dialects.patch). It applies to `main` as of November 1, and with it all 59 tests pass (50 existing and 9 new). To take it, run `git apply docs/dialects.patch` on `nicks-branch`. If `gop.js` or `phones.js` have changed since, try `git apply --3way docs/dialects.patch`. Once it's in, delete the patch and update this section.

- A new file, `js/score/dialects.js`, holds the dialects and their rules.
- `targets(phones, dialect)` in `phones.js` takes an optional dialect. It defaults to General American, so every existing call scores exactly as before.
- `scoreWord` in `gop.js` handles a sound a dialect may leave out, deciding each one on its own ("hardware" can keep one r and drop the other). A left-out sound comes back as `grade: null, dropped: true`, so it shows plain, like "couldn't tell", and the rest of the word is scored without it.
- New tests are in `tests/score/dialects.test.js`.

| Dialect | What it also accepts |
| --- | --- |
| General American | Nothing new. This is the default. |
| Southern | pin and pen sound the same, with the e said like i before m or n. time, ride, my, and fire use a flat "ah" for the i. right keeps its slide, because a voiceless sound follows. |
| Boston, New York City | No r after a vowel unless a vowel follows: car, card, and water drop it, but carry keeps its r. |

General American always still counts as right. A dialect only stops its own forms from being marked wrong.

Hooking it into the app would mean passing the learner's pick through `scoreSounds` in `score.js` to `targets()`, and adding a picker, perhaps in Your colors. Both are iiSurf's files, and a change to `ctx.score` would change the handshake in PLAN.md. One thing to watch for in `scoreRecording`: the worst-sound check uses `WORSE[s.grade]`, and `WORSE[null]` is undefined, so a dropped sound sharing a part with another sound could hide that sound's grade. Today an r gets its own part, so this doesn't happen yet.

## What it can't do

- **The model can only hear 38 sounds.** A dialect that only nudges its vowels scores the same as General American. That includes the Northern Cities shift around Chicago, the California vowel shift, and the Pacific Northwest. caught and cot are already one sound to the model, too.
- **There are no dialect voices.** The model voice and the phone's own voice are General American, so Listen, Hear it, and Slowly can't play a Southern or Boston version.
- **It hasn't been tried on real recordings,** only on made-up model output in the tests. The model learned from TIMIT, which has speakers from eight US regions, so it has heard these accents, but that's untested here.

## Is it worth it for this learner?

Maybe not. They asked for "American", and General American is what most learners aim for and what every voice in the app speaks. Picking a regional accent matters most for someone who lives in that region. Ask at the handover before building a picker.
