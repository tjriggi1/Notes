const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const DEFAULT_SETTINGS = {
  q5Path: path.join(os.homedir(), 'Q5'),
  anthropicKey: '',
  model: 'claude-sonnet-5-5',
  githubToken: '',
  githubRepo: 'tjriggi1/notes',
};

class Store {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'notes-data.json');
    this.data = { classes: [], sessions: [], drafts: {}, settings: { ...DEFAULT_SETTINGS } };
    this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      this.data = {
        classes: parsed.classes || [],
        sessions: parsed.sessions || [],
        drafts: parsed.drafts || {},
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      };
    } catch (e) {
      if (e.code !== 'ENOENT') {
        // Keep the unreadable file around instead of overwriting it on the next save.
        try { fs.renameSync(this.file, this.file + '.corrupt-' + Date.now()); } catch (_) {}
      }
    }
  }

  save() {
    fs.mkdirSync(this.dir, { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }

  id() { return crypto.randomUUID(); }

  addClass(name) {
    name = String(name || '').trim();
    if (!name) throw new Error('Class name is empty.');
    if (this.data.classes.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A class with that name already exists.');
    }
    const cls = { id: this.id(), name };
    this.data.classes.push(cls);
    this.save();
    return cls;
  }

  renameClass(id, name) {
    name = String(name || '').trim();
    const cls = this.data.classes.find(c => c.id === id);
    if (!cls || !name) throw new Error('Cannot rename class.');
    cls.name = name;
    this.save();
    return cls;
  }

  deleteClass(id) {
    this.data.classes = this.data.classes.filter(c => c.id !== id);
    this.data.sessions = this.data.sessions.filter(s => s.classId !== id);
    delete this.data.drafts[id];
    this.save();
  }

  setDraft(classId, text) {
    if (text) this.data.drafts[classId] = text; else delete this.data.drafts[classId];
    this.save();
  }

  addSession(session) {
    this.data.sessions.push(session);
    delete this.data.drafts[session.classId];
    this.save();
  }

  updateSession(id, patch) {
    const s = this.data.sessions.find(x => x.id === id);
    if (s) Object.assign(s, patch);
    this.save();
  }

  sessionsFor(classId) {
    return this.data.sessions
      .filter(s => s.classId === classId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }

  setSettings(patch) {
    for (const k of Object.keys(DEFAULT_SETTINGS)) {
      if (patch[k] !== undefined) this.data.settings[k] = String(patch[k]).trim();
    }
    this.save();
  }
}

module.exports = { Store, DEFAULT_SETTINGS };
