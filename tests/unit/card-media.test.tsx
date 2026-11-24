import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Card, CardHeader, CardMedia, CardTitle } from "@/registry/syncrobotic/ui/card"

afterEach(cleanup)

const media = (root: HTMLElement) => root.querySelector<HTMLElement>("[data-slot=card-media]")!

describe("CardMedia", () => {
  it("is a 16:9 cover by default, edge to edge through the card's padding, clipping to the card's top corners", () => {
    const { container } = render(
      <Card>
        <CardMedia>
          <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" />
        </CardMedia>
        <CardHeader>
          <CardTitle>Forklift aisles v3</CardTitle>
        </CardHeader>
      </Card>,
    )
    const m = media(container)
    expect(m.className).toContain("aspect-video")
    expect(m.className).toContain("-mx-4")
    expect(m.className).toContain("first:-mt-4")
    // The card's own step, not a new radius: concentric by construction.
    expect(m.className).toContain("first:rounded-t-[inherit]")
    expect(m.className).toContain("overflow-hidden")
    expect(m.className).toContain("[&>img]:object-cover")
    expect(m.hasAttribute("data-inset")).toBe(false)
  })
  it("inset: inside the padding at the image radius, with no negative margins", () => {
    const { container } = render(
      <Card>
        <CardMedia inset aspect="square" />
      </Card>,
    )
    const m = media(container)
    expect(m.getAttribute("data-inset")).toBe("true")
    expect(m.className).toContain("rounded-sm")
    expect(m.className).toContain("aspect-square")
    expect(m.className).not.toMatch(/-mx-4|-mt-4|inherit/)
  })
  it("leaves the shape to the content with aspect auto, and passes its props through", () => {
    const { container } = render(<CardMedia aspect="auto" aria-hidden="true" className="extra" />)
    const m = media(container)
    expect(m.className).not.toContain("aspect-")
    expect(m.getAttribute("aria-hidden")).toBe("true")
    expect(m.className).toContain("extra")
  })
})
