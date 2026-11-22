import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from "@/registry/syncrobotic/ui/breadcrumb"

// Layout itself is measured in Chromium (the breadcrumb in a stretched row, a flex column with items-start, an inline
// block, an absolutely placed header, a grid cell and the app shell's top bar); here the classes that carry it.
afterEach(cleanup)

const levels = () => [...document.querySelectorAll("li")].map((li) => li.className.split(" "))

describe("Breadcrumb's first level (#307)", () => {
  it("starts from its content and only gives way when the row is short of room, to a third of the row at most", () => {
    render(
      <Breadcrumb>
        <BreadcrumbLink href="#catalog">Data catalog</BreadcrumbLink>
        <BreadcrumbPage>night-run-v3</BreadcrumbPage>
      </Breadcrumb>,
    )
    const [first, last] = levels()
    // A max-width of a third resolved against an ol as wide as its content, and cut the label with room to spare.
    expect(first).not.toContain("max-w-1/3")
    expect(first).not.toContain("shrink-0")
    // Its width only sets the floor (flexbox's automatic minimum: a third of the row or its content, the smaller); its
    // size comes from its content, and it shrinks before the current page.
    expect(first).toEqual(expect.arrayContaining(["w-1/3", "basis-[content]", "min-w-auto", "shrink-100"]))
    expect(first).not.toContain("min-w-0")
    expect(last).toContain("min-w-0")
    expect(last.some((c) => c.startsWith("shrink"))).toBe(false)
  })

  it("leaves a single level alone, and the middle levels give way before the first", () => {
    const { rerender } = render(
      <Breadcrumb>
        <BreadcrumbPage>Sites</BreadcrumbPage>
      </Breadcrumb>,
    )
    expect(levels()[0]).not.toContain("w-1/3")
    rerender(
      <Breadcrumb>
        <BreadcrumbLink href="#sites">Sites</BreadcrumbLink>
        <BreadcrumbLink href="#site">Taipei Neihu distribution warehouse</BreadcrumbLink>
        <BreadcrumbPage>Hall B</BreadcrumbPage>
      </Breadcrumb>,
    )
    expect(levels()[1]).toContain("shrink-1000")
  })
})
