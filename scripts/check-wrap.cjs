// Rows of buttons on a phone, and stray text: finds a wrapping row of actions (buttons, links, badges) whose last line holds a single item
// under a fuller line, the "Source" left alone on a line of its own. A horizontal-overflow check cannot see it: nothing
// overflows, it only wraps badly. Fix by giving the phone its own layout (equal columns, a stack, or a shorter row).
// Needs the site running:
//   npm run build && npm start   then   npm run check:wrap   (SITE=http://localhost:3000, width 375 by default)
const { chromium } = require('playwright')
const fs = require('fs')
const SITE = process.env.SITE || 'http://localhost:3000'
const WIDTH = Number(process.env.WIDTH || 375)
const exe = process.env.PW_CHROMIUM_PATH
const reg = JSON.parse(fs.readFileSync('registry.json', 'utf8'))
const foundations = fs.readdirSync('app/(site)/(docs)/docs/foundations', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
const docs = fs.readdirSync('app/(site)/(docs)/docs', { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('[') && d.name !== 'components' && d.name !== 'foundations').map((d) => d.name)

const pages = [
  '/', '/blocks', '/icons', '/docs/foundations', '/docs/components',
  ...foundations.map((s) => '/docs/foundations/' + s),
  ...docs.map((s) => '/docs/' + s),
  ...reg.items.filter((i) => i.type !== 'registry:block').map((i) => '/docs/components/' + i.name),
  ...reg.items.filter((i) => i.type === 'registry:block').map((i) => '/preview/' + i.name),
]

;(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {})
  const p = await b.newPage({ viewport: { width: WIDTH, height: 800 }, isMobile: true, hasTouch: true })
  const found = []
  let n = 0
  for (const u of pages) {
    const r = await p.goto(SITE + u, { waitUntil: 'load' }).catch(() => null)
    if (!r || r.status() !== 200) continue
    n++
    const hits = await p.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('*')) {
        const cs = getComputedStyle(el)
        if (!(cs.display.includes('flex') && cs.flexWrap === 'wrap' && cs.flexDirection.startsWith('row'))) continue
        // data-wrap="free": a list of tags that wraps like words (Built from …), not a row of actions.
        if (el.closest('[role=dialog],.specimen,svg,[data-wrap=free]')) continue
        const kids = [...el.children].filter((c) => {
          const s = c.getBoundingClientRect()
          return s.width > 0 && s.height > 0 && getComputedStyle(c).position !== 'absolute'
        })
        if (kids.length < 3) continue
        if (!kids.every((k) => k.matches('a,button,[role=button],[data-slot=badge]') || k.querySelector('a,button'))) continue
        const lines = {}
        for (const k of kids) (lines[Math.round(k.getBoundingClientRect().top / 4)] ??= []).push(k)
        const ls = Object.values(lines)
        if (ls.length > 1 && ls.at(-1).length === 1 && ls.at(-2).length >= 2)
          out.push(`alone on its line: "${(ls.at(-1)[0].textContent || '').trim().slice(0, 40)}" (${String(el.className).slice(0, 60)})`)
      }
      // Text that should never reach the screen: a code comment rendered as text, or a value that did not resolve.
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let t
      while ((t = w.nextNode())) {
        if (t.parentElement.closest('pre,code,script,style,[data-code]')) continue
        const v = t.nodeValue.trim()
        if (/^\/\/ |\bfocus-ring:|\[object Object\]|\bNaN\b/.test(v)) out.push(`text that should not show: "${v.slice(0, 50)}"`)
      }
      return out
    })
    for (const h of hits) found.push(`${u}  ${h}`)
  }
  await b.close()
  if (found.length) {
    console.error(found.join('\n'))
    console.error(`\n${found.length} row(s) wrap with one item alone, on ${n} pages at ${WIDTH} px`)
    process.exit(1)
  }
  console.log(`Wrap check passed: ${n} pages at ${WIDTH} px`)
})()
