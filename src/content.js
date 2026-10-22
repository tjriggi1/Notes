// The shape of a polished session, shared by the AI path, the local formatter and the
// page builders. normalize() accepts model output (or older saved sessions) and returns:
// {
//   title, summary,
//   sections: [{ heading, paragraphs: [str], bullets: [{ text, sub: [str] }],
//                added: [str],                         // context Claude added, not from class
//                figures: [{ ref, title, explanation }], // pasted slide graphs ("Graph 1")
//                charts: [chartSpec] }],                 // charts Claude drew (see chartSvg.js)
//   keyTerms: [{ term, definition, source: 'class' | 'added' }],
//   takeaways: [str], reviewQuestions: [str], sources: [{ title, url }]
// }

const { cleanChart } = require('./chartSvg');

const strs = v => (Array.isArray(v) ? v.map(x => (x == null ? '' : String(x)).trim()).filter(Boolean) : []);

function bullet(b) {
  if (typeof b === 'string') return b.trim() ? { text: b.trim(), sub: [] } : null;
  if (!b || typeof b !== 'object') return null;
  const text = String(b.text || '').trim();
  return text ? { text, sub: strs(b.sub) } : null;
}

function normalize(o) {
  o = o && typeof o === 'object' ? o : {};
  return {
    title: String(o.title || 'Class notes'),
    summary: String(o.summary || ''),
    sections: (Array.isArray(o.sections) ? o.sections : []).map(s => ({
      heading: String(s && s.heading || ''),
      paragraphs: strs(s && s.paragraphs),
      bullets: (Array.isArray(s && s.bullets) ? s.bullets : []).map(bullet).filter(Boolean),
      added: strs(s && s.added),
      figures: (Array.isArray(s && s.figures) ? s.figures : [])
        .map(f => ({ ref: String(f && f.ref || '').trim(), title: String(f && f.title || ''), explanation: String(f && f.explanation || '') }))
        .filter(f => /^Graph \d+$/i.test(f.ref)),
      charts: (Array.isArray(s && s.charts) ? s.charts : []).map(cleanChart).filter(Boolean).slice(0, 3),
    })),
    keyTerms: (Array.isArray(o.keyTerms) ? o.keyTerms : [])
      .map(t => ({
        term: String(t && t.term || '').trim(),
        definition: String(t && t.definition || '').trim(),
        source: t && t.source === 'added' ? 'added' : 'class',
      }))
      .filter(t => t.term),
    takeaways: strs(o.takeaways),
    reviewQuestions: strs(o.reviewQuestions),
    sources: (Array.isArray(o.sources) ? o.sources : [])
      .map(s => ({ title: String(s && s.title || '').trim(), url: String(s && s.url || '').trim() }))
      .filter(s => /^https?:\/\//.test(s.url)),
  };
}

module.exports = { normalize };
