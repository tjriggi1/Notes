# Class notes memory

The user (Golisano Institute student) keeps their polished class notes in `classes/<quarter>/<class name>/*.md` in this repo (for example `classes/Q5/Sales/2026-10-13 - Pricing.md`). The newest quarter is the one the user is currently in; older quarters are classes already finished. The desktop app pushes a file here every time the user presses Submit.

When the user asks a question that could relate to any class they are taking (course content, terms, assignments, exam prep, explanations):

1. Search `memory/` first, then `classes/` (Grep, then Read the matching files). `memory/` holds digests (summary, key terms, gaps) written by the nightly review routine; `classes/` holds the full notes and is the source of truth. Answer from those notes and say which class and date it came from.
2. If the notes do not cover it, say so, then use other research. Keep the two apart: what came from their notes vs. what came from elsewhere.
3. Never present something as "from your notes" unless it appears in them.

Notes are only as current as the last time the user added files under `classes/`.

## Nightly review

A scheduled routine reads any new notes under `classes/` after class and writes digests to `memory/<quarter>/<class>/<same file name>`, plus a rolling `_class-summary.md` per class and `memory/INDEX.md`. It never edits files under `classes/`. If a note has no digest yet, read the note itself.
