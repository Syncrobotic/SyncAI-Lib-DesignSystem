import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"

afterEach(cleanup)

describe("Meter", () => {
  it("is neutral while normal and names the level when it is not", () => {
    const { rerender } = render(<Meter value={72} low={30} critical={15} label="Battery" />)
    const m = screen.getByRole("meter", { name: "Battery" })
    expect(m.getAttribute("data-tone")).toBe("normal")
    expect(m.getAttribute("aria-valuetext")).toBe("72 %")
    rerender(<Meter value={20} low={30} critical={15} label="Battery" />)
    expect(screen.getByRole("meter").getAttribute("data-tone")).toBe("warning")
    rerender(<Meter value={9} low={30} critical={15} label="Battery" />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("9 %, critical")
  })

  it("reads higher as worse when asked", () => {
    render(<Meter value={96} low={80} critical={95} higherIsWorse label="Storage" />)
    expect(screen.getByRole("meter").getAttribute("data-tone")).toBe("danger")
  })
})

describe("Pagination", () => {
  it("says the range and disables at the ends", () => {
    const go = vi.fn()
    render(<Pagination page={0} pageSize={10} total={48} onPageChange={go} />)
    expect(screen.getByText("1–10 of 48")).toBeTruthy()
    expect((screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Next page" }))
    expect(go).toHaveBeenCalledWith(1)
  })

  it("marks the current page and leaves gaps in a long list", () => {
    render(<Pagination page={5} pageSize={10} total={240} onPageChange={() => {}} pages />)
    expect(screen.getByRole("button", { name: "Page 6" }).getAttribute("aria-current")).toBe("page")
    expect(screen.getAllByText("…").length).toBe(2)
  })
})

describe("Field around a Select", () => {
  it("labels the trigger and describes it with the error", () => {
    render(
      <Field label="Return dock" error="Choose a dock">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Dock A</SelectItem>
          </SelectContent>
        </Select>
      </Field>,
    )
    const trigger = screen.getByRole("combobox", { name: "Return dock" })
    expect(trigger.getAttribute("aria-invalid")).toBe("true")
    expect(document.getElementById(trigger.getAttribute("aria-describedby")!)?.textContent).toContain("Choose a dock")
  })
})

describe("Sortable table head", () => {
  it("announces its order and sorts on press", () => {
    const onSort = vi.fn()
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sort="asc" onSort={onSort}>
              Robot
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>,
    )
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("ascending")
    fireEvent.click(screen.getByRole("button", { name: "Robot" }))
    expect(onSort).toHaveBeenCalled()
  })
})

describe("CountBadge", () => {
  it("caps at max and hides at zero", () => {
    const { container, rerender } = render(<CountBadge count={240} />)
    expect(container.textContent).toBe("99+")
    rerender(<CountBadge count={0} />)
    expect(container.textContent).toBe("")
  })
})
