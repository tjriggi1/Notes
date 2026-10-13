const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const DEFAULT_SETTINGS = {
  q5Path: path.join(os.homedir(), 'Q5'), // legacy: only used to migrate data saved by older versions
  anthropicKey: '',
  model: 'claude-sonnet-5-5',
  notesRepo: '', // local clone of the notes repo; blank = auto-detect the app's own folder
};

class Store {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'notes-data.json');
    this.data = { classes: [], sessions: [], drafts: {}, quarters: [], currentQuarterId: null, settings: { ...DEFAULT_SETTINGS } };
    this.load();
  }

  load() {
    let migrated = false;
    try {
      const p = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      this.data = {
        classes: p.classes || [],
        sessions: p.sessions || [],
        drafts: p.drafts || {},
        quarters: p.quarters || [],
        currentQuarterId: p.currentQuarterId || null,
        settings: { ...DEFAULT_SETTINGS, ...(p.settings || {}) },
      };
    } catch (e) {
      if (e.code !== 'ENOENT') {
        // Keep the unreadable file around instead of overwriting it on the next save.
        try { fs.renameSync(this.file, this.file + '.corrupt-' + Date.now()); } catch (_) {}
      }
    }
    // Older versions had no quarters: put their classes in one built from the old Q5 path.
    const orphans = this.data.classes.filter(c => !c.quarterId);
    if (orphans.length) {
      const q = this.ensureQuarter(this.data.settings.q5Path);
      orphans.forEach(c => { c.quarterId = q.id; });
      if (!this.data.currentQuarterId) this.data.currentQuarterId = q.id;
      migrated = true;
    }
    if (migrated) this.save();
  }

  save() {
    fs.mkdirSync(this.dir, { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }

  id() { return crypto.randomUUID(); }

  currentQuarter() {
    return this.data.quarters.find(q => q.id === this.data.currentQuarterId) || null;
  }

  quarterOf(cls) {
    return this.data.quarters.find(q => q.id === cls.quarterId) || null;
  }

  ensureQuarter(dirPath) {
    const norm = path.resolve(dirPath);
    let q = this.data.quarters.find(x => path.resolve(x.path) === norm);
    if (!q) {
      q = { id: this.id(), name: path.basename(norm), path: norm };
      this.data.quarters.push(q);
    }
    return q;
  }

  // Register a quarter folder (e.g. Q6) with one class per subfolder, and make it the current quarter.
  // Classes from every other quarter stay in the app and show up under "Previous classes".
  addQuarter(dirPath, classNames) {
    const q = this.ensureQuarter(dirPath);
    let added = 0;
    for (const name of classNames) {
      if (this.data.classes.some(c => c.quarterId === q.id && c.name.toLowerCase() === name.toLowerCase())) continue;
      this.data.classes.push({ id: this.id(), name, quarterId: q.id, folder: path.join(q.path, name) });
      added++;
    }
    this.data.currentQuarterId = q.id;
    this.save();
    return { quarter: q, added };
  }

  addClass(name) {
    name = String(name || '').trim();
    if (!name) throw new Error('Class name is empty.');
    const q = this.currentQuarter();
    if (!q) throw new Error('Add your quarter folder first (File > Add quarter folder).');
    if (this.data.classes.some(c => c.quarterId === q.id && c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A class with that name already exists this quarter.');
    }
    const cls = { id: this.id(), name, quarterId: q.id, folder: path.join(q.path, name) };
    this.data.classes.push(cls);
    this.save();
    return cls;
  }

  renameClass(id, name) {
    name = String(name || '').trim();
    const cls = this.data.classes.find(c => c.id === id);
    if (!cls || !name) throw new Error('Cannot rename class.');
    cls.name = name; // the folder on disk keeps its original name
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
