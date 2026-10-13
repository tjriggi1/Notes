const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { Store } = require('./src/store');
const { polish } = require('./src/polish');
const { uploadToRepo } = require('./src/upload');
const { sessionPage, allNotesPage, toMarkdown } = require('./src/pageBuilder');

let store;
let win;

function safeName(s) {
  return String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Untitled';
}

function today() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// The repo to push notes to: the Settings value, else this app's own folder if it is a git clone.
function notesRepo() {
  const s = store.data.settings.notesRepo;
  if (s) return s;
  return fs.existsSync(path.join(__dirname, '.git')) ? __dirname : '';
}

function publicSettings() {
  const s = { ...store.data.settings };
  // Never send secrets back to the renderer; just say whether they are set.
  const out = { ...s, anthropicKeySet: !!(s.anthropicKey || process.env.ANTHROPIC_API_KEY) };
  delete out.anthropicKey;
  out.notesRepoResolved = notesRepo();
  return out;
}

function snapshot() {
  const d = store.data;
  return {
    classes: d.classes,
    quarters: d.quarters,
    currentQuarterId: d.currentQuarterId,
    sessions: d.sessions.map(({ raw, ...s }) => s),
    drafts: d.drafts,
    settings: publicSettings(),
    today: today(),
  };
}

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 820,
    minHeight: 560,
    title: 'Golisano Notes',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [
      { label: 'Add quarter folder...', accelerator: 'CmdOrCtrl+O', click: () => win.webContents.send('menu:add-quarter') },
      { type: 'separator' },
      { role: 'quit' },
    ] },
    { role: 'editMenu' },
  ]));
}

// Use the class folder you already made in Q5 if one matches (ignoring case); otherwise make it.
function classDir(q5, className) {
  const want = safeName(className).toLowerCase();
  try {
    const hit = fs.readdirSync(q5, { withFileTypes: true }).find(d => d.isDirectory() && d.name.toLowerCase() === want);
    if (hit) return path.join(q5, hit.name);
  } catch (_) {}
  return path.join(q5, safeName(className));
}

function uniquePath(dir, base, ext) {
  let p = path.join(dir, base + ext);
  for (let i = 2; fs.existsSync(p); i++) p = path.join(dir, `${base} (${i})${ext}`);
  return p;
}

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'));

  ipcMain.handle('state', () => snapshot());

  ipcMain.handle('quarter:add', async () => {
    const r = await dialog.showOpenDialog(win, { title: 'Select your quarter folder (e.g. Q6)', properties: ['openDirectory'] });
    if (r.canceled) return null;
    const dir = r.filePaths[0];
    const names = fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name).sort();
    if (!names.length) throw new Error('That folder has no class folders inside it. Make one folder per class first.');
    const { quarter, added } = store.addQuarter(dir, names);
    return { state: snapshot(), quarterName: quarter.name, added, total: names.length };
  });

  ipcMain.handle('class:add', (_, name) => { store.addClass(name); return snapshot(); });
  ipcMain.handle('class:rename', (_, id, name) => { store.renameClass(id, name); return snapshot(); });
  ipcMain.handle('class:delete', (_, id) => { store.deleteClass(id); return snapshot(); });

  ipcMain.handle('draft:save', (_, classId, text) => { store.setDraft(classId, String(text || '')); });

  ipcMain.handle('settings:set', (_, patch) => {
    // Blank secret fields mean "keep what is stored".
    const p = { ...patch };
    if (!p.anthropicKey) delete p.anthropicKey;
    store.setSettings(p);
    return snapshot();
  });

  ipcMain.handle('pick-folder', async () => {
    const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] });
    return r.canceled ? null : r.filePaths[0];
  });

  ipcMain.handle('open-file', (_, p) => shell.showItemInFolder(p));

  ipcMain.handle('submit', async (_, { classId, raw, date }) => {
    const cls = store.data.classes.find(c => c.id === classId);
    if (!cls) throw new Error('Pick a class first.');
    raw = String(raw || '').trim();
    if (!raw) throw new Error('There are no notes to submit.');
    date = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today();

    const s = store.data.settings;
    const warnings = [];
    const result = await polish({
      raw, className: cls.name, date,
      apiKey: s.anthropicKey || process.env.ANTHROPIC_API_KEY || '',
      model: s.model,
    });
    if (result.warning) warnings.push(result.warning);

    const session = {
      id: store.id(), classId, date,
      createdAt: new Date().toISOString(),
      title: result.content.title,
      summary: result.content.summary,
      polished: result.polished,
      content: result.content,
      raw,
      pagePath: null,
    };

    // Q5/<class>/<date> - <title>.html, plus an up-to-date "All notes.html" and a Markdown copy.
    try {
      const quarter = store.quarterOf(cls);
      const dir = cls.folder || classDir(quarter.path, cls.name);
      fs.mkdirSync(dir, { recursive: true });
      const base = `${date} - ${safeName(session.title)}`;
      const file = uniquePath(dir, base, '.html');
      fs.writeFileSync(file, sessionPage(session, cls.name));
      session.pagePath = file;
      fs.writeFileSync(path.join(dir, 'All notes.html'), allNotesPage([...store.sessionsFor(classId), session], cls.name));
      const mdDir = path.join(dir, 'for-claude');
      fs.mkdirSync(mdDir, { recursive: true });
      const md = toMarkdown(session, cls.name);
      fs.writeFileSync(uniquePath(mdDir, base, '.md'), md);
      const up = await uploadToRepo({
        repo: notesRepo(),
        relPath: path.join('classes', safeName(quarter.name), safeName(cls.name), `${base}.md`),
        markdown: md,
        message: `Add ${cls.name} notes for ${date}`,
      });
      if (up.ok) session.uploaded = true;
      else warnings.push(up.warning);
    } catch (e) {
      warnings.push(`Could not save to your Q5 folder (${e.message}). The notes are still in the app.`);
    }

    store.addSession(session);
    return { state: snapshot(), sessionId: session.id, warnings };
  });

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
