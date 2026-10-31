# The team plan

Both of us, and both of our Claude Code agents, work from this file. Change it only through a pull request that the other person approves. GitHub doesn't require approvals here, but this file is our agreement, so changes to it wait for the other person's OK.

Status: proposed by iiSurf on October 30, 2026. The teammate agrees by approving the pull request that brings this file into `main`.

## What we are building, and for whom

Articulate is a pronunciation practice app for one person: a friend of iiSurf's who grew up speaking Ukrainian, speaks English very well, and wants to sound closer to an American accent. They use English all day, practice many short times a day, often where they can't speak out loud (on a bus, in a quiet room), and mostly use a Samsung Android phone. What we know about them, and what each answer means for the app, is in [docs/needs.md](docs/needs.md).

How it works:

1. **My words.** They type the words they want to work on.
2. **Suggestions.** For each word, Articulate suggests similar words to add to the mix:
   - words that sound almost the same (west and vest),
   - words with the same hard sound (think, three, both),
   - words from the same family where the stress moves (PHOtograph, phoTOGraphy).
3. **Where are you right now?** One tap picks how to practice:
   - **Quiet:** no sound at all. Puzzles on screen that train the ear in your head (below).
   - **Headphones:** listen, but no speaking. Hear each word at normal speed and slowly, and play "which word did you hear?" with sound-alike pairs.
   - **Out loud:** say the word and see each part of it colored by how close it was (below).
4. **Tips** that compare each hard English sound to a Ukrainian sound they already know.
5. **Colors from home.** The app's colors come from the learner's first language, Ukrainian first. Ukraine has seven looks (drafts in [design/themes.html](design/themes.html)). The "UA → EN" tag in the band opens Your colors, where the learner picks one look for the day and one for night, and the app switches when the phone goes dark.

### Quiet: practice in your head

Ukrainian is spelled almost the way it sounds, so a Ukrainian speaker tends to say every letter they see. English spelling hides its sounds: the small "uh", silent letters, and one sound spelled many ways. These puzzles train exactly that, and the dictionary knows every answer, so the app is always right about them:

- **Find the strong part:** tap the syllable that is said strongest (pho-TOG-ra-phy).
- **Spot the small "uh":** tap the letters that shrink to "uh" (the first and last a in banana, the a in about).
- **Same sound?** Two words with letters marked (bread, bead): do the marked letters sound the same?
- **Odd one out:** which of four words has a different sound in the marked spot (cut, but, put, shut)?
- **Mouth it:** a short cue for the hard part ("tongue between your teeth"), to mouth without making a sound.

### Out loud: colored letters, then fix that part

1. Say the word. Each part of it turns a color: **green** (good), **yellow** (close), **orange** (a little off), or **red** (needs work). Every color also has its own mark under the letters, so it works for color-blind eyes too. When the app can't tell, the part stays plain instead of guessing.
2. Tap a part to see what it sounded like ("this sounded like s").
3. **Fix this part:** the tip for that sound, the model saying it slowly, then a few words with the same sound in the same spot (think: thank, thin, three) and a sound-alike pair to hear the difference (sink, think). Each one is colored on that part only.
4. **Back to your word:** try it again and see the colors change.

How it colors: a free speech model that recognizes English sounds runs in the browser, on the phone, so the recording never leaves it. Code lines up what it heard against the word's sounds from the dictionary and scores each one. This was the riskiest part of the plan, so it was tested first, and it passed ("The scoring test" below). If it fails on real voices or a real phone, Out loud shows **the beat** instead (each syllable as a block sized by how loud and long it is, the model's above yours), and the learner picks the part to fix themselves.

## Must, Stretch, Later

**Must** (ready for the handover on Friday, November 6):

- My words: add and remove words, saved on the phone.
- A page for each word: its parts (which letters make which sound), which syllable is strong, the tip for a Ukrainian speaker, and the model voice.
- Suggestions from the dictionary, tap to add.
- Where are you: Quiet, Headphones, Out loud.
- Quiet: find the strong part, spot the small "uh", and same sound.
- Headphones: normal and slow, and "which word did you hear?"
- Out loud: record, play yours and the model back to back, colored letters, fix this part, and back to your word. The silence before and after a try is cut off before scoring, to keep it fast. For bad/bed and fool/full, which the model hears poorly, the vowel never shows better than yellow.
- Works in Chrome on an Android phone and on a computer.
- The seven Ukraine looks and Your colors: Sky over wheat, Vyshyvanka, Pysanka, Sunflower field, and Kalyna for the day, and Petrykivka and Night flag for night. It starts with Sky over wheat and Night flag. The four grade colors stay the same in every look.

**Stretch:**

