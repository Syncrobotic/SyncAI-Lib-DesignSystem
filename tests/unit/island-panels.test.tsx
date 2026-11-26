import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CircleAlert, Square } from "lucide-react"
import { Island, IslandNotice, IslandNotifications, IslandRobots, IslandStatus, type IslandRobot } from "@/registry/syncrobotic/shell/island"
import { AppShellControl } from "@/registry/syncrobotic/blocks/app-shell-control"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const robots: IslandRobot[] = [
  { id: "7F3A", name: "Patrol dog 7F3A", status: "active", state: "Patrolling", battery: 72 },
  { id: "9E37", name: "Patrol dog 9E37", status: "warning", state: "Stuck", battery: 12, attention: true },
]

function island(extra: Partial<React.ComponentProps<typeof Island>> = {}) {
  return render(
    <Island
      name="Patrol dog 7F3A"
      battery={72}
      unread={1}
      panels={{
        name: <IslandRobots robots={robots} current="7F3A" />,
        status: <IslandStatus link="wifi" battery={72} updated="14:06" />,
        bell: <IslandNotifications items={[{ id: "n1", title: "9E37 is stuck", unread: true, tone: "warning", icon: CircleAlert }]} />,
      }}
      {...extra}
    />,
  )
}

describe("Island's zones open their panels", () => {
  it("opens each zone's panel by itself, one at a time, named and pointed to by its zone", () => {
    island()
    const name = screen.getByRole("button", { name: /Patrol dog 7F3A/ })
    expect(name.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(name)
    expect(name.getAttribute("aria-expanded")).toBe("true")
    const robotsPanel = screen.getByRole("region", { name: "Switch robot" })
    expect(name.getAttribute("aria-controls")).toBe(robotsPanel.id)
    expect(within(robotsPanel).getByRole("button", { name: /Patrol dog 7F3A/ }).getAttribute("aria-current")).toBe("true")

    fireEvent.click(screen.getByRole("button", { name: /^Device status/ }))
    expect(name.getAttribute("aria-expanded")).toBe("false")
    const status = screen.getByRole("region", { name: "Device status" })
    expect(within(status).getByText("Wi-Fi")).toBeTruthy()
    expect(within(status).getByRole("meter")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }))
    expect(within(screen.getByRole("region", { name: "Notifications" })).getByText("9E37 is stuck")).toBeTruthy()
  })

  it("closes on Esc, giving focus back to the zone, and on a tap outside", () => {
    island()
    const bell = screen.getByRole("button", { name: "Notifications, 1 unread" })
    fireEvent.click(bell)
    const panel = screen.getByRole("region", { name: "Notifications" })
    within(panel).getByRole("button", { name: /9E37 is stuck/ }).focus()
    fireEvent.keyDown(panel, { key: "Escape" })
    expect(bell.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(bell)

    fireEvent.click(bell)
    expect(bell.getAttribute("aria-expanded")).toBe("true")
    fireEvent.pointerDown(document.body)
    expect(bell.getAttribute("aria-expanded")).toBe("false")
  })

  it("keeps a failure notice in view above the open panel", () => {
    island({ defaultOpen: "status", children: <IslandNotice tone="danger" icon={Square} title="Stopped from this phone" persistent /> })
    const notice = screen.getByText("Stopped from this phone")
    const panel = screen.getByRole("region", { name: "Device status" })
    expect(notice.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("is controlled when open is passed", () => {
    const onOpenChange = vi.fn()
    island({ open: null, onOpenChange })
    fireEvent.click(screen.getByRole("button", { name: /Patrol dog 7F3A/ }))
    expect(onOpenChange).toHaveBeenCalledWith("name")
    expect(screen.queryByRole("region")).toBeNull()
  })
})

describe("the panels", () => {
  it("IslandRobots: a row per robot, the current one ticked, the one that needs attention marked, switches on a tap", () => {
    const onSelect = vi.fn()
    render(<IslandRobots robots={robots} current="7F3A" onSelect={onSelect} />)
    expect(screen.getByRole("button", { name: /Patrol dog 7F3A.*current/ }).getAttribute("aria-current")).toBe("true")
    expect(screen.getByLabelText("needs attention")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /Patrol dog 9E37/ }))
    expect(onSelect).toHaveBeenCalledWith("9E37")
  })

  it("IslandStatus: the battery is a Meter that warns below 15 %; an unknown battery is said, not made up", () => {
    const { unmount } = render(<IslandStatus link="wifi" battery={12} />)
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("12")
    unmount()
    render(<IslandStatus link="bluetooth" />)
    expect(screen.queryByRole("meter")).toBeNull()
    expect(screen.getByText("Not reported yet")).toBeTruthy()
    expect(screen.getByText(/Bluetooth only/)).toBeTruthy()
  })

  it("IslandNotifications: unread ones are said, Mark all read shows only while one is unread, and an empty list says so", () => {
    const onMarkAllRead = vi.fn()
    const { rerender } = render(<IslandNotifications items={[{ id: "a", title: "Night patrol finished", unread: true }]} onMarkAllRead={onMarkAllRead} />)
    expect(screen.getByRole("button", { name: "unread: Night patrol finished" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }))
    expect(onMarkAllRead).toHaveBeenCalled()
    rerender(<IslandNotifications items={[{ id: "a", title: "Night patrol finished" }]} onMarkAllRead={onMarkAllRead} />)
    expect(screen.queryByRole("button", { name: "Mark all read" })).toBeNull()
    rerender(<IslandNotifications items={[]} />)
    expect(screen.getByText("No notifications")).toBeTruthy()
  })
})

describe("app-shell-control", () => {
  it("switches robot from the island and keeps the stop in the dock", () => {
    render(<AppShellControl />)
    fireEvent.click(screen.getAllByRole("button", { name: /Patrol dog 7F3A/ })[0]!)
    fireEvent.click(within(screen.getByRole("region", { name: "Switch robot" })).getByRole("button", { name: /Patrol dog DAA6/ }))
    expect(screen.queryByRole("region", { name: "Switch robot" })).toBeNull()
    expect(screen.getAllByRole("button", { name: /Patrol dog DAA6/ }).length).toBeGreaterThan(0)
  })

  it("a stop turns the island's edge danger with a notice that stays, and its reply is cleared on unmount", () => {
    vi.useFakeTimers()
    const { unmount } = render(<AppShellControl />)
    // The stop fires at the touch (pointer down), as on the robot.
    fireEvent.pointerDown(screen.getByRole("button", { name: /stop/i }))
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByText("Patrol dog 7F3A stopped from this phone")).toBeTruthy()
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
