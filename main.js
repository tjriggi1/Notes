const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { Store } = require('./src/store');
const { polish } = require('./src/polish');
const { buildDocx } = require('./src/docxBuilder');

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

function publicSettings() {
  const s = { ...store.data.settings };
  // Never send secrets back to the renderer; just say whether they are set.
  const out = { ...s, anthropicKeySet: !!(s.anthropicKey || process.env.ANTHROPIC_API_KEY) };
  delete out.anthropicKey;
  delete out.githubToken;
  return out;
}

function snapshot() {
  const d = store.data;
  return {
    classes: d.classes,
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
    title: 'Galisano Notes',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function uniquePath(dir, base, ext) {
  let p = path.join(dir, base + ext);
  for (let i = 2; fs.existsSync(p); i++) p = path.join(dir, `${base} (${i})${ext}`);
  return p;
}

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'));

  ipcMain.handle('state', () => snapshot());

  ipcMain.handle('class:add', (_, name) => { store.addClass(name); return snapshot(); });
  ipcMain.handle('class:rename', (_, id, name) => { store.renameClass(id, name); return snapshot(); });
  ipcMain.handle('class:delete', (_, id) => { store.deleteClass(id); return snapshot(); });

  ipcMain.handle('draft:save', (_, classId, text) => { store.setDraft(classId, String(text || '')); });

  ipcMain.handle('settings:set', (_, patch) => {
    // Blank secret fields mean "keep what is stored".
    const p = { ...patch };
    if (!p.anthropicKey) delete p.anthropicKey;
    if (!p.githubToken) delete p.githubToken;
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
      docxPath: null,
    };

    // Q5/<class>/<date> - <title>.docx
    try {
      const dir = path.join(s.q5Path, safeName(cls.name));
      fs.mkdirSync(dir, { recursive: true });
      const file = uniquePath(dir, `${date} - ${safeName(session.title)}`, '.docx');
      fs.writeFileSync(file, await buildDocx(session, cls.name));
      session.docxPath = file;
    } catch (e) {
      warnings.push(`Could not save the Word file (${e.message}). The notes are still in the app.`);
    }

    store.addSession(session);
    return { state: snapshot(), sessionId: session.id, warnings };
  });

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
