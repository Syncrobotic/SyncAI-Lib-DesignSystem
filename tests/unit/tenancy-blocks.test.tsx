import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ProjectMembersContent, type ProjectMember, type ProjectRole } from "@/registry/syncrobotic/blocks/project-members"
import { PermissionMatrixContent, samplePermissionAxes } from "@/registry/syncrobotic/blocks/permission-matrix"
import { WebhookDeliveriesContent, sampleDeliveries } from "@/registry/syncrobotic/blocks/webhook-deliveries"
import { OfflineLicenceContent, sampleLicenceModules, sampleOfflineLicences } from "@/registry/syncrobotic/blocks/offline-licence"
import { TenantAdminContent, sampleDeletedProjects, sampleTenantProjects } from "@/registry/syncrobotic/blocks/tenant-admin"
import { StepUpCancelledError } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatAbsolute } from "@/registry/syncrobotic/lib/relative-time"
import { permissionsFrom } from "@/registry/syncrobotic/ui/permission-gate"

afterEach(cleanup)

const flush = () => act(async () => {})
const pick = (combobox: HTMLElement, option: string) => {
  fireEvent.keyDown(combobox, { key: "Enter" })
  fireEvent.click(screen.getByRole("option", { name: option }))
}

const roles: ProjectRole[] = [
  { id: "owner", name: "Owner", permissions: ["project:transfer-ownership", "members:write", "billing:write"] },
  { id: "admin", name: "Admin", permissions: ["members:write", "devices:write"] },
  { id: "viewer", name: "Viewer", permissions: ["project:read"] },
]
const members: ProjectMember[] = [
  { id: "u1", name: "Mei Lin", email: "mei@example.com", roleId: "owner" },
  { id: "u2", name: "Kai Chen", email: "kai@example.com", roleId: "admin" },
  { id: "u3", name: "Tom Okafor", email: "tom@example.com", roleId: "viewer" },
  { id: "u4", name: "", email: "new@example.com", roleId: "viewer", invited: true },
]
const team = (props: Partial<React.ComponentProps<typeof ProjectMembersContent>> = {}) =>
  render(
    <ProjectMembersContent
      members={{ items: members, total: members.length }}
      roles={roles}
      ownerRoleId="owner"
      currentUserId="u1"
      onRoleChange={() => Promise.resolve()}
      onTransfer={() => Promise.resolve()}
      {...props}
    />,
  )

describe("ProjectMembersContent", () => {
  it("counts from the server's total", () => {
    team({ members: { items: members.slice(0, 2), total: 57 }, query: { page: 1, limit: 2 }, onQueryChange: () => {} })
    expect(screen.getByText("57 members in this project.")).toBeTruthy()
  })

  it("never offers the owner's role in a picker, and the owner's row is locked with the reason", () => {
    team()
    expect(screen.queryByRole("combobox", { name: "Role of Mei Lin" })).toBeNull()
    expect(screen.getByText("Changes only by a transfer of ownership.")).toBeTruthy()
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Role of Kai Chen" }), { key: "Enter" })
    expect(screen.queryByRole("option", { name: "Owner" })).toBeNull()
  })

  it("bounds role assignment by the viewer's own permissions", () => {
    team({ currentUserId: "u2", can: permissionsFrom(["members:write", "project:read"]) })
    // Kai lacks devices:write, so cannot give Admin, nor change Kai's own row.
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Role of Tom Okafor" }), { key: "Enter" })
    expect(screen.getByRole("option", { name: "Admin" }).getAttribute("aria-disabled")).toBe("true")
    expect(screen.getByRole("option", { name: "Viewer" }).getAttribute("aria-disabled")).toBeNull()
    // Only the owner hands ownership over.
    expect(screen.queryByRole("button", { name: "Transfer ownership" })).toBeNull()
  })

  it("transfers only to a joined member, with the role the old owner keeps", async () => {
    const onTransfer = vi.fn(() => Promise.resolve())
    team({ onTransfer })
    fireEvent.click(screen.getByRole("button", { name: "Transfer ownership" }))
    const dialog = screen.getByRole("dialog")
    fireEvent.keyDown(within(dialog).getByRole("combobox", { name: "New owner" }), { key: "Enter" })
    expect(screen.queryByRole("option", { name: "new@example.com" })).toBeNull()
    expect(screen.queryByRole("option", { name: "Mei Lin" })).toBeNull()
    fireEvent.click(screen.getByRole("option", { name: "Tom Okafor" }))
    pick(within(dialog).getByRole("combobox", { name: "Your role afterwards" }), "Viewer")
    expect(within(dialog).getByText("Tom Okafor becomes the owner when they accept, and you become Viewer.")).toBeTruthy()
    fireEvent.click(within(dialog).getByRole("button", { name: "Transfer ownership" }))
    await flush()
    expect(onTransfer).toHaveBeenCalledWith({ to: members[2], formerOwnerRoleId: "viewer" })
  })

  it("a cancelled step-up leaves the dialog as it was and says nothing", async () => {
    team({ onTransfer: () => Promise.reject(new StepUpCancelledError()) })
    fireEvent.click(screen.getByRole("button", { name: "Transfer ownership" }))
    const dialog = screen.getByRole("dialog")
    pick(within(dialog).getByRole("combobox", { name: "New owner" }), "Kai Chen")
    fireEvent.click(within(dialog).getByRole("button", { name: "Transfer ownership" }))
    await flush()
    expect(screen.getByRole("dialog")).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("disables Transfer with the reason when nobody else has joined", () => {
    team({ members: { items: [members[0]!, members[3]!], total: 2 } })
    expect(screen.getByRole("button", { name: "Transfer ownership" }).getAttribute("aria-disabled")).toBe("true")
    expect(screen.getByText(/Ownership goes only to a member/)).toBeTruthy()
  })

  it("a pending transfer says who must accept, and the owner can cancel it", async () => {
    const onCancelTransfer = vi.fn(() => Promise.resolve())
    team({ pendingTransfer: { toMemberId: "u2" }, onCancelTransfer })
    expect(screen.getByText("Waiting for Kai Chen to accept ownership")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Transfer ownership" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Cancel transfer" }))
    await flush()
    expect(onCancelTransfer).toHaveBeenCalled()
  })
})

