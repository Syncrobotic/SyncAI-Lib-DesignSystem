import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MissionForm, type MissionValues } from "@/registry/syncrobotic/examples/form"

afterEach(cleanup)

const filled: MissionValues = { name: "Night patrol", robot: "7F3A", repeat: "daily", notes: "" }
const submit = () => act(async () => fireEvent.click(screen.getByRole("button", { name: /Create mission/ })))

// The installable example: React Hook Form's Controller around the kit's Field, no form wrapper.
describe("form example (MissionForm)", () => {
  it("says nothing before the first submit, then puts each error under its field", async () => {
    render(<MissionForm />)
    const name = screen.getByLabelText("Mission name")
    fireEvent.change(name, { target: { value: "ab" } })
    fireEvent.blur(name)
    expect(name.getAttribute("aria-invalid")).toBeNull()
    await submit()
    await waitFor(() => expect(name.getAttribute("aria-invalid")).toBe("true"))
    // The error replaces the hint, and the control is described by it.
    expect(document.getElementById(name.getAttribute("aria-describedby")!)!.textContent).toContain("At least 3 characters")
    expect(screen.queryByText("Shown in the schedule and on the island.")).toBeNull()
    expect(screen.getByText("Pick the robot that runs it")).toBeTruthy()
  })

  it("focuses the first field in error, a Select's trigger included (field.ref on the trigger)", async () => {
    const { unmount } = render(<MissionForm />)
    await submit()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Mission name")))
    unmount()
    render(<MissionForm defaultValues={{ ...filled, robot: "" }} />)
    await submit()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("combobox", { name: "Robot" })))
  })

  it("clears an error as soon as it is fixed", async () => {
    render(<MissionForm />)
    await submit()
    const name = screen.getByLabelText("Mission name")
    await waitFor(() => expect(name.getAttribute("aria-invalid")).toBe("true"))
    await act(async () => fireEvent.change(name, { target: { value: "Night patrol" } }))
    await waitFor(() => expect(name.getAttribute("aria-invalid")).toBeNull())
  })

  it("shows a refused save above the fields as an alert, and keeps the values", async () => {
    render(
      <MissionForm
        defaultValues={filled}
        onSave={async () => {
          throw new Error("The fleet server did not answer")
        }}
      />,
    )
    await submit()
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("The fleet server did not answer"))
    expect((screen.getByLabelText("Mission name") as HTMLInputElement).value).toBe("Night patrol")
  })

  it("keeps the submit button busy while the save is awaited", async () => {
    let finish = () => {}
    render(<MissionForm defaultValues={filled} onSave={() => new Promise<void>((r) => (finish = r))} />)
    await submit()
    const button = screen.getByRole("button", { name: /Create mission/ })
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("true"))
    await act(async () => finish())
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull())
  })

  // The next three go through zodResolver from @hookform/resolvers: they pin down that the schema's own messages, its
  // trim and its output reach the form unchanged, whichever major of the resolver is installed.
  it("shows each schema message under its field, the length limit on notes included", async () => {
    render(<MissionForm defaultValues={{ ...filled, notes: "x".repeat(201) }} />)
    await submit()
    const notes = screen.getByLabelText("Notes")
    await waitFor(() => expect(notes.getAttribute("aria-invalid")).toBe("true"))
    expect(document.getElementById(notes.getAttribute("aria-describedby")!)!.textContent).toContain("200 characters at most")
    // Only the field in error is marked; the valid ones say nothing.
    expect(screen.getByLabelText("Mission name").getAttribute("aria-invalid")).toBeNull()
  })

  it("trims the name before checking its length, so spaces alone do not pass", async () => {
    const saved: MissionValues[] = []
    render(<MissionForm defaultValues={{ ...filled, name: "     " }} onSave={async (v) => void saved.push(v)} />)
    await submit()
    await waitFor(() => expect(screen.getByLabelText("Mission name").getAttribute("aria-invalid")).toBe("true"))
    expect(saved).toEqual([])
  })

  it("saves the schema's output: the name trimmed, the other values as entered", async () => {
    const saved: MissionValues[] = []
    render(<MissionForm defaultValues={{ ...filled, name: "  Night patrol  " }} onSave={async (v) => void saved.push(v)} />)
    await submit()
    await waitFor(() => expect(saved).toHaveLength(1))
    expect(saved[0]).toEqual({ ...filled, name: "Night patrol" })
  })

  it("turns the browser's own validation off", () => {
    const { container } = render(<MissionForm />)
    expect(container.querySelector("form")!.noValidate).toBe(true)
  })
})
