import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button } from "@/registry/syncrobotic/ui/button"
import { isAllowed, PermissionGate, permissionsFrom } from "@/registry/syncrobotic/ui/permission-gate"

afterEach(cleanup)

const can = permissionsFrom(["devices:read", "devices:create"])

describe("isAllowed", () => {
  it("checks permission strings, all by default or any, and denies when nothing decides", () => {
    expect(isAllowed({ can, permission: "devices:create" })).toBe(true)
    expect(isAllowed({ can, permission: ["devices:read", "devices:delete"] })).toBe(false)
    expect(isAllowed({ can, permission: ["devices:read", "devices:delete"], match: "any" })).toBe(true)
    expect(isAllowed({ can, permission: [] })).toBe(false)
    expect(isAllowed({})).toBe(false)
    expect(isAllowed({ allowed: true, can, permission: "devices:delete" })).toBe(true)
  })
})

describe("PermissionGate", () => {
  it("renders the child as it is when allowed", () => {
    const onClick = vi.fn()
    render(
      <PermissionGate can={can} permission="devices:create" mode="disabled" reason="Nope">
        <Button onClick={onClick}>Add device</Button>
      </PermissionGate>,
    )
    const button = screen.getByRole("button", { name: "Add device" })
    expect(button.getAttribute("aria-disabled")).toBeNull()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("hidden: renders nothing, or the fallback", () => {
    const { rerender } = render(
      <PermissionGate can={can} permission="devices:delete">
        <Button>Remove device</Button>
      </PermissionGate>,
    )
    expect(screen.queryByRole("button")).toBeNull()
    rerender(
      <PermissionGate can={can} permission="devices:delete" fallback={<span>Ask an admin</span>}>
        <Button>Remove device</Button>
      </PermissionGate>,
    )
    expect(screen.getByText("Ask an admin")).toBeTruthy()
  })

  it("disabled: stays focusable, refuses the click, and is described by its reason", () => {
    vi.useFakeTimers()
    const onClick = vi.fn()
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <PermissionGate can={can} permission="devices:delete" mode="disabled" reason="Only a project admin can remove devices.">
          <Button type="submit" onClick={onClick}>
            Remove device
          </Button>
        </PermissionGate>
      </form>,
    )
    const button = screen.getByRole("button", { name: "Remove device" })
    expect(button.getAttribute("aria-disabled")).toBe("true")
    expect(button.hasAttribute("disabled")).toBe(false)
    expect(button.tabIndex).toBe(0)
    const reasonId = button.getAttribute("aria-describedby")!
    expect(document.getElementById(reasonId)!.textContent).toBe("Only a project admin can remove devices.")
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
    // A tap shows the reason, as touch has no hover.
    act(() => void vi.runAllTimers())
    expect(screen.getAllByText("Only a project admin can remove devices.").length).toBeGreaterThan(1)
    vi.useRealTimers()
  })

  it("read-only: a plain child goes in a disabled fieldset; a function child renders values itself", () => {
    const { rerender } = render(
      <PermissionGate allowed={false} mode="read-only" reason="A project admin can change them.">
        <input aria-label="Name" defaultValue="Hsinchu plant" />
      </PermissionGate>,
    )
    expect(screen.getByText(/View only: you can see this but not change it\. A project admin can change them\./)).toBeTruthy()
    expect((screen.getByRole("textbox", { name: "Name" }).closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true)
    rerender(<PermissionGate allowed={false} mode="read-only">{({ readOnly }) => (readOnly ? <p>Hsinchu plant</p> : <input aria-label="Name" />)}</PermissionGate>)
    expect(screen.getByText("Hsinchu plant")).toBeTruthy()
    expect(screen.queryByRole("textbox")).toBeNull()
    expect(document.querySelector("fieldset")).toBeNull()
  })

  it("forbidden: replaces the region with what is missing", () => {
    render(
      <PermissionGate can={can} permission="auditLogs:read" mode="forbidden" reason="Needs auditLogs:read.">
        <p>Audit log</p>
      </PermissionGate>,
    )
    expect(screen.queryByText("Audit log")).toBeNull()
    expect(screen.getByText("You do not have access to this")).toBeTruthy()
    expect(screen.getByText("Needs auditLogs:read.")).toBeTruthy()
  })
})
