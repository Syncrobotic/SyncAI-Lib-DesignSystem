import * as React from "react"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormField, FormFieldSet, FormMessage, FormSubmit } from "@/registry/syncrobotic/ui/form"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField } from "@/registry/syncrobotic/ui/choice-field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"

afterEach(cleanup)

const schema = z.object({
  name: z.string().min(3, "At least 3 characters"),
  robot: z.string().min(1, "Pick a robot"),
  channels: z.array(z.string()).min(1, "Choose at least one"),
})
type V = z.infer<typeof schema>

function Mission({ onSubmit = () => {}, initial }: { onSubmit?: (v: V, form: ReturnType<typeof useForm<V>>) => unknown; initial?: Partial<V> }) {
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { name: "", robot: "", channels: [], ...initial } })
  return (
    <Form form={form} onSubmit={(v) => onSubmit(v, form) as void}>
      <FormMessage />
      <FormField name="name" label="Mission name" hint="Shown in the schedule" render={({ field }) => <Input {...field} />} />
      <FormField
        name="robot"
        label="Robot"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7F3A">7F3A</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <FormFieldSet
        name="channels"
        legend="Alerts"
        render={({ field }) => (
          <ChoiceField
            label="Email"
            control={<Checkbox checked={field.value.includes("email")} onCheckedChange={(on) => field.onChange(on ? ["email"] : [])} />}
          />
        )}
      />
      <FormSubmit>Create mission</FormSubmit>
    </Form>
  )
}

const submit = () => act(async () => fireEvent.click(screen.getByRole("button", { name: "Create mission" })))

describe("Form", () => {
  it("says nothing before the first submit, then puts each error under its field", async () => {
    render(<Mission />)
    const name = screen.getByLabelText("Mission name")
    fireEvent.change(name, { target: { value: "ab" } })
    fireEvent.blur(name)
    expect(name.getAttribute("aria-invalid")).toBeNull()
    await submit()
    await waitFor(() => expect(name.getAttribute("aria-invalid")).toBe("true"))
    // The error replaces the hint, and the control is described by it.
    const note = document.getElementById(name.getAttribute("aria-describedby")!)!
    expect(note.textContent).toBe("At least 3 characters")
    expect(screen.queryByText("Shown in the schedule")).toBeNull()
    expect(screen.getByText("Pick a robot")).toBeTruthy()
    expect(screen.getByText("Choose at least one")).toBeTruthy()
  })

  it("focuses the first field in error, in page order", async () => {
    render(<Mission />)
    await submit()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Mission name")))
  })

  it("reaches a Select's trigger, and a group's first choice, when they are the first in error", async () => {
    const { unmount } = render(<Mission initial={{ name: "Night patrol" }} />)
    await submit()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("combobox", { name: "Robot" })))
    unmount()
    render(<Mission initial={{ name: "Night patrol", robot: "7F3A" }} />)
    await submit()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: "Email" })))
  })

  it("after a submit, clears an error as soon as it is fixed", async () => {
    render(<Mission />)
    await submit()
    const name = screen.getByLabelText("Mission name")
    await waitFor(() => expect(name.getAttribute("aria-invalid")).toBe("true"))
    await act(async () => fireEvent.change(name, { target: { value: "Night patrol" } }))
    await waitFor(() => expect(name.getAttribute("aria-invalid")).toBeNull())
  })

  it("puts a server's refusal on its field, or on the form as an alert", async () => {
    render(
      <Mission
        initial={{ name: "Night patrol", robot: "7F3A", channels: ["email"] }}
        onSubmit={(v, form) => {
          form.setError("name", { message: "Name taken" })
          form.setError("root.server", { message: "The fleet server did not answer" })
        }}
      />,
    )
    await submit()
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("The fleet server did not answer"))
    expect(screen.getByLabelText("Mission name").getAttribute("aria-invalid")).toBe("true")
    expect(screen.getByText("Name taken")).toBeTruthy()
  })

  it("keeps the submit button busy while the save is awaited", async () => {
    let finish = () => {}
    render(<Mission initial={{ name: "Night patrol", robot: "7F3A", channels: ["email"] }} onSubmit={() => new Promise<void>((r) => (finish = r))} />)
    await submit()
    const button = screen.getByRole("button", { name: /Create mission/ })
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("true"))
    await act(async () => finish())
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull())
  })

  it("turns the browser's own validation off", () => {
    const { container } = render(<Mission />)
    expect(container.querySelector("form")!.noValidate).toBe(true)
  })
})
