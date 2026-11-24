import { readFileSync } from "node:fs"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Code } from "@/registry/syncrobotic/ui/code"

afterEach(cleanup)

describe("Code", () => {
  it("is a <code> in mono on a muted tile, that breaks anywhere and keeps its padding on each line", () => {
    render(
      <p>
        Set <Code>max_items</Code> in the config.
      </p>,
    )
    const code = screen.getByText("max_items")
    expect(code.tagName).toBe("CODE")
    expect(code.getAttribute("data-slot")).toBe("code")
    for (const c of ["rounded-2xs", "bg-muted", "px-1", "font-mono", "wrap-anywhere", "box-decoration-clone"]) expect(code.className).toContain(c)
  })
  it("has no size of its own, so it takes the size of the text around it, and no vertical padding, so the line height stays", () => {
    render(<Code>a</Code>)
    const cls = screen.getByText("a").className
    expect(cls).not.toMatch(/(?:^|\s)text-(?:xs|sm|base|lg|\[)/)
    expect(cls).not.toMatch(/(?:^|\s)(?:p|py|pt|pb|leading)-/)
    expect(readFileSync("registry/syncrobotic/ui/code.tsx", "utf8")).not.toMatch(/\d(?:\.\d+)?em\b/)
  })
  it("has no button: a copy button goes beside it", () => {
    const { container } = render(<Code>group/name@v3</Code>)
    expect(container.querySelector("button")).toBeNull()
  })
  it("passes props through and merges classes", () => {
    render(
      <Code title="A reference" className="text-muted-foreground">
        x
      </Code>,
    )
    const code = screen.getByText("x")
    expect(code.getAttribute("title")).toBe("A reference")
    expect(code.className).toContain("text-muted-foreground")
    expect(code.className).not.toContain("text-foreground ")
  })
})
