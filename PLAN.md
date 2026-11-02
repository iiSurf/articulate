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
3. **Right now I can…** One tap picks how to practice. The names were chosen on November 1, replacing Quiet, Headphones, and Out loud:
   - **Read:** no sound at all. Puzzles on screen that train the ear in your head (below).
   - **Listen:** hearing, but no speaking (with headphones on a bus). Hear each word at normal speed and slowly, and play "which word did you hear?" with sound-alike pairs.
   - **Speak:** say the word and see each part of it colored by how close it was (below).
4. **Tips** that compare each hard English sound to a Ukrainian sound they already know.
5. **Colors from home.** The app's colors come from the learner's first language, Ukrainian first. Ukraine has seven looks (drafts in [design/themes.html](design/themes.html)). The "UA → EN" tag in the band opens Your colors, where the learner picks one look for the day and one for night, and the app switches when the phone goes dark.

### Read: practice in your head

Ukrainian is spelled almost the way it sounds, so a Ukrainian speaker tends to say every letter they see. English spelling hides its sounds: the small "uh", silent letters, and one sound spelled many ways. These puzzles train exactly that, and the dictionary knows every answer, so the app is always right about them:

- **Find the strong part:** tap the syllable that is said strongest (pho-TOG-ra-phy).
- **Spot the small "uh":** tap the letters that shrink to "uh" (the first and last a in banana, the a in about).
- **Same sound?** Two words with letters marked (bread, bead): do the marked letters sound the same?
- **Odd one out:** which of four words has a different sound in the marked spot (cut, but, put, shut)?
- **Mouth it:** a short cue for the hard part ("tongue between your teeth"), to mouth without making a sound.

### Speak: colored letters, then fix that part

1. Say the word. Each part of it turns a color: **green** (good), **yellow** (close), **orange** (a little off), or **red** (needs work). Every color also has its own mark under the letters, so it works for color-blind eyes too. When the app can't tell, the part stays plain instead of guessing.
2. Tap a part to see what it sounded like ("this sounded like s").
3. **Fix this part:** the tip for that sound, the model saying it slowly, then a few words with the same sound in the same spot (think: thank, thin, three) and a sound-alike pair to hear the difference (sink, think). Each one is colored on that part only.
4. **Back to your word:** try it again and see the colors change.

How it colors: a free speech model that recognizes English sounds runs in the browser, on the phone, so the recording never leaves it. Code lines up what it heard against the word's sounds from the dictionary and scores each one. This was the riskiest part of the plan, so it was tested first, and it passed ("The scoring test" below). If it fails on real voices or a real phone, Speak shows **the beat** instead (each syllable as a block sized by how loud and long it is, the model's above yours), and the learner picks the part to fix themselves.

## Must, Stretch, Later

**Must** (ready for the handover on Friday, November 6):

- My words: add and remove words, saved on the phone.
- A page for each word: its parts (which letters make which sound), which syllable is strong, the tip for a Ukrainian speaker, and the model voice.
- Suggestions from the dictionary, tap to add.
- Right now I can: Read, Listen, Speak.
- Read: find the strong part, spot the small "uh", and same sound.
- Listen: normal and slow, and "which word did you hear?"
- Speak: record, play yours and the model back to back, colored letters, fix this part, and back to your word. The silence before and after a try is cut off before scoring, to keep it fast. For bad/bed and fool/full, which the model hears poorly, the vowel never shows better than yellow.
- Works in Chrome on an Android phone and on a computer.
- **A first visit that teaches by doing** (chosen November 1). The first time the app opens, it walks the learner through their own first word:
  1. add a word,
  2. hear it,
  3. say it and see the colors,
  4. tap the part that isn't green and practice it,
  5. say the word again.

  After that, the first time each other screen opens (Read, Listen, Your colors), a one-line tip explains it once. Each screen also has a "?" button for more. There's always a Skip, and Your colors has "Show me around again". The drafts are in [design/tutorial.html](design/tutorial.html), and it gets built once the screens exist.
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

## Known issues and future features

One list both agents check before starting work. When you fix an issue or start an idea, update it here (the teammate suggests the update in a pull request, since iiSurf owns this file), and say so in your log.

### Known issues

