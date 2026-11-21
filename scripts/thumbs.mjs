// The pictures on /docs/components: each component's first story (the one its page opens with), cropped to what it draws
// and framed 16:10, light and dark, at two widths. Taken from the built Storybook in a browser and encoded to WebP by the
// browser's own canvas, so there is no image library to install.
//
//   npm run build-storybook && npm run thumbs          writes public/thumbs/components/<name>-<theme>-<width>.webp
//   npm run thumbs -- button dialog                     only these
//   npm run lint:thumbs                                 fails when a component with examples has no pictures, or one is left over
//
// The visual-baseline workflow runs it after the baselines, in the same Playwright image, and commits the result with
// them, so the pictures change when the stories do. Taken on a laptop they differ from CI's only in font rendering.
import { spawn } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"

const OUT = "public/thumbs/components"
const THEMES = ["light", "dark"]
/** Output widths in pixels (16:10). A card is 17 to 24 rem wide: 1x screens take the first, 2x the second. */
const WIDTHS = [400, 800]
const RATIO = 16 / 10
/** The crop of the story in CSS pixels: at least MIN_W wide (a lone button is shown larger, never past 1.25x), at most its 422 px page. */
const MIN_W = 320
const MAX_W = 422
const PAD = 20
/** The browser is wider than the story's page, so a small component can sit in the middle of its frame. */
const VW = 800

/**
 * Stories that make a better picture than the first one, by component. Overlays are covered by a rule instead (their
 * "…Open" story shows the overlay, not the button that opens it).
 */
/** @type {Record<string, string>} */
const pick = {
  // The first story is one bare tile or one bare divider; these show what the component is for.
  "icon-tile": "IconTileVariants",
  marker: "MarkerInLog",
  // The first story is three buttons that raise a toast; the open one pins its toasts to the viewport's bottom edge.
  toast: "ToastWithUndo",
}

/** @typedef {{ name: string, file: string, prefix?: string, only?: string[] }} Component */
/** @typedef {{ x1: number, y1: number, x2: number, y2: number }} Edges */
/** @typedef {{ x: number, y: number, width: number, height: number }} Box */

// The catalog is TypeScript that imports JSON, which Node cannot load as is; its entries are regular enough to read.
function components() {
  const src = readFileSync("site/catalog.ts", "utf8")
  const start = src.indexOf("const entries: Record<string, Entry> = {")
  const body = src.slice(start, src.indexOf("\n}\n", start))
  const keys = [...body.matchAll(/^ {2}"?([\w-]+)"?: \{/gm)]
  /** @type {Component[]} */
  const out = []
  keys.forEach((k, i) => {
    const chunk = body.slice(k.index, keys[i + 1]?.index)
    // Hooks are behaviour: their demos are a button and a counter, not a picture of anything. Their cards stay text.
    if (/group: "Hooks/.test(chunk)) return
    const ex = chunk.match(/examples: \{ file: "([\w-]+)"(?:, prefix: "(\w+)")?(?:, only: \[([^\]]*)\])? \}/)
    if (!ex) {
      if (/examples:/.test(chunk)) throw new Error(`site/catalog.ts: cannot read the examples of ${k[1]}`)
      return
    }
    out.push({ name: k[1], file: ex[1], prefix: ex[2], only: ex[3] ? [...ex[3].matchAll(/"(\w+)"/g)].map((m) => m[1]) : undefined })
  })
  if (out.length < 50) throw new Error(`site/catalog.ts: read only ${out.length} components with examples; has its layout changed?`)
  return out
}

/** The story to picture: as storyNames() in site/catalog.ts, the first one the component page shows, unless an overlay has an open one. */
/** @param {Component} c */
function story(c) {
  const src = readFileSync(`stories/${c.file}.stories.tsx`, "utf8")
  const names = [...src.matchAll(/^export const ([^\s:=]+)\s*[:=]/gm)].map((m) => m[1])
  if (pick[c.name]) return pick[c.name]
  if (c.prefix && names.includes(`${c.prefix}Open`)) return `${c.prefix}Open`
  const picked = c.only ? names.filter((n) => c.only?.includes(n)) : c.prefix ? names.filter((n) => n.startsWith(c.prefix ?? "") && !n.endsWith("Open")) : names
  if (!picked.length) throw new Error(`No stories in stories/${c.file}.stories.tsx for ${c.name}`)
  return picked[0]
}

const files = (/** @type {string} */ name) => THEMES.flatMap((t) => WIDTHS.map((w) => `${name}-${t}-${w}.webp`))

if (process.argv.includes("--check")) {
  const want = new Set(components().flatMap((c) => files(c.name)))
  const have = new Set(existsSync(OUT) ? readdirSync(OUT) : [])
  const missing = [...want].filter((f) => !have.has(f))
  const extra = [...have].filter((f) => !want.has(f))
  if (missing.length) console.error(`Missing component thumbnails:\n  ${missing.join("\n  ")}`)
  if (extra.length) console.error(`Thumbnails of no component:\n  ${extra.join("\n  ")}`)
  if (missing.length || extra.length) {
    console.error("\nRun npm run build-storybook && npm run thumbs, or the visual-baseline workflow.")
    process.exit(1)
  }
  console.log(`Thumbnail check passed (${want.size / files("x").length} components)`)
  process.exit(0)
}

const { chromium } = await import("playwright")
const PORT = 6008
const BASE = `http://127.0.0.1:${PORT}`
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8"))
const ids = new Map(Object.values(index.entries).map((e) => [`${e.importPath}#${e.exportName}`, e.id]))
const only = process.argv.slice(2).filter((a) => !a.startsWith("-"))
const list = components().filter((c) => !only.length || only.includes(c.name))

const server = spawn("npx", ["http-server", "storybook-static", "-p", String(PORT), "-s"], { stdio: "ignore" })
for (let i = 0; i < 150 && !(await fetch(BASE).then((r) => r.ok, () => false)); i++) await new Promise((r) => setTimeout(r, 200))

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {})
// Three device pixels per CSS pixel, so the narrowest crop still has more pixels than the 800 wide file.
const shots = await browser.newContext({ viewport: { width: VW, height: 900 }, deviceScaleFactor: 3, reducedMotion: "reduce" })
const encoder = await (await browser.newContext()).newPage()
if (!only.length) rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