- Odd one out, and mouth it.
- Remember which sounds keep coming up red, and suggest words for them.
- Add to the phone's Home screen and work offline (useful on a bus).
- A one-minute warm-up before a stressful call (speaking is hardest when they are tired or stressed).

**Later:**

- The melody (the pitch line of the model and of you).
- A vowel map (where your vowel landed and where it should be).
- Whole sentences.
- Other first languages. The Ukrainian tips live in their own file, so another language is a new file, not new code.

## The scoring test

One day, before anyone builds Out loud on it (Saturday, October 31 to Monday, November 2, iiSurf):

1. Run a free English sound-recognition model in Chrome. The first candidate is [speako-phoneme-recognizer](https://huggingface.co/robg/speako-phoneme-recognizer) (Apache 2.0, about 355 MB, built to run in the browser). Try a smaller one too, if one exists.
2. Score each sound of a word against the dictionary, the way pronunciation research does ([CTC-based GOP](https://github.com/frank613/CTC-based-GOP)).
3. Record test words: said normally, and said wrong on purpose (sink for think, vest for west, ship for sheep). Test recordings stay in `.tmp/`, never in the repository.

It passes if all three hold:

- In Chrome on an Android phone, a word is scored in under 3 seconds, once the model is downloaded.
- The wrong-on-purpose part turns orange or red at least 8 times in 10.
- A part said correctly turns red at most 1 time in 10.

If it fails, Out loud ships with the beat, and colored letters move to Later. Either way, the result goes in iiSurf's log.

**Result (October 31): passed, on the Mac's own voices.** Swapped sounds were caught 89% of the time, a right sound turned red 3% of the time, and a short word took 2.8 s with Chrome slowed down 6 times as a stand-in for a cheap phone. The th mistakes, the most important ones, were caught 35 times in 36. Weak spots: bad/bed and fool/full. Still unproven: real voices, a real Android phone, and a real accent. Everything is in [docs/scoring-test.md](docs/scoring-test.md). Next, before the handover:

1. iiSurf records about ten words, said right and wrong on purpose, to check the colors with a real voice.
2. A small page anyone can open on a phone, to time it there.

## Data and voices

- **Pronunciations:** the [CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict) (American English, about 135,000 words, BSD license). It is in the repository at `data/words/cmudict.dict`, with its license, and a script will turn it into a compact file for the app. It gives each word's sounds and stress. A script also lines up each word's letters with its sounds. Code finds the similar words and the puzzle answers.
- **Everyday words:** a list of common words keeps suggestions to words people actually use. Which list depends on its license (to check).
- **The model voice:** clips made ahead of time, on a computer, with [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), a free voice model (Apache 2.0) with American voices, for the most common words. Any other word plays in the phone's own voice. To try first.
- **The sound model** (Out loud only): 355 MB, too big for GitHub, so it comes from Hugging Face, pinned to one version (`js/score/source.js`). The app downloads it once on first use, ideally over Wi-Fi, and keeps it in the browser. Hugging Face allows downloads from both GitHub Pages and localhost (checked October 31). That download is the app's only outside request, and it sends nothing about the learner. While developing, `npm run get-model` keeps a checked copy in `.models/`, and the app uses that copy instead.
- **The engine that runs it:** onnxruntime-web (Microsoft, MIT), copied into `vendor/` by `npm run vendor` and committed, so the app works on GitHub Pages and from a fresh clone without npm.
- **Working from a fresh clone:** both of us get everything with `npm install` and `npm run get-model`, on a Mac, Windows, or Linux (README.md, "Getting started"). The only exception is the scoring test's recordings, which use the Mac's voices.
- **Privacy:** the learner's words and recordings stay in the browser on their phone. No accounts, no server, no analytics, no paid services, no API keys. Saved data uses keys that start with `articulate.`, because every iisurf.github.io site shares one browser storage.

## Who owns what

The owner of a file is the only one who changes it. If you need a change in the other person's files, ask them, or explain it in your pull request instead of making it.

| Part | Owner | Files |
| --- | --- | --- |
| The app shell: the page, the look and the themes, moving between screens | iiSurf | `index.html`, `css/`, `js/app.js`, `design/` |
| Words: my words, the dictionary, letters and sounds, suggestions, word pages, Ukrainian tips | iiSurf | `js/words/`, `data/words/`, `tools/words/`, `tests/words/` |
| Scoring: the sound model and the color of each part | iiSurf | `js/score/`, `tools/score/`, `tests/score/`, `vendor/` |
| Practice: the Quiet puzzles, Headphones, the Out loud screen (record, play back, show the colors, fix this part), and the voice clips | the teammate | `js/practice/`, `data/voice/`, `tools/voice/`, `tests/practice/` |
| The shared documents | iiSurf (the teammate suggests changes in a pull request) | `README.md`, `PLAN.md`, `CLAUDE.md`, `docs/` |
| The shared tools and settings | iiSurf (the teammate suggests changes in a pull request) | `tools/*.mjs` (not the part folders), `package.json`, `package-lock.json`, `.gitignore`, `.github/` |
| Each person's log | its writer | `LOG.md` (iiSurf), `LOG-<their GitHub name>.md` (the teammate) |

iiSurf takes Scoring because it is the riskiest part and has to start this weekend, before the teammate joins. The teammate is never blocked by it: until the real scoring lands, a stand-in returns made-up colors in the same shape.

iiSurf merges the app shell first (Monday, November 2), so both parts have a place to go.

### The handshake between the parts

Practice gets everything it needs from three functions, so nobody reaches into anyone else's files:

```js
// js/words/lookup.js (iiSurf): a word's parts and stress
lookUp("think")
// → {
//     word: "think",
//     parts: [ // which letters make which sound; phone is null for a silent letter
//       { letters: "th", phone: "TH" },
//       { letters: "i", phone: "IH" },
//       { letters: "n", phone: "NG" },
//       { letters: "k", phone: "K" },
//     ],
//     stress: [1], // one number per syllable: 1 strong, 2 medium, 0 weak
//   }
lookUp("not-a-word") // → null

// js/words/similar.js (iiSurf): words for "fix this part"
sameSound("think", 0) // → ["thank", "thin", "three", ...] the same sound in the same spot as part 0
soundAlikes("think")  // → ["sink", ...] one sound different

// js/score/score.js (iiSurf): how close each part was
await score(recording, "think")
// → [
//     { letters: "th", phone: "TH", grade: "red", heard: "S" },
//     { letters: "i", phone: "IH", grade: "green", heard: "IH" },
//     ...
//   ]
// grade is "green", "yellow", "orange", "red", or null (couldn't tell)
```

Practice finds its own voice clip for a word (`data/voice/`). Changing any of these shapes means changing this section, in a pull request the other person approves.

## Branches, pull requests, and merging

- `main` is what GitHub Pages puts live. Nobody pushes to it directly.
- Each of us works on our own branch: iiSurf on `nicks-branch`, the teammate on theirs (they add its name here).
- Merge into `main` often, every day or two, through a pull request. Once the tests pass, whoever opened it merges it with **Create a merge commit**. GitHub requires no approval, so neither of us waits on the other. Changes to this file or to the handshake are the exception: they wait for the other person's OK. Not squash: our branches live on after each merge, and a squash merge makes the next pull request from the same branch conflict.
- After anything merges into `main`, bring your branch up to date (the pull request's "Update branch" button, or `git merge origin/main`) before more work.
- If a merge stops with a conflict, the person who owns the file decides how it ends up. An agent never settles a conflict in someone else's file.

### Set up once on GitHub (iiSurf)

1. Settings, Collaborators: add the teammate.
2. Settings, General, Pull Requests: allow merge commits only (turn off squash merging and rebase merging).
3. Settings, Rules, Rulesets, New branch ruleset, aimed at `main`: require a pull request (0 approvals, so neither of us waits on the other), restrict deletions, and block force pushes. Add "Repository admin" to its bypass list. Once the test check exists, also require it to pass. (Done October 30.)
4. Settings, Pages: deploy from `main`, folder `/` (root), once there is a page to show.

If a rule ever gets in the way, iiSurf can skip it as the admin (that is what the bypass list is for), and says why in their log.

## Logs

- iiSurf writes in `LOG.md`. The teammate writes in their own `LOG-<their GitHub name>.md`, made in their first commit. Each of us writes only in our own, so the logs never collide. Together they are the team's record.
- Each entry has the date, what was planned, what changed, what was checked, and what was not.

## Timeline

| When | What |
| --- | --- |
| Fri Oct 30 to Sat Oct 31 | This plan. The teammate joins and approves it. Drafts of the screens. |
| Sat Oct 31 to Mon Nov 2 | The scoring test (iiSurf, one day). |
| Sun Nov 1 | Portfolio checkpoint: each of us updates our own Artifact 4 card to show where we are. |
| Mon Nov 2 | The app shell is merged. Colored letters it is (the scoring test passed). |
| Mon Nov 2 to Thu Nov 5 | Build all the parts, merging every day or two. |
| Fri Nov 6 | Hand it to the friend and watch them try it. Log what they say. |
| Sat Nov 7 to Sun Nov 8 | Fix what they ran into. Both cards to "done". Submit on Canvas by 11:59 PM Sunday. |

## Before calling something done

- `npm test` passes (once there are tests).
- Looked at in a browser at 360, 390, and 1280 wide. Say what was not checked.
- Every animation has an off state for people who turn motion down.
- What the learner reads is plain language.
