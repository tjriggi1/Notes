# Galisano Notes

A desktop app for taking class notes fast and getting a polished Word document out the other end.

## Run it

```
npm install
npm start
```

Needs Node 18+. On first launch, open **Settings** and set:

- **Q5 folder**: defaults to `~/Q5`. Each class gets its own subfolder inside it.
- **Anthropic API key**: used to rewrite your notes. Without a key, notes are saved exactly as typed.

## How it works

- Classes are listed on the left. Double-click one to rename it.
- Each class has three tabs: **New notes**, **Previous notes** (date plus a short description of each day), and **All notes** (every submitted day in one scrolling document).
- Your draft autosaves as you type, so closing the app mid-class loses nothing.
- **Submit** sends the rough notes to Claude, which fixes wording and structure without adding facts, then saves `Q5/<class>/<date> - <title>.docx`.
- If polishing or the file save fails, the notes are still stored in the app and a warning says what went wrong.

App data (classes, notes, settings) lives in the Electron user-data folder as `notes-data.json`.

## Not built yet

Sending each submission to a repo so Claude can read it in later sessions. See the open question in the pull request or chat.
