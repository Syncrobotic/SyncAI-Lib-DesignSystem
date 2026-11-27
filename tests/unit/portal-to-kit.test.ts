// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { DOT_TO_GLYPH, diff, transform } from "../../scripts/codemods/portal-to-kit.mjs"
import { dotToGlyph } from "@/site/status-mapping"

// The Portal → kit codemod (/docs/migrating-from-local-components): the fixture pair is a page that uses every
// component it moves; the output is what --write leaves, reviewed by hand.
const fixture = (name: string) => readFileSync(`tests/unit/fixtures/portal-to-kit/${name}.tsx.txt`, "utf8")

describe("portal-to-kit codemod", () => {
  const input = fixture("page.input")
  const result = transform(input, "page.tsx")

  it("turns the fixture page into the expected one", () => {
    expect(result.changed).toBe(true)
    expect(result.code).toBe(fixture("page.output"))
  })

  it("is idempotent: a second run changes nothing", () => {
    const again = transform(result.code, "page.tsx")
    expect(again.changed).toBe(false)
  })

  it("lists what it dropped and what is left to do, by line", () => {
    const todo = result.notes.filter((n) => n.kind === "todo").map((n) => `${n.line} ${n.message.split(":")[0]}`)
    expect(todo).toEqual([
      "6 ConfirmDialog",
      "9 PageHeaderAction has no kit equivalent",
      "24 PageHeader",
      "31 StatusGlyph is hidden from screen readers",
      "32 StatusGlyph is hidden from screen readers",
      "36 EmptyState",
    ])
    const dropped = result.notes.filter((n) => n.kind === "dropped").map((n) => n.message.match(/`(\w+)`/)![1])
    expect(dropped).toEqual(["icon", "colorTheme", "icon", "compact", "icon", "tone", "size", "pulse", "eyebrow"])
  })

  it("keeps a name with no kit equivalent imported from the local module, so the file still compiles", () => {
    expect(result.code).toContain('import { type PageHeaderAction } from "@/components/common/page-header";')
  })

  it("maps a status it cannot see to a todo, and leaves the value alone", () => {
    const { code, notes } = transform('import { StatusDot } from "@/components/ui/status-dot"\nexport const A = ({ s }: { s: "online" }) => <StatusDot status={s} />\n', "a.tsx")
    expect(code).toContain("<StatusGlyph status={s} />")
    expect(code).toContain('import { StatusGlyph } from "@/components/status-glyph"')
    expect(notes.some((n) => n.message.startsWith("StatusGlyph: map this status yourself"))).toBe(true)
  })

  it("merges a Section's class expression with cn, importing it", () => {
    const src = 'import { Section } from "@/components/common/section-header"\nexport const A = ({ c }: { c: string }) => (\n  <Section title="T" className={c}>\n    <p />\n  </Section>\n)\n'
    const { code } = transform(src, "a.tsx")
    expect(code).toContain('<section className={cn("flex flex-col gap-3", c)}>\n    <SectionHeader title="T" />')
    expect(code).toContain('import { cn } from "@/lib/utils"')
    expect(code).toContain("</section>")
  })

  it("follows the product's aliases", () => {
    const { code } = transform('import { MetricCard } from "@/components/common/metric-card"\nexport const A = () => <MetricCard label="L" value={1} internalHref="/x" />\n', "a.tsx", {
      ui: "~/ui",
      linkFrom: "next/link",
    })
    expect(code).toContain('from "~/ui/metric-card"')
    expect(code).toContain('import { Link } from "next/link"')
  })

  it("leaves a file without any of the moved components untouched", () => {
    const src = 'import { Button } from "@/components/ui/button"\nexport const A = () => <Button />\n'
    expect(transform(src, "a.tsx")).toEqual({ code: src, notes: [], changed: false })
  })

  it("prints a dry-run diff of the changed lines with context", () => {
    expect(diff("a\nb\nc\nd\ne\nf\ng", "a\nb\nC\nd\ne\nf\ng")).toBe("@@ line 1\n a\n b\n-c\n+C\n d\n e")
  })

  it("maps StatusDot as the Colour foundation's decision record does", () => {
    expect(DOT_TO_GLYPH).toEqual(dotToGlyph)
  })
})
