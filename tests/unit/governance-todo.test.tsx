import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { GovernanceTodo, sampleTodos } from "@/registry/syncrobotic/blocks/governance-todo"

afterEach(cleanup)

const list = () => screen.getByRole("list", { name: "To-do" })
const rows = () => within(list()).getAllByRole("listitem")

describe("GovernanceTodo", () => {
  it("by default each row has its action, and a done row leaves the list", async () => {
    render(<GovernanceTodo />)
    expect(within(list()).getAllByRole("button")).toHaveLength(sampleTodos.length)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Review" })))
    // It fades out where it was, then the count drops.
    expect(screen.getByRole("radio", { name: `All ${sampleTodos.length - 1}` })).toBeTruthy()
  })

  it("readOnly: no row actions, every row and its state still there", () => {
    render(<GovernanceTodo readOnly />)
    expect(within(list()).queryAllByRole("button")).toHaveLength(0)
    expect(rows()).toHaveLength(sampleTodos.length)
    expect(screen.getByText("Blocks release")).toBeTruthy()
  })

  it("onDone: the app owns completion; the row stays until todos drops it", async () => {
    const onDone = vi.fn()
    const { rerender } = render(<GovernanceTodo onDone={onDone} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Record consent" })))
    expect(onDone).toHaveBeenCalledWith("t2")
    expect(screen.getByRole("button", { name: "Record consent" })).toBeTruthy()
    expect(screen.getByRole("radio", { name: `All ${sampleTodos.length}` })).toBeTruthy()
    rerender(<GovernanceTodo onDone={onDone} todos={sampleTodos.filter((t) => t.id !== "t2")} />)
    expect(screen.getByRole("radio", { name: `All ${sampleTodos.length - 1}` })).toBeTruthy()
  })
})
