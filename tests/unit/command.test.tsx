import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AppShell, sampleNav, sampleSearch } from "@/registry/syncrobotic/blocks/app-shell"

describe("AppShell search", () => {
  afterEach(cleanup)

  it("opens the palette on Ctrl+K and narrows results by typing", async () => {
    render(
      <AppShell product="Fleet console" nav={sampleNav} title="Overview" search={sampleSearch}>
        page
      </AppShell>,
    )
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    const input = await screen.findByPlaceholderText("Search robots, pages and actions")
    expect(screen.getByText("Patrol dog 2B10")).toBeTruthy()
    fireEvent.change(input, { target: { value: "7F3A" } })
    expect(screen.queryByText("Patrol dog 2B10")).toBeNull()
    expect(screen.getByText("Patrol dog 7F3A")).toBeTruthy()
  })
})
