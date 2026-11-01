# Articulate

A pronunciation practice app for one person: a friend who grew up speaking Ukrainian, speaks English very well, and wants to sound closer to an American accent. They add their own words and get suggestions of similar words. Then they practice in one of three ways, picked under "Right now I can…": Read (puzzles on screen, no sound), Listen (hearing words, no speaking), or Speak (each part of the word colored by how close it was, then practice on that part). Use these three names everywhere.

This is TCSS 490 Artifact 4 ("For Someone Else"), built by a team of two. Each of us works with our own Claude Code, and the two agents never talk to each other, so this file and PLAN.md are how both agents stay on the same plan. Due Sunday, November 8, 2026, 11:59 PM.

## Read PLAN.md first

[PLAN.md](PLAN.md) is the team's plan: what we are building, who owns which files, how we merge, and the timeline. Follow it. If a task goes against it, stop and ask your person instead of working around it.

## Setup (both of us)

A fresh clone has everything except two things git ignores: `node_modules/` (`npm install`) and the 355 MB sound model in `.models/` (`npm run get-model`). README.md, "Getting started", has the commands. If a task needs the model and it isn't there, run `npm run get-model` (ask your person first: it's a big download). Don't work around a missing setup step.

- `npm start` serves the repository at http://localhost:8000. Use it, not `file://`: the app loads modules and data with fetch.
- `npm test` runs every test, with nothing downloaded.
- To try the scoring by hand: `npm start`, then http://localhost:8000/tools/score/try.html (say a word, see each sound's color).
- `vendor/` holds the browser engine for the sound model, copied from npm by `npm run vendor`. Never edit it by hand.
- Never commit `.models/`, `node_modules/`, or `.tmp/`.
- `npm run score-test` only runs on a Mac (it records with the Mac's voices). Everything else runs on a Mac, Windows, or Linux.

## Who you are working for

Check the branch (`git branch --show-current`):

- `nicks-branch`: you are working for **iiSurf** (GitHub: iiSurf), who owns the app shell, Words, Scoring, and the shared documents, and writes in `LOG.md`.
- Any other branch: you are working for **the teammate**, who owns Practice and writes in their own `LOG-<their GitHub name>.md`. Start with [docs/practice-brief.md](docs/practice-brief.md): what to build, in what order, and how the screens plug in.
- `main`: stop. Nobody works on `main`. Ask your person which branch to use.

## Rules for every agent

- Work only on your person's branch. Never commit to `main`, push to `main`, force-push, or merge a pull request. Your person merges, on GitHub.
- Change only the files your person owns ("Who owns what" in PLAN.md). If something in the other person's files needs to change, say so in the pull request instead of changing it.
- Before starting work, bring the branch up to date with `main` (`git fetch origin`, then `git merge origin/main`). If that stops with a conflict in the other person's file, stop and tell your person.
- Ask your person before every push.
- After each meaningful change, add a dated entry to your person's log, and only theirs: what was planned, what changed, what was checked, and what was not.
- Plan before building anything large. Keep changes small and commit after each working step, with a clear message.
- Run `npm test` before committing changes to `js/`.
- Check anything visible in a browser at 360, 390, and 1280 wide before calling it done, and say what was not checked.

## The app's own rules

- Plain HTML, CSS, and JavaScript (ES modules). No build step, no framework, no server.
- The learner's words and recordings stay in their own browser. No accounts, no analytics, no third-party trackers.
- No API keys and no paid services, ever. The voice clips are made ahead of time on a computer. The only model on the phone is the free sound model that colors the letters, and it runs in the browser, so recordings never leave the phone.
- The sound model's download is the app's only outside request. Add no others (no font links, no analytics, no CDN scripts): keep libraries in the repository.
- Saved data uses keys that start with `articulate.`, because every iisurf.github.io site shares one browser storage.
- The learner types their own words, and they show up on screen. Never put typed text into the page as raw HTML: build markup with `html` from `js/html.js`, and use `raw()` only for markup written in our own code.
- Screens plug into the app with `registerScreen()` from `js/app.js`, and get what they need from its `ctx` (PLAN.md, "Screens, and the hooks the tour needs"). Don't import another part's screens directly.
- What's saved goes through `js/store.js`. Changing its shape means a new version and an upgrade step for older saves.
- Every animation has an off state for `prefers-reduced-motion`.
- What the learner reads is plain, friendly language.
- Never put the friend's name, their recordings, or anything that could identify them in the repository. No secrets or tokens either.
- Never commit copyrighted documents (PDFs, book pages). Data files must have a license that lets us publish them, written next to the file.

## On iiSurf's Mac

Claude works only inside `~/Documents/claude-workspace`: never in Downloads, the Desktop, iCloud Drive, or the system's temporary folder. Scratch files go in `.tmp/` in this repository, which git ignores. npm keeps its cache in the home folder unless told otherwise, so on this Mac install with `npm install --cache .tmp/npm-cache`. Node is at `/Users/nick/.nvm/versions/node/v22.18.0/bin`.
