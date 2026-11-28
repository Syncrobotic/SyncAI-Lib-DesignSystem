import { describe, expect, it } from "vitest"
import { allAreaNav, areaNav, pageSections, scopes } from "@/site/scopes"

// Every docs page carries its area's sidebar in its HTML (the React payload). All areas with every page's sections was
// 72 KB of each page; an area's pages alone are a few KB, and a page's sections come with that page only.
const kb = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length / 1024

/** Budgets in KB, a little above today's sizes: a regrowth fails here before it shows in lint:html-size. */
const budget: Record<string, number> = { docs: 3, components: 18, blocks: 4, icons: 1 }

describe("sidebar payload", () => {
  it("sends an area's pages without their sections", () => {
    for (const a of allAreaNav()) for (const g of a.groups) for (const l of g.links) expect(l, `${a.key}: ${l.href}`).not.toHaveProperty("sections")
  })

  it("keeps each area's pages within its budget", () => {
    for (const s of scopes) expect(kb(areaNav(s.key)), s.key).toBeLessThanOrEqual(budget[s.key] ?? 3)
  })

  it("sends a page only its own sections", () => {
    const own = pageSections("/docs/components/chart")
    expect(own?.href).toBe("/docs/components/chart")
    expect(own?.sections.length).toBeGreaterThan(1)
    expect(own?.sections.every((s) => s.href.startsWith("#"))).toBe(true)
    expect(kb(own)).toBeLessThan(4)
    expect(pageSections("/icons")?.sections.some((s) => s.href.startsWith("/icons?category="))).toBe(true)
    expect(pageSections("/docs/installation")).toBeNull()
  })
})
