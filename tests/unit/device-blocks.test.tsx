import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DeviceEnrolmentContent, sampleEnrolmentRequests, type EnrolmentRequest } from "@/registry/syncrobotic/blocks/device-enrolment"
import { DeviceDetailContent, sampleDevice, sampleDeviceLicences, sampleDeviceReport, type DeviceRecord } from "@/registry/syncrobotic/blocks/device-detail"
import { StepUpCancelledError } from "@/registry/syncrobotic/hooks/use-step-up"
import { permissionsFrom } from "@/registry/syncrobotic/ui/permission-gate"
import * as zh from "@/registry/syncrobotic/lib/labels-zh-tw"

afterEach(cleanup)

const now = Date.parse("2026-11-21T14:00:00Z")
const flush = () => act(async () => {})
const apiError = (code: string) => Object.assign(new Error("server words, never shown"), { error: { code } })
const pending = sampleEnrolmentRequests[0]!

const enrolment = (props: Partial<React.ComponentProps<typeof DeviceEnrolmentContent>> = {}) =>
  render(
    <DeviceEnrolmentContent
      requests={{ items: sampleEnrolmentRequests, total: sampleEnrolmentRequests.length }}
      defaultSelectedId={pending.id}
      rejectCooldownMs={7 * 86_400_000}
      now={now}
      onApprove={() => Promise.resolve()}
      onReject={() => Promise.resolve()}
      {...props}
    />,
  )

