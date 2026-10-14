const $ = id => document.getElementById(id);
let S = null;            // app state from main process
let activeClass = null;  // class id
let activeTab = 'new';   // new | previous | all
let openSession = null;  // session id shown in Previous tab
let saveTimer = null;
let view = 'current';    // sidebar: current | previous

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

function isCurrent(c) { return c.quarterId === S.currentQuarterId; }

function visibleClasses() {
  return S.classes.filter(c => (view === 'current') === isCurrent(c));
}

function setState(next) {
  S = next;
  if (!visibleClasses().some(c => c.id === activeClass)) activeClass = visibleClasses()[0]?.id || null;
  renderSidebar();
  renderMain();
}

function classRow(c) {
  return el('div', {
    class: 'cls' + (c.id === activeClass ? ' active' : ''),
    title: 'Double-click to rename',
    onclick: () => { activeClass = c.id; openSession = null; renderSidebar(); renderMain(); },
    ondblclick: async () => {
      const name = prompt('Rename class', c.name);
      if (name && name.trim()) setState(await window.api.renameClass(c.id, name));
    },
  }, el('span', {}, c.name), view === 'current' ? el('button', {
    class: 'x', title: 'Remove class from the app (files on disk are kept)',
    onclick: async e => {
      e.stopPropagation();
      if (confirm(`Remove "${c.name}" and its notes from this app? The saved pages in your quarter folder are not touched.`)) {
        setState(await window.api.deleteClass(c.id));
      }
    },
  }, '\u00d7') : null);
}

function renderSidebar() {
  $('segCurrent').className = view === 'current' ? 'on' : '';
  $('segPrevious').className = view === 'previous' ? 'on' : '';
  $('addClassForm').hidden = view !== 'current';
  const list = $('classList');
  if (view === 'current') {
    list.replaceChildren(...visibleClasses().map(classRow));
    return;
  }
  const rows = [];
  for (const q of [...S.quarters].reverse()) {
    if (q.id === S.currentQuarterId) continue;
    const cs = S.classes.filter(c => c.quarterId === q.id);
    if (!cs.length) continue;
    rows.push(el('div', { class: 'qhead' }, q.name), ...cs.map(classRow));
  }
  list.replaceChildren(...rows);
}

function renderMain() {
  const main = $('main');
  const cls = S.classes.find(c => c.id === activeClass);
  if (!cls) {
    main.replaceChildren(el('div', { class: 'empty' },
      el('h2', {}, view === 'previous' ? 'No previous classes yet' : 'No classes yet'),
      el('p', {}, view === 'previous'
        ? 'When you add your next quarter folder, this quarter\'s classes move here and keep all their notes.'
        : 'Click "Add quarter folder" and pick your Q folder. Each class folder inside it becomes a class.')));
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


// ---- Slide-style note typing: "1. Heading", Tab for "- sub notes", Enter for the next number.
const HEADER = /^\d+[.)]\s*\S/;
const EMPTY_HEADER = /^\d+[.)]\s*$/;
const BULLET_LINE = /^-\s*\S/;
const EMPTY_BULLET = /^-\s*$/;

// True when the text is only leftover "1." / "-" markers with nothing written.
function isBlankNotes(text) {
  return text.split('\n').every(l => !l.trim() || EMPTY_HEADER.test(l.trim()) || EMPTY_BULLET.test(l.trim()));
}

function insertAt(ta, from, to, text) {
  ta.focus();
  ta.setSelectionRange(from, to);
  // execCommand keeps Ctrl+Z working; fall back to a plain edit if it is unavailable.
  if (!document.execCommand('insertText', false, text)) {
    ta.setRangeText(text, from, to, 'end');
    ta.dispatchEvent(new Event('input'));
  }
}

