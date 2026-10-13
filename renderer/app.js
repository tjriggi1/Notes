const $ = id => document.getElementById(id);
let S = null;            // app state from main process
let activeClass = null;  // class id
let activeTab = 'new';   // new | previous | all
let openSession = null;  // session id shown in Previous tab
let saveTimer = null;

function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n[k] = v;
  }
  for (const k of kids.flat()) if (k != null) n.append(k);
  return n;
}

function errText(e) {
  return String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
}

function toast(msg, warn) {
  const t = $('toast');
  t.textContent = msg;
  t.className = warn ? 'warn' : '';
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, warn ? 9000 : 3500);
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function classSessions() {
  return S.sessions.filter(s => s.classId === activeClass)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

function setState(next) {
  S = next;
  if (!S.classes.some(c => c.id === activeClass)) activeClass = S.classes[0]?.id || null;
  renderSidebar();
  renderMain();
}

function renderSidebar() {
  const list = $('classList');
  list.replaceChildren(...S.classes.map(c => el('div', {
    class: 'cls' + (c.id === activeClass ? ' active' : ''),
    title: 'Double-click to rename',
    onclick: () => { activeClass = c.id; openSession = null; renderSidebar(); renderMain(); },
    ondblclick: async () => {
      const name = prompt('Rename class', c.name);
      if (name && name.trim()) setState(await window.api.renameClass(c.id, name));
    },
  }, el('span', {}, c.name), el('button', {
    class: 'x', title: 'Delete class and its notes',
    onclick: async e => {
      e.stopPropagation();
      if (confirm(`Delete "${c.name}" and all its notes inside this app? Saved Word files are not touched.`)) {
        setState(await window.api.deleteClass(c.id));
      }
    },
  }, '×'))));
}

function renderMain() {
  const main = $('main');
  const cls = S.classes.find(c => c.id === activeClass);
  if (!cls) {
    main.replaceChildren(el('div', { class: 'empty' },
      el('h2', {}, 'No classes yet'),
      el('p', {}, 'Type a class name in the box at the bottom left and press Enter.')));
    return;
  }
  const tabs = [['new', 'New notes'], ['previous', 'Previous notes'], ['all', 'All notes']];
  const header = el('header', { class: 'top' },
    el('h1', {}, cls.name),
    el('div', { class: 'tabs' }, tabs.map(([k, label]) => el('button', {
      class: 'tab' + (k === activeTab ? ' active' : ''),
      onclick: () => { activeTab = k; openSession = null; renderMain(); },
    }, label))));
  const pane = el('div', { class: 'pane' });
  main.replaceChildren(header, pane);
  if (activeTab === 'new') renderNew(pane, cls);
  else if (activeTab === 'previous') renderPrevious(pane);
  else renderAll(pane);
}

function renderNew(pane, cls) {
  pane.style.display = 'flex';
  pane.style.flexDirection = 'column';
  const editor = el('textarea', {
    id: 'editor',
    placeholder: 'Type quickly. Fragments and shorthand are fine; they get cleaned up when you submit.',
    value: S.drafts[cls.id] || '',
    spellcheck: true,
  });
  const date = el('input', { type: 'date', value: S.today });
  const count = el('span', {}, '');
  const submit = el('button', { class: 'primary' }, 'Submit');
  const updateCount = () => {
    const w = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
    count.textContent = `${w} words`;
  };
  updateCount();
  editor.addEventListener('input', () => {
    updateCount();
    S.drafts[cls.id] = editor.value;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => window.api.saveDraft(cls.id, editor.value), 400);
  });
  submit.addEventListener('click', async () => {
    if (!editor.value.trim()) return toast('Type some notes first.', true);
    submit.disabled = true;
    submit.textContent = 'Polishing and saving...';
    clearTimeout(saveTimer);
    try {
      const r = await window.api.submit({ classId: cls.id, raw: editor.value, date: date.value });
      activeTab = 'previous';
      setState(r.state);
      const s = r.state.sessions.find(x => x.id === r.sessionId);
      toast(r.warnings.length ? r.warnings.join(' ') : `Saved to ${s.pagePath}`, r.warnings.length > 0);
    } catch (e) {
      submit.disabled = false;
      submit.textContent = 'Submit';
      toast(errText(e), true);
    }
  });
  pane.append(el('div', { class: 'new-wrap' },
    el('div', { class: 'meta' }, 'Class date', date),
    editor,
    el('div', { class: 'bar' }, count, submit)));
  editor.focus();
}

