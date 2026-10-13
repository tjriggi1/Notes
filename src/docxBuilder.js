const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} = require('docx');

const ACCENT = '1F3A5F';
const MUTED = '5A6472';
const FONT = 'Calibri';

function run(text, o = {}) {
  return new TextRun({ text, font: FONT, ...o });
}

function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9D3E0', space: 2 } },
    children: [run(text, { bold: true, size: 28, color: ACCENT })],
  });
}

function body(text) {
  return new Paragraph({ spacing: { after: 120, line: 300 }, children: [run(text, { size: 22 })] });
}

function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60, line: 288 }, children: [run(text, { size: 22 })] });
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function keyTermsTable(terms) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'C9D3E0' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cell = (text, w, o = {}) => new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
    children: [new Paragraph({ children: [run(text, { size: 21, bold: o.bold })] })],
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: terms.map(t => new TableRow({
      children: [
        cell(t.term, 2800, { bold: true, fill: 'F4F6FA' }),
        cell(t.definition || '(not explained in class notes)', 6560),
      ],
    })),
  });
}

function sessionChildren(session, className) {
  const c = session.content;
  const out = [];
  out.push(new Paragraph({
    spacing: { after: 40 },
    children: [run(className.toUpperCase(), { size: 20, bold: true, color: MUTED, characterSpacing: 40 })],
  }));
  out.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 60 },
    children: [run(c.title, { bold: true, size: 40, color: ACCENT })],
  }));
  out.push(new Paragraph({
    spacing: { after: 160 },
    children: [run(formatDate(session.date), { size: 22, color: MUTED })],
  }));
  if (c.summary) {
    out.push(new Paragraph({
      spacing: { after: 200, line: 300 },
      shading: { type: ShadingType.CLEAR, fill: 'EEF3F9', color: 'auto' },
      border: { left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT, space: 8 } },
      indent: { left: 160 },
      children: [run(c.summary, { italics: true, size: 22 })],
    }));
  }
  for (const s of c.sections) {
    if (s.heading) out.push(heading(s.heading));
    s.paragraphs.forEach(p => out.push(body(p)));
    s.bullets.forEach(b => out.push(bullet(b)));
  }
  if (c.keyTerms.length) {
    out.push(heading('Key terms'));
    out.push(keyTermsTable(c.keyTerms));
  }
  if (c.takeaways.length) {
    out.push(heading('Takeaways'));
    c.takeaways.forEach(t => out.push(bullet(t)));
  }
  return out;
}

async function buildDocx(session, className) {
  const doc = new Document({
    creator: 'Galisano Notes',
    title: `${className}: ${session.content.title}`,
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, bottom: 1200, left: 1440, right: 1440 } } },
      children: sessionChildren(session, className),
    }],
  });
  return Packer.toBuffer(doc);
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

module.exports = { buildDocx, toMarkdown, formatDate };
