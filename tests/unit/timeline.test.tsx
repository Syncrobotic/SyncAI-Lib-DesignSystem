import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Timeline, TimelineHeading, TimelineItem } from "@/registry/syncrobotic/ui/timeline"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("Timeline", () => {
  it("is an ordered list of events, each with its time, title and details", () => {
    render(
      <Timeline aria-label="Shift">
        <TimelineItem time="08:00" dateTime="2026-11-17T08:00" title="Shift started">
          Left the dock with 98 % battery.
        </TimelineItem>
        <TimelineItem time="09:12" title="North gate patrol done" />
      </Timeline>,
    )
    const list = screen.getByRole("list", { name: "Shift" })
    expect(list.tagName).toBe("OL")
    const [first, second] = within(list).getAllByRole("listitem")
    expect(first.textContent).toBe("08:00Shift startedLeft the dock with 98 % battery.")
    expect(second.textContent).toBe("09:12North gate patrol done")
  })

  it("gives a machine-readable time in a <time> element", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem time="Yesterday" dateTime="2026-11-16" title="Battery replaced" />
      </Timeline>,
    )
    const time = container.querySelector("time")!
    expect(time.textContent).toBe("Yesterday")
    expect(time.getAttribute("datetime")).toBe("2026-11-16")
  })

  it("leaves out the time and the details when they are not given", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem title="Commissioned" />
      </Timeline>,
    )
    expect(container.querySelector("time")).toBeNull()
    expect(screen.getByRole("listitem").textContent).toBe("Commissioned")
  })

  it("keeps markers and connecting lines out of the accessibility tree", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem time="14:02" tone="danger" title="Emergency stop pressed" />
        <TimelineItem time="14:01" icon={<svg data-testid="icon" />} title="Obstacle in path" />
      </Timeline>,
    )
    for (const svg of container.querySelectorAll("svg")) expect(svg.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.getByTestId("icon").closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it("draws a status glyph for a tone, and colours the title only for warning and danger", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem tone="danger" title="Stopped" />
        <TimelineItem tone="warning" title="Slowed" />
        <TimelineItem tone="info" title="Patrol started" />
        <TimelineItem title="Plain" />
      </Timeline>,
    )
    const titles = ["Stopped", "Slowed", "Patrol started", "Plain"].map((t) => screen.getByText(t))
    expect(titles[0].className).toContain("text-danger")
    expect(titles[1].className).toContain("text-warning")
    expect(titles[2].className).not.toMatch(/text-(danger|warning)/)
    expect(titles[3].className).not.toMatch(/text-(danger|warning)/)
    const items = container.querySelectorAll('[data-slot="timeline-item"]')
    // Danger is a square, warning a triangle, info (active) a filled circle; a plain event has a dot and no glyph.
    expect(items[0].querySelector("svg rect")).not.toBeNull()
    expect(items[1].querySelector("svg path")).not.toBeNull()
    expect(items[2].querySelector("svg circle")).not.toBeNull()
    expect(items[3].querySelector("svg")).toBeNull()
  })

  it("shows an icon in place of the marker", () => {
    render(
      <Timeline>
        <TimelineItem tone="danger" icon={<svg data-testid="wrench" />} title="Lidar cleaned" />
      </Timeline>,
    )
    const item = screen.getByRole("listitem")
    expect(within(item).getByTestId("wrench")).toBeTruthy()
    expect(item.querySelector("rect")).toBeNull() // the icon wins over the tone's glyph
  })

  it("groups events under headings, which are list items too", () => {
    const { container } = render(
      <Timeline>
        <TimelineHeading>Today</TimelineHeading>
        <TimelineItem time="10:40" title="Returned to dock" />
        <TimelineHeading>Yesterday</TimelineHeading>
        <TimelineItem time="17:55" title="Battery 18 %" />
      </Timeline>,
    )
    expect(screen.getAllByRole("listitem").map((li) => li.getAttribute("data-slot"))).toEqual([
      "timeline-heading",
      "timeline-item",
      "timeline-heading",
      "timeline-item",
    ])
    expect(container.querySelector('[data-slot="timeline-heading"]')?.textContent).toBe("Today")
  })

  it("puts time and content on either side in the alternate layout", () => {
    render(
      <Timeline align="alternate">
        <TimelineItem time="08:00" title="Shift started" />
      </Timeline>,
    )
    const columns = screen.getByRole("listitem").children
    expect(columns).toHaveLength(3)
    expect(columns[0].textContent).toBe("08:00")
    expect(columns[2].textContent).toBe("Shift started")
  })

  it("uses less space between events at size sm", () => {
    const { container, rerender } = render(
      <Timeline>
        <TimelineItem title="A" />
      </Timeline>,
    )
    expect(container.querySelector(".pb-6")).not.toBeNull()
    rerender(
      <Timeline size="sm">
        <TimelineItem title="A" />
      </Timeline>,
    )
    expect(container.querySelector(".pb-6")).toBeNull()
    expect(container.querySelector(".pb-4")).not.toBeNull()
  })

  it("has no density prop any more: size is the only spacing switch", () => {
    const { container } = render(
      // @ts-expect-error `density` was removed in 0.40; use size="sm".
      <Timeline density="dense">
        <TimelineItem title="A" />
      </Timeline>,
    )
    expect(container.querySelector(".pb-4")).toBeNull()
  })

  it("is not a Tab stop when vertical", () => {
    render(
      <Timeline>
        <TimelineItem title="A" />
      </Timeline>,
    )
    expect(screen.getByRole("list").hasAttribute("tabindex")).toBe(false)
    expect(screen.getByRole("list").getAttribute("data-orientation")).toBe("vertical")
  })

  it("scrolls sideways when horizontal: the keyboard can reach it, and the edge fades while more events are hidden", () => {
    let scrollLeft = 0
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1200)
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(() => scrollLeft)
    render(
      <Timeline orientation="horizontal" aria-label="Releases">
        <TimelineItem time="v0.1" title="First" />
        <TimelineItem time="v0.2" title="Second" />
      </Timeline>,
    )
    const list = screen.getByRole("list", { name: "Releases" })
    expect(list.getAttribute("tabindex")).toBe("0")
    expect(list.getAttribute("data-orientation")).toBe("horizontal")
    expect(list.className).toContain("mask-image")
    scrollLeft = 800 // scrolled to the end
    act(() => {
      fireEvent.scroll(list)
    })
    expect(list.className).not.toContain("mask-image")
    scrollLeft = 300
    act(() => {
      fireEvent.scroll(list)
    })
    expect(list.className).toContain("mask-image")
  })

  it("does not fade a horizontal row that fits", () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400)
    render(
      <Timeline orientation="horizontal">
        <TimelineItem title="Only" />
      </Timeline>,
    )
    expect(screen.getByRole("list").className).not.toContain("mask-image")
  })

  it("renders an empty list with no events", () => {
    render(<Timeline aria-label="Empty" />)
    expect(within(screen.getByRole("list", { name: "Empty" })).queryAllByRole("listitem")).toHaveLength(0)
  })

  // Was a bug, fixed in 0.24.1: the status glyph is aria-hidden and nothing else carries the tone (timeline.tsx:213-233), so a screen reader
  // hears a danger or warning event exactly like an ordinary one; the colour and shape are visual only. Marker does
  // this right with a visually hidden ", failed" / ", warning" (marker.tsx:81). TimelineItem should do the same.
  it("tells screen readers that an event is a warning or a failure", () => {
    render(
      <Timeline>
        <TimelineItem tone="danger" title="Emergency stop pressed" />
        <TimelineItem tone="warning" title="Obstacle in path" />
      </Timeline>,
    )
    const [danger, warning] = screen.getAllByRole("listitem")
    expect(danger.textContent).toMatch(/failed|danger|error/i)
    expect(warning.textContent).toMatch(/warning/i)
  })
})
