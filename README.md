# Golisano Notes

A desktop app for taking class notes fast and getting a polished Word document out the other end.

## Run it

```
npm install
npm start
```

Needs Node 18+. On first launch, open **Settings** and set:

- **Q5 folder**: defaults to `~/Q5`. Point it at your real Q5 folder with Browse. If a folder named after the class already exists inside it (case ignored), notes go there; otherwise one is created.
- **Anthropic API key**: used to rewrite your notes. Without a key, notes are saved exactly as typed.

## How it works

- Classes are listed on the left. Double-click one to rename it.
- Each class has three tabs: **New notes**, **Previous notes** (date plus a short description of each day), and **All notes** (every submitted day in one scrolling document).
- Your draft autosaves as you type, so closing the app mid-class loses nothing.
- **Submit** sends the rough notes to Claude, which fixes wording and structure without adding facts, then saves a formatted web page (plain `.html`, opens in any browser, no Word) to `Q5/<class>/<date> - <title>.html`. It also refreshes `Q5/<class>/All notes.html` and writes a Markdown copy in `Q5/<class>/for-claude/`.
- If polishing or the file save fails, the notes are still stored in the app and a warning says what went wrong.

App data (classes, notes, settings) lives in the Electron user-data folder as `notes-data.json`.

## Claude's memory of your notes

Copy the files from each `Q5/<class>/for-claude/` folder into `classes/<class>/` in this repo and push. `CLAUDE.md` tells Claude to search those notes before anything else when you ask about a class. Nothing is uploaded automatically.
