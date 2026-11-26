import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  NotificationCenter,
  NotificationPanel,
  groupByDay,
  sampleNotifications,
  sampleNow,
  unreadCount,
  type FleetNotification,
} from "@/registry/syncrobotic/blocks/notification-center"
import { SettingsBilling, formatMoney, invoiceStatus, invoiceStatusText, sampleBilling, type Invoice } from "@/registry/syncrobotic/blocks/settings-billing"

afterEach(cleanup)

const clock = { now: sampleNow, timeZone: "Asia/Taipei" }
const flush = () => act(() => void vi.runAllTimers())

/** The panel with its own state, as NotificationCenter keeps it. */
function Panel({ initial = sampleNotifications, onMarkRead }: { initial?: FleetNotification[]; onMarkRead?: (ids: string[]) => void }) {
  const [items, setItems] = React.useState(initial)
  return (
    <NotificationPanel
      {...clock}
      notifications={items}
      onMarkRead={(ids) => {
        setItems((all) => all.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
        onMarkRead?.(ids)
      }}
    />
  )
}

describe("notification center", () => {
  it("counts unread and groups by day in the reader's time zone, newest first", () => {
    expect(unreadCount(sampleNotifications)).toBe(3)
    const groups = groupByDay(sampleNotifications, sampleNow, { timeZone: "Asia/Taipei" })
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Tue 17 Nov"])
    expect(groups[0].items.map((n) => n.id)).toEqual(["n1", "n2", "n3"])
  })

  it("shows the unread count on the bell, in its name too", () => {
    render(<NotificationCenter {...clock} />)
    const bell = screen.getByRole("button", { name: "Notifications, 3 unread" })
    expect(bell.querySelector('[data-slot="count-badge"]')?.textContent).toBe("3")
  })

  it("marks unread by words for screen readers, not colour alone", () => {
    render(<Panel />)
    const first = screen.getAllByRole("link")[0]
    expect(first.textContent).toContain("Unread: Night patrol B finished")
    expect(first.querySelector(".font-medium")).toBeTruthy()
  })

  it("marks one as read and keeps focus in the list", () => {
    vi.useFakeTimers()
    const onMarkRead = vi.fn()
    render(<Panel onMarkRead={onMarkRead} />)
    fireEvent.click(screen.getByRole("button", { name: "Mark as read: Weekly patrol report is ready" }))
    expect(onMarkRead).toHaveBeenCalledWith(["n2"])
    flush()
    expect(screen.queryByRole("button", { name: "Mark as read: Weekly patrol report is ready" })).toBeNull()
    expect(document.activeElement?.getAttribute("data-notification-link")).toBe("n2")
    expect(screen.getByRole("status").textContent).toBe("Marked as read: Weekly patrol report is ready")
    vi.useRealTimers()
  })

  it("marks all as read, then the Unread filter says you are all caught up", () => {
    vi.useFakeTimers()
    const onMarkRead = vi.fn()
    render(<Panel onMarkRead={onMarkRead} />)
    fireEvent.click(screen.getByRole("radio", { name: /Unread/ }))
    expect(screen.getAllByRole("link")).toHaveLength(3)
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }))
    expect(onMarkRead).toHaveBeenCalledWith(["n1", "n2", "n3"])
    flush()
    expect(screen.getByText("You're all caught up")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Mark all as read" })).toBeNull()
    fireEvent.click(screen.getByRole("radio", { name: "All" }))
    expect(screen.getAllByRole("link")).toHaveLength(6)
    vi.useRealTimers()
  })

  it("moves through the list with the arrow keys, Home and End", () => {
    render(<Panel />)
    const links = screen.getAllByRole("link")
    links[0].focus()
    fireEvent.keyDown(links[0], { key: "ArrowDown" })
    expect(document.activeElement).toBe(links[1])
    fireEvent.keyDown(links[1], { key: "End" })
    expect(document.activeElement).toBe(links[5])
    fireEvent.keyDown(links[5], { key: "ArrowDown" })
    expect(document.activeElement).toBe(links[5])
    fireEvent.keyDown(links[5], { key: "Home" })
    expect(document.activeElement).toBe(links[0])
  })

  it("has empty, loading and error states", () => {
    const onRetry = vi.fn()
    const { rerender } = render(<NotificationPanel {...clock} notifications={[]} onMarkRead={() => {}} />)
    expect(screen.getByText("No notifications yet")).toBeTruthy()
    rerender(<NotificationPanel {...clock} notifications={[]} onMarkRead={() => {}} status="loading" />)
    expect(screen.getByText("Loading notifications")).toBeTruthy()
    rerender(<NotificationPanel {...clock} notifications={[]} onMarkRead={() => {}} status="error" onRetry={onRetry} />)
    expect(screen.getByText("Notifications did not load")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalled()
  })

  it("closes on Esc and puts focus back on the bell", async () => {
    render(<NotificationCenter {...clock} />)
    const bell = screen.getByRole("button", { name: "Notifications, 3 unread" })
    bell.focus()
    fireEvent.click(bell)
    const panel = await screen.findByRole("dialog", { name: "Notifications" })
    expect(within(panel).getAllByRole("link").length).toBeGreaterThan(0)
    fireEvent.keyDown(document.activeElement ?? panel, { key: "Escape" })
    // Radix hands focus back on the next tick, after the panel has gone.
    await act(() => new Promise((r) => setTimeout(r, 10)))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.activeElement).toBe(bell)
  })
})

