// Auto-upload for Claude's memory: copy the session's Markdown into a local clone of the
// notes repo, then commit and push with git. Uses whatever git login is already set up
// on this computer, so the app never stores a GitHub token.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

function git(repo, args) {
  return new Promise((resolve, reject) => {
    execFile('git', ['-C', repo, ...args], {
      timeout: 60000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, // fail instead of hanging on a password prompt
    }, (err, stdout, stderr) => {
      if (err) reject(new Error((stderr || err.message).trim().split('\n').slice(-2).join(' ')));
      else resolve(stdout);
    });
  });
}

// Returns { ok, warning? }. Never throws: a failed upload must not lose the notes.
async function uploadToRepo({ repo, relPath, markdown, message }) {
  if (!repo || !fs.existsSync(path.join(repo, '.git'))) {
    return { ok: false, warning: 'Auto-upload is off: no notes repo found. Set "Notes repo folder" in Settings to a clone of your notes repo.' };
  }
  try {
    const abs = path.join(repo, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, markdown);
    await git(repo, ['add', '--', relPath]);
    await git(repo, ['commit', '-m', message, '--', relPath]);
    try {
      await git(repo, ['push', 'origin', 'HEAD']);
    } catch (_) {
      // Remote moved ahead (e.g. an earlier push from another machine): sync once and retry.
      await git(repo, ['pull', '--rebase', '--autostash', 'origin', (await git(repo, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim()]);
      await git(repo, ['push', 'origin', 'HEAD']);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, warning: `Saved locally, but the upload to Claude's memory failed (${e.message}). It will be included next time you run "git push" in that folder.` };
  }
}

module.exports = { uploadToRepo };
