/* GoDooars usage log: a small, free Cloudflare Worker + D1 database.
   - POST /      the chat page sends one row per visit ('open') and per question ('q')
   - GET /stats  private stats page, needs ?key=<STATS_KEY secret>
   Setup (Cloudflare dashboard): create D1 database "godooars-log", bind it to this worker as DB,
   add a secret STATS_KEY, then open /setup?key=<STATS_KEY> once to create the table. */

const ALLOWED_ORIGINS = ['https://cleareasttrip.github.io', 'http://localhost:5175', 'http://127.0.0.1:5175'];
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const SCHEMA = `CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  t TEXT, sid TEXT, src TEXT, lang TEXT, q TEXT, route TEXT,
  answered INTEGER, places TEXT, chip INTEGER, ref TEXT, country TEXT
);
CREATE INDEX IF NOT EXISTS events_ts ON events(ts);`;

function cors(origin) {
  return ALLOWED_ORIGINS.includes(origin) ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : {};
}

async function log(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin)) return new Response('forbidden', { status: 403 });
  const raw = await request.text();
  if (raw.length > 4000) return new Response('too big', { status: 413 });
  let b; try { b = JSON.parse(raw); } catch { return new Response('bad json', { status: 400, headers: cors(origin) }); }
  const t = b.t === 'open' ? 'open' : 'q';
  /* mask anything that still looks like a phone number */
  const q = clip(b.q, 300).replace(/\+?\d[\d\s-]{7,}\d/g, '[number]');
  await env.DB.prepare('INSERT INTO events (t,sid,src,lang,q,route,answered,places,chip,ref,country) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .bind(t, clip(b.sid, 12), clip(b.src, 40) || 'direct', clip(b.lang, 4), t === 'q' ? q : null, clip(b.route, 60),
      b.answered ? 1 : 0, clip(b.places, 200), b.chip ? 1 : 0, clip(b.ref, 100), clip(request.cf && request.cf.country, 2))
    .run();
  return new Response('ok', { headers: cors(origin) });
}

const all = async (env, sql, ...args) => (await env.DB.prepare(sql).bind(...args).all()).results;

async function stats(env, days) {
  const since = `-${days} days`;
  const [tot] = await all(env, `SELECT
      COUNT(DISTINCT CASE WHEN t='open' THEN sid END) AS visits,
      COUNT(DISTINCT CASE WHEN t='q' THEN sid END) AS chatted,
      SUM(t='q') AS questions, SUM(t='q' AND answered=1) AS answered
    FROM events WHERE ts >= datetime('now', ?)`, since);
  const byDay = await all(env, `SELECT date(ts) d, COUNT(DISTINCT CASE WHEN t='open' THEN sid END) visits, SUM(t='q') questions
    FROM events WHERE ts >= datetime('now', ?) GROUP BY d ORDER BY d DESC`, since);
  const bySrc = await all(env, `SELECT src, COUNT(DISTINCT sid) visits, SUM(t='q') questions FROM events
    WHERE ts >= datetime('now', ?) GROUP BY src ORDER BY visits DESC LIMIT 30`, since);
  const byLang = await all(env, `SELECT lang, COUNT(*) n FROM events WHERE t='q' AND ts >= datetime('now', ?) GROUP BY lang ORDER BY n DESC`, since);
  const placeRows = await all(env, `SELECT places FROM events WHERE t='q' AND places <> '' AND ts >= datetime('now', ?)`, since);
  const pc = {}; placeRows.forEach(r => r.places.split('|').forEach(p => { if (p) pc[p] = (pc[p] || 0) + 1; }));
  const topPlaces = Object.entries(pc).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const unanswered = await all(env, `SELECT ts, lang, q FROM events WHERE t='q' AND answered=0 AND ts >= datetime('now', ?) ORDER BY id DESC LIMIT 50`, since);
  const recent = await all(env, `SELECT ts, src, lang, q, answered FROM events WHERE t='q' AND chip=0 AND ts >= datetime('now', ?) ORDER BY id DESC LIMIT 100`, since);
  return { tot, byDay, bySrc, byLang, topPlaces, unanswered, recent };
}

