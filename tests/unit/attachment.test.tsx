import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Attachment } from "@/registry/syncrobotic/ui/attachment"

afterEach(cleanup)

describe("Attachment", () => {
  // A long name is cut in the middle: the extension, which says what the file is, never goes.
  it("keeps the extension out of the part that is cut", () => {
    const name = "taipei-warehouse-floor-plan-revision-12-final.pdf"
    const { container } = render(<Attachment name={name} size={4096} />)
    const holder = container.querySelector(`[title="${name}"]`)!
    const [stem, ext] = [...holder.children] as HTMLElement[]
    expect(stem.className).toContain("truncate")
    expect(stem.textContent).toBe("taipei-warehouse-floor-plan-revision-12-final")
    expect(ext.textContent).toBe(".pdf")
    expect(ext.className).toContain("shrink-0")
  })

  it("cuts a name without an extension at the end, as usual", () => {
    const { container } = render(<Attachment variant="chip" name="README" />)
    expect(container.querySelector('[title="README"]')!.children).toHaveLength(1)
  })
})
