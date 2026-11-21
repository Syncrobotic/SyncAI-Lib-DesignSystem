// Fails CI when a component skips the motion language (see the Motion foundation):
//  1. overlays (dialog, alert dialog, sheet, popover, menu, select, tooltip) animate in and out
//  2. every <button> presses (the `press` utility) unless it is a text link (hover:underline)
//  3. timing comes from the tokens: no duration-150, ease-in-out and the like
//  4. every duration class has ease-(--ease-standard) beside it; 5. loops only while waiting (Spinner, skeleton breath,
//     caret); 6. icon sizes and stroke; 7. icon to label is 8 px (gap-2), except inside a 24 px Badge
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ["registry"]
/** @type {(dir: string) => string[]} */
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(p) ? [p] : []
  })

let bad = 0
/**
 * @param {string} file
 * @param {number} line
 * @param {string} msg
 */
const fail = (file, line, msg) => {
  console.error(`${file}:${line}  ${msg}`)
  bad++
}

for (const file of ROOTS.flatMap(walk)) {
  const src = readFileSync(file, "utf8")
  const lines = src.split("\n")
  // Class helpers defined in the file (const base = "press …", const zone = (z) => cn("press …"), const sides = { … animate-… })
  /** @param {string} word */
  const helpers = (word) => [...src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(\{\n[\s\S]*?\n\}|[^\n]*)/g)].filter((m) => m[2].includes(word)).map((m) => m[1])
  const pressHelpers = helpers("press")
  const animHelpers = helpers("animate-")
  /**
   * @param {string} text
   * @param {string[]} names
   */
  const uses = (text, names) => names.some((n) => new RegExp(`[({\\[,\\s]${n}\\b`).test(text))

  // 1. Overlay contents and scrims
  for (const m of src.matchAll(/<(\w+Primitive)\.(Content|Overlay)\b[^>]*?>/gs)) {
    const prim = m[1]
    if (!/Dialog|AlertDialog|Sheet|Popover|Menu|Select|Tooltip/.test(prim)) continue
    const block = src.slice(m.index, m.index + 900)
    if (!/animate-/.test(block) && !uses(block, animHelpers))
      fail(
        file,
        src.slice(0, m.index).split("\n").length,
        `${prim}.${m[2]} has no enter/exit animation (animate-appear / animate-disappear / animate-sheet-* / animate-fade-in)`,
      )
  }

  // 2. Buttons press
  lines.forEach((l, i) => {
    if (!/<button\b/.test(l)) return
    const block = lines.slice(i, i + 10).join("\n")
    const tag = block.slice(0, block.indexOf(">", block.indexOf("className")) + 1 || undefined)
    if (/\bpress\b|hover:underline|role="tab"/.test(tag) || uses(tag, pressHelpers)) return
    fail(file, i + 1, "button without press feedback: add the `press` utility (or use <Button>)")
  })

  // 3. Timing from tokens only
  lines.forEach((l, i) => {
    const t = l.trim()
    if (t.startsWith("//") || t.startsWith("*")) return
    // Escape hatch, as in check-tokens: `motion-ok: <reason>` on the line or the line above (a "don't" example in the docs).
    if (/motion-ok:/.test((lines[i - 1] ?? "") + l)) return
    for (const m of l.matchAll(/(?<![\w-])(duration-\d+|ease-(?:in|out|in-out|linear)\b|delay-\d+)/g))
      fail(file, i + 1, `${m[0]}: use duration-(--motion-fast|base|sheet) and ease-(--ease-standard)`)
    // 4. A duration token always travels with the curve; without it Tailwind's own default curve applies.
    for (const m of l.matchAll(/["`][^"`\n]*duration-\(--motion-\w+\)[^"`\n]*["`]/g))
      if (!m[0].includes("ease-(--ease-standard)")) fail(file, i + 1, "duration-(--motion-*) without ease-(--ease-standard) on the same element")
    // 5. Loops only while waiting: the Spinner (animate-spin), the skeleton's breath and the caret; all stop under reduced motion (theme).
    if (!file.endsWith("spinner.tsx"))
      for (const m of l.matchAll(/(?<![\w-])animate-(spin|pulse|ping|bounce)\b/g)) fail(file, i + 1, `${m[0]}: loops are only for waiting; use <Spinner /> (or Skeleton for a shape)`)
    // 6. Icons are 16, 20 or 24 px with a 2 px stroke.
    for (const m of l.matchAll(/(?:\[&_svg\]:|<[A-Z]\w+ [^>]*className="[^"]*)size-(2\.5|3\.5|3)\b/g))
      fail(file, i + 1, `icon size-${m[1]}: use size-4, size-5 or size-6`)
    // 7. A row holding an icon and a label spaces them 8 px apart (gap-2); 4 is only for text to text and the 24 px tag.
    if (/\b(items-center|items-start)\b/.test(l) && /(?<![\w-])gap-(?:x-)?(?:1|1\.5|0\.5|3)\b/.test(l) && !/h-\(--h-tag\)[^"]*text-xs|icon-gap-ok/.test(l)) {
      const body = lines
        .slice(i + 1, i + 7)
        .join("\n")
        .split(/\n\s*<\/(?:div|span|p|button|dd|a)>/)[0]
      const icon = body.match(/<(?:[A-Z]\w+) aria-(?:hidden|label)=[^\n]*|<StatusGlyph\b[^\n]*|<Spinner\b[^\n]*|\{item\.icon && [^\n]*|<Icon\b[^\n]*/)
      // Not a label row: the icon sits inside a nested button or box, or is pushed to the far end (ml-auto).
      const nested = icon && /<(?:Button|button|div|li|ul)\b/.test(body.slice(0, icon.index))
      if (icon && !nested && !/ml-auto/.test(icon[0]) && !/flex-col/.test(l))
        fail(file, i + 1, "icon next to a label: gap-2 (8 px); add `icon-gap-ok` in a comment only for a deliberate exception")
    }
    if (/strokeWidth=\{?["']?(?:1\.5|2\.5|3)\b/.test(l) && /lucide|<[A-Z]\w+ /.test(l) && !/<(circle|path|svg|rect|line)\b/.test(l))
      fail(file, i + 1, "icon strokeWidth: 2 px like every icon")
  })
}

if (bad) {
  console.error(`\n${bad} motion problem(s)`)
  process.exit(1)
}
console.log("Motion check passed")