describe("settings billing", () => {
  const invoice = (status: Invoice["status"]): Invoice => ({ id: "x", number: "INV-1", date: "2026-11-01", dueDate: "2026-12-01", amount: 10, status, pdfHref: "#" })

  it("words each invoice status as an InlineStatus; only overdue is in colour, warning (robots keep working)", () => {
    expect(invoiceStatusText(invoice("paid"))).toBe("Paid")
    expect(invoiceStatusText(invoice("due"))).toBe("Due 1 Dec 2026")
    expect(invoiceStatusText(invoice("overdue"))).toBe("Overdue since 1 Dec 2026")
    expect(invoiceStatus.paid.status).toBe("normal")
    expect(invoiceStatus.due.status).toBe("normal")
    expect(invoiceStatus.overdue.status).toBe("warning")
    expect(Object.values(invoiceStatus).some((s) => (s.status as string) === "danger")).toBe(false)
  })

  it("formats money with Intl in the account's currency", () => {
    expect(formatMoney(1490, "USD")).toBe("US$1,490.00")
    expect(formatMoney(45000, "TWD")).toBe("NT$45,000.00")
  })

  it("warns on a meter only near the limit", () => {
    render(<SettingsBilling />)
    expect(screen.getByRole("meter", { name: "Robots" }).getAttribute("data-tone")).toBe("warning")
    expect(screen.getByRole("meter", { name: "Console seats" }).getAttribute("data-tone")).toBe("normal")
  })

  it("lists invoices with a PDF link each, and says when one is overdue", () => {
    render(<SettingsBilling />)
    const note = screen.getByText("Invoice INV-2026-0131 is overdue").closest("[data-slot=alert]")!
    // A warning, not an alarm: the robots keep working, so it is never role=alert (read out over everything on load).
    expect(note.getAttribute("role")).toBe("status")
    expect(screen.queryByRole("alert")).toBeNull()

    // ResponsiveTable renders its table and its phone list until it has measured itself (jsdom never does): count one.
    const table = screen.getByRole("table", { name: "Invoices" })
    expect(within(table).getAllByRole("link", { name: /^Download invoice INV-2026-\d+, PDF$/ })).toHaveLength(sampleBilling.invoices.length)
  })

  it("cancels the plan only after confirming", async () => {
    const onCancelPlan = vi.fn()
    render(<SettingsBilling onCancelPlan={onCancelPlan} />)
    fireEvent.click(screen.getByRole("button", { name: "Cancel plan" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(onCancelPlan).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel plan" }))
    expect(onCancelPlan).toHaveBeenCalled()
    expect(screen.getByText("Cancelled. Ends on 1 Dec 2026")).toBeTruthy()
  })

  it("has empty, loading and error states", () => {
    const { rerender } = render(<SettingsBilling account={{ ...sampleBilling, invoices: [] }} />)
    expect(screen.getByText("No invoices yet")).toBeTruthy()
    rerender(<SettingsBilling status="loading" />)
    expect(screen.getByText("Loading plan and invoices")).toBeTruthy()
    rerender(<SettingsBilling status="error" onRetry={() => {}} />)
    expect(screen.getByText("Billing did not load")).toBeTruthy()
  })
})
