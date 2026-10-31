# Words data

- `cmudict.dict`: the CMU Pronouncing Dictionary, American English, about 135,000 words. Each line is a word and its sounds in ARPAbet, with a stress number on each vowel (`think TH IH1 NG K`). Copied unchanged from https://github.com/cmusphinx/cmudict at commit `0f8072f814306c5ee4fbf992ed853601b12c01f9` (December 17, 2024).
- `cmudict-LICENSE.txt`: its license, a BSD license from Carnegie Mellon University that allows sharing it with the notice kept.

The app will use a smaller file made from this one (iiSurf's Words part). The scoring test reads this file directly.
