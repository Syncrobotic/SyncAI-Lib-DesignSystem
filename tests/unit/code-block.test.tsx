import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CodeBlock } from "@/registry/syncrobotic/ui/code-block"

function mockClipboard() {
  const writeText = vi.fn(async () => {})
  Object.defineProperty(window, "isSecureContext", { value: true, configurable: true })
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
  return writeText
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("CodeBlock", () => {
  it("copies the code exactly, also when children show it highlighted", async () => {
    const writeText = mockClipboard()
    const code = 'curl https://portal.example.com/api/v1/devices \\\n  -H "Authorization: Bearer $KEY"'
    render(
      <CodeBlock code={code} title="Terminal">
        <pre>
          <code>highlighted</code>
        </pre>
      </CodeBlock>,
    )
    expect(screen.getByText("highlighted")).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy Terminal" })))
    expect(writeText).toHaveBeenCalledWith(code)
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy()
  })

  it("hides a secret until Show is pressed, and copies the real value while hidden", async () => {
    const writeText = mockClipboard()
    const key = "lm_live_4f9c2a7e81d34b06"
    const { container } = render(<CodeBlock code={key} title="API key" secret />)
    expect(container.textContent).not.toContain(key)
    expect(screen.getByText("Hidden")).toBeTruthy()
    const show = screen.getByRole("button", { name: "Show value" })
    expect(show.getAttribute("aria-pressed")).toBe("false")
    // The value is never part of a name.
    expect(screen.getByRole("group").getAttribute("aria-label")).toBe("API key")
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy API key" })))
    expect(writeText).toHaveBeenCalledWith(key)
    fireEvent.click(show)
    expect(show.getAttribute("aria-pressed")).toBe("true")
    expect(container.textContent).toContain(key)
    fireEvent.click(show)
    expect(container.textContent).not.toContain(key)
  })

  it("wrap words keeps each name whole, with a break chance after a slash", () => {
    const { container } = render(<CodeBlock code="npx shadcn add @syncrobotic/number-field" wrap="words" />)
    const tokens = [...container.querySelectorAll("pre .whitespace-nowrap")].map((s) => s.textContent)
    expect(tokens).toEqual(["npx", "shadcn", "add", "@syncrobotic/", "number-field"])
    expect(container.querySelectorAll("pre wbr")).toHaveLength(1)
    // A scheme stays with its host.
    const { container: url } = render(<CodeBlock code="dvc import https://git.example.com/data" wrap="words" />)
    expect([...url.querySelectorAll("pre .whitespace-nowrap")].map((s) => s.textContent)).toContain("https://git.example.com/")
  })

  it("source scrolls in a box that takes focus and is named by the title", () => {
    render(<CodeBlock code={'{ "id": "dev_7Q2M9KX4" }'} title="device.json" />)
    const box = screen.getByRole("group", { name: "device.json" })
    expect(box.tabIndex).toBe(0)
    expect(box.className).toContain("overflow-x-auto")
    box.focus()
    expect(document.activeElement).toBe(box)
  })

  it("without a title the box takes the code label, and line numbers are hidden from screen readers", () => {
    const { container } = render(<CodeBlock code={"a\nb\nc"} lineNumbers labels={{ code: "程式碼" }} />)
    expect(screen.getByRole("group", { name: "程式碼" })).toBeTruthy()
    const gutter = container.querySelector("[data-slot=code-block-gutter]")
    expect(gutter?.getAttribute("aria-hidden")).toBe("true")
    expect(gutter?.textContent).toBe("123")
    expect(screen.getByRole("button", { name: "Copy code" })).toBeTruthy()
  })

  it("a command that fits is not a tab stop", () => {
    render(<CodeBlock code="npx shadcn add @syncrobotic/code-block" title="Install" wrap="words" />)
    expect(screen.getByRole("group", { name: "Install" }).hasAttribute("tabindex")).toBe(false)
  })
})
