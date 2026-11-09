# Four fixes for the handover

The four bugs from the improvements list that could show up in front of the learner. They're in iiSurf's files, so this pull request needs iiSurf's OK before it's merged. The fixes are made straight in the code, after `main` as of November 8 (PR #9).

| Bug | What the learner would see | Fix | File |
| --- | --- | --- | --- |
| Only the first way of saying a word is scored | "live" said as "liv", or "read" said as "red", can come out red when it was right | `lookUp()` adds `ways`, every way to say the word. `scoreSounds()` runs the model once, scores every way, and keeps the best fit. The result says which `way` it was, with that way's `phones` and `parts`. | `js/words/lookup.js`, `js/score/score.js` |
| The e and oo vowels are always capped at yellow | "very" and "weather", two of the six starter words, can never be all green | Cap only when this try's closest other sound was the vowel it gets mixed up with (e and a, long and short oo), and it won by less than `UNSURE_MARGIN` (1). `scoreWord()` now returns `closest` even for green sounds. Check the margin with real voices. | `js/score/score.js`, `js/score/gop.js` |
| A stray % in the address | `#/words/50%` shows a blank app until reload | `decode()` falls back to the text as typed | `js/app.js` |
| The phone switching to dark redraws the whole app | A Speak result, a Read answer, or typed text is wiped when the phone goes dark at sunset | The dark switch only changes the look (Your colors is still redrawn). `registerScreen()` redraws only if that screen is showing, once for several. | `js/app.js` |

## Checked

- With the patch on `main`, all 54 tests pass, including 4 new ones:
  - an e the model can't tell from an a shows yellow;
  - an e it heard clearly stays green;
  - "read" said as "red" is scored as "red";
  - `lookUp()` lists every way to say "live".
  - One test changed on purpose: weather's ea is now green when the model clearly heard an e.
- In headless Chrome, with the Practice screens added:
  - `#/words/50%` now shows "isn't in our word list" (on `main` it's a blank app);
  - Read answered, then the phone switched to dark: the look changed and the answer stayed on screen.
- With `docs/dialects.patch` applied after this one, all 70 tests pass. Apply this one first.

## Not checked

- Real recordings. `UNSURE_MARGIN` is a starting guess, like the color cuts.
