import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { thumbnailLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Thumbnail } from "@/registry/syncrobotic/ui/thumbnail"

afterEach(cleanup)

const src = "data:image/gif;base64,R0lGODlhAQABAAAAACw="

describe("Thumbnail", () => {
  it("is a lazy picture, object-cover, rounded-xs, in a size from the control scale", () => {
    const { rerender } = render(<Thumbnail src={src} alt="Forklift in aisle 3" />)
    const img = screen.getByRole("img", { name: "Forklift in aisle 3" })
    expect(img.getAttribute("loading")).toBe("lazy")
    expect(img.className).toContain("object-cover")
    const box = img.parentElement!
    expect(box.getAttribute("data-slot")).toBe("thumbnail")
    expect(box.className).toContain("rounded-xs")
    expect(box.className).toContain("size-(--h-sm)")
    rerender(<Thumbnail src={src} alt="x" size="md" />)
    expect(screen.getByRole("img").parentElement!.className).toContain("size-(--h-md)")
    rerender(<Thumbnail src={src} alt="x" size="lg" />)
    expect(screen.getByRole("img").parentElement!.className).toContain("size-(--h-lg)")
  })

  it("shows the neutral fallback in the same box when the picture fails, and tries a new src again", () => {
    const { rerender, container } = render(<Thumbnail src={src} alt="Night patrol, frame 12" />)
    fireEvent.error(screen.getByRole("img"))
    const fallback = screen.getByRole("img", { name: "Could not load: Night patrol, frame 12" })
    expect(fallback.tagName).toBe("SPAN")
    expect(fallback.className).toContain("bg-muted")
    expect(fallback.className).toContain("size-(--h-sm)")
    expect(fallback.querySelector("svg")?.getAttribute("class")).toContain("lucide-image-off")
    rerender(<Thumbnail src={`${src}#2`} alt="Night patrol, frame 12" />)
    expect(container.querySelector("img")).not.toBeNull()
  })

  it("a decorative picture that fails stays hidden from screen readers", () => {
    const { container } = render(<Thumbnail alt="" />)
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true")
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("restricted: RestrictedPreview's neutral placeholder, named by the reason, fetching nothing and never a Tab stop", () => {
    const { container } = render(<Thumbnail restricted reason="Restricted · faces" src={src} alt="People in Hall B" />)
    expect(container.querySelector("img")).toBeNull()
    const ph = screen.getByRole("img", { name: "Restricted · faces" })
    expect(ph.hasAttribute("data-restricted")).toBe(true)
    for (const c of ["bg-muted", "border-dashed", "text-muted-foreground"]) expect(ph.className).toContain(c)
    expect(ph.className).not.toMatch(/warning|danger/)
    expect(ph.querySelector("svg")?.getAttribute("class")).toContain("lucide-eye-off")
    expect(ph.tabIndex).toBe(-1)
    expect(container.querySelector("button, a, [tabindex='0']")).toBeNull()
  })

  it("restricted without a reason takes its name from labels", () => {
    render(<Thumbnail restricted labels={thumbnailLabels} />)
    expect(screen.getByRole("img", { name: thumbnailLabels.restricted })).toBeTruthy()
  })
})
