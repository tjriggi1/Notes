const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { Store } = require('../src/store');
const { polish, normalize } = require('../src/polish');
const { sessionPage, allNotesPage, toMarkdown } = require('../src/pageBuilder');

const { localFormat } = require('../src/localFormat');
const { uploadToRepo } = require('../src/upload');
(async () => {
  const lf = localFormat('PRICING MODELS\n- cost-plus w/ markup b/c simple\nelasticity: how much demand changes when price moves\nvalue pricing & premium brands\n');
  assert.equal(lf.sections[0].heading, 'Pricing models');
  assert.match(lf.sections[0].bullets[0], /^Cost-plus with markup because simple/);
  assert.equal(lf.keyTerms[0].term, 'Elasticity');
  assert.match(lf.sections[0].bullets[1], /and premium/);
  const slides = localFormat('1. pricing models\n- cost-plus w/ markup\n- value pricing: charge by perceived worth to buyer\n\n2. elasticity\n- demand changes when price moves\n');
  assert.deepEqual(slides.sections.map(s => s.heading), ['Pricing models', 'Elasticity']);
  assert.equal(slides.sections[0].bullets.length, 2);   // sub notes stay under their slide
  assert.equal(slides.sections[1].bullets.length, 1);
  assert.equal(slides.keyTerms.length, 0);
  assert.equal(slides.title, 'Pricing models and Elasticity');
  const up = await uploadToRepo({ repo: '/tmp/definitely-not-a-repo', relPath: 'a.md', markdown: 'x', message: 'm' });
  assert.equal(up.ok, false);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gn-'));
  const store = new Store(dir);
  assert.throws(() => store.addClass('Statistics'), /quarter folder/);
  const q5 = store.addQuarter('/tmp/Q5', ['Finance', 'Sales']);
  assert.equal(q5.added, 2);
  const cls = store.addClass('Statistics');
  assert.throws(() => store.addClass('statistics'));
  assert.equal(cls.folder, path.join(path.resolve('/tmp/Q5'), 'Statistics'));
  store.addSession({ id: 'old', classId: cls.id, date: '2026-09-01', createdAt: 'x', content: {}, title: 't', summary: 's' });
  const q6 = store.addQuarter('/tmp/Q6', ['Marketing']);
  assert.equal(store.data.currentQuarterId, q6.quarter.id);
  assert.equal(store.data.classes.length, 4);          // Q5 classes still there
  assert.equal(store.sessionsFor(cls.id).length, 1);   // and their notes
  assert.equal(store.addQuarter('/tmp/Q6', ['Marketing', 'Ops']).added, 1); // re-adding is idempotent
  store.data.currentQuarterId = q5.quarter.id; store.save();

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

  assert.equal(new Store(dir).sessionsFor(cls.id).length, 2);
  console.log('ok');
})();