const LANG = { en: 'English', hi: 'Hinglish / Hindi', bn: 'Banglish / Bangla' };
function page(s, days, key) {
  const n = x => Number(x || 0).toLocaleString('en-IN');
  const pct = s.tot.questions ? Math.round(100 * s.tot.answered / s.tot.questions) : 0;
  const table = (head, rows) => `<table><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${head.length}">Nothing yet</td></tr>`}</table>`;
  const range = [7, 30, 90, 365].map(d => `<a href="?key=${encodeURIComponent(key)}&days=${d}"${d === days ? ' class="on"' : ''}>${d} days</a>`).join(' ');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GoDooars assistant stats</title>
<style>body{font:15px system-ui,sans-serif;margin:0;padding:16px;background:#f6f4ee;color:#123c35}main{max-width:900px;margin:auto}
h1{font-size:22px}h2{font-size:16px;margin-top:28px}.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.k div{background:#fff;border-radius:12px;padding:14px}.k b{font-size:28px;display:block}.k small{color:#5b6b66}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top}
a{color:#c55a00;margin-right:8px}a.on{font-weight:700}p.note{color:#5b6b66;font-size:13px}</style>
<main><h1>GoDooars trip assistant: usage</h1><p>${range}</p>
<div class="k"><div><b>${n(s.tot.visits)}</b><small>visits (QR scans and link opens)</small></div><div><b>${n(s.tot.chatted)}</b><small>visitors who asked something</small></div>
<div><b>${n(s.tot.questions)}</b><small>questions asked</small></div><div><b>${pct}%</b><small>answered</small></div></div>
<h2>By QR location</h2>${table(['Source', 'Visits', 'Questions'], s.bySrc.map(r => [r.src, n(r.visits), n(r.questions)]))}
<h2>By language</h2>${table(['Language', 'Questions'], s.byLang.map(r => [LANG[r.lang] || r.lang, n(r.n)]))}
<h2>Places people ask about</h2>${table(['Place', 'Questions'], s.topPlaces.map(([p, c]) => [p, n(c)]))}
<h2>Questions it could not answer (add these to the data)</h2>${table(['When (UTC)', 'Lang', 'Question'], s.unanswered.map(r => [r.ts, r.lang, r.q]))}
<h2>By day</h2>${table(['Day', 'Visits', 'Questions'], s.byDay.map(r => [r.d, n(r.visits), n(r.questions)]))}
<h2>Latest typed questions</h2>${table(['When (UTC)', 'Source', 'Lang', 'Question', 'Answered'], s.recent.map(r => [r.ts, r.src, r.lang, r.q, r.answered ? 'yes' : 'no']))}
<p class="note">Phone numbers and names are masked before saving. Taps on ready-made buttons are counted but not listed. Download everything: <a href="/export.csv?key=${encodeURIComponent(key)}&days=${days}">CSV</a></p></main>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...cors(origin), 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (request.method === 'POST') return log(request, env);

    const key = url.searchParams.get('key') || '';
    const authed = env.STATS_KEY && key === env.STATS_KEY;
    if (url.pathname === '/setup') {
      if (!authed) return new Response('not found', { status: 404 });
      for (const stmt of SCHEMA.split(';').map(s => s.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
      return new Response('table ready');
    }
    if (url.pathname === '/stats' || url.pathname === '/export.csv') {
      if (!authed) return new Response('not found', { status: 404 });
      const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days'), 10) || 30));
      if (url.pathname === '/export.csv') {
        const rows = await all(env, `SELECT ts,t,sid,src,lang,q,route,answered,places,chip,country FROM events WHERE ts >= datetime('now', ?) ORDER BY id`, `-${days} days`);
        const cols = ['ts', 't', 'sid', 'src', 'lang', 'q', 'route', 'answered', 'places', 'chip', 'country'];
        const csv = cols.join(',') + '\n' + rows.map(r => cols.map(c => '"' + String(r[c] == null ? '' : r[c]).replace(/"/g, '""') + '"').join(',')).join('\n');
        return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="godooars-assistant-log.csv"' } });
      }
      return new Response(page(await stats(env, days), days, key), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    return new Response(JSON.stringify({ ok: true, service: 'godooars-log' }), { headers: { 'Content-Type': 'application/json' } });
  }
};
