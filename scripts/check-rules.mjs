// Fails CI on the design rules the 0.17 audit found broken by hand. Each one is a rule from the foundations that a
// reviewer missed more than once; a check is cheaper than a second audit.
//
//  1. Focus is never removed. `outline-none` needs a visible replacement on the same element (a focus-visible ring,
//     background or outline, has-focus-visible on a wrapper, or a highlighted state for menu items), or a
//     `focus-ring:` comment within three lines above saying where focus shows instead.
//  2. In Tailwind 4, `outline-none` cancels `focus-visible:outline-2` on the same element (both set outline-style), so
//     the ring never draws. Drop `outline-none` there: :focus-visible already keeps mouse clicks ring-free.
//  3. A battery warns below 15 % and never turns danger: no other threshold, no `critical` on a battery Meter.
//  4. Every chart block has a table view: a block that draws a chart (ChartContainer) offers ChartTable or a Table.
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

// A focus style that shows: a ring, an outline, a fill, or a wrapper that draws it.
const REPLACEMENT =
  /focus-visible:(?:outline-(?!none)|ring|bg-|border-|underline|shadow)|has-focus-visible:|has-\[[^\]]*focus-visible\]:|focus-within:(?:outline|ring|bg-)|focus:bg-|data-\[highlighted\]:|data-highlighted:|aria-selected:bg-|data-\[selected=true\]:bg-/
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
      if (!REPLACEMENT.test(near) && !/focus-ring:/.test(above))
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
}

if (bad) {
  console.error(`\n${bad} rule problem(s)`)
  process.exit(1)
}
console.log("Rules check passed")
