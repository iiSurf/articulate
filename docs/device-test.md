# Testing on a real phone

Everything here was checked in headless Chrome on a Mac, with a stand-in microphone that plays recordings of the Mac's voices. These steps are what that could not check: a real phone, a real microphone, and a real person's voice. About 20 minutes, on Wi-Fi, in Chrome on the Samsung (the friend's phone is mostly Samsung, so that is the one that counts).

Open https://iisurf.github.io/articulate/ and use a private window the first time, so it starts like a new learner.

## First visit
- [ ] The welcome shows, and Let's start walks the five steps with your first word.
- [ ] Say your word at normal volume, in a quiet room, then once with a TV on. Do the colors seem fair? Write down any part that was clearly wrong, with the word.
- [ ] The first Speak asks before the 355 MB download, and the window reads clearly. Download on Wi-Fi. Does the bar move, and does the phone stay awake?
- [ ] Interrupt it once (turn Wi-Fi off for a few seconds in the middle, then back on). It should carry on from where it was.

## Speaking
- [ ] The microphone permission prompt shows once, and Allow works.
- [ ] Stop works when you tap it, and it stops by itself after 4 seconds.
- [ ] A word said wrong on purpose (think as sink) turns the th red or orange, and the tip makes sense.
- [ ] "Hear it" and "Slowly" use a decent American voice. (Samsung phones sometimes pick a different one.)
- [ ] The tips box ends with Practice th in a round.

## Progress, Say it round, Which did you hear?
- [ ] After a few words, Progress shows the three boards. Tap a word and Speak opens with it.
- [ ] Under Needs work, Practice th starts a round: five words, a recap, and stars. Hear the difference opens the listening game.
- [ ] In the listening game the voice plays when you tap Play, and by itself after Next word. Tap the wrong one on purpose: the tip shows.
- [ ] Add these words puts the words in My words.

## The look
- [ ] Turn on the phone's dark mode: the night look takes over. Try two of the day looks.
- [ ] Text is easy to read at arm's length. Buttons are easy to tap with a thumb.
- [ ] Turn the phone sideways: nothing breaks.

## Write down
Anything odd, with the word you said and what the screen showed. A photo of the screen is the best note. Put it in `LOG.md` or tell the agent.

Not covered even here: Safari and Firefox (the app uses MediaRecorder and WebAssembly, which both support, but nobody has tried).
