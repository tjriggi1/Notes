// Draws the simple line/bar charts Claude adds to notes as standalone SVG strings.
// Colors come from CSS classes (.c-s1 ... .c-s4, .c-grid, .c-ink, .c-muted, .c-surface) so
// the saved page and the app can theme them for light and dark; no inline styles, since
// the app's Content-Security-Policy blocks them. Every point and bar carries a <title>
// for a hover tooltip, and chartTable() gives the data-table view.

const MAX_SERIES = 4;
const MAX_POINTS = 60;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Accepts whatever the model returned and gives back a clean spec, or null if unusable.
function cleanChart(c) {
  if (!c || typeof c !== 'object') return null;
  const type = c.type === 'bar' ? 'bar' : c.type === 'line' ? 'line' : null;
  if (!type || !Array.isArray(c.x) || !Array.isArray(c.series)) return null;
  const x = c.x.slice(0, MAX_POINTS).map(v => (typeof v === 'number' ? v : String(v)));
  const series = c.series.slice(0, MAX_SERIES).map(s => ({
    name: String(s && s.name || ''),
    values: (Array.isArray(s && s.values) ? s.values : []).slice(0, x.length).map(Number),
  })).filter(s => s.values.length === x.length && s.values.every(Number.isFinite));
  if (x.length < 2 || !series.length) return null;
  return {
    type,
    title: String(c.title || ''),
    xLabel: String(c.xLabel || ''),
    yLabel: String(c.yLabel || ''),
    caption: String(c.caption || ''),
    illustrative: c.illustrative !== false, // assume made-up shape unless told the numbers are real
    x,
    series,
  };
}

