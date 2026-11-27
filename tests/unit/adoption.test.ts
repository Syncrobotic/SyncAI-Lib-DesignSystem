// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, describe, expect, it } from "vitest"
import { GUIDE, LOOKALIKES, RENAMED, changesBetween, compareVersions, describeDistance, distance, findLookalikes, formatText, parseChangelog, parseHeader, report, scanDir, scanLookalikes, statusOf, summarize } from "../../scripts/adoption.mjs"

const changelog = parseChangelog(`# Changelog

## Unreleased

### Added
- **\`tree\`**: not released yet.

## 0.18.0 · 2026-11-19

### Added
- **\`tree\`** (beta): a hierarchy.
- **\`annotated-image\`**: boxes over a picture.

## 0.17.0 · 2026-11-19

### Fixed
- \`tree\` keeps its guide line. \`button\` too.

## 0.16.0 · 2026-11-18

- **\`tree\`**: first version.
`)

const registry = {
  items: [
    { name: "tree", type: "registry:ui", meta: { status: "beta", version: "0.18.0", changelog: [{ version: "0.18.0", date: "", note: "Tree note" }] } },
    { name: "button", type: "registry:ui", meta: { version: "0.17.0", changelog: [{ version: "0.17.0", date: "", note: "Button note" }, { version: "0.16.5", date: "", note: "Button patch" }] } },
    { name: "fleet-table", type: "registry:block", meta: { version: "0.10.0", changelog: [] } },
  ],
}

