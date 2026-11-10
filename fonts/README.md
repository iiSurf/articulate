# Fonts

The app (and the redesign drafts, `design/redesign.html`) draws its text with one typeface, served from this folder instead of from Google, so nothing is requested from anywhere else and it works offline.

| File | Typeface | Used for |
|---|---|---|
| `atkinson-next-latin.woff2` | Atkinson Hyperlegible Next (variable: weights 200 to 800, upright) | The English text. Ukrainian letters fall back to the phone's own font. |

- Why: it was made by the Braille Institute to be read at a glance, with a clear difference between look-alike letters (I, l, 1 and O, 0), which helps someone reading English as a second language.
- Source: the same file MySkate uses (`fonts.gstatic.com`, Atkinson Hyperlegible Next v7, downloaded 2026-10-18, Latin subset), copied from that repo on 2026-11-09.
- The `@font-face` rule is in `css/fonts.css`.
- License: SIL Open Font License 1.1 (https://openfontlicense.org). Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors (https://github.com/googlefonts/atkinson-hyperlegible-next). The full license is in `OFL-atkinson-hyperlegible-next.txt`. Used as it is, unmodified.
