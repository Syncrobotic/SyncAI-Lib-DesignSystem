// Fails CI when shipped components use values outside the design tokens.
// Rules mirror the design canvas lint: no arbitrary lengths, no raw colours, spacing only on the 4/8/12/16/24/32 scale.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOT = "registry"
const SPACING_OK = new Set(["0", "px", "0.5", "1", "2", "3", "4", "6", "8"])
const RAW_COLOUR = "Raw colour (use a token such as bg-stop or text-info)"
const rules = [
  {
    name: "Arbitrary Tailwind length (use a token such as h-(--h-stop) or rounded-md)",
    re: /\b[\w:-]+-\[(?![^\]]*env\(safe-area)[^\]]*\d(?:px|rem|em)[^\]]*\]/g,
  },
  { name: RAW_COLOUR, re: /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/g },
  {
    name: "Spacing off the scale (use only 1, 2, 3, 4, 6, 8)",
    re: /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(\d+(?:\.\d+)?)\b/g,
    test: (m) => !SPACING_OK.has(m[1]),
  },
  { name: "Font weight off the scale (use only 400, 500, 700)", re: /\bfont-(thin|extralight|light|semibold|extrabold|black)\b/g },
]

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(p) ? [p] : []
  })
}

let bad = 0
for (const file of walk(ROOT)) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return
      for (const r of rules) {
        for (const m of line.matchAll(r.re)) {
          if (r.test && !r.test(m)) continue
          if (r.name === RAW_COLOUR && /white|black/.test(m[0])) continue
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
