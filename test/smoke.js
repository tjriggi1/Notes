const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { Store } = require('../src/store');
const { polish, normalize } = require('../src/polish');
const { sessionPage, allNotesPage, toMarkdown } = require('../src/pageBuilder');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gn-'));
  const store = new Store(dir);
  const cls = store.addClass('Statistics');
  assert.throws(() => store.addClass('statistics'));

  const r = await polish({ raw: '- mean vs median\n- skew pulls mean', className: 'Statistics', date: '2026-10-13', apiKey: '', model: 'x' });
  assert.equal(r.polished, false);
  assert.ok(r.warning);

  const content = normalize({ title: 'Averages', summary: 'Mean and median.', sections: [{ heading: 'Center', bullets: ['a'], paragraphs: ['b'] }], keyTerms: [{ term: 'Mean' }], takeaways: ['c'] });
  const session = { id: store.id(), classId: cls.id, date: '2026-10-13', createdAt: new Date().toISOString(), content, title: content.title, summary: content.summary, raw: 'x' };
  store.addSession(session);

  assert.match(sessionPage(session, 'Statistics'), /<h1>Averages<\/h1>/);
  assert.match(allNotesPage([session], 'Statistics'), /All notes/);
  assert.ok(!sessionPage({ ...session, content: { ...content, title: '<script>' } }, 'S').includes('<script>'));
  assert.match(toMarkdown(session, 'Statistics'), /## Key terms/);

  assert.equal(new Store(dir).sessionsFor(cls.id).length, 1);
  console.log('ok');
})();