describe("adoption scanner", () => {
  it("reads the header of an installed file, in TS and CSS, and nothing else", () => {
    expect(parseHeader("// @syncrobotic/tree v0.18.0 · update: npx shadcn add @syncrobotic/tree --overwrite\n\"use client\"")).toEqual({ name: "tree", version: "0.18.0" })
    expect(parseHeader("/* @syncrobotic/syncrobotic-theme v0.17.3 · update: … */\n:root {}")).toEqual({ name: "syncrobotic-theme", version: "0.17.3" })
    expect(parseHeader('"use client"\n// @syncrobotic/dock v0.9.0 · update: …')).toEqual({ name: "dock", version: "0.9.0" })
    expect(parseHeader('import x from "@syncrobotic/tree"\n')).toBeNull()
    expect(parseHeader("// @syncrobotic/<name> vX.Y.Z · update: …")).toBeNull()
  })

  it("compares versions numerically and counts how far behind", () => {
    expect(compareVersions("0.9.0", "0.10.0")).toBe(-1)
    expect(compareVersions("0.10.0", "0.10.0")).toBe(0)
    expect(describeDistance(distance("0.10.0", "0.17.1"))).toBe("7 minors behind")
    expect(describeDistance(distance("0.17.0", "0.18.0"))).toBe("1 minor behind")
    expect(describeDistance(distance("0.17.1", "0.17.3"))).toBe("2 patches behind")
    expect(describeDistance(distance("0.9.0", "1.2.0"))).toBe("1 major behind")
    expect(describeDistance(distance("0.18.0", "0.18.0"))).toBe("current")
    expect(describeDistance(distance("0.19.0", "0.18.0"))).toBe("ahead")
  })

  it("lists the changelog lines after the installed version, up to the latest, oldest first", () => {
    const tree = registry.items[0]
    expect(changesBetween({ sections: changelog, item: tree, name: "tree", from: "0.16.0", to: "0.18.0" }).map((c) => c.version + " " + c.text)).toEqual([
      "0.17.0 `tree` keeps its guide line. `button` too.",
      "0.18.0 **`tree`** (beta): a hierarchy.",
    ])
    // A version CHANGELOG.md does not name the item in falls back to the item's own note.
    const button = registry.items[1]
    expect(changesBetween({ sections: changelog, item: button, name: "button", from: "0.16.0", to: "0.17.0" })).toEqual([
      { version: "0.16.5", text: "Button patch", source: "registry.json" },
      { version: "0.17.0", text: "`tree` keeps its guide line. `button` too.", source: "CHANGELOG.md" },
    ])
  })

  it("reports each item once, at its oldest installed version, with status", () => {
    const r = report(
      [
        { name: "tree", version: "0.17.0", file: "a/tree.tsx" },
        { name: "tree", version: "0.18.0", file: "b/tree.tsx" },
        { name: "fleet-table", version: "0.10.0", file: "components/fleet-table.tsx" },
        { name: "gone", version: "0.3.0", file: "components/gone.tsx" },
      ],
      registry,
      changelog,
    )
    const tree = r.items.find((i) => i.name === "tree")!
    expect(tree).toMatchObject({ installed: "0.17.0", versions: ["0.17.0", "0.18.0"], latest: "0.18.0", behind: true, minorsBehind: 1, status: "beta" })
    expect(tree.changes.map((c) => c.version)).toEqual(["0.18.0"])
    expect(r.items[0].name).toBe("tree") // behind first
    expect(r.items.find((i) => i.name === "fleet-table")).toMatchObject({ status: "block", state: "current" })
    expect(r.items.find((i) => i.name === "gone")).toMatchObject({ status: "unknown", latest: null, state: "not in registry" })
    expect(r.counts).toEqual({ items: 3, behind: 1, current: 1, beta: 1, unknown: 1, renamed: 0 })
    expect(statusOf(registry.items[1])).toBe("stable")

    const s = summarize([{ ...r, repo: "a" }, { ...report([], registry, changelog), repo: "b" }])
    expect(s).toMatchObject({ repos: 2, reposUsingKit: 1, items: 3, installs: 3, behind: 1 })
  })

  it("names the item to install for a name 0.40 renamed, instead of calling it unknown", () => {
    const r = report(
      [
        { name: "format-count", version: "0.39.0", file: "lib/format-count.ts" },
        { name: "sparkline-metric-tiles", version: "0.40.0", file: "components/sparkline-metric-tiles.tsx" },
      ],
      registry,
      changelog,
    )
    expect(r.items.find((i) => i.name === "format-count")).toMatchObject({ status: "renamed", renamedTo: "format-number", state: "renamed in 0.40: install format-number" })
    expect(r.items.find((i) => i.name === "sparkline-metric-tiles")).toMatchObject({ status: "renamed", renamedTo: "stats-cards", state: "renamed in 0.40: install stats-cards" })
    expect(r.counts).toMatchObject({ unknown: 0, renamed: 2 })
    const text = formatText([{ ...r, repo: "app", source: "." }], summarize([{ ...r, repo: "app" }]))
    expect(text).toContain("2 renamed")
    expect(text).toContain("npx shadcn add @syncrobotic/format-number")
    expect(text).toContain("npx shadcn add @syncrobotic/stats-cards")
    expect(text).not.toContain("not in the registry")
  })

  it("knows only renames the registry agrees with: the old name is gone, the new one is there", () => {
    const names = new Set((JSON.parse(readFileSync("registry.json", "utf8")) as { items: { name: string }[] }).items.map((i) => i.name))
    for (const [from, { to }] of Object.entries(RENAMED)) {
      expect(names.has(from)).toBe(false)
      expect(names.has(to)).toBe(true)
    }
  })

  const dir = mkdtempSync(join(tmpdir(), "adoption-"))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it("scans a directory for headers, skipping dependencies and build output", () => {
    mkdirSync(join(dir, "components/ui"), { recursive: true })
    mkdirSync(join(dir, "node_modules/pkg"), { recursive: true })
    mkdirSync(join(dir, ".next"), { recursive: true })
    writeFileSync(join(dir, "components/ui/tree.tsx"), "// @syncrobotic/tree v0.17.0 · update: …\n")
    writeFileSync(join(dir, "components/ui/mine.tsx"), "export const mine = 1\n")
    writeFileSync(join(dir, "README.md"), "// @syncrobotic/tree v0.1.0\n")
    writeFileSync(join(dir, "node_modules/pkg/tree.tsx"), "// @syncrobotic/tree v0.1.0\n")
    writeFileSync(join(dir, ".next/tree.js"), "// @syncrobotic/tree v0.1.0\n")
    expect(scanDir(dir)).toEqual([{ name: "tree", version: "0.17.0", file: join("components", "ui", "tree.tsx") }])
  })

  it("finds a product's own look-alikes of kit items, by export and by file name", () => {
    expect(findLookalikes("export function PageHeader() {}\nexport function Section() {}\n", "src/common/page-header.tsx")).toEqual([
      { file: "src/common/page-header.tsx", name: "PageHeader", item: "page-header", guide: `${GUIDE}#page-header` },
      { file: "src/common/page-header.tsx", name: "Section", item: "section-header", guide: `${GUIDE}#section-header` },
    ])
    expect(findLookalikes("const Dot = () => null\nexport { Dot as StatusDot }\n", "src/x.tsx").map((l) => l.item)).toEqual(["status-glyph"])
    // Named for one, exporting under another name: the file is still listed.
    expect(findLookalikes("export const Stat = () => null\n", "src/metric-card.tsx")).toMatchObject([{ name: "metric-card", item: "metric-card" }])
    // A kit file, a test and a story are not look-alikes; nor is a name that only contains one.
    expect(findLookalikes("// @syncrobotic/page-header v0.53.0 · update: …\nexport function PageHeader() {}\n", "components/ui/page-header.tsx")).toEqual([])
    expect(findLookalikes("export function PageHeader() {}\n", "src/page-header.test.tsx")).toEqual([])
    expect(findLookalikes("export function PageHeaderSkeleton() {}\nexport const Sections = 1\n", "src/x.tsx")).toEqual([])
  })

  it("points every look-alike at a kit item the registry has", () => {
    const names = new Set((JSON.parse(readFileSync("registry.json", "utf8")) as { items: { name: string }[] }).items.map((i) => i.name))
    for (const l of LOOKALIKES) expect(names.has(l.item), l.item).toBe(true)
  })

  it("scans a directory for look-alikes and lists them under the repo, with the guide", () => {
    mkdirSync(join(dir, "src/common"), { recursive: true })
    writeFileSync(join(dir, "src/common/metric-card.tsx"), "export function MetricCard() {}\n")
    writeFileSync(join(dir, "src/common/status.tsx"), "export const StatusDot = () => null\n")
    writeFileSync(join(dir, "node_modules/pkg/empty-state.tsx"), "export function EmptyState() {}\n")
    const found = scanLookalikes(dir)
    expect(found.map((l) => [l.file, l.name, l.item])).toEqual([
      [join("src", "common", "metric-card.tsx"), "MetricCard", "metric-card"],
      [join("src", "common", "status.tsx"), "StatusDot", "status-glyph"],
    ])
    const r = { ...report([], registry, changelog), repo: "app", source: ".", lookalikes: found }
    const text = formatText([r], summarize([r]))
    expect(text).toContain(`Look-alikes of kit items, to move (${GUIDE}):`)
    expect(text).toMatch(/src.common.status\.tsx\s+StatusDot\s+status-glyph\s+#status-dot/)
    expect(text).toContain("2 look-alikes to move")
  })
})
