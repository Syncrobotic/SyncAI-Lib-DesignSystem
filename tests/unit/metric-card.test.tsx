import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MetricCard, MetricGrid } from "@/registry/syncrobotic/ui/metric-card"
import { StatsCards, sampleStats } from "@/registry/syncrobotic/blocks/stats-cards"

afterEach(cleanup)

const card = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-slot=metric-card]")!
// The delta is the span that holds the arrow.
const delta = (c: HTMLElement) => c.querySelector("svg.lucide")!.closest("span")!

describe("MetricCard trend", () => {
  it("colours only a change for the worse", () => {
    const { container } = render(
      <MetricGrid>
        <MetricCard label="Robots online" value="12" delta="+1" trend="good" />
        <MetricCard label="Events" value="24" delta="+6" trend="bad" />
        <MetricCard label="Missions" value="968" delta="+0.2%" trend="flat" />
      </MetricGrid>,
    )
    const [good, bad, flat] = [...container.querySelectorAll<HTMLElement>("[data-slot=metric-card]")].map(delta)
    expect(bad.className).toContain("text-danger")
    expect(good.className).not.toMatch(/text-(danger|warning|success|info)/)
    expect(flat.className).not.toMatch(/text-(danger|warning|success|info)/)
    expect(flat.className).toContain("text-muted-foreground")
    // No other part of any card takes a status colour.
    expect(container.querySelectorAll("[class*=text-danger]")).toHaveLength(1)
  })

  it("says better or worse to screen readers, nothing when flat", () => {
    const { container, rerender } = render(<MetricCard label="Robots online" value="12" delta="+1" trend="good" />)
    expect(delta(container).textContent).toBe("+1, better")
    expect(delta(container).querySelector(".sr-only")!.textContent).toBe(", better")
    rerender(<MetricCard label="Events" value="24" delta="+6" trend="bad" />)
    expect(delta(container).textContent).toBe("+6, worse")
    rerender(<MetricCard label="Missions" value="968" delta="+0.2%" />)
    expect(delta(container).textContent).toBe("+0.2%")
    expect(delta(container).querySelector(".sr-only")).toBeNull()
  })

  it("translates the spoken words", () => {
    const { container } = render(<MetricCard label="事件" value="24" delta="+6" trend="bad" labels={{ worse: "，變差" }} />)
    expect(delta(container).textContent).toBe("+6，變差")
  })

  it("points the arrow down for a minus, ASCII or typographic", () => {
    const { container, rerender } = render(<MetricCard label="Battery" value="71" delta="−2%" />)
    expect(container.querySelector(".lucide-arrow-down-right")).not.toBeNull()
    rerender(<MetricCard label="Battery" value="71" delta="-2%" />)
    expect(container.querySelector(".lucide-arrow-down-right")).not.toBeNull()
    rerender(<MetricCard label="Battery" value="71" delta="+2%" />)
    expect(container.querySelector(".lucide-arrow-up-right")).not.toBeNull()
  })

  it("draws no arrow when nothing changed", () => {
    const { container, rerender } = render(<MetricCard label="Robots" value="12" delta="0" />)
    for (const d of ["0", "+0", "±0", "0.0 %", "−0"]) {
      rerender(<MetricCard label="Robots" value="12" delta={d} />)
      expect(container.querySelector(".lucide-arrow-up-right, .lucide-arrow-down-right")).toBeNull()
      expect(container.textContent).toContain(d)
    }
    rerender(<MetricCard label="Robots" value="12" delta="+10" />)
    expect(container.querySelector(".lucide-arrow-up-right")).not.toBeNull()
  })

  it("reads label, value, then the change", () => {
    const { container } = render(<MetricCard label="Events" value="24" delta="+6" trend="bad" caption="3 need review" />)
    expect(card(container).textContent).toBe("Events24+6, worse3 need review")
  })
})

describe("MetricCard unavailable", () => {
  it("shows a dash and the reason, never a value, change or sparkline", () => {
    const { container } = render(
      <MetricCard label="Avg. battery" value="0" unit="%" delta="+1" series={[1, 2, 3]} caption="Last 7 days" unavailable="Fleet telemetry paused since 14:02" />,
    )
    expect(screen.getByText("—").getAttribute("aria-hidden")).toBe("true")
    expect(screen.getByText("Not available").className).toContain("sr-only")
    expect(screen.getByText("Fleet telemetry paused since 14:02")).toBeTruthy()
    expect(screen.queryByText("0")).toBeNull()
    expect(screen.queryByText("+1")).toBeNull()
    expect(screen.queryByText("Last 7 days")).toBeNull()
    expect(container.querySelector("svg")).toBeNull()
  })
})

