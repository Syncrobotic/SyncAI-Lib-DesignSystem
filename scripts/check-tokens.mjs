// Fails CI when code uses values outside the design tokens: the shipped components and the docs site alike,
// because the site is the first product built with the language and must not teach by counter-example.
// Rules: no arbitrary lengths, no raw colours, spacing only on the 4/8/12/16/24/32 scale (plus the section tokens),
// three font weights, and rounded-full only for shapes that are round by nature.
//
// Escape hatch: a comment containing `tokens-ok: <reason>` on the line or the line above skips that line.
// Use it for values that cannot be tokens (brand file colours, OS metadata), never to save effort.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ["registry", "site", "app", "stories"]
const SPACING_OK = new Set(["0", "px", "0.5", "1", "2", "3", "4", "6", "8"])
// Files allowed to use rounded-full, and for what. The Radius page lists the same uses.
const ROUND = {
  "registry/syncrobotic/ui/alarm.tsx": "the priority bar is a pill with round ends in its own gutter",
  "site/site-footer.tsx": "the dot beside the version",
  "registry/syncrobotic/ui/share-bar.tsx": "the bar is a track, and its legend keys are dots",
  "site/icon-gallery.tsx": "the dot that marks the icons the kit has given a meaning",
  "registry/syncrobotic/ui/avatar.tsx": "avatar",
  "registry/syncrobotic/ui/image-grid.tsx": "the pick-one mark is a radio, with its dot",
  "registry/syncrobotic/ui/switch.tsx": "switch track and thumb",
  "registry/syncrobotic/ui/radio-group.tsx": "radio and its dot",
  "registry/syncrobotic/ui/slider.tsx": "slider track and thumb",
  "registry/syncrobotic/ui/progress.tsx": "progress track",
  "registry/syncrobotic/ui/sheet.tsx": "bottom sheet grabber",
  "registry/syncrobotic/shell/dock.tsx": "count badge",
  "registry/syncrobotic/shell/island.tsx": "avatar placeholder, status dot ring, unread count",
  "registry/syncrobotic/ui/sidebar.tsx": "count dot on a collapsed nav icon",
  "registry/syncrobotic/blocks/notification-center.tsx": "unread dot on a notification",
  "registry/syncrobotic/ui/badge.tsx": "count badge",
  "registry/syncrobotic/ui/meter.tsx": "meter track and fill",
  "registry/syncrobotic/ui/icon-tile.tsx": "circle tile shape and the status dot",
  "registry/syncrobotic/ui/scroll-area.tsx": "scrollbar thumb",
  "registry/syncrobotic/ui/resizable.tsx": "resize grip pill",
  "registry/syncrobotic/blocks/status-tracker-rollout.tsx": "stage progress track and fill",
  "registry/syncrobotic/ui/trace.tsx": "waterfall bar track and fill",
  "registry/syncrobotic/ui/stepper.tsx": "step circles and the compact progress track",
  "registry/syncrobotic/ui/timeline.tsx": "event dots",
  "registry/syncrobotic/shell/teleop-pad.tsx": "joystick base, its travel rings and the knob (a thumb)",
  "stories/calendar.stories.tsx": "booked-day dot",
  "stories/display.stories.tsx": "status dot on an avatar",
  "stories/file-upload.stories.tsx": "avatar upload: the avatar is a circle",
  "registry/syncrobotic/blocks/wizard-commission.tsx": "dot of a self-check that has not started",
  "registry/syncrobotic/ui/questionnaire.tsx": "progress track",
  "registry/syncrobotic/ui/joint-state.tsx": "each joint's limit track, and its skeleton",
  "site/prose.tsx": "list bullet dot",
  "app/(site)/(docs)/docs/foundations/motion/page.tsx": "timeline dot",
  "app/(site)/(docs)/docs/foundations/radius/page.tsx": "documents this rule: bullet dots and the pill-button counter-example",
}
/** @type {{ name: string; re: RegExp; test?: (m: RegExpMatchArray) => boolean; file?: (f: string) => boolean }[]} */
const rules = [
  {
    name: "Arbitrary length (use a token such as h-(--h-stop), text-3xl or rounded-md)",
    // rounded-[inherit] has no length, so it passes: a child that fills its parent edge to edge clips to the parent's step
    // (Radius foundation, #concentric).
    // Grid templates describe columns, not a size of the scale, so they are allowed.
    re: /(?<![\w-])(?![\w:-]*grid-(?:cols|rows)-\[)[\w:-]+-\[(?![^\]]*env\(safe-area)[^\]]*\d(?:px|rem|em)[^\]]*\]/g,
  },
  { name: "Raw colour (use a token such as bg-stop or text-info)", re: /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g },
  {
    name: "Spacing off the scale (use only 1, 2, 3, 4, 6, 8, or section / section-sm between page sections)",
    re: /(?<![\w-])(?:-?(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y))-(\d+(?:\.\d+)?)\b/g,
    test: (m) => !SPACING_OK.has(m[1]),
  },
  { name: "Font size off the scale (use xs, sm, base, lg, xl, 2xl, 3xl, 4xl or 5xl)", re: /(?<![\w-])text-([6-9]xl)\b/g },
  {
    // A native number input draws the browser's own spinner and has no unit or range. NumberField has both.
    name: "Native number input (use NumberField: 44 px steppers, a unit and a range)",
    re: /<Input\b[^>]*type="number"/g,
  },
  { name: "Font weight off the scale (use only 400, 500, 700)", re: /\bfont-(thin|extralight|light|semibold|extrabold|black)\b/g },
  {
    // The radius scale is 2xs–xl. Full is only for things that are round by nature (ROUND below).
    name: "rounded-full outside its uses (round by nature: avatars, dots and bullets, switch and radio, tracks and thumbs (slider, progress, meter, scrollbar), count badges, step circles, grips and grabbers; see the Radius foundation): use rounded-2xs…xl, or add the file to ROUND with its use",
    re: /\brounded-full\b/g,
    file: (f) => !(f.replaceAll("\\", "/") in ROUND),
  },
]

// The icon set (site/icons.ts) is the allowlist for Lucide: one icon per meaning, so a new icon is a reviewed change there.
/** @param {string} src */
const iconImport = (src) =>
  [...src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"lucide-react"/g)].flatMap((m) =>
    m[1]
      .split(",")
      .map((n) => n.replace(/^\s*type\s+/, "").split(/\s+as\s+/)[0].trim())
      .filter(Boolean)
      .map((name) => ({ name, at: m.index })),
  )
const ICONS = new Set(iconImport(readFileSync("site/icons.ts", "utf8")).map((i) => i.name))
const ICON_TYPES = new Set(["LucideIcon", "LucideProps", "createLucideIcon"])

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(p) ? [p] : []
  })
}

let bad = 0
for (const file of ROOTS.flatMap(walk)) {
  const src = readFileSync(file, "utf8")
  const lines = src.split("\n")
  for (const { name, at } of iconImport(src)) {
    if (ICONS.has(name) || ICON_TYPES.has(name)) continue
    const n = src.slice(0, at).split("\n").length
    if (/tokens-ok:/.test((lines[n - 2] ?? "") + lines[n - 1])) continue
    console.error(`${file}:${n}  Icon outside the icon set (use the icon site/icons.ts gives that meaning, or add it there)\n    ${name}`)
    bad++
  }
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