describe("DeviceEnrolmentContent", () => {
  it("counts and pages from the server's total and counts, never the rows in hand", () => {
    enrolment({
      requests: { items: sampleEnrolmentRequests.slice(0, 2), total: 40 },
      query: { page: 1, limit: 2 },
      onQueryChange: () => {},
      counts: { all: 40, pending: 31 },
    })
    expect(screen.getByText("31 machines are waiting for a decision.")).toBeTruthy()
    expect(screen.getByRole("radio", { name: "To review 31" })).toBeTruthy()
    // A segment the summary does not count shows no number rather than one counted from the page.
    expect(screen.getByRole("radio", { name: "Unclaimed" })).toBeTruthy()
    expect(screen.getByText("1–2 of 40")).toBeTruthy()
  })

  it("forbidden shows neither the queue nor the routes", () => {
    enrolment({ state: "forbidden" })
    expect(screen.getAllByText("You do not have access to this").length).toBeGreaterThan(0)
    expect(screen.queryByRole("list", { name: "Enrolment queue" })).toBeNull()
    expect(screen.queryByRole("button", { name: "How a device gets in" })).toBeNull()
  })

  it("reviews the machine's claims against the record, never as fact", () => {
    enrolment()
    const review = screen.getByRole("region", { name: "Review this registration" })
    expect(within(review).getByRole("region", { name: "Reported by the device" })).toBeTruthy()
    expect(within(review).getByText("1 value does not match the record")).toBeTruthy()
  })

  it("approves with the name a person gave it", async () => {
    const onApprove = vi.fn((_r: EnrolmentRequest, _d: { name?: string }) => Promise.resolve())
    enrolment({ onApprove })
    fireEvent.change(screen.getByRole("textbox", { name: "Name it before approving" }), { target: { value: "  Taipei DC-01 " } })
    fireEvent.click(screen.getByRole("button", { name: "Approve" }))
    await flush()
    expect(onApprove).toHaveBeenCalledWith(pending, { name: "Taipei DC-01" })
    expect(screen.getByText("Taipei DC-01 approved")).toBeTruthy()
  })

  it("rejects only from a second face that says the cooldown", async () => {
    const onReject = vi.fn(() => Promise.resolve())
    enrolment({ onReject })
    fireEvent.click(screen.getByRole("button", { name: "Reject" }))
    expect(onReject).not.toHaveBeenCalled()
    expect(screen.getByRole("heading", { name: "Reject this registration?" })).toBeTruthy()
    expect(screen.getByText(/It cannot ask again for 7 days\./)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Reject" }))
    await flush()
    expect(onReject).toHaveBeenCalledWith(pending)
  })

  it("disables Approve and Reject with the reason for a viewer without devices:write", () => {
    const onApprove = vi.fn(() => Promise.resolve())
    enrolment({ can: permissionsFrom(["devices:read"]), onApprove })
    const approve = screen.getByRole("button", { name: "Approve" })
    expect(approve.getAttribute("aria-disabled")).toBe("true")
    expect(screen.getAllByText(/You need the devices:write permission/).length).toBeGreaterThan(0)
    fireEvent.click(approve)
    expect(onApprove).not.toHaveBeenCalled()
  })

  it("disables Approve with the reason when no seat is left", () => {
    enrolment({ seatsLeft: 0 })
    expect(screen.getByRole("button", { name: "Approve" }).getAttribute("aria-disabled")).toBe("true")
    expect(screen.getAllByText(/Every seat in this project is taken/).length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Reject" }).getAttribute("aria-disabled")).toBeNull()
  })

  it("says nothing when the step-up is cancelled, and words a failure by its code", async () => {
    const onApprove = vi.fn().mockRejectedValueOnce(new StepUpCancelledError()).mockRejectedValueOnce(apiError("SEAT_LIMIT"))
    enrolment({ onApprove, labels: { errors: { SEAT_LIMIT: "No seat left." } } })
    fireEvent.click(screen.getByRole("button", { name: "Approve" }))
    await flush()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.queryByText("That did not work")).toBeNull()
    expect(screen.getByRole("region", { name: "Review this registration" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Approve" }))
    await flush()
    expect(screen.getByText("No seat left.")).toBeTruthy()
    expect(screen.queryByText("server words, never shown")).toBeNull()
  })

  it("has nothing to decide for a place still waiting for its machine", () => {
    enrolment({ defaultSelectedId: "r4" })
    expect(screen.getByRole("heading", { name: "Waiting for its machine" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull()
  })

  it("shows both routes in when the queue is empty", () => {
    enrolment({ requests: { items: [], total: 0 }, slug: "acme-tpe", onRegisterOffline: () => {} })
    expect(screen.getByText("No machine is waiting")).toBeTruthy()
    expect(screen.getByText("acme-tpe")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Register an offline device" })).toBeTruthy()
  })

  it("takes the zh-TW labels", () => {
    enrolment({ labels: zh.deviceEnrolmentLabels, locale: "zh-TW", counts: { pending: 3 } })
    expect(screen.getByText("3 台機器正在等待決定。")).toBeTruthy()
    expect(screen.getByRole("button", { name: "核准" })).toBeTruthy()
  })
})

const thresholds = { laggingAfterMs: 2 * 60_000, staleAfterMs: 10 * 60_000 }
const airGapped: DeviceRecord = { ...sampleDevice, connectivity: "air-gapped", lastSeenAt: null }

const detail = (props: Partial<React.ComponentProps<typeof DeviceDetailContent>> = {}) =>
  render(<DeviceDetailContent device={sampleDevice} report={sampleDeviceReport} thresholds={thresholds} licences={sampleDeviceLicences} now={now} {...props} />)

const openActions = () => fireEvent.keyDown(screen.getByRole("button", { name: "Device actions" }), { key: "Enter" })

describe("DeviceDetailContent", () => {
  it("keeps an air-gapped device quiet: no colour, no check-ins, no report", () => {
    const { container } = detail({ device: airGapped, report: null })
    expect(screen.getAllByText("Does not report").length).toBeGreaterThan(0)
    expect(screen.getByText("Air-gapped: its correct, permanent state")).toBeTruthy()
    expect(screen.getByText(/never checks in\. That is its correct, permanent state/)).toBeTruthy()
    expect(container.querySelector("[data-tone]")).toBeNull()
    // The copy button keeps its failure icon in the DOM, hidden until a copy fails.
    expect(container.querySelector(".text-danger:not(.opacity-0), .text-warning:not(.opacity-0)")).toBeNull()
    expect(container.querySelector("[data-slot=heartbeat-strip]")).toBeNull()
  })

  it("flags a connected device the server calls offline, on the check-in it missed", () => {
    detail({ device: { ...sampleDevice, offline: true } })
    const card = screen.getByText("Last check-in").closest("[data-slot=metric-card]")!
    expect(card.getAttribute("data-tone")).toBe("danger")
    expect(screen.getByText("Not reporting: what it last said may be out of date")).toBeTruthy()
  })

  it("says a value the device did not send is not reported, never 0", () => {
    detail({ report: { ...sampleDeviceReport, version: null } })
    const card = screen.getAllByText("Version running")[0]!.closest("[data-slot=metric-card]")!
    expect(within(card as HTMLElement).getByText("Not reported")).toBeTruthy()
  })

  it("shows a revocation as ordered beside reported: revoking is not revoked", () => {
    detail({ order: { desired: "Revoked: every module off", reported: "Running 4 modules", orderedAt: new Date(now - 4 * 60_000).toISOString() } })
    const card = screen.getByText("Licence").closest("[data-slot=metric-card]")!
    expect(within(card as HTMLElement).getByText("Revoking")).toBeTruthy()
    const order = screen.getByRole("region", { name: "Ordered, not yet in effect" })
    expect(within(order).getByText("Revoked: every module off")).toBeTruthy()
    expect(within(order).getByText("Running 4 modules")).toBeTruthy()
    // The books still say the licence is active: the device has not reported the revocation.
    expect(within(screen.getByRole("table", { name: "Licences" })).getByText("Active")).toBeTruthy()
  })

  it("disables an action that cannot work, with the reason", async () => {
    const onRevoke = vi.fn(() => Promise.resolve())
    detail({ device: airGapped, report: null, onRevoke, onRemove: () => Promise.resolve() })
    openActions()
    const revoke = await screen.findByRole("menuitem", { name: /Stop the features/ })
    expect(revoke.getAttribute("aria-disabled")).toBe("true")
    expect(screen.getAllByText(/a revocation cannot reach it/).length).toBeGreaterThan(0)
    fireEvent.click(revoke)
    expect(onRevoke).not.toHaveBeenCalled()
  })

  it("disables every lifecycle action for a viewer without devices:write", async () => {
    detail({ can: permissionsFrom(["devices:read"]), onRemove: () => Promise.resolve(), onIssueLicence: () => {} })
    expect(screen.getByRole("button", { name: "Issue licence" }).getAttribute("aria-disabled")).toBe("true")
    openActions()
    const remove = await screen.findByRole("menuitem", { name: /Remove from project/ })
    expect(remove.getAttribute("aria-disabled")).toBe("true")
  })

  it("forbidden shows no device data", () => {
    detail({ state: "forbidden" })
    expect(screen.getAllByText("You do not have access to this").length).toBeGreaterThan(0)
    expect(screen.queryByText("Running services")).toBeNull()
  })

  it("forces a removal only with a reason, and a cancelled step-up says nothing", async () => {
    const onForceRemove = vi.fn().mockRejectedValueOnce(new StepUpCancelledError()).mockResolvedValueOnce(undefined)
    detail({ device: { ...sampleDevice, lifecycle: "removing" }, onForceRemove })
    openActions()
    fireEvent.click(await screen.findByRole("menuitem", { name: /Force removal/ }))
    const dialog = await screen.findByRole("alertdialog")
    const confirm = within(dialog).getByRole("button", { name: "Force removal" }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Reason" }), { target: { value: "Machine scrapped on site" } })
    expect(confirm.disabled).toBe(false)
    fireEvent.click(confirm)
    await flush()
    expect(onForceRemove).toHaveBeenCalledWith(expect.objectContaining({ id: sampleDevice.id }), "Machine scrapped on site")
    expect(screen.getByRole("alertdialog")).toBeTruthy()
    expect(within(screen.getByRole("alertdialog")).queryByRole("alert")).toBeNull()
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Force removal" }))
    await flush()
    expect(onForceRemove).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole("alertdialog")).toBeNull()
  })

  it("takes the zh-TW labels", () => {
    detail({ labels: zh.deviceDetailLabels, locale: "zh-TW", device: airGapped, report: null })
    expect(screen.getAllByText("不回報").length).toBeGreaterThan(0)
  })
})