let total = 0
for (const c of list) {
  const name = story(c)
  const id = ids.get(`./stories/${c.file}.stories.tsx#${name}`)
  if (!id) throw new Error(`${c.name}: story ${name} is not in storybook-static (rebuild it)`)
  for (const theme of THEMES) {
    const page = await shots.newPage()
    // A sheet is placed against the viewport's edges: give it the story's own phone-width page.
    const vw = name === "SheetOpen" ? MAX_W : VW
    if (vw !== VW) await page.setViewportSize({ width: vw, height: 900 })
    // As tests/story.ts opens a story: the clock run past timed states, the kit's fonts loaded.
    await page.clock.install()
    await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
    await page.waitForSelector("#storybook-root > *")
    await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, theme === "dark")
    await page.evaluate(() => Promise.all(["400 16px Geist", "500 16px Geist", "700 16px Geist", "400 16px 'Geist Mono'"].map((f) => document.fonts.load(f))))
    // Room above and below the story, so a short one is centred in its frame instead of sitting on the page's top edge.
    await page.addStyleTag({ content: "#storybook-root > div { padding-top: 200px !important; padding-bottom: 400px !important }" })
    await page.clock.runFor(1000)
    // Canvas and media stories draw on frames and loads the paused clock does not drive.
    if (/robot-model|point-cloud|robot-map|camera-feed|media-player|annotated-image|image-grid/.test(c.file)) {
      await page.waitForTimeout(1500)
      await page.clock.runFor(500)
    }
    // A picture, not a session: no focus ring or selected text left by an overlay's autofocus.
    await page.evaluate(() => {
      /** @type {HTMLElement | null} */ (document.activeElement)?.blur?.()
      getSelection()?.removeAllRanges()
    })
    // Floating content (a popover, a menu) is placed after it mounts, on frames and observers: measure until it stops moving.
    let box = await page.evaluate(ink)
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(50)
      await page.clock.runFor(100)
      const again = await page.evaluate(ink)
      if (JSON.stringify(again) === JSON.stringify(box) && i >= 2) break
      box = again
    }
    if (!box) throw new Error(`${c.name}: ${name} draws nothing`)
    const clip = frame(box, await page.evaluate(() => document.documentElement.scrollHeight), vw)
    const png = await page.screenshot({ clip, fullPage: true })
    await page.close()
    const webp = await encoder.evaluate(encode, { png: png.toString("base64"), widths: WIDTHS })
    WIDTHS.forEach((w, i) => {
      const buf = Buffer.from(webp[i], "base64")
      total += buf.length
      writeFileSync(`${OUT}/${c.name}-${theme}-${w}.webp`, buf)
    })
  }
  console.log(`${c.name.padEnd(24)} ${name}`)
}
await browser.close()
server.kill()
console.log(`${list.length} components, ${list.length * THEMES.length * WIDTHS.length} files, ${Math.round(total / 1024)} KB`)

/**
 * Runs in the story: the box of what it paints. Its text, its leaves (icons, inputs, images, canvases) and every element
 * with a background, border or shadow count; layout wrappers that paint nothing do not, so a row of buttons is the row,
 * not the 390 px column around it. The story is clamped to its 422 px page, so content that scrolls sideways is cut where
 * the page cuts it. An open modal (a backdrop over the whole viewport) is the picture on its own; a popover or tooltip is
 * shown with the control it belongs to.
 */
