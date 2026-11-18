import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CopyButton, copyText } from "@/registry/syncrobotic/ui/copy-button"

function setSecure(secure: boolean, writeText?: (v: string) => Promise<void>) {
  Object.defineProperty(window, "isSecureContext", { value: secure, configurable: true })
  Object.defineProperty(navigator, "clipboard", { value: writeText ? { writeText } : undefined, configurable: true })
}
function setExec(result: boolean | "throw") {
  Object.defineProperty(document, "execCommand", {
    value: vi.fn(() => {
      if (result === "throw") throw new Error("not allowed")
      return result
    }),
    configurable: true,
  })
}

afterEach(() => vi.restoreAllMocks())

describe("copyText", () => {
  it("uses the Clipboard API in a secure context", async () => {
    const writeText = vi.fn(async () => {})
    setSecure(true, writeText)
    setExec(false)
    expect(await copyText("7F3A")).toBe(true)
    expect(writeText).toHaveBeenCalledWith("7F3A")
    expect(document.execCommand).not.toHaveBeenCalled()
  })

  it("falls back to execCommand over plain HTTP, and leaves no textarea behind", async () => {
    setSecure(false)
    setExec(true)
    expect(await copyText("npx shadcn add @syncrobotic/button")).toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith("copy")
    expect(document.querySelector("textarea")).toBeNull()
  })

  it("falls back when the Clipboard API refuses", async () => {
    setSecure(true, vi.fn(async () => Promise.reject(new Error("denied"))))
    setExec(true)
    expect(await copyText("x")).toBe(true)
  })

  it("reports failure when nothing works", async () => {
    setSecure(false)
    setExec("throw")
    expect(await copyText("x")).toBe(false)
  })
})

describe("CopyButton", () => {
  it("says it could not copy instead of pretending", async () => {
    setSecure(false)
    setExec(false)
    render(<CopyButton value="x">Copy link</CopyButton>)
    await act(async () => fireEvent.click(screen.getByRole("button")))
    expect(screen.getByRole("button").textContent).toContain("Not copied")
    expect(screen.getByText(/Could not copy/)).toBeTruthy()
  })

  it("confirms a copy over plain HTTP", async () => {
    setSecure(false)
    setExec(true)
    render(<CopyButton value="x" label="Copy the key" />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy the key" })))
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy()
  })
})
