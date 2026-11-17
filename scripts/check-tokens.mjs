// Fails CI when code uses values outside the design tokens: the shipped components and the docs site alike,
// because the site is the first product built with the language and must not teach by counter-example.
// Rules: no arbitrary lengths, no raw colours, spacing only on the 4/8/12/16/24/32 scale (plus the section tokens),
// three font weights, and rounded-full only for shapes that are round by nature.
//
// Escape hatch: a comment containing `tokens-ok: <reason>` on the line or the line above skips that line.
// Use it for values that cannot be tokens (brand file colours, OS metadata), never to save effort.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ["registry", "site", "app"]
const SPACING_OK = new Set(["0", "px", "0.5", "1", "2", "3", "4", "6", "8"])
// Files allowed to use rounded-full, and for what. The Radius page lists the same uses.
const ROUND = {
  "registry/syncrobotic/ui/avatar.tsx": "avatar",
  "registry/syncrobotic/ui/switch.tsx": "switch track and thumb",
  "registry/syncrobotic/ui/radio-group.tsx": "radio and its dot",
  "registry/syncrobotic/ui/slider.tsx": "slider track and thumb",
  "registry/syncrobotic/ui/progress.tsx": "progress track",
  "registry/syncrobotic/ui/sheet.tsx": "bottom sheet grabber",
  "registry/syncrobotic/shell/dock.tsx": "count badge",
  "registry/syncrobotic/shell/island.tsx": "avatar placeholder, status dot ring, unread count",
  "registry/syncrobotic/blocks/app-shell.tsx": "unread dot on a collapsed nav icon",
  "registry/syncrobotic/ui/badge.tsx": "count badge",
  "registry/syncrobotic/ui/meter.tsx": "meter track and fill",
  "site/prose.tsx": "list bullet dot",
  "app/(site)/(docs)/docs/foundations/motion/page.tsx": "timeline dot",
  "app/(site)/(docs)/docs/foundations/radius/page.tsx": "documents this rule: bullet dots and the pill-button counter-example",
}
const rules = [
  {
    name: "Arbitrary length (use a token such as h-(--h-stop), text-3xl or rounded-md)",
    // Grid templates describe columns, not a size of the scale, so they are allowed.
    re: /(?<![\w-])(?![\w:-]*grid-(?:cols|rows)-\[)[\w:-]+-\[(?![^\]]*env\(safe-area)[^\]]*\d(?:px|rem|em)[^\]]*\]/g,
  },
  { name: "Raw colour (use a token such as bg-stop or text-info)", re: /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g },
  {
    name: "Spacing off the scale (use only 1, 2, 3, 4, 6, 8, or section / section-sm between page sections)",
    re: /(?<![\w-])(?:-?(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y))-(\d+(?:\.\d+)?)\b/g,
    test: (m) => !SPACING_OK.has(m[1]),
  },
  { name: "Font weight off the scale (use only 400, 500, 700)", re: /\bfont-(thin|extralight|light|semibold|extrabold|black)\b/g },
  {
    // The radius scale is xs–xl. Full is only for things that are round by nature (ROUND below).
    name: "rounded-full outside its uses (avatar, dot, switch, radio, slider, progress track, count badge, grabber): use rounded-xs…xl, or add the file to ROUND with its use",
    re: /\brounded-full\b/g,
    file: (f) => !(f.replaceAll("\\", "/") in ROUND),
  },
]

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(p) ? [p] : []
  })
}

let bad = 0
for (const file of ROOTS.flatMap(walk)) {
  const lines = readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    const prev = lines[i - 1] ?? ""
    const t = line.trim()
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return
    if (/tokens-ok:/.test(prev + line)) return
    for (const r of rules) {
      if (r.file && !r.file(file)) continue
      for (const m of line.matchAll(r.re)) {
        if (r.test && !r.test(m)) continue
        console.error(`${file}:${i + 1}  ${r.name}\n    ${m[0]}`)
        bad++
      }
    }
  })
}
if (bad) {
  console.error(`\n${bad} violation(s)`)
  process.exit(1)
}
console.log("Token check passed")
