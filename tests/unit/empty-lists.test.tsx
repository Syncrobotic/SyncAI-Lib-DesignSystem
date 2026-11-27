import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AppShell, sampleNav, sampleSearch } from "@/registry/syncrobotic/blocks/app-shell"
import { AppShellMobileTabs } from "@/registry/syncrobotic/blocks/app-shell-mobile-tabs"
import { Questionnaire } from "@/registry/syncrobotic/ui/questionnaire"

// Items install as source and take their lists as props, so an empty list is a real input: none may throw on reading
// the first element of an empty list (noUncheckedIndexedAccess finds these).
describe("empty lists", () => {
  afterEach(cleanup)

  it("AppShellMobileTabs renders with no tabs", () => {
    render(<AppShellMobileTabs tabs={[]}>page</AppShellMobileTabs>)
    expect(screen.getByText("page")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("")
  })

  it("ShellSearch with no scopes opens and shows every group", async () => {
    render(
      <AppShell product="Fleet console" nav={sampleNav} title="Overview" search={{ ...sampleSearch, scopes: [] }}>
        page
      </AppShell>,
    )
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    await screen.findByPlaceholderText("Search robots, pages and actions")
    expect(screen.getByText("Patrol dog 2B10")).toBeTruthy()
  })

  it("Questionnaire renders a paged form with no questions, and Next does nothing", () => {
    const onSubmit = vi.fn()
    const { container } = render(<Questionnaire questions={[]} onSubmit={onSubmit} />)
    const form = container.querySelector("form")
    expect(form).toBeTruthy()
    fireEvent.submit(form!)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
