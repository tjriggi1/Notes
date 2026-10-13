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

function localFormat(raw) {
  const sections = [];
  const keyTerms = [];
  let cur = null;
  const section = h => { cur = { heading: h, paragraphs: [], bullets: [] }; sections.push(cur); };

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const h = headingText(line);
    if (h) { section(h); continue; }
    if (!cur) section('Notes');
    const td = termDef(line);
    if (td) { keyTerms.push(td); continue; }
    const text = tidy(line);
    const words = text.split(' ').length;
    if (!BULLET.test(line) && words >= 14) cur.paragraphs.push(endSentence(text));
    else cur.bullets.push(endSentence(text));
  }

  const used = sections.filter(s => s.paragraphs.length || s.bullets.length);
  const heads = used.map(s => s.heading).filter(h => h !== 'Notes');
  const first = used[0]?.bullets[0] || used[0]?.paragraphs[0] || keyTerms[0]?.term || 'Class notes';
  const title = heads[0] || (first.length > 60 ? first.slice(0, 57).replace(/\s+\S*$/, '') + '...' : first.replace(/\.$/, ''));
  const summary = heads.length
    ? `Covers ${heads.slice(0, 4).join(', ')}${heads.length > 4 ? ` and ${heads.length - 4} more topics` : ''}.`
    : `${used.reduce((n, s) => n + s.bullets.length + s.paragraphs.length, 0)} points from this session${keyTerms.length ? `, plus ${keyTerms.length} defined terms` : ''}.`;

  return { title, summary, sections: used, keyTerms, takeaways: [] };
}

module.exports = { localFormat };