describe("PermissionMatrixContent", () => {
  it("draws one table per axis, rows grouped by resource, granted in words", () => {
    render(<PermissionMatrixContent axes={samplePermissionAxes} />)
    const tables = screen.getAllByRole("table")
    expect(tables).toHaveLength(2)
    const project = screen.getByRole("table", { name: "Project roles" })
    expect(within(project).getByRole("columnheader", { name: "devices" })).toBeTruthy()
    const row = within(project).getByRole("row", { name: /project:delete/ })
    expect(within(row).getAllByText("Granted")).toHaveLength(1)
    expect(within(row).getAllByText("Not granted")).toHaveLength(3)
  })
})

describe("WebhookDeliveriesContent", () => {
  const base = (props: Partial<React.ComponentProps<typeof WebhookDeliveriesContent>> = {}) =>
    render(
      <WebhookDeliveriesContent
        deliveries={{ items: sampleDeliveries, total: 240 }}
        counts={{ all: 240, failed: 12 }}
        query={{ page: 3, limit: 5 }}
        onQueryChange={() => {}}
        filters={{}}
        onFiltersChange={() => {}}
        events={[{ value: "device.offline" }]}
        endpoints={[{ id: "e1", url: "https://ops.example.com/hooks" }]}
        timeZone="Asia/Taipei"
        {...props}
      />,
    )

  it("counts and pages from the server, and a new filter goes back to page 1", () => {
    const onQueryChange = vi.fn()
    const onFiltersChange = vi.fn()
    base({ onQueryChange, onFiltersChange })
    expect(screen.getByText("240 deliveries")).toBeTruthy()
    expect(screen.getByRole("radio", { name: "Failed 12" })).toBeTruthy()
    expect(screen.getByRole("radio", { name: "Retrying" })).toBeTruthy()
    fireEvent.click(screen.getByRole("radio", { name: "Failed 12" }))
    expect(onFiltersChange).toHaveBeenCalledWith({ status: "failed" })
    expect(onQueryChange).toHaveBeenCalledWith({ page: 1, limit: 5 })
  })

  it("colours only a failure; retrying is the blue of a wait", () => {
    base()
    const statuses = screen.getAllByText((_, el) => el?.getAttribute("data-slot") === "inline-status")
    const failed = statuses.find((s) => s.textContent?.startsWith("Failed"))!
    const ok = statuses.find((s) => s.textContent?.startsWith("Delivered"))!
    expect(failed.className).toMatch(/text-danger/)
    expect(ok.className).not.toMatch(/text-(danger|warning|success)/)
  })

  it("opens a delivery's request and response, and a cancelled step-up on send again says nothing", async () => {
    const d = sampleDeliveries[0]!
    const onRedeliver = vi.fn(() => Promise.reject(new StepUpCancelledError()))
    base({
      selectedId: d.id,
      detail: { ...d, request: { body: '{"type":"device.offline"}' }, response: { body: "Service Unavailable" } },
      onRedeliver,
    })
    const sheet = screen.getByRole("dialog")
    expect(sheet.textContent).toContain('{"type":"device.offline"}')
    expect(sheet.textContent).toContain("Service Unavailable")
    fireEvent.click(within(sheet).getByRole("button", { name: "Send again" }))
    await flush()
    expect(onRedeliver).toHaveBeenCalledWith(d)
    expect(screen.queryByRole("alert")).toBeNull()
  })
})

