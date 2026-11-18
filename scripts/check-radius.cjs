// Concentric corners: on every docs page and block preview, finds a rounded surface sitting close to the corner of a
// rounded surface around it (padding at most half the outer radius) whose radius is more than outer - padding + 2.
// That is the radius rule (outer = inner + padding) broken where it shows. Needs the site running:
//   npm run build && npm start   then   npm run check:radius   (SITE=http://localhost:3000 by default)
const { chromium } = require('playwright'); const fs = require('fs');
const SITE = process.env.SITE || 'http://localhost:3000';
const exe = process.env.PW_CHROMIUM_PATH;
const reg = JSON.parse(fs.readFileSync('registry.json', 'utf8'));


const pages = ['/', '/blocks', '/docs/foundations', ...['principles','color','typography','spacing','elevation','motion','iconography','accessibility','alarms'].map(s=>'/docs/foundations/'+s),
  ...reg.items.filter(i => ['registry:ui','registry:component'].includes(i.type) && !i.name.includes('theme')).map(i => '/docs/components/' + i.name),
  ...reg.items.filter(i => i.type === 'registry:block').map(i => '/preview/' + i.name)];
(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'dark') } catch {} });
  const p = await ctx.newPage(); const found = new Map(); let n = 0;
  for (const u of pages) {
    const r = await p.goto(SITE + u, { waitUntil: 'load' }).catch(() => null);
    if (!r || r.status() !== 200) continue; n++;
    await p.waitForTimeout(400);
    const hits = await p.evaluate(() => {
      const cs = e => getComputedStyle(e);
      const surf = e => { const s = cs(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
        const bg = s.backgroundColor; const hasBg = bg && bg !== 'transparent' && !/,\s*0\)$/.test(bg);
        const hasB = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none'; return hasBg || hasB || s.boxShadow !== 'none' };
      const rad = e => parseFloat(cs(e).borderTopLeftRadius) || 0;
      const sig = e => (e.getAttribute('data-slot') ? '[' + e.getAttribute('data-slot') + '] ' : '') + e.tagName.toLowerCase() + '.' + (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter(c => /rounded|ring|border|bg-|shadow|p-|px-|py-/.test(c)).slice(0, 6).join('.');
      const out = [];
      for (const e of document.querySelectorAll('body *')) {
        const ri = rad(e); if (!ri || !surf(e)) continue;
        const ir = e.getBoundingClientRect(); if (ir.width < 24 || ir.height < 24) continue;
        if (ri >= Math.min(ir.width, ir.height) / 2 - 1) continue; // pill: its own rule
        let a = e.parentElement; while (a && !(rad(a) > 0 && surf(a))) a = a.parentElement; if (!a) continue;
        const ro = rad(a); const or = a.getBoundingClientRect();
        if (ro >= Math.min(or.width, or.height) / 2 - 1) continue;
        const corners = [[ir.left - or.left, ir.top - or.top], [or.right - ir.right, ir.top - or.top], [ir.left - or.left, or.bottom - ir.bottom], [or.right - ir.right, or.bottom - ir.bottom]];
        let worst = null;
        for (const [dx, dy] of corners) { if (dx < -0.5 || dy < -0.5) continue; const gap = Math.min(dx, dy); if (!(gap <= ro / 2 + 0.5)) continue;
          if (gap < 1 && /hidden|clip/.test(cs(a).overflow)) continue;
          const want = Math.max(0, ro - gap); if (ri > want + 2) worst = { gap: Math.round(gap), ri, ro, want: Math.round(want) } }
        if (worst) out.push({ inner: sig(e), outer: sig(a), ...worst });
      }
      return out;
    });
    for (const h of hits) { const k = h.inner + ' IN ' + h.outer; if (!found.has(k)) found.set(k, { ...h, pages: [] }); const f = found.get(k); if (f.pages.length < 3 && !f.pages.includes(u)) f.pages.push(u) }
  }
  console.log('pages checked', n, 'distinct issues', found.size);
  for (const [k, v] of found) console.log(`inner r${v.ri} in outer r${v.ro}, gap ${v.gap} → inner should be ≤ ${v.want}\n   ${v.inner}\n   in ${v.outer}\n   e.g. ${v.pages.join(' ')}`);
  await b.close();
  process.exit(found.size ? 1 : 0);
})();
