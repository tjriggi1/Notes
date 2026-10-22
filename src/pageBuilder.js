// Builds self-contained HTML note pages (no external files, works offline) and the
// Markdown copy that goes to the notes repo.

const { chartSvg, chartTable, CHART_CSS } = require('./chartSvg');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Older sessions stored bullets as plain strings.
const asBullet = b => (typeof b === 'string' ? { text: b, sub: [] } : { text: b.text, sub: b.sub || [] });
const list = (x) => (Array.isArray(x) ? x : []);

const CSS = `
:root{--bg:#f6f5f1;--panel:#fff;--ink:#1d232c;--muted:#667080;--line:#dfe3ea;--accent:#1f3a5f;--tint:#eef3f9;--note:#f7f4ea;--note-edge:#c9a227}
@media(prefers-color-scheme:dark){:root{--bg:#14181f;--panel:#1b212b;--ink:#e6eaf0;--muted:#98a3b3;--line:#2b3441;--accent:#8fb7e8;--tint:#222c3a;--note:#262a22;--note-edge:#a8892a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 Georgia,"Times New Roman",serif;padding:32px 16px}
.wrap{max-width:820px;margin:0 auto}
article{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:36px 44px;margin-bottom:28px}
.kicker{font:700 12px/1 -apple-system,"Segoe UI",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
h1{font:700 32px/1.2 -apple-system,"Segoe UI",sans-serif;color:var(--accent);margin:8px 0 4px}
.when{color:var(--muted);font:15px -apple-system,"Segoe UI",sans-serif;margin-bottom:18px}
.summary{background:var(--tint);border-left:4px solid var(--accent);padding:12px 16px;font-style:italic;border-radius:0 8px 8px 0}
h2{font:700 20px/1.3 -apple-system,"Segoe UI",sans-serif;color:var(--accent);margin:28px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
ul{padding-left:22px}li{margin:3px 0}li ul{margin:2px 0 4px}
.added{background:var(--note);border-left:3px solid var(--note-edge);padding:10px 14px;border-radius:0 8px 8px 0;margin:10px 0;font-size:16px}
.added b,.tag{font:700 11px/1 -apple-system,"Segoe UI",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.added b{display:block;margin-bottom:4px}
.tag{border:1px solid var(--line);border-radius:4px;padding:2px 5px;margin-left:6px;white-space:nowrap}
figure{margin:16px 0;padding:14px;border:1px solid var(--line);border-radius:10px}
figure img{max-width:100%;height:auto;display:block;margin:0 auto;border-radius:6px}
figcaption{font-size:15px;margin-top:10px}figcaption strong{display:block;font-family:-apple-system,"Segoe UI",sans-serif}
.illus{color:var(--muted);font-size:14px}
details{margin-top:6px;font-size:14px}summary{cursor:pointer;color:var(--muted)}
table.terms{border-collapse:collapse;width:100%;font-size:16px}
table.terms td{border:1px solid var(--line);padding:8px 12px;vertical-align:top}
table.terms td:first-child{width:28%;font-weight:700;background:var(--tint)}
.sources a{color:var(--accent);word-break:break-word}
.toc a{color:var(--accent);text-decoration:none}.toc li{margin:6px 0}.toc .d{color:var(--muted);font-size:15px}
@media print{body{background:#fff;padding:0}article{border:0;padding:0}}
@media(max-width:600px){article{padding:22px 18px}}
${CHART_CSS}`;

function chartFigure(c) {
  const note = c.illustrative ? '<div class="illus">Illustrative values, drawn to show the shape of the idea, not real data.</div>' : '';
  return `<figure>${c.title ? `<figcaption><strong>${esc(c.title)}</strong></figcaption>` : ''}${chartSvg(c)}<figcaption>${esc(c.caption)}${note}</figcaption><details><summary>Show data</summary>${chartTable(c)}</details></figure>`;
}

