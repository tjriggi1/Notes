const { localFormat } = require('./localFormat');

// Turns rough in-class notes into structured, formal notes using the Claude API.
// If there is no key or the call fails, falls back to local rule-based formatting so a
// submit never loses notes.

const SYSTEM = `You turn a student's rushed in-class notes into polished study notes.

Rules:
- Use only what the student wrote. Expand abbreviations and fragments into clear sentences, fix spelling and grammar, and reorder for logical flow. Do not add facts, examples, numbers, names or definitions that are not in the notes.
- If a term appears in the notes without an explanation, list it under keyTerms with an empty definition rather than inventing one.
- The student types in slide format. A line that starts with a number and a period ("1. Pricing models") is a slide heading. The dash lines under it ("- cost-plus uses markup") are sub notes that belong to that heading, until the next numbered line. Make exactly one section per numbered heading, in the same order. The section heading is the cleaned-up slide title and its sub notes become that section's bullets (or a short paragraph if they read as an explanation). Never move a sub note under a different heading. If the notes have no numbering, group related points under short, specific headings instead.
- "title" is the header for the whole day, chosen by you: name the overall theme that ties the slides together, in 3 to 8 words. Do not copy the first line or the first slide heading unless it truly covers the whole session.
- Group related points under short, specific section headings. Use bullets for lists of facts, paragraphs for explanations.
- Write in a formal but plain register. Short sentences beat long ones.
- "summary" is one or two sentences saying what the class session covered.
- Reply with a single JSON object and nothing else, in this shape:
{"title": string, "summary": string,
 "sections": [{"heading": string, "paragraphs": [string], "bullets": [string]}],
 "keyTerms": [{"term": string, "definition": string}],
 "takeaways": [string]}
Leave any array empty if it does not apply.`;

const fallback = localFormat;

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Model reply had no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

function normalize(o) {
  const arr = v => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  return {
    title: String(o.title || 'Class notes'),
    summary: String(o.summary || ''),
    sections: (Array.isArray(o.sections) ? o.sections : []).map(s => ({
      heading: String(s.heading || ''),
      paragraphs: arr(s.paragraphs),
      bullets: arr(s.bullets),
    })),
    keyTerms: (Array.isArray(o.keyTerms) ? o.keyTerms : [])
      .map(t => ({ term: String(t.term || ''), definition: String(t.definition || '') }))
      .filter(t => t.term),
    takeaways: arr(o.takeaways),
  };
}

async function polish({ raw, className, date, apiKey, model }) {
  if (!apiKey) {
    return { content: fallback(raw), polished: false, warning: 'No API key set, so notes were formatted with basic cleanup only (shorthand expanded, headings and bullets organized). Add a key in Settings for full rewriting.' };
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Class: ${className}\nDate: ${date}\n\nRaw notes:\n${raw}` }],
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error?.message || `HTTP ${res.status}`);
    const text = (body.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return { content: normalize(extractJson(text)), polished: true };
  } catch (e) {
    return { content: fallback(raw), polished: false, warning: `Polishing failed (${e.message}); basic cleanup was used instead.` };
  }
}

module.exports = { polish, fallback, normalize };
