const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { Store } = require('../src/store');
const http = require('http');
const Anthropic = require('@anthropic-ai/sdk');
const { polish } = require('../src/polish');
const { normalize } = require('../src/content');
const { chartSvg, cleanChart } = require('../src/chartSvg');
const { sessionPage, allNotesPage, toMarkdown } = require('../src/pageBuilder');

const { localFormat } = require('../src/localFormat');
const { uploadToRepo } = require('../src/upload');
(async () => {
  const lf = localFormat('PRICING MODELS\n- cost-plus w/ markup b/c simple\nelasticity: how much demand changes when price moves\nvalue pricing & premium brands\n');
  assert.equal(lf.sections[0].heading, 'Pricing models');
  assert.match(lf.sections[0].bullets[0].text, /^Cost-plus with markup because simple/);
  assert.equal(lf.keyTerms[0].term, 'Elasticity');
  assert.match(lf.sections[0].bullets[1].text, /and premium/);
  const slides = localFormat('1. pricing models\n- cost-plus w/ markup\n- value pricing: charge by perceived worth to buyer\n\n2. elasticity\n- demand changes when price moves\n');
  assert.deepEqual(slides.sections.map(s => s.heading), ['Pricing models', 'Elasticity']);
  assert.equal(slides.sections[0].bullets.length, 2);   // sub notes stay under their slide
  assert.equal(slides.sections[1].bullets.length, 1);
  assert.equal(slides.keyTerms.length, 0);
  assert.equal(slides.title, 'Pricing models and Elasticity');
  // Sub notes under sub notes, and a pasted graph marker.
  const nested = localFormat('1. Concept stage\n- first point\n    - detail a\n    - detail b\n- second point\n    - detail c\n[Graph 1]\n', [{ label: 'Graph 1' }]);
  const b = nested.sections[0].bullets;
  assert.deepEqual(b.map(x => x.text), ['First point', 'Second point']);
  assert.deepEqual(b[0].sub, ['Detail a', 'Detail b']);
  assert.deepEqual(b[1].sub, ['Detail c']);
  assert.deepEqual(nested.sections[0].figures.map(f => f.ref), ['Graph 1']);
  // A graph whose marker was deleted still lands in the notes.
  assert.equal(localFormat('1. A\n- x', [{ label: 'Graph 2' }]).sections[0].figures[0].ref, 'Graph 2');

  // Charts: bad specs are dropped, good ones render with escaped text and tooltips.
  assert.equal(cleanChart({ type: 'pie', x: [1, 2], series: [] }), null);
  const ch = cleanChart({ type: 'line', title: '<b>', x: [0, 1, 2], series: [{ name: 'Demand', values: [3, 2, 1] }, { name: 'Supply', values: [1, 2, 3] }] });
  assert.equal(ch.illustrative, true);
  const svg = chartSvg(ch);
  assert.ok(svg.startsWith('<svg') && !svg.includes('<b>') && svg.includes('<title>Demand, 0: 3</title>'));
  assert.ok(chartSvg(cleanChart({ type: 'bar', x: ['Q1', 'Q2'], series: [{ name: 'Rev', values: [-2, 5] }] })).includes('<path'));

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

  const content = normalize({ title: 'Averages', summary: 'Mean and median.', sections: [{ heading: 'Center', bullets: ['a', { text: 'b', sub: ['c'] }], paragraphs: ['b'], figures: [{ ref: 'Graph 1', title: 'Skew', explanation: 'e' }], charts: [ch], added: ['ctx'] }], keyTerms: [{ term: 'Mean', definition: 'avg', source: 'added' }], takeaways: ['c'], reviewQuestions: ['q?'] });
  assert.deepEqual(content.sections[0].bullets, [{ text: 'a', sub: [] }, { text: 'b', sub: ['c'] }]);
  const session = { id: store.id(), classId: cls.id, date: '2026-10-13', createdAt: new Date().toISOString(), content, title: content.title, summary: content.summary, raw: 'x' };
  store.addSession(session);

  const html = sessionPage(session, 'Statistics', { 'graph 1': { mime: 'image/png', data: 'AAAA' } });
  assert.match(html, /<h1>Averages<\/h1>/);
  assert.ok(html.includes('<li>b<ul><li>c</li></ul></li>'));
  assert.ok(html.includes('data:image/png;base64,AAAA') && html.includes('Added context') && html.includes('Review questions') && html.includes('<svg'));
  assert.ok(html.includes('class="tag">Added'));
  const md = toMarkdown(session, 'Statistics', { 'graph 1': 'images/x - Graph 1.png' });
  assert.ok(md.includes('    - c') && md.includes('![Graph 1](images/x%20-%20Graph%201.png)') && md.includes('(added, not from class)'));
  // Old sessions saved bullets as plain strings; they must still render.
  assert.ok(sessionPage({ ...session, content: { title: 'Old', sections: [{ heading: 'h', bullets: ['plain'] }] } }, 'S').includes('<li>plain</li>'));
  assert.match(allNotesPage([session], 'Statistics'), /All notes/);
  assert.ok(!sessionPage({ ...session, content: { ...content, title: '<script>' } }, 'S').includes('<script>'));
  assert.match(toMarkdown(session, 'Statistics'), /## Key terms/);

  assert.equal(new Store(dir).sessionsFor(cls.id).length, 2);

  // The AI path, against a fake API server, through the real SDK.
  const seen = [];
  const reply = (stop, content) => ({ id: 'm', type: 'message', role: 'assistant', model: 'm', stop_reason: stop, usage: { input_tokens: 1, output_tokens: 1 }, content });
  const json = JSON.stringify({ title: 'Price Elasticity Basics', summary: 's', sections: [{ heading: 'Elasticity', bullets: [{ text: 'x', sub: ['y'] }], added: ['ctx'] }],
    keyTerms: [{ term: 'Elasticity', definition: 'd', source: 'added' }],
    sources: [{ title: 'Real', url: 'https://example.edu/elasticity' }, { title: 'Made up', url: 'https://fake.example/nope' }] });
  const replies = [
    reply('pause_turn', [{ type: 'server_tool_use', id: 'srv1', name: 'web_search', input: { query: 'elasticity' } },
      { type: 'web_search_tool_result', tool_use_id: 'srv1', content: [{ type: 'web_search_result', url: 'https://example.edu/elasticity', title: 'Real', encrypted_content: 'e' }] }]),
    reply('end_turn', [{ type: 'text', text: 'Here are the notes.\n' + json }]),
  ];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', d => { body += d; });
    req.on('end', () => {
      seen.push({ headers: req.headers, body: JSON.parse(body) });
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(replies[seen.length - 1] || reply('refusal', [])));
    });
  });
  await new Promise(r => server.listen(0, r));
  const client = new Anthropic({ apiKey: 'test', baseURL: `http://127.0.0.1:${server.address().port}`, maxRetries: 0 });
  const ai = await polish({ raw: '1. elasticity\n- x\n    - y', className: 'Econ', date: '2026-10-22', model: 'claude-sonnet-5-5',
    images: [{ label: 'Graph 1', mime: 'image/png', data: 'AAAA' }], client });
  assert.equal(ai.polished, true, ai.warning);
  assert.equal(seen.length, 2);                                  // resumed after pause_turn
  assert.equal(seen[1].body.messages[1].role, 'assistant');      // paused turn sent back unchanged
  assert.equal(seen[0].body.fallbacks, 'default');
  assert.match(seen[0].headers['anthropic-beta'], /server-side-fallback-2026-07-01/);
  assert.equal(seen[0].body.tools[0].type, 'web_search_20260209');
  assert.deepEqual(seen[0].body.output_config, { effort: 'high' });
  assert.ok(seen[0].body.messages[0].content.some(c => c.type === 'image'));
  assert.deepEqual(ai.content.sources.map(s => s.url), ['https://example.edu/elasticity']); // made-up link dropped
  assert.deepEqual(ai.content.sections[0].bullets[0].sub, ['y']);
  // A refusal falls back to local cleanup with a warning, and Haiku gets the basic search tool and no fallback.
  const refused = await polish({ raw: '1. a\n- b', className: 'Econ', date: '2026-10-22', model: 'claude-haiku-5-5', client });
  assert.equal(refused.polished, false);
  assert.match(refused.warning, /declined/);
  assert.equal(seen[2].body.tools[0].type, 'web_search_20250305');
  assert.equal(seen[2].body.fallbacks, undefined);
  server.close();
  console.log('ok');
})();