function ink() {
  const root = /** @type {Element} */ (document.querySelector("#storybook-root"))
  const portals = [...document.body.children].filter((e) => e !== root && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(e.tagName) && !e.id?.startsWith("storybook") && !/\bsb-/.test(e.className))
  const vw = document.documentElement.clientWidth
  const vh = innerHeight
  const painted = (/** @type {CSSStyleDeclaration} */ s) => {
    const bg = s.backgroundColor.match(/[\d.]+/g)
    return (bg && (bg.length === 3 || +bg[3] > 0)) || s.backgroundImage !== "none" || ["Top", "Right", "Bottom", "Left"].some((k) => parseFloat(/** @type {string} */ (s.getPropertyValue(`border-${k.toLowerCase()}-width`))) > 0) || s.boxShadow !== "none"
  }
  // The story wrapper itself (padded, the page colour) is the background, not the component.
  const backdrop = new Set([root, root.firstElementChild, root.firstElementChild?.firstElementChild])
  let modal = false
  /** @type {(scope: Element, edges: [number, number]) => Edges | null} */
  const measure = (scope, [left, right]) => {
    /** @type {Edges | null} */
    let r = null
    const add = (/** @type {DOMRect} */ b) => {
      // Off the page altogether (a chart library's text-measuring node at -20000 px) is not drawn.
      if (b.width < 1 || b.height < 1 || b.bottom + scrollY <= 0 || b.right + scrollX <= 0) return
      const x1 = Math.max(left, b.left + scrollX)
      const x2 = Math.min(right, b.right + scrollX)
      if (x2 <= x1) return
      const y1 = b.top + scrollY
      const y2 = b.bottom + scrollY
      r = r ? { x1: Math.min(r.x1, x1), y1: Math.min(r.y1, y1), x2: Math.max(r.x2, x2), y2: Math.max(r.y2, y2) } : { x1, y1, x2, y2 }
    }
    for (const el of [scope, ...scope.querySelectorAll("*")]) {
      if (backdrop.has(el) || (el.closest("svg") && el.closest("svg") !== el)) continue
      const s = getComputedStyle(el)
      if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) continue
      const b = el.getBoundingClientRect()
      // A fixed layer over the whole viewport is a modal's dimming, not something to frame.
      if (s.position === "fixed" && b.width >= vw - 1 && b.height >= vh - 1) {
        modal = true
        continue
      }
      const leaf = !el.firstElementChild || /^(svg|canvas|img|video|input|textarea|select)$/i.test(el.tagName)
      if (leaf || painted(s)) add(b)
    }
    const walk = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent?.trim() || !n.parentElement || n.parentElement.closest("script, style")) continue
      const s = getComputedStyle(n.parentElement)
      if (s.visibility === "hidden" || +s.opacity === 0) continue
      range.selectNodeContents(n)
      add(range.getBoundingClientRect())
    }
    return r
  }
  const story = measure(root, [vw / 2 - 211, vw / 2 + 211])
  const over = /** @type {Edges[]} */ (portals.map((p) => measure(p, [0, vw])).filter(Boolean))
  const boxes = /** @type {Edges[]} */ (modal && over.length ? over : [story, ...over].filter(Boolean))
  if (!boxes.length) return null
  const x1 = Math.min(...boxes.map((b) => b.x1))
  const y1 = Math.min(...boxes.map((b) => b.y1))
  const x2 = Math.max(...boxes.map((b) => b.x2))
  const y2 = Math.max(...boxes.map((b) => b.y2))
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}

/** A 16:10 crop around the box: at least MIN_W wide and centred on it; wider (up to MAX_W) when it is tall; then cut at the bottom. */
/** @param {Box} b @param {number} pageH @param {number} vw */
function frame(b, pageH, vw) {
  const w = Math.min(MAX_W, Math.max(MIN_W, b.width + 2 * PAD, (b.height + 2 * PAD) * RATIO))
  const h = w / RATIO
  const x = Math.min(vw - w, Math.max(0, b.x + b.width / 2 - w / 2))
  const tall = b.height + 2 * PAD > h
  const y = Math.max(0, Math.min(pageH - h, tall ? b.y - PAD : b.y + b.height / 2 - h / 2))
  return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) }
}

/** Runs in the browser: the PNG scaled down to each width with the canvas's best filter, as WebP. */
/** @param {{ png: string, widths: number[] }} input */
async function encode({ png, widths }) {
  const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob())
  const out = []
  for (const w of widths) {
    const c = document.createElement("canvas")
    c.width = w
    c.height = Math.round((w * 10) / 16)
    const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"))
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, 0, 0, c.width, c.height)
    out.push(c.toDataURL("image/webp", 0.8).split(",")[1])
  }
  return out
}