- **Scoring is unproven on real people.** Every test recording came from the Mac's voices, and every mistake was a whole swapped sound, never the in-between sounds a real accent makes. The color cuts in `js/score/gop.js` need checking with real voices, on the try-it page ([docs/scoring-test.md](docs/scoring-test.md), "Still to prove").
- **A Ukrainian accent itself** hasn't been tested at all. Only the friend can test that, at the handover.
- **bad/bed and fool/full are caught poorly** (8 of 15 and 5 of 9). Speak already caps those vowels at yellow (`UNSURE` in `js/score/score.js`).
- **Not tried on a real Android phone,** or in Safari or Firefox. Speed was measured with Chrome slowed down as a stand-in, and the 355 MB download hasn't happened on a phone.
- **A real microphone** hasn't been tried on the try-it page or through `ctx.score` in the app.
- **Long recordings are slow** (about 8 s for 2 s of audio with Chrome slowed down 6 times), so the silence must be cut before scoring.
- **Hear it and Slowly** (the phone's own voice) haven't been heard: headless Chrome has no voices.
- **Kokoro** (the model voice) hasn't been tried yet.
- **The friend's answers** in [docs/needs.md](docs/needs.md) came from iiSurf. Confirm them at the handover.
- **Still to come from iiSurf:** the Ukrainian tips, same-sound words, and sound-alike pairs, then the tour.

### Future features and ideas

The Stretch and Later lists above still hold. These ideas aren't in Must or Stretch yet, except where noted:

- **American dialects:** scoring that also accepts Southern, Boston, or New York City ways of saying a word, with General American as the default. A working, tested version is sketched in [docs/dialects.md](docs/dialects.md) as a proposal for Scoring (iiSurf's part). It has limits: the model can't hear vowel-only differences, and there are no dialect voices. It may not be worth it for this learner, so ask at the handover.
- **Install and auto-update** (this is Stretch's "Home screen and offline"): a web app manifest and a service worker, so Chrome on Android offers "Install app", and each launch picks up what's new on `main`. `index.html` exists now, so this can start. There are two traps:
  - The service worker must never delete the `articulate.model` cache, which holds the 355 MB model.
  - It must be scoped to `/articulate/`, since every iisurf.github.io site shares one origin.

## The scoring test

One day, before anyone builds Speak on it (Saturday, October 31 to Monday, November 2, iiSurf):

1. Run a free English sound-recognition model in Chrome. The first candidate is [speako-phoneme-recognizer](https://huggingface.co/robg/speako-phoneme-recognizer) (Apache 2.0, about 355 MB, built to run in the browser). Try a smaller one too, if one exists.
2. Score each sound of a word against the dictionary, the way pronunciation research does ([CTC-based GOP](https://github.com/frank613/CTC-based-GOP)).
3. Record test words: said normally, and said wrong on purpose (sink for think, vest for west, ship for sheep). Test recordings stay in `.tmp/`, never in the repository.

It passes if all three hold:

- In Chrome on an Android phone, a word is scored in under 3 seconds, once the model is downloaded.
- The wrong-on-purpose part turns orange or red at least 8 times in 10.
- A part said correctly turns red at most 1 time in 10.

If it fails, Speak ships with the beat, and colored letters move to Later. Either way, the result goes in iiSurf's log.

**Result (October 31): passed, on the Mac's own voices.** Swapped sounds were caught 89% of the time, a right sound turned red 3% of the time, and a short word took 2.8 s with Chrome slowed down 6 times as a stand-in for a cheap phone. The th mistakes, the most important ones, were caught 35 times in 36. Weak spots: bad/bed and fool/full. Still unproven: real voices, a real Android phone, and a real accent. Everything is in [docs/scoring-test.md](docs/scoring-test.md). Next, before the handover:

1. iiSurf records about ten words, said right and wrong on purpose, to check the colors with a real voice.
2. Time it on real phones.

Both happen on the try-it page, `tools/score/try.html` (built November 1). Anyone can open it on GitHub Pages, say a word, see the colors and the time, and copy the results.

## Data and voices

- **Pronunciations:** the [CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict) (American English, about 135,000 words, BSD license). It is in the repository at `data/words/cmudict.dict`, with its license, and a script will turn it into a compact file for the app. It gives each word's sounds and stress. A script also lines up each word's letters with its sounds. Code finds the similar words and the puzzle answers.
- **Everyday words:** a list of common words keeps suggestions to words people actually use. Which list depends on its license (to check).
- **The model voice:** clips made ahead of time, on a computer, with [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), a free voice model (Apache 2.0) with American voices, for the most common words. Any other word plays in the phone's own voice. To try first.
- **The sound model** (Speak only): 355 MB, too big for GitHub, so it comes from Hugging Face, pinned to one version (`js/score/source.js`). The app downloads it once on first use, ideally over Wi-Fi, and keeps it in the browser. Hugging Face allows downloads from both GitHub Pages and localhost (checked October 31). That download is the app's only outside request, and it sends nothing about the learner. While developing, `npm run get-model` keeps a checked copy in `.models/`, and the app uses that copy instead.
- **The engine that runs it:** onnxruntime-web (Microsoft, MIT), copied into `vendor/` by `npm run vendor` and committed, so the app works on GitHub Pages and from a fresh clone without npm.
- **Working from a fresh clone:** both of us get everything with `npm install` and `npm run get-model`, on a Mac, Windows, or Linux (README.md, "Getting started"). The only exception is the scoring test's recordings, which use the Mac's voices.
- **Privacy:** the learner's words and recordings stay in the browser on their phone. No accounts, no server, no analytics, no paid services, no API keys. Saved data uses keys that start with `articulate.`, because every iisurf.github.io site shares one browser storage.

## Who owns what

The owner of a file is the only one who changes it. If you need a change in the other person's files, ask them, or explain it in your pull request instead of making it.

| Part | Owner | Files |
| --- | --- | --- |
| The app shell: the page, the look and the themes, moving between screens, saved settings, and the tour | iiSurf | `index.html`, `css/`, `js/app.js`, `js/looks.js`, `js/store.js`, `js/html.js`, `js/tour.js`, `tests/app/`, `design/` |
| Words: my words, the dictionary, letters and sounds, suggestions, word pages, Ukrainian tips | iiSurf | `js/words/`, `data/words/`, `tools/words/`, `tests/words/` |
| Scoring: the sound model and the color of each part | iiSurf | `js/score/`, `tools/score/`, `tests/score/`, `vendor/` |
| Practice: the Read puzzles, Listen, the Speak screen (record, play back, show the colors, fix this part), and the voice clips | the teammate | `js/practice/`, `data/voice/`, `tools/voice/`, `tests/practice/` |
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

### Screens, and the hooks the tour needs (proposed by iiSurf on November 1, waiting for the teammate's OK)

The app shell shows one screen at a time. Each part plugs its screens in by name, so nobody edits anyone else's files:

```js
// js/app.js (iiSurf)
registerScreen("speak", {
  render(container, ctx) { ... }, // draw the screen into container
});
// ctx gives every screen what it needs from the other parts:
//   ctx.word          the word being practiced ("weather"), or null
//   ctx.lookUp(word)  its parts and stress (Words)
//   ctx.score(...)    how close each sound was (Scoring)
//   ctx.go(name, x)   open another screen, like ctx.go("fix", { word, part: 2 })
//   ctx.tour          the tour (below)
```

The Practice screens are named "read", "listen", "speak", and "fix". Until one is plugged in, the shell shows a plain "This part is being built" in its place. The shell loads `js/practice/index.js` (the teammate's file) when it exists, and that file calls `registerScreen()` for each Practice screen, so plugging in never means editing iiSurf's files.

**The tour** (design/tutorial.html) finds controls by a `data-tour` name, and moves on when a screen tells it something happened. Practice screens add these:

| On the screen | `data-tour` | Tell the tour |
| --- | --- | --- |
| Speak: the Record button | `record` | `ctx.tour.did("said")` after a try is graded |
| Speak: each part of the graded word | `part` (with `data-grade` set to good, close, off, or work) | tapping a part opens "fix" |
| Fix: the Back to the word button | `fix-back` | `ctx.tour.did("fixed")` when it's tapped |
| Read: the puzzle | `read-puzzle` | nothing (the tip shows once by itself) |
| Listen: the Play button | `listen-play` | nothing |

A test (`tests/app/tour.test.js`, with the tour) will check that every `data-tour` name the tour uses exists somewhere in the code, so renaming one means updating the tour.

## Building, in order (iiSurf's part)

1. **The app shell:** the page, the seven looks and Your colors (day, night, and following the phone's dark mode), the tabs (Words, Practice, Progress), "Right now I can…" with Read, Listen, and Speak, saved settings, and a safe way to put text on the page. Started November 1.
2. **Words:** My words (add, remove, saved on the phone), and the word page (its sounds, the strong part, Hear it and Slowly with the phone's own voice until the voice clips exist). Built November 1, along with lining letters up with sounds.
3. **Scoring hooked up:** `score(recording, word)` from the handshake, with the letters for each sound. Built November 1 as `ctx.score`, with `ctx.lookUp`, `ctx.model`, and `ctx.word`.
4. **The tour:** the welcome, the step card, the ring, the one-time tips, the "?", and Show me around again. Steps 1 and 2 run on the Words screens. Steps 3 to 5 run on the Speak and Fix screens through the hooks above.
5. **Words, finished:** suggestions, a smaller dictionary file, and lining up letters with sounds.

## Branches, pull requests, and merging

- `main` is what GitHub Pages puts live. Nobody pushes to it directly.
- Each of us works on our own branch: iiSurf on `nicks-branch`, the teammate (ArthurJClack) on `arthurs-branch`.
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
