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
