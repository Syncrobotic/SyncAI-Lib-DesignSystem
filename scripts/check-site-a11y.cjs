// axe on the docs site itself: every docs page and every block preview, as built, in the dark theme and the light one.
// The examples on a component's page are left out (their stories run axe in tests/stories.spec.ts); what is checked here
// is what only the site draws: its navigation, search, code sheets, props tables and foundations pages, and the blocks
// as whole pages. Needs the site running:
//   npm run build && npm start   then   npm run check:a11y   (SITE=http://localhost:3000 by default)
const { chromium } = require('playwright'); const fs = require('fs');
const { default: AxeBuilder } = require('@axe-core/playwright');
const SITE = process.env.SITE || 'http://localhost:3000';
const exe = process.env.PW_CHROMIUM_PATH;
/** @type {import("./types.js").Registry} */
const reg = JSON.parse(fs.readFileSync('registry.json', 'utf8'));

const docs = fs.readdirSync('app/(site)/(docs)/docs', { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'components' && d.name !== 'foundations');
const pages = ['/', '/blocks', '/docs', '/docs/components', ...docs.map((d) => '/docs/' + d.name),
  ...fs.readdirSync('app/(site)/(docs)/docs/foundations').map((s) => '/docs/foundations/' + s),
  ...reg.items.filter((i) => ['registry:ui', 'registry:component'].includes(i.type) && !i.name.includes('theme')).map((i) => '/docs/components/' + i.name),
  ...reg.items.filter((i) => i.type === 'registry:block').map((i) => '/preview/' + i.name)];
// WCAG 2.2 AA, as the foundations' accessibility page promises.
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  /** @type {Map<string, Set<string>>} */
  const found = new Map(); let n = 0;
  for (const theme of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t) } catch {} }, theme);
    const p = await ctx.newPage();
    for (const u of pages) {
      const r = await p.goto(SITE + u, { waitUntil: 'load' }).catch(() => null);
      if (!r || r.status() !== 200) continue; n++;
      await p.waitForTimeout(300);
      const { violations } = await new AxeBuilder({ page: p }).withTags(tags).exclude('[data-slot=example-stage]').analyze();
      for (const v of violations) for (const node of v.nodes) {
        const key = `${v.id}: ${node.target.join(' ')}`;
        if (!found.has(key)) found.set(key, new Set());
        found.get(key)?.add(`${u} (${theme})`);
      }
    }
    await ctx.close();
  }
  await b.close();
  for (const [k, where] of found) console.log(`${k}\n    ${[...where].slice(0, 4).join(', ')}${where.size > 4 ? ` and ${where.size - 4} more` : ''}`);
  if (found.size) { console.error(`\n${found.size} accessibility problem(s) on ${n} pages`); process.exit(1); }
  console.log(`Site accessibility check passed (${n} pages, dark and light)`);
})();
