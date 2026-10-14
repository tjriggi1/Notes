# Golisano Notes

A desktop app for taking class notes fast and getting a polished Word document out the other end.

## Run it

```
git clone https://github.com/tjriggi1/notes.git
cd notes
npm install
npm start
```

Needs Node 18+ and git. First launch:

1. **File > Add quarter folder** (or the button at the top of the sidebar). Pick your Q5 folder. Every folder inside it becomes a class and notes save into that class folder.
2. **Settings > Anthropic API key** (optional). Without one the app still tidies notes with built-in rules. With one, Claude rewrites them.

## Each new quarter

Make the Q6 folder with one folder per class, then File > Add quarter folder and pick Q6. Q6's classes become the current ones and new notes save there. Q5's classes move to the **Previous** tab in the sidebar with every note intact. Nothing is deleted, and each class folder keeps its `All notes.html`, which is easy to send to a classmate.

## How it works

- Each class has three tabs: **New notes**, **Previous notes** (date plus a short description of each day), and **All notes** (every day in one scrolling page).
- **Slide-style typing:** the page starts with `1. `. Type the slide name, press **Tab** for a sub note (`- `), Tab again for the next one, and **Enter** to skip a line and start `2. `. Submit keeps each sub note under the heading above it, and the day's title is chosen from all the slides (by Claude when an API key is set; from the slide headings otherwise).
- Your draft autosaves as you type.
- **Submit** polishes the notes and writes `<quarter>/<class>/<date> - <title>.html`, refreshes `All notes.html`, and writes a Markdown copy in `for-claude/`.
- **Auto-upload:** if the app runs from a clone of this repo (or Settings > Notes repo folder points at one), Submit also commits and pushes the Markdown to `classes/<quarter>/<class>/`. It uses the git login already on your computer, so no token is stored. If the push fails, the notes are still saved and a warning says why.

## Claude's memory of your notes

`CLAUDE.md` tells Claude to search `classes/` first when you ask about a class. That works in Claude sessions opened on this repo, and only if `CLAUDE.md` and the notes are on the branch the session uses (merge into `main`).
