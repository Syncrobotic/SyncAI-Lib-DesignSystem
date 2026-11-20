import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { RecordForm } from "@/registry/syncrobotic/blocks/record-form"
import { DialogForm } from "@/registry/syncrobotic/blocks/dialog-form"

afterEach(cleanup)

// The two form blocks validate like the `form` example, without a form library.
describe.each([
  ["record-form", () => render(<RecordForm />), "Mission name", /Create mission/],
  ["dialog-form", () => render(<DialogForm defaultOpen />), "Name", /Create mission|Create/],
])("%s", (_, mount, label, submitName) => {
  it("says nothing before the first submit, focuses the first error after it, and clears it once fixed", async () => {
    mount()
    const name = screen.getByLabelText(label)
    fireEvent.change(name, { target: { value: "ab" } })
    expect(name.getAttribute("aria-invalid")).toBeNull()
    fireEvent.change(name, { target: { value: "" } })
    await act(async () => fireEvent.click(screen.getByRole("button", { name: submitName })))
    await waitFor(() => expect(name.getAttribute("aria-invalid")).toBe("true"))
    await waitFor(() => expect(document.activeElement).toBe(name))
    await act(async () => fireEvent.change(name, { target: { value: "Night perimeter" } }))
    expect(name.getAttribute("aria-invalid")).toBeNull()
  })
})
