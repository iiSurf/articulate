# The scoring test

PLAN.md asked one question before anyone builds Out loud on it: can a free speech model, running in the browser, color each sound of a word right? This is the answer from October 31, 2026.

**Short answer: yes, so far.** On recordings made by the Mac's own voices, it passed all three parts of the pass rule:

- It caught the swapped sounds 89% of the time.
- It marked a correct sound red 3% of the time.
- It took 2.8 seconds for a short word with Chrome slowed down 6 times.

Out loud gets colored letters. Three things are still unproven:

- Real voices, and a real accent.
- A real Android phone.
- Two vowel pairs the model hears poorly (below).

## How it was tested

- **The model:** [speako-phoneme-recognizer](https://huggingface.co/robg/speako-phoneme-recognizer) (Apache 2.0). It is a wav2vec2 model trained on TIMIT, a set of American recordings, saved in a form that runs in the browser. It hears 38 sounds. The file is 355 MB, and its checksum matched the one Hugging Face lists. It ran with onnxruntime-web 1.31.1 on one thread, the way it will run on GitHub Pages.
- **The scoring:** `js/score/gop.js`. For each sound of the word, the code asks whether the word as written fits the recording better than the same word with that one sound swapped for any other sound, or left out. The gap is the sound's score, and the best other sound is what it "sounded like".
- **The recordings:** 61 word pairs, each a target and a look-alike that swaps one sound. Most are the swaps a Ukrainian speaker tends to make (think and sink, west and vest, sheep and ship), plus some controls (pin and bin, right and light).
  - Each pair was said by six of the Mac's American voices with `say`.
  - Every target word was scored twice: against its own recording, where every sound is right, and against the look-alike's recording, where one sound is wrong.
  - The recordings stayed on the Mac, in `.tmp/`.
- **Fair grading:** the color cuts were picked on three voices (Eddy, Flo, Sandy). The results below come from the other three (Samantha, Reed, Shelley), which played no part in picking them.
- **Rerun it:** `npm run score-test` for the colors (Mac only), and `npm run score-speed` for the speed (anywhere). Both need the model, from `npm run get-model`. The dictionary is in `data/words/`.

## Results on the three check voices

| Pass rule (PLAN.md) | Result |
| --- | --- |
| The wrong-on-purpose sound turns orange or red at least 8 times in 10 | **163 of 183 (89%)** |
| A sound said right turns red at most 1 time in 10 | **25 of 915 (3%)** |
| A word is scored in under 3 seconds on an Android phone | Not tried on a phone. In Chrome on this Mac, slowed down 6 times as a stand-in for a cheap phone: **2.8 s** for a 0.6 s word. |

Also measured:

- Sounds said right that came out green: 86%.
- "Sounded like" named the actual swap 81% of the time. One pair is counted wrong when it wasn't: leave and live. The dictionary's first "live" rhymes with "five", but the Mac said "liv", and the model heard ɪ every time.
- The cuts it picked (scores are natural-log units): green at −1.8 and above, yellow from −2.3, orange from −6.6, red below.
  - A sound said right can score a little below zero and still be green, because the model is never fully sure.
  - The yellow band came out narrow. That is because these recordings are either right or swapped, never in between. Real tries will be in between more often, so the cuts need checking with real voices.

### Which swaps it catches

Caught means orange or red, across the three check voices:

| Swap | Caught | Notes |
| --- | --- | --- |
| th said as s, t, or f (think, three, both) | 35 of 36 | The most common Ukrainian mistake, and the model's best. Mostly red, and "sounded like" names the swap. |
| the th in "this" said as d or z | 18 of 21 | Two "this/dis" and one "then/den" slipped through as green. |
| w said as v, and v said as w | 21 of 24 | One voice (Shelley) let three w→v swaps through. |
| sheep / ship (long and short ee) | 18 of 18 | Orange more than red: the model treats it as a smaller difference. |
| coat / caught | 12 of 12 | |
| p / b, t / d | 23 of 24 | |
| sing / sin (ng) | 12 of 12 | |
| r / l | 11 of 12 | |
| **bad / bed** | **8 of 15** | **Weak.** The model often accepts the e of "bed" as the a of "bad". |
| **fool / full** | **5 of 9** | **Weak** for the same reason, with the two oo sounds. |

The 25 right sounds that turned red were mostly the voices' own quirks: one voice's k sounding like d, another's strong t sounding like h, and a th at the end of "breathe" that the voices barely said. The full list is in `.tmp/score/report.md` after a run.

## Speed

Chrome on this Mac, one thread, median of five words:

| Speed | Model, per word | Scoring, per word |
| --- | --- | --- |
| Full speed | 0.45 s | 2 ms |
| Slowed 4× (about a mid-range phone) | 1.84 s | 6 ms |
| Slowed 6× (about a cheap phone) | 2.77 s | 10 ms |

The model's time grows with the length of the recording. These words were about 0.6 s long with almost no silence around them, but a real try has silence before and after.

A second run timed recordings by length, loading the model the way the app does (`js/score/model.js`, with the engine from `vendor/`), from a fresh copy of the repository:

| Speed | 0.6 s recording | 1 s recording | 2 s recording |
| --- | --- | --- | --- |
| Full speed | 0.44 s | 0.72 s | 1.42 s |
| Slowed 4× | 1.66 s | 2.85 s | 5.55 s |
| Slowed 6× | 2.54 s | 4.17 s | 8.33 s |

**So the app must cut the silence off before scoring.** A word should go to the model at under about 0.8 s long. Loading the model took 0.7 s from this Mac. On a phone, the first visit has to download 355 MB, which should happen once, on Wi-Fi, and then stay saved in the browser.

## What this decides, and what is still open

- **Decided:** Out loud uses colored letters, with "sounded like" for any part that isn't green. The beat stays the fallback.
- **Make the weak vowels honest:** for bad/bed and fool/full, the app should not sound certain. For example, it can show "close" (yellow) at most for those vowels, and say the model has trouble hearing them.
- **Still to prove, before the handover:**
  1. Real voices. iiSurf records about ten words said right and wrong on purpose, and we check the colors and cuts.
  2. A real Android phone. A small page anyone can open on their phone will time it there.
  3. The download. It is 355 MB, and GitHub Pages can't hold a file that big, so the app loads it from Hugging Face, the app's only outside request.
- **Not tested at all:** a Ukrainian accent itself, where sounds are in between rather than swapped. Only the friend can test that, at the handover.
