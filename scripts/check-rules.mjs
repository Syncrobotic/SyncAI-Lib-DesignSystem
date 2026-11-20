// Fails CI on the design rules the 0.17 audit found broken by hand. Each one is a rule from the foundations that a
// reviewer missed more than once; a check is cheaper than a second audit.
//
//  1. Focus is never removed. `outline-none` needs a visible replacement on the same element: an outline, ring, border,
//     underline or shadow under a focus or highlight state (focus-visible:, focus:, focus-within:, data-[highlighted]:,
//     aria-selected:, data-[selected=true]:), or a wrapper that draws it (has-focus-visible:, has-[…focus-visible…]:), or
//     a `focus-ring:` comment within three lines above saying where focus shows instead. A background change alone is
//     not a replacement: bg-accent on the card is 1.2:1, so the keyboard position cannot be found by it.
//  2. In Tailwind 4, `outline-none` cancels `focus-visible:outline-2` on the same element (both set outline-style), so
//     the ring never draws. Drop `outline-none` there: :focus-visible already keeps mouse clicks ring-free.
//  3. A battery warns below 15 % and never turns danger: no other threshold, no `critical` on a battery Meter.
//  4. Every chart with axes has a table view: a block that draws one (ChartContainer: line, area, bar) offers ChartTable or
//     a Table. Sparklines, rings and status strips write their numbers in words instead (see the Data visualisation foundation).
//  5. A graph has a text view in the same way: a block that draws one (Graph) offers GraphList.
//  6. So does a map: a block that draws one (RobotMap) offers RobotMapList.
//
// Field-edge contrast (--input 3:1) is a number, so it is a unit test: tests/unit/rules.test.ts.
//
//   node scripts/check-rules.mjs [dirs…]   default: registry site app stories
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ["registry", "site", "app", "stories"]
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx|ts)$/.test(p) ? [p] : []
  })

let bad = 0
const fail = (file, line, msg) => {
  console.error(`${file}:${line}  ${msg}`)
  bad++
}

// A focus style that shows: an outline, ring, border, underline or shadow under a focus or highlight state, or a wrapper
// that draws one. A fill alone (focus:bg-accent, data-[highlighted]:bg-accent) does not count.
const STATE = /(?:^|:)(?:focus-visible|focus|focus-within|data-\[highlighted\]|data-highlighted|aria-selected|data-\[selected=true\])(?::|$)/
const WRAPPER = /(?:^|:)(?:has-focus-visible|has-\[[^\]]*focus-visible[^\]]*\])(?::|$)/
const DRAWS = /^-?(?:outline-(?!none$|hidden$|offset)|outline$|ring(?:-|$)|border(?:-|$)|underline|decoration-|shadow)/
// Splits a class at its last colon outside brackets: variants, then the utility.
const split = (token) => {
  let depth = 0
  for (let i = token.length - 1; i >= 0; i--) {
    const c = token[i]
    if (c === "]") depth++
    else if (c === "[") depth--
    else if (c === ":" && depth === 0) return [token.slice(0, i), token.slice(i + 1)]
  }
  return ["", token]
}
export const showsFocus = (text) =>
  text
    .split(/[\s"'`,{}]+/)
    .filter(Boolean)
    .some((token) => {
      const [variants, utility] = split(token)
      if (!variants) return false
      if (WRAPPER.test(variants)) return true
      return STATE.test(variants) && DRAWS.test(utility.replace(/^!/, ""))
    })
const OUTLINE_VARIANT = /focus-visible:outline-(?:\d|offset|ring|\[)/

for (const file of ROOTS.flatMap(walk)) {
  const src = readFileSync(file, "utf8")
  const lines = src.split("\n")

  lines.forEach((line, i) => {
    const n = i + 1
    // 1 and 2: focus
    for (const m of line.matchAll(/(["'`])((?:(?!\1).)*\boutline-none\b(?:(?!\1).)*)\1/g)) {
      const cls = m[2]
      if (/\bfocus-visible:outline-none\b/.test(cls) && !/\boutline-none\b(?<!focus-visible:outline-none)/.test(cls.replace(/focus-visible:outline-none/g, ""))) continue
      if (OUTLINE_VARIANT.test(cls) && !/focus-visible:outline-solid/.test(cls)) {
        fail(file, n, "`outline-none` cancels `focus-visible:outline-*` in Tailwind 4, so no ring draws. Drop `outline-none`.")
        continue
      }
      // A class list split over several strings in cn(…): look at its neighbours too.
      // Only lines that are themselves class strings (each starts with a quote), not a neighbouring element.
      const strings = (from, step) => {
        const out = []
        for (let j = from; j >= 0 && j < lines.length && Math.abs(j - i) <= 3; j += step) {
          if (!/^\s*["'`]/.test(lines[j])) break
          out.push(lines[j])
        }
        return out
      }
      const near = [line, ...strings(i - 1, -1), ...strings(i + 1, 1)].join("\n")
      const above = lines.slice(Math.max(0, i - 3), i + 1).join("\n")
      if (!showsFocus(near) && !/focus-ring:/.test(above))
        fail(file, n, "`outline-none` with no visible focus in its place. Add one, or a `// focus-ring:` comment saying where focus shows.")
    }

    // 3: battery thresholds
    const batteryLine = /battery/i.test(line)
    if (batteryLine) {
      for (const m of line.matchAll(/\bbattery\w*\s*(?:<|<=)\s*(\d+)/gi)) if (m[1] !== "15") fail(file, n, `battery warns below 15 %, not ${m[1]}`)
      if (/<Meter\b/.test(line) || /label:\s*["'][^"']*battery/i.test(line)) {
        const low = line.match(/\blow[=:]\s*\{?\s*(\d+)/)
        if (low && low[1] !== "15") fail(file, n, `a battery Meter takes low 15, not ${low[1]}`)
        if (/\bcritical[=:]/.test(line)) fail(file, n, "a battery never turns danger: no `critical` on a battery Meter")
      }
    }
  })

  // 4: chart blocks
  if (file.includes("registry/syncrobotic/blocks/") && /<ChartContainer\b/.test(src) && !/<ChartTable\b|<Table\b/.test(src))
    fail(file, 1, "a chart block needs a table view: a Chart / Table switch with ChartTable (see bar-chart-missions)")

  // 5: graph blocks
  if (file.includes("registry/syncrobotic/blocks/") && /<Graph\b/.test(src) && !/<GraphList\b/.test(src))
    fail(file, 1, "a graph block needs a text view: a Graph / List switch with GraphList (see the graph stories)")

  // 6: map blocks. `<RobotMap\b` would also match RobotMapList, so the tag must end there.
  if (file.includes("registry/syncrobotic/blocks/") && /<RobotMap[\s/>]/.test(src) && !/<RobotMapList\b/.test(src))
    fail(file, 1, "a map block needs a text view: RobotMapList beside the map, or in a Robots sheet (see map-workspace)")
}

if (bad) {
  console.error(`\n${bad} rule problem(s)`)
  process.exit(1)
}
console.log("Rules check passed")
