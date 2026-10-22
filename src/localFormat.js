// Cleans up rough notes without any AI: expands common shorthand, fixes capitalization
// and spacing, groups lines under headings, and pulls "term: definition" lines into a
// key-terms table. It cannot fix spelling or reword unclear lines; that needs the API.

const ABBREV = [
  [/\bw\/o\b/gi, 'without'],
  [/\bw\//gi, 'with '],
  [/\bb\/c\b/gi, 'because'],
  [/\bbc\b/gi, 'because'],
  [/\bmgmt\b/gi, 'management'],
  [/\bapprox\.?(?=\s)/gi, 'approximately'],
  [/\bppl\b/gi, 'people'],
  [/\bgovt\b/gi, 'government'],
  [/\binfo\b/gi, 'information'],
  [/\s&\s/g, ' and '],
  [/\s*->\s*/g, ' leads to '],
  [/\s*=>\s*/g, ' leads to '],
  [/\bvs\.?(?=\s)/gi, 'versus'],
];

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;

function tidy(line) {
  let s = line.replace(BULLET, '').replace(/\s+/g, ' ').trim();
  for (const [re, to] of ABBREV) s = s.replace(re, to);
  s = s.replace(/\s+([,.;:!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function endSentence(s) {
  const words = s.split(' ').length;
  return words >= 6 && !/[.!?:)]$/.test(s) ? s + '.' : s;
}

function headingText(line) {
  const t = line.trim();
  if (/^#{1,4}\s+/.test(t)) return tidy(t.replace(/^#{1,4}\s+/, ''));
  if (/^[^:]{2,60}:$/.test(t)) return tidy(t.slice(0, -1));
  if (t.length >= 4 && t.length <= 50 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
    const low = t.toLowerCase();
    return low.charAt(0).toUpperCase() + low.slice(1);
  }
  return null;
}

function termDef(line) {
  const m = line.replace(BULLET, '').match(/^([A-Za-z][\w\s/&'-]{1,40}?)\s*(?::|=|\s[-–—]\s)\s*(.{12,})$/);
  if (!m) return null;
  const term = m[1].trim();
  if (term.split(/\s+/).length > 4) return null;
  return { term: tidy(term), definition: endSentence(tidy(m[2])) };
}

function localFormat(raw, images = []) {
  const sections = [];
  const keyTerms = [];
  let cur = null;
  // Slide format ("1. Heading" with "- sub notes" under it): numbered lines are headings and
  // sub notes stay where they were typed, so "term: definition" lines are not pulled out.
  const structured = /^\s*\d+[.)]\s+\S/m.test(raw);
  const section = h => { cur = { heading: h, paragraphs: [], bullets: [], added: [], figures: [], charts: [] }; sections.push(cur); };
  const hasImage = new Set(images.map(i => i.label.toLowerCase()));

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const num = line.match(/^\s*\d+[.)]\s+(\S.*)$/);
    if (num) { section(tidy(num[1])); continue; }
    const h = headingText(line);
    if (h) { section(h); continue; }
    if (!cur) section('Notes');
    // "[Graph 2]" marks where a pasted slide graph goes.
    const graph = line.trim().match(/^\[(graph \d+)[^\]]*\]$/i);
    if (graph) {
      const ref = graph[1].replace(/^g/, 'G');
      if (hasImage.has(ref.toLowerCase())) cur.figures.push({ ref, title: '', explanation: '' });
      continue;
    }
    // Indented "    - text" is a sub note of the bullet above it.
    const nested = /^\s{2,}[-*\u2022]\s+\S/.test(line) || /^\t+[-*\u2022]\s+\S/.test(line);
    const last = cur.bullets[cur.bullets.length - 1];
    if (nested && last) { last.sub.push(endSentence(tidy(line))); continue; }
    const td = structured ? null : termDef(line);
    if (td) { keyTerms.push(td); continue; }
    const text = tidy(line);
    const words = text.split(' ').length;
    if (!BULLET.test(line) && words >= 14) cur.paragraphs.push(endSentence(text));
    else cur.bullets.push({ text: endSentence(text), sub: [] });
  }
  // A pasted graph whose marker was deleted still belongs in the notes: put it in the last section.
  const placed = new Set(sections.flatMap(s => s.figures.map(f => f.ref.toLowerCase())));
  const spare = images.filter(i => !placed.has(i.label.toLowerCase()));
  if (spare.length) {
    if (!cur) section('Notes');
    spare.forEach(i => cur.figures.push({ ref: i.label, title: '', explanation: '' }));
  }

  const used = sections.filter(s => s.paragraphs.length || s.bullets.length || s.figures.length);
  const heads = used.map(s => s.heading).filter(h => h !== 'Notes');
  const first = used[0]?.bullets[0]?.text || used[0]?.paragraphs[0] || keyTerms[0]?.term || 'Class notes';
  // Without the API there is no real "theme of the day", so name it from the slide headings.
  const clip = s => (s.length > 60 ? s.slice(0, 57).replace(/\s+\S*$/, '') + '...' : s);
  const title = heads.length >= 3 ? clip(`${heads[0]}, ${heads[1]} and ${heads.length - 2} more`)
    : heads.length === 2 ? clip(`${heads[0]} and ${heads[1]}`)
    : heads.length === 1 ? clip(heads[0])
    : clip(first.replace(/\.$/, ''));
  const summary = heads.length
    ? `Covers ${heads.slice(0, 4).join(', ')}${heads.length > 4 ? ` and ${heads.length - 4} more topics` : ''}.`
    : `${used.reduce((n, s) => n + s.bullets.length + s.paragraphs.length, 0)} points from this session${keyTerms.length ? `, plus ${keyTerms.length} defined terms` : ''}.`;

  keyTerms.forEach(k => { k.source = 'class'; });
  return { title, summary, sections: used, keyTerms, takeaways: [], reviewQuestions: [], sources: [] };
}

module.exports = { localFormat };
