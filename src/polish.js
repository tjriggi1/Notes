const Anthropic = require('@anthropic-ai/sdk');
const { localFormat } = require('./localFormat');
const { normalize } = require('./content');

// Turns rough in-class notes (plus any pasted slide graphs) into in-depth study notes with
// the Claude API. If there is no key or the call fails, falls back to local rule-based
// formatting so a submit never loses notes.

const SYSTEM = `You turn a student's rushed in-class notes into thorough, polished study notes. The student will study from these and ask questions about them later, so make them complete and easy to learn from.

How the notes are typed:
- "1. Heading" lines are slide headings. Make exactly one section per numbered heading, in the same order, using the cleaned-up slide title as the heading. If there is no numbering, group points under short, specific headings.
- "- text" lines are sub notes that belong to the heading above, until the next numbered line.
- Indented "    - text" lines are sub notes of the "- " line directly above them. Keep that nesting: put them in that bullet's "sub" array. Never move a note under a different heading or bullet.
- A "[Graph N]" line marks where the student pasted a picture of a slide graph. The pictures are attached after the notes, each labeled "Graph N". For each one, add a figure to the section where its marker appears: a short title and an explanation of what the graph shows and how it connects to the notes around it. Describe only what is visible in the picture and what the notes say about it. Do not invent numbers you cannot read.
- A line starting with "Graph:" is the student describing a graph the teacher showed. Turn it into a chart (see Charts).

What to write:
- Rewrite the student's notes in clear, full sentences. Fix spelling and grammar and expand shorthand. Keep every point the student wrote.
- "added" (per section): a few sentences of context that make the section easier to understand, such as what a concept means, why it matters or a short example. This is the only place for information that is not in the notes. Keep it accurate and standard for the subject. Leave it empty when the notes already explain the point.
- keyTerms: every important term from the class. If the notes explain it, rewrite that explanation and set "source": "class". If they do not, write an accurate definition yourself and set "source": "added". Never leave a definition empty.
- "title": a 3 to 8 word header naming the theme of the whole session, not a copy of the first heading. "summary": one or two sentences on what the session covered.
- takeaways: the most important points to remember. reviewQuestions: 3 to 5 questions the student should be able to answer after studying, drawn from this session.

Charts:
- Add a chart to a section only when it helps explain the concept (for example supply and demand, break-even, a trend over time, or a comparison the notes give), or when the student described a graph with "Graph:". At most 3 charts in total. Most sessions need none.
- Chart format: {"type": "line" or "bar", "title": string, "xLabel": string, "yLabel": string, "x": [labels or numbers], "series": [{"name": string, "values": [numbers, one per x]}], "illustrative": boolean, "caption": string}. Use at most 4 series and 30 points.
- If the numbers come from the notes or a pasted graph, set "illustrative": false. If you made up numbers only to show a shape or relationship, set "illustrative": true and say in the caption that the values are illustrative.

Research:
- If a web search tool is available, use it only to check definitions of terms the notes do not explain or that you are unsure about. List the pages you relied on in "sources" with their exact title and URL. Do not search for anything else.

Reply format:
- After any searches, end your reply with a single JSON object and nothing after it, in this shape:
{"title": string, "summary": string,
 "sections": [{"heading": string, "paragraphs": [string], "bullets": [{"text": string, "sub": [string]}], "added": [string], "figures": [{"ref": "Graph N", "title": string, "explanation": string}], "charts": [chart]}],
 "keyTerms": [{"term": string, "definition": string, "source": "class" or "added"}],
 "takeaways": [string], "reviewQuestions": [string],
 "sources": [{"title": string, "url": string}]}
Leave any array empty if it does not apply. Use plain text inside strings, no markdown.`;

const fallback = localFormat;

// Server-side refusal fallback ("default" mode) is offered for these models on the Claude API.
const FALLBACK_MODELS = /^claude-(opus-5-5|opus-5|sonnet-5-5|fable-5-1)$/;
// The dynamic-filtering web search version; other models use the basic one.
const NEW_SEARCH_MODELS = /^claude-(opus-(5-5|5|4-8|4-7|4-6)|sonnet-(5-5|5|4-6))$/;
// Models that accept output_config.effort.
const EFFORT_MODELS = /^claude-(opus|sonnet|haiku|fable)-5|^claude-opus-4-(6|7|8)$|^claude-sonnet-4-6$/;

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Model reply had no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

function buildContent({ raw, className, date, images }) {
  const blocks = [{ type: 'text', text: `Class: ${className}\nDate: ${date}\n\nRaw notes:\n${raw}` }];
  for (const img of images) {
    blocks.push({ type: 'text', text: `${img.label}:` });
    blocks.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.data } });
  }
  return blocks;
}

// URLs that actually came back from web searches in this request.
function searchedUrls(responses) {
  const urls = new Map();
  for (const r of responses) {
    for (const b of r.content || []) {
      if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
        for (const hit of b.content) if (hit && hit.url) urls.set(hit.url, hit.title || hit.url);
      }
    }
  }
  return urls;
}

async function polish({ raw, className, date, apiKey, model, images = [], research = true, client }) {
  if (!apiKey && !client) {
    return { content: fallback(raw, images), polished: false, warning: 'No API key set, so notes were formatted with basic cleanup only (shorthand expanded, headings and bullets organized). Add a key in Settings for full rewriting.' };
  }
  try {
    client = client || new Anthropic({ apiKey, maxRetries: 2 });
    const params = {
      model,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: 'user', content: buildContent({ raw, className, date, images }) }],
    };
    if (EFFORT_MODELS.test(model)) params.output_config = { effort: 'high' };
    if (research) {
      params.tools = [{ type: NEW_SEARCH_MODELS.test(model) ? 'web_search_20260209' : 'web_search_20250305', name: 'web_search', max_uses: 5 }];
    }
    if (FALLBACK_MODELS.test(model)) {
      params.betas = ['server-side-fallback-2026-07-01'];
      params.fallbacks = 'default';
    }

    const responses = [];
    let response;
    for (let i = 0; i < 4; i++) {
      response = await client.beta.messages.create(params);
      responses.push(response);
      // A long server-side search loop can pause; send the turn back unchanged to resume.
      if (response.stop_reason !== 'pause_turn') break;
      params.messages = [...params.messages, { role: 'assistant', content: response.content }];
    }
    if (response.stop_reason === 'refusal') throw new Error('the model declined this request');
    if (response.stop_reason === 'pause_turn') throw new Error('research took too long');

    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    let parsed;
    try {
      parsed = extractJson(text);
    } catch (e) {
      if (response.stop_reason === 'max_tokens') throw new Error('the notes were too long for one reply');
      throw e;
    }
    const content = normalize(parsed);
    // Keep only sources that really came back from a search, so a made-up link can't slip in.
    const seen = searchedUrls(responses);
    content.sources = content.sources.filter(s => seen.has(s.url));
    return { content, polished: true };
  } catch (e) {
    const msg = e instanceof Anthropic.AuthenticationError ? 'the API key was rejected'
      : e instanceof Anthropic.RateLimitError ? 'rate limited, try again in a minute'
      : e instanceof Anthropic.APIError ? `API error ${e.status || ''}: ${e.message}`.trim()
      : e.message;
    return { content: fallback(raw, images), polished: false, warning: `Polishing failed (${msg}); basic cleanup was used instead.` };
  }
}

module.exports = { polish, fallback, extractJson, SYSTEM };