// images: { "graph 1": { mime, data(base64) } }
function articleHtml(session, className, id, images = {}) {
  const c = session.content;
  const h = [`<article id="${id}">`,
    `<div class="kicker">${esc(className)}</div>`,
    `<h1>${esc(c.title)}</h1>`,
    `<div class="when">${esc(formatDate(session.date))}</div>`];
  if (c.summary) h.push(`<div class="summary">${esc(c.summary)}</div>`);
  for (const s of list(c.sections)) {
    if (s.heading) h.push(`<h2>${esc(s.heading)}</h2>`);
    list(s.paragraphs).forEach(p => h.push(`<p>${esc(p)}</p>`));
    const bullets = list(s.bullets).map(asBullet);
    if (bullets.length) {
      h.push('<ul>' + bullets.map(b => `<li>${esc(b.text)}${b.sub.length ? `<ul>${b.sub.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</li>`).join('') + '</ul>');
    }
    for (const f of list(s.figures)) {
      const img = images[f.ref.toLowerCase()];
      if (!img) continue;
      h.push(`<figure><img alt="${esc(f.title || f.ref)}" src="data:${img.mime};base64,${img.data}"><figcaption><strong>${esc(f.title || f.ref)}</strong>${esc(f.explanation)}</figcaption></figure>`);
    }
    list(s.charts).forEach(ch => h.push(chartFigure(ch)));
    if (list(s.added).length) h.push(`<div class="added"><b>Added context (not from class)</b>${s.added.map(a => `<p>${esc(a)}</p>`).join('')}</div>`);
  }
  if (list(c.keyTerms).length) {
    h.push('<h2>Key terms</h2><table class="terms">' + c.keyTerms.map(t =>
      `<tr><td>${esc(t.term)}</td><td>${esc(t.definition || '(not explained in class notes)')}${t.source === 'added' ? '<span class="tag">Added</span>' : ''}</td></tr>`).join('') + '</table>');
  }
  if (list(c.takeaways).length) h.push(`<h2>Takeaways</h2><ul>${c.takeaways.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`);
  if (list(c.reviewQuestions).length) h.push(`<h2>Review questions</h2><ol>${c.reviewQuestions.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`);
  if (list(c.sources).length) h.push(`<h2>Sources for added definitions</h2><ul class="sources">${c.sources.map(s => `<li><a href="${esc(s.url)}">${esc(s.title || s.url)}</a></li>`).join('')}</ul>`);
  h.push('</article>');
  return h.join('\n');
}

function page(title, body) {
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body><div class="wrap">\n${body}\n</div></body></html>\n`;
}

function sessionPage(session, className, images) {
  return page(`${className}: ${session.content.title}`, articleHtml(session, className, 's', images));
}

// One scrolling page with every session, oldest first, plus a table of contents.
// imagesFor(session) returns that session's image map.
function allNotesPage(sessions, className, imagesFor = () => ({})) {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const toc = `<article class="toc"><div class="kicker">${esc(className)}</div><h1>All notes</h1><ul>` +
    sorted.map((s, i) => `<li><a href="#n${i}">${esc(formatDate(s.date))}</a> <span class="d">${esc(s.content.title)}</span></li>`).join('') +
    '</ul></article>';
  return page(`${className}: all notes`, toc + '\n' + sorted.map((s, i) => articleHtml(s, className, `n${i}`, imagesFor(s))).join('\n'));
}

// imagePaths: { "graph 1": "images/2026-10-22 - Graph 1.png" } (relative to the Markdown file)
function toMarkdown(session, className, imagePaths = {}) {
  const c = session.content;
  const L = [`# ${c.title}`, '', `*${className} · ${session.date}*`, ''];
  if (c.summary) L.push(`> ${c.summary}`, '');
  for (const s of list(c.sections)) {
    if (s.heading) L.push(`## ${s.heading}`, '');
    list(s.paragraphs).forEach(p => L.push(p, ''));
    const bullets = list(s.bullets).map(asBullet);
    bullets.forEach(b => { L.push(`- ${b.text}`); b.sub.forEach(x => L.push(`    - ${x}`)); });
    if (bullets.length) L.push('');
    for (const f of list(s.figures)) {
      const p = imagePaths[f.ref.toLowerCase()];
      L.push(`**${f.title || f.ref}**`, '');
      if (p) L.push(`![${f.ref}](${encodeURI(p)})`, '');
      if (f.explanation) L.push(f.explanation, '');
    }
    for (const ch of list(s.charts)) {
      L.push(`**Chart: ${ch.title}**${ch.illustrative ? ' (illustrative values)' : ''}`, '');
      if (ch.caption) L.push(ch.caption, '');
      L.push(`| ${ch.xLabel || ''} | ${ch.series.map(x => x.name).join(' | ')} |`, `|${'---|'.repeat(ch.series.length + 1)}`);
      ch.x.forEach((x, i) => L.push(`| ${x} | ${ch.series.map(sr => sr.values[i]).join(' | ')} |`));
      L.push('');
    }
    if (list(s.added).length) { L.push('*Added context (not from class):*', ''); s.added.forEach(a => L.push(`> ${a}`, '')); }
  }
  if (list(c.keyTerms).length) {
    L.push('## Key terms', '');
    c.keyTerms.forEach(t => L.push(`- **${t.term}**: ${t.definition}${t.source === 'added' ? ' *(added, not from class)*' : ''}`));
    L.push('');
  }
  if (list(c.takeaways).length) { L.push('## Takeaways', ''); c.takeaways.forEach(t => L.push(`- ${t}`)); L.push(''); }
  if (list(c.reviewQuestions).length) { L.push('## Review questions', ''); c.reviewQuestions.forEach((t, i) => L.push(`${i + 1}. ${t}`)); L.push(''); }
  if (list(c.sources).length) { L.push('## Sources for added definitions', ''); c.sources.forEach(s => L.push(`- [${s.title || s.url}](${s.url})`)); L.push(''); }
  return L.join('\n');
}

module.exports = { sessionPage, allNotesPage, toMarkdown, formatDate };
