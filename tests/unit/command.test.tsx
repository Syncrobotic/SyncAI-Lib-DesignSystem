import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AppShell, sampleNav, sampleSearch } from "@/registry/syncrobotic/blocks/app-shell"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/registry/syncrobotic/ui/command"

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

describe("Command", () => {
  afterEach(cleanup)

  const palette = () =>
    render(
      <Command>
        <CommandInput placeholder="Find" />
        <CommandList>
          <CommandEmpty>{(query) => `No robot matches “${query}”.`}</CommandEmpty>
          <CommandGroup heading="Robots">
            <CommandItem value="Patrol dog 7F3A">Patrol dog 7F3A</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Pages">
            <CommandItem value="Overview">Overview</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    )

  it("says the words that were typed when nothing matches", () => {
    palette()
    fireEvent.change(screen.getByPlaceholderText("Find"), { target: { value: "gate x" } })
    expect(screen.getByRole("option", { name: "No robot matches “gate x”." })).toBeTruthy()
  })

  it("hides the separator while a query filters the list, so no line is left under nothing", () => {
    palette()
    expect(document.querySelector("[data-slot=command-separator]")).not.toBeNull()
    fireEvent.change(screen.getByPlaceholderText("Find"), { target: { value: "7F3A" } })
    expect(screen.getByText("Patrol dog 7F3A")).toBeTruthy()
    expect(document.querySelector("[data-slot=command-separator]")).toBeNull()
  })
})

describe("CommandDialog key hints", () => {
  afterEach(cleanup)

  it("shows the keys it answers to, hidden from screen readers and from touch, in its labels' words", () => {
    render(
      <CommandDialog open labels={{ move: "移動", open: "開啟", close: "關閉" }}>
        <CommandInput />
      </CommandDialog>,
    )
    const hints = document.querySelector<HTMLElement>("[data-slot=command-hints]")!
    expect(hints.getAttribute("aria-hidden")).toBe("true")
    expect(hints.className).toMatch(/\bpointer-coarse:hidden\b/)
    expect(hints.textContent).toBe("↑↓移動↵開啟Esc關閉")
    expect(hints.querySelectorAll("[data-slot=kbd]")).toHaveLength(4)
  })

  it("leaves them out with hints={false}", () => {
    render(
      <CommandDialog open hints={false}>
        <CommandInput />
      </CommandDialog>,
    )
    expect(document.querySelector("[data-slot=command-hints]")).toBeNull()
  })
})