describe("MetricCard href", () => {
  it("makes the card one link named by its label", () => {
    const { container } = render(<MetricCard href="/events" label="Events" value="24" delta="+6" trend="bad" caption="3 need review" />)
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute("href")).toBe("/events")
    expect(links[0].textContent).toBe("Events")
    // The link's ::after covers the card, and the card draws the focus ring.
    expect(links[0].className).toContain("after:inset-0")
    expect(card(container).className).toContain("has-[a:focus-visible]:outline-2")
    expect(card(container).className).toContain("press")
  })

  it("renders through linkAs", () => {
    const Link = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>((props, ref) => <a ref={ref} data-router="yes" {...props} />)
    render(<MetricCard href="/robots" linkAs={Link} label="Robots online" value="12" />)
    expect(screen.getByRole("link").getAttribute("data-router")).toBe("yes")
  })

  it("is not a link without href", () => {
    render(<MetricCard label="Events" value="24" />)
    expect(screen.queryByRole("link")).toBeNull()
  })
})

describe("MetricCard loading", () => {
  it("is busy, keeps the label and hides the value behind bones", () => {
    const { container } = render(<MetricCard label="Events" value="24" delta="+6" trend="bad" caption="3 need review" loading />)
    expect(card(container).getAttribute("aria-busy")).toBe("true")
    expect(screen.getByText("Events")).toBeTruthy()
    expect(screen.getByText("Loading").className).toContain("sr-only")
    expect(screen.queryByText("24")).toBeNull()
    expect(screen.queryByText("3 need review")).toBeNull()
    expect(container.querySelectorAll(".animate-breath").length).toBeGreaterThanOrEqual(3)
  })

  it("is not busy once loaded", () => {
    const { container } = render(<MetricCard label="Events" value="24" />)
    expect(card(container).hasAttribute("aria-busy")).toBe(false)
  })
})

describe("MetricCard sparkline", () => {
  it("is hidden from screen readers and needs two points", () => {
    const { container, rerender } = render(<MetricCard label="Events" value="24" series={[12, 15, 24]} />)
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true")
    rerender(<MetricCard label="Events" value="24" series={[24]} />)
    expect(container.querySelector("svg")).toBeNull()
  })
})

describe("StatsCards on MetricCard", () => {
  it("renders the sample stats as metric cards in a grid", () => {
    const { container } = render(<StatsCards />)
    expect(container.querySelector("[data-slot=metric-grid]")).not.toBeNull()
    expect(container.querySelectorAll("[data-slot=metric-card]")).toHaveLength(sampleStats.length)
    expect(container.querySelectorAll("[class*=text-danger]")).toHaveLength(1)
  })
})

describe("MetricCard tone", () => {
  it("is calm by default: a muted caption, no glyph", () => {
    const { container } = render(<MetricCard label="Datasets" value="128" caption="4 added this week" />)
    expect(container.querySelector("svg")).toBeNull()
    expect(screen.getByText("4 added this week").className).toContain("text-muted-foreground")
    expect(container.querySelector("[data-tone]")).toBeNull()
  })
  it("puts the status shape and colour on the caption only; the value stays foreground and the card is not tinted", () => {
    const { container } = render(<MetricCard label="Needs review" value="14" caption="3 blocking a release" tone="warning" />)
    const card = container.querySelector("[data-slot=metric-card]")!
    expect(card.getAttribute("data-tone")).toBe("warning")
    expect(card.className).not.toMatch(/bg-(warning|danger)/)
    const caption = screen.getByText("3 blocking a release").parentElement!
    expect(caption.className).toContain("text-warning")
    expect(caption.querySelector("svg[aria-hidden=true] path")).not.toBeNull()
    expect(screen.getByText("14").className).not.toMatch(/text-(warning|danger)/)
  })
  it("uses the danger colour and square for danger", () => {
    render(<MetricCard label="Failed exports" value="2" caption="Storage quota reached" tone="danger" />)
    const caption = screen.getByText("Storage quota reached").parentElement!
    expect(caption.className).toContain("text-danger")
    expect(caption.querySelector("svg rect")).not.toBeNull()
  })
  it("has nothing to colour while loading or unavailable", () => {
    const { container, rerender } = render(<MetricCard label="x" caption="c" tone="warning" loading />)
    expect(container.querySelector("[class*=text-warning]")).toBeNull()
    rerender(<MetricCard label="x" caption="c" tone="warning" unavailable="Offline" />)
    expect(container.querySelector("[class*=text-warning]")).toBeNull()
    expect(container.querySelector("[data-tone]")).toBeNull()
  })
})