function niceStep(range, target) {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

function fmt(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return +(v / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return +(v / 1e3).toFixed(1) + 'K';
  return String(+v.toFixed(2));
}

function chartSvg(spec) {
  const W = 640, H = 360;
  const multi = spec.series.length > 1;
  const m = { top: multi ? 44 : 20, right: 20, bottom: 56, left: 64 };
  const pw = W - m.left - m.right, ph = H - m.top - m.bottom;

  const all = spec.series.flatMap(s => s.values);
  let lo = Math.min(0, ...all), hi = Math.max(...all);
  if (hi === lo) hi = lo + 1;
  const step = niceStep(hi - lo, 4);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const y = v => m.top + ph - ((v - lo) / (hi - lo)) * ph;

  const numericX = spec.type === 'line' && spec.x.every(v => typeof v === 'number');
  const xs = numericX ? spec.x : null;
  const xMin = numericX ? Math.min(...xs) : 0, xMax = numericX ? Math.max(...xs) : 0;
  const n = spec.x.length;
  const band = pw / n;
  const xPos = i => numericX
    ? m.left + ((xs[i] - xMin) / ((xMax - xMin) || 1)) * pw
    : m.left + band * i + band / 2;

  const out = [];
  out.push(`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.title || 'Chart')}" xmlns="http://www.w3.org/2000/svg">`);

  // Gridlines and y ticks (hairline, solid, recessive).
  for (let v = lo; v <= hi + step / 2; v += step) {
    const yy = y(v).toFixed(1);
    out.push(`<line class="c-grid" x1="${m.left}" x2="${W - m.right}" y1="${yy}" y2="${yy}"/>`);
    out.push(`<text class="c-muted" x="${m.left - 8}" y="${yy}" text-anchor="end" dominant-baseline="middle" font-size="12">${esc(fmt(v))}</text>`);
  }

  // X labels: thin them out so they never collide.
  const every = Math.ceil(n / 10);
  spec.x.forEach((v, i) => {
    if (i % every && i !== n - 1) return;
    out.push(`<text class="c-muted" x="${xPos(i).toFixed(1)}" y="${H - m.bottom + 18}" text-anchor="middle" font-size="12">${esc(typeof v === 'number' ? fmt(v) : v)}</text>`);
  });
  if (spec.xLabel) out.push(`<text class="c-ink" x="${m.left + pw / 2}" y="${H - 12}" text-anchor="middle" font-size="13">${esc(spec.xLabel)}</text>`);
  if (spec.yLabel) out.push(`<text class="c-ink" transform="translate(16 ${m.top + ph / 2}) rotate(-90)" text-anchor="middle" font-size="13">${esc(spec.yLabel)}</text>`);

  if (spec.type === 'bar') {
    // Grouped bars, <= 24px thick, 2px gap between neighbours, 4px rounded top.
    const k = spec.series.length;
    const bw = Math.min(24, (band * 0.7 - (k - 1) * 2) / k);
    spec.series.forEach((s, si) => {
      s.values.forEach((v, i) => {
        const x0 = xPos(i) - (k * bw + (k - 1) * 2) / 2 + si * (bw + 2);
        const y0 = y(Math.max(v, 0)), y1 = y(Math.min(v, 0));
        const h = Math.max(y1 - y0, 0.5), r = Math.min(4, h, bw / 2);
        const d = v >= 0
          ? `M${x0},${y1} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x0 + bw - r} Q${x0 + bw},${y0} ${x0 + bw},${y0 + r} V${y1} Z`
          : `M${x0},${y0} V${y1 - r} Q${x0},${y1} ${x0 + r},${y1} H${x0 + bw - r} Q${x0 + bw},${y1} ${x0 + bw},${y1 - r} V${y0} Z`;
        out.push(`<path class="c-s${si + 1}f" d="${d}"><title>${esc(`${s.name ? s.name + ', ' : ''}${spec.x[i]}: ${fmt(v)}`)}</title></path>`);
      });
    });
  } else {
    spec.series.forEach((s, si) => {
      const pts = s.values.map((v, i) => `${xPos(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      out.push(`<polyline class="c-s${si + 1}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>`);
      // Markers only when there are few points; each has a 2px surface ring and a tooltip.
      if (n <= 16) {
        s.values.forEach((v, i) => out.push(`<circle class="c-s${si + 1}f c-ring" stroke-width="2" r="4" cx="${xPos(i).toFixed(1)}" cy="${y(v).toFixed(1)}"><title>${esc(`${s.name ? s.name + ', ' : ''}${spec.x[i]}: ${fmt(v)}`)}</title></circle>`));
      }
    });
  }

  // Zero baseline when the range crosses zero.
  if (lo < 0 && hi > 0) out.push(`<line class="c-axis" x1="${m.left}" x2="${W - m.right}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/>`);

  // Legend for 2+ series: a short line key per series, text in ink (never the series color).
  if (multi) {
    let lx = m.left;
    spec.series.forEach((s, si) => {
      out.push(`<line class="c-s${si + 1}" stroke-width="3" stroke-linecap="round" x1="${lx}" x2="${lx + 16}" y1="18" y2="18"/>`);
      out.push(`<text class="c-ink" x="${lx + 22}" y="18" dominant-baseline="middle" font-size="12">${esc(s.name || `Series ${si + 1}`)}</text>`);
      lx += 22 + Math.min(180, 7 * (s.name || 'Series 1').length) + 20;
    });
  }
  out.push('</svg>');
  return out.join('');
}

function chartTable(spec) {
  const head = `<tr><th>${esc(spec.xLabel || '')}</th>${spec.series.map((s, i) => `<th>${esc(s.name || `Series ${i + 1}`)}</th>`).join('')}</tr>`;
  const rows = spec.x.map((x, i) => `<tr><td>${esc(typeof x === 'number' ? fmt(x) : x)}</td>${spec.series.map(s => `<td>${esc(fmt(s.values[i]))}</td>`).join('')}</tr>`).join('');
  return `<table class="chart-table">${head}${rows}</table>`;
}

// Color tokens for both themes. The same block goes into saved pages and the app stylesheet.
const CHART_CSS = `
.chart{width:100%;height:auto;display:block}
.chart text{font-family:-apple-system,"Segoe UI",Calibri,sans-serif}
.c-grid{stroke:var(--c-grid,#e3e6ea);stroke-width:1}
.c-axis{stroke:var(--c-axis,#9aa3ad);stroke-width:1}
.c-ink{fill:var(--c-ink,#1d232c)}
.c-muted{fill:var(--c-muted,#5d6672)}
.c-ring{stroke:var(--c-surface,#ffffff)}
.c-s1{stroke:var(--s1,#2a78d6)}.c-s1f{fill:var(--s1,#2a78d6)}
.c-s2{stroke:var(--s2,#eb6834)}.c-s2f{fill:var(--s2,#eb6834)}
.c-s3{stroke:var(--s3,#1baf7a)}.c-s3f{fill:var(--s3,#1baf7a)}
.c-s4{stroke:var(--s4,#eda100)}.c-s4f{fill:var(--s4,#eda100)}
@media(prefers-color-scheme:dark){:root{--c-grid:#2b3441;--c-axis:#6b7684;--c-ink:#e6eaf0;--c-muted:#98a3b3;--c-surface:#1b212b;--s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#c98500}}
.chart-table{border-collapse:collapse;font-size:14px;margin-top:6px}
.chart-table th,.chart-table td{border:1px solid var(--line,#dfe3ea);padding:4px 10px;text-align:right}
.chart-table th:first-child,.chart-table td:first-child{text-align:left}`;

module.exports = { cleanChart, chartSvg, chartTable, CHART_CSS };