function renderPrevious(pane) {
  const sessions = classSessions().reverse();
  if (openSession) {
    const s = sessions.find(x => x.id === openSession);
    if (s) {
      pane.append(el('button', { class: 'back', onclick: () => { openSession = null; renderMain(); } }, '← All sessions'), docView(s));
      return;
    }
  }
  if (!sessions.length) return void pane.append(el('p', { class: 'none' }, 'No submitted notes for this class yet.'));
  sessions.forEach(s => pane.append(el('div', { class: 'row', onclick: () => { openSession = s.id; renderMain(); } },
    el('div', { class: 'date' }, fmtDate(s.date)),
    el('div', { class: 'desc' }, el('b', {}, s.title), el('span', {}, s.summary)))));
}

function renderAll(pane) {
  const sessions = classSessions();
  if (!sessions.length) return void pane.append(el('p', { class: 'none' }, 'Nothing here until you submit your first notes.'));
  sessions.forEach(s => pane.append(docView(s)));
}

function docView(s) {
  const c = s.content;
  const cls = S.classes.find(x => x.id === s.classId);
  const d = el('article', { class: 'doc' },
    el('div', { class: 'kicker' }, cls ? cls.name : ''),
    el('h2', {}, c.title),
    el('div', { class: 'when' }, fmtDate(s.date)));
  if (c.summary) d.append(el('div', { class: 'summary' }, c.summary));
  for (const sec of c.sections) {
    if (sec.heading) d.append(el('h3', {}, sec.heading));
    sec.paragraphs.forEach(p => d.append(el('p', {}, p)));
    if (sec.bullets.length) d.append(el('ul', {}, sec.bullets.map(b => el('li', {}, b))));
  }
  if (c.keyTerms.length) {
    d.append(el('h3', {}, 'Key terms'), el('table', {}, c.keyTerms.map(t =>
      el('tr', {}, el('td', {}, t.term), el('td', {}, t.definition || '(not explained in class notes)')))));
  }
  if (c.takeaways.length) d.append(el('h3', {}, 'Takeaways'), el('ul', {}, c.takeaways.map(t => el('li', {}, t))));
  if (s.pagePath) d.append(el('div', { class: 'file' }, 'Saved page: ', el('a', { onclick: () => window.api.showFile(s.pagePath) }, s.pagePath)));
  return d;
}

$('addClassForm').addEventListener('submit', async e => {
  e.preventDefault();
  const input = $('addClassInput');
  if (!input.value.trim()) return;
  try {
    const next = await window.api.addClass(input.value);
    input.value = '';
    const known = new Set(S.classes.map(c => c.id));
    activeClass = next.classes.find(c => !known.has(c.id))?.id;
    activeTab = 'new';
    setState(next);
  } catch (err) {
    toast(errText(err), true);
  }
});

$('settingsBtn').addEventListener('click', () => {
  const st = S.settings;
  const dlg = $('settingsDlg');
  const field = (id, label, value, o = {}) => [
    el('label', { htmlFor: id }, label),
    el('input', { id, value, type: o.type || 'text', placeholder: o.ph || '' }),
    o.hint ? el('div', { class: 'hint' }, o.hint) : null,
  ];
  const folderBtn = el('button', { type: 'button', onclick: async () => {
    const p = await window.api.pickFolder();
    if (p) $('s_q5').value = p;
  } }, 'Browse...');
  dlg.replaceChildren(
    el('h2', { style: 'margin-top:0' }, 'Settings'),
    ...field('s_q5', 'Q5 folder (each class gets a subfolder)', st.q5Path), folderBtn,
    ...field('s_key', 'Anthropic API key', '', {
      type: 'password',
      ph: st.anthropicKeySet ? 'Saved. Leave blank to keep it.' : 'sk-ant-...',
      hint: 'Used to rewrite your notes. Without it, notes are saved exactly as typed.',
    }),
    ...field('s_model', 'Model', st.model),
    el('div', { class: 'btns' },
      el('button', { type: 'button', onclick: () => dlg.close() }, 'Cancel'),
      el('button', { class: 'primary', type: 'button', onclick: async () => {
        setState(await window.api.setSettings({ q5Path: $('s_q5').value, anthropicKey: $('s_key').value, model: $('s_model').value }));
        dlg.close();
        toast('Settings saved.');
      } }, 'Save')));
  dlg.showModal();
});

window.api.state().then(setState);