function slideKey(e) {
  const ta = e.target;
  if ((e.key !== 'Tab' && e.key !== 'Enter') || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  if (ta.selectionStart !== ta.selectionEnd) return;
  const v = ta.value;
  const pos = ta.selectionStart;
  const lineStart = v.lastIndexOf('\n', pos - 1) + 1;
  let lineEnd = v.indexOf('\n', pos);
  if (lineEnd < 0) lineEnd = v.length;
  const line = v.slice(lineStart, lineEnd).trim();

  if (e.key === 'Tab') {
    e.preventDefault();
    if (EMPTY_BULLET.test(line) || EMPTY_HEADER.test(line)) return;   // already waiting for text
    if (!line) insertAt(ta, lineEnd, lineEnd, '- ');
    else insertAt(ta, lineEnd, lineEnd, '\n- ');
    return;
  }

  // Enter: only take over at the end of a heading or sub note line.
  if (pos !== lineEnd) return;
  const onHeading = HEADER.test(line);
  const onBullet = BULLET_LINE.test(line);
  const onEmptyBullet = EMPTY_BULLET.test(line);
  if (!onHeading && !onBullet && !onEmptyBullet) return;
  let n = 0;
  for (const l of v.slice(0, lineEnd).split('\n')) {
    const m = l.trim().match(/^(\d+)[.)]\s/);
    if (m) n = Number(m[1]);
  }
  e.preventDefault();
  if (onEmptyBullet) insertAt(ta, lineStart, lineEnd, `\n${n + 1}. `);   // blank line, then next heading
  else insertAt(ta, lineEnd, lineEnd, `\n\n${n + 1}. `);
}

function renderNew(pane, cls) {
  pane.style.display = 'flex';
  pane.style.flexDirection = 'column';
  const editor = el('textarea', {
    id: 'editor',
    placeholder: '1. Slide name\n- Tab adds a sub note\n- Enter starts the next numbered slide',
    value: S.drafts[cls.id] || '',
    spellcheck: true,
  });
  const date = el('input', { type: 'date', value: S.today });
  const count = el('span', {}, '');
  const submit = el('button', { class: 'primary' }, 'Submit');
  const updateCount = () => {
    const body = editor.value.replace(/^\s*(\d+[.)]|-)\s*/gm, '').trim();
    const w = body ? body.split(/\s+/).length : 0;
    count.textContent = `${w} words`;
  };
  updateCount();
  editor.addEventListener('keydown', slideKey);
  editor.addEventListener('input', () => {
    updateCount();
    S.drafts[cls.id] = editor.value;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => window.api.saveDraft(cls.id, editor.value), 400);
  });
  submit.addEventListener('click', async () => {
    if (isBlankNotes(editor.value)) return toast('Type some notes first.', true);
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
    el('div', { class: 'bar' }, count, el('span', { class: 'hint' }, 'Tab: sub note   Enter: next slide'), submit)));
  editor.focus();
  if (!editor.value) editor.value = '1. ';   // start the first slide heading
  editor.setSelectionRange(editor.value.length, editor.value.length);
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
    if (p) $('s_repo').value = p;
  } }, 'Browse...');
  dlg.replaceChildren(
    el('h2', { style: 'margin-top:0' }, 'Settings'),
    ...field('s_repo', 'Notes repo folder (auto-upload for Claude)', st.notesRepo || st.notesRepoResolved || '', {
      hint: 'A local clone of your notes repo. Leave as is if you run the app from that clone. Submit commits and pushes with your existing git login.',
    }), folderBtn,
    ...field('s_key', 'Anthropic API key', '', {
      type: 'password',
      ph: st.anthropicKeySet ? 'Saved. Leave blank to keep it.' : 'sk-ant-...',
      hint: 'Used to rewrite your notes. Without it, the app still tidies them with built-in rules.',
    }),
    ...field('s_model', 'Model', st.model),
    el('div', { class: 'btns' },
      el('button', { type: 'button', onclick: () => dlg.close() }, 'Cancel'),
      el('button', { class: 'primary', type: 'button', onclick: async () => {
        setState(await window.api.setSettings({ notesRepo: $('s_repo').value, anthropicKey: $('s_key').value, model: $('s_model').value }));
        dlg.close();
        toast('Settings saved.');
      } }, 'Save')));
  dlg.showModal();
});

window.api.state().then(setState);

async function addQuarter() {
  try {
    const r = await window.api.addQuarter();
    if (!r) return;
    view = 'current';
    activeClass = null;
    activeTab = 'new';
    setState(r.state);
    toast(`${r.quarterName} is now your current quarter with ${r.total} classes. Earlier classes are under Previous.`);
  } catch (e) {
    toast(errText(e), true);
  }
}
$('addQuarterBtn').addEventListener('click', addQuarter);
window.api.onAddQuarter(addQuarter);
for (const [id, v] of [['segCurrent', 'current'], ['segPrevious', 'previous']]) {
  $(id).addEventListener('click', () => { view = v; activeClass = null; openSession = null; setState(S); });
}