describe("OfflineLicenceContent", () => {
  const device = { id: "d4", name: "Hsinchu lab 4", connectivity: "air-gapped" as const }
  const base = (props: Partial<React.ComponentProps<typeof OfflineLicenceContent>> = {}) =>
    render(<OfflineLicenceContent device={device} modules={sampleLicenceModules} licences={sampleOfflineLicences} now={Date.parse("2026-11-27T06:00:00Z")} {...props} />)

  it("bounds the modules by the project's entitlement, with the reason", () => {
    base({ entitled: ["vision", "search"], onIssue: () => Promise.resolve({ blob: "x", fileName: "x.lic" }) })
    fireEvent.click(screen.getByRole("button", { name: "Issue licence" }))
    expect(screen.getByRole("radio", { name: /All, including future ones/ }).hasAttribute("disabled")).toBe(true)
    expect(screen.getByRole("checkbox", { name: /Agents/ }).hasAttribute("disabled")).toBe(true)
    expect(screen.getAllByText("This project is not licensed for it.").length).toBeGreaterThan(0)
  })

  it("hands the signed file over saying downloading is not applying, and drops it on Done", async () => {
    const onIssue = vi.fn(() => Promise.resolve({ blob: "LMLIC1.signed", fileName: "lab-4.lic" }))
    base({ onIssue, renderQr: (b) => <span>QR for {b}</span> })
    fireEvent.click(screen.getByRole("button", { name: "Issue licence" }))
    fireEvent.click(screen.getByRole("button", { name: "Sign licence" }))
    await flush()
    expect(onIssue).toHaveBeenCalledWith({ modules: null, expiresAt: "2027-11-27T06:00:00.000Z" })
    expect(screen.getByText("Downloading is not applying")).toBeTruthy()
    expect(screen.getByText("LMLIC1.signed")).toBeTruthy()
    fireEvent.click(screen.getByRole("radio", { name: "QR code" }))
    expect(screen.getByText("QR for LMLIC1.signed")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    expect(screen.queryByText("QR for LMLIC1.signed")).toBeNull()
  })

  it("a cancelled step-up signs nothing and says nothing", async () => {
    base({ onIssue: () => Promise.reject(new StepUpCancelledError()) })
    fireEvent.click(screen.getByRole("button", { name: "Issue licence" }))
    fireEvent.click(screen.getByRole("button", { name: "Sign licence" }))
    await flush()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.getByRole("button", { name: "Sign licence" })).toBeTruthy()
  })

  it("an order stays pending, never in effect, until the device has it", () => {
    base({ order: { desired: "Licence lic_3", reported: "Running its previous licence", orderedAt: Date.parse("2026-11-27T05:00:00Z") } })
    expect(screen.getByText("Ordered, not yet in effect")).toBeTruthy()
  })
})

describe("TenantAdminContent", () => {
  const base = (props: Partial<React.ComponentProps<typeof TenantAdminContent>> = {}) =>
    render(
      <TenantAdminContent
        projects={{ items: sampleTenantProjects, total: 312 }}
        query={{ page: 1, limit: 4 }}
        onQueryChange={() => {}}
        modules={sampleLicenceModules}
        now={Date.parse("2026-11-27T06:00:00Z")}
        timeZone="Asia/Taipei"
        {...props}
      />,
    )

  it("counts from the server's total and tells unlimited from 0", () => {
    base()
    expect(screen.getByText("312 projects on the platform.")).toBeTruthy()
    expect(screen.getByText("3, unlimited seats")).toBeTruthy()
    expect(screen.getByText("0 of 0 seats")).toBeTruthy()
    expect(screen.getByText("Over by 2")).toBeTruthy()
    expect(screen.getAllByText("All, including future ones").length).toBeGreaterThan(0)
  })

  it("shows restorableUntil as the server gave it, and disables Restore once it has passed", () => {
    const gone = { ...sampleDeletedProjects[0]!, id: "p10", name: "Closed one", restorableUntil: "2026-11-20T00:00:00Z" }
    base({ deleted: [sampleDeletedProjects[0]!, gone], onRestore: () => Promise.resolve() })
    const until = formatAbsolute(sampleDeletedProjects[0]!.restorableUntil, { timeZone: "Asia/Taipei", precision: "date" })
    expect(screen.getByText(`Restorable until ${until}`)).toBeTruthy()
    expect(screen.getByRole("button", { name: "Restore Old pilot" }).getAttribute("aria-disabled")).toBeNull()
    expect(screen.getByRole("button", { name: "Restore Closed one" }).getAttribute("aria-disabled")).toBe("true")
  })

  it("saves Unlimited as null, not 0", async () => {
    const onSaveSeats = vi.fn(() => Promise.resolve())
    base({ onSaveSeats })
    fireEvent.keyDown(screen.getByRole("button", { name: "More actions for Taipei DC" }), { key: "Enter" })
    fireEvent.click(screen.getByRole("menuitem", { name: "Change device seats…" }))
    fireEvent.click(screen.getByRole("switch", { name: /Unlimited/ }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await flush()
    expect(onSaveSeats).toHaveBeenCalledWith(sampleTenantProjects[0], null)
  })
})
