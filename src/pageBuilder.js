// Builds self-contained HTML note pages (no external files, works offline) and
// Markdown copies. Replaces the old Word export.

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

const CSS = `
:root{--bg:#f6f5f1;--panel:#fff;--ink:#1d232c;--muted:#667080;--line:#dfe3ea;--accent:#1f3a5f;--tint:#eef3f9}
@media(prefers-color-scheme:dark){:root{--bg:#14181f;--panel:#1b212b;--ink:#e6eaf0;--muted:#98a3b3;--line:#2b3441;--accent:#8fb7e8;--tint:#222c3a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 Georgia,"Times New Roman",serif;padding:32px 16px}
.wrap{max-width:820px;margin:0 auto}
article{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:36px 44px;margin-bottom:28px}
.kicker{font:700 12px/1 -apple-system,"Segoe UI",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
h1{font:700 32px/1.2 -apple-system,"Segoe UI",sans-serif;color:var(--accent);margin:8px 0 4px}
.when{color:var(--muted);font:15px -apple-system,"Segoe UI",sans-serif;margin-bottom:18px}
.summary{background:var(--tint);border-left:4px solid var(--accent);padding:12px 16px;font-style:italic;border-radius:0 8px 8px 0}
h2{font:700 20px/1.3 -apple-system,"Segoe UI",sans-serif;color:var(--accent);margin:28px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
ul{padding-left:22px}li{margin:3px 0}
table{border-collapse:collapse;width:100%;font-size:16px}
td{border:1px solid var(--line);padding:8px 12px;vertical-align:top}
td:first-child{width:28%;font-weight:700;background:var(--tint)}
.toc a{color:var(--accent);text-decoration:none}.toc li{margin:6px 0}.toc .d{color:var(--muted);font-size:15px}
@media print{body{background:#fff;padding:0}article{border:0;padding:0}}
@media(max-width:600px){article{padding:22px 18px}}`;

function articleHtml(session, className, id) {
  const c = session.content;
  const h = [`<article id="${id}">`,
    `<div class="kicker">${esc(className)}</div>`,
    `<h1>${esc(c.title)}</h1>`,
    `<div class="when">${esc(formatDate(session.date))}</div>`];
  if (c.summary) h.push(`<div class="summary">${esc(c.summary)}</div>`);
  for (const s of c.sections) {
    if (s.heading) h.push(`<h2>${esc(s.heading)}</h2>`);
    s.paragraphs.forEach(p => h.push(`<p>${esc(p)}</p>`));
    if (s.bullets.length) h.push(`<ul>${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`);
  }
  if (c.keyTerms.length) {
    h.push('<h2>Key terms</h2><table>' + c.keyTerms.map(t =>
      `<tr><td>${esc(t.term)}</td><td>${esc(t.definition || '(not explained in class notes)')}</td></tr>`).join('') + '</table>');
  }
  if (c.takeaways.length) h.push(`<h2>Takeaways</h2><ul>${c.takeaways.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`);
  h.push('</article>');
  return h.join('\n');
}

function page(title, body) {
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body><div class="wrap">\n${body}\n</div></body></html>\n`;
}

function sessionPage(session, className) {
  return page(`${className}: ${session.content.title}`, articleHtml(session, className, 's'));
}

// One scrolling page with every session, oldest first, plus a table of contents.
function allNotesPage(sessions, className) {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const toc = `<article class="toc"><div class="kicker">${esc(className)}</div><h1>All notes</h1><ul>` +
    sorted.map((s, i) => `<li><a href="#n${i}">${esc(formatDate(s.date))}</a> <span class="d">${esc(s.content.title)}</span></li>`).join('') +
    '</ul></article>';
  return page(`${className}: all notes`, toc + '\n' + sorted.map((s, i) => articleHtml(s, className, `n${i}`)).join('\n'));
}

function toMarkdown(session, className) {
  const c = session.content;
  const L = [`# ${c.title}`, '', `*${className} · ${session.date}*`, ''];
  if (c.summary) L.push(`> ${c.summary}`, '');
  for (const s of c.sections) {
    if (s.heading) L.push(`## ${s.heading}`, '');
    s.paragraphs.forEach(p => L.push(p, ''));
    s.bullets.forEach(b => L.push(`- ${b}`));
    if (s.bullets.length) L.push('');
  }
  if (c.keyTerms.length) {
    L.push('## Key terms', '');
    c.keyTerms.forEach(t => L.push(`- **${t.term}**: ${t.definition || '(not explained in class notes)'}`));
    L.push('');
  }
  if (c.takeaways.length) {
    L.push('## Takeaways', '');
    c.takeaways.forEach(t => L.push(`- ${t}`));
    L.push('');
  }
  return L.join('\n');
}

module.exports = { sessionPage, allNotesPage, toMarkdown, formatDate };
