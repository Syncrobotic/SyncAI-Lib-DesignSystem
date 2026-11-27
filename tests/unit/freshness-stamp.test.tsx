import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { freshnessStampLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { FreshnessStamp, freshnessOf, type FreshnessThresholds } from "@/registry/syncrobotic/ui/freshness-stamp"

afterEach(cleanup)

const NOW = Date.UTC(2026, 10, 27, 6, 2, 0)
const min = 60_000
const t: FreshnessThresholds = { laggingAfterMs: 2 * min, staleAfterMs: 10 * min }
const stamp = () => document.querySelector<HTMLElement>("[data-slot=freshness-stamp]")!

describe("freshnessOf", () => {
  it("live, lagging and stale by the thresholds, each boundary inclusive", () => {
    expect(freshnessOf(NOW - 30_000, t, { now: NOW })).toBe("live")
    expect(freshnessOf(NOW - 2 * min + 1, t, { now: NOW })).toBe("live")
    expect(freshnessOf(NOW - 2 * min, t, { now: NOW })).toBe("lagging")
    expect(freshnessOf(NOW - 10 * min + 1, t, { now: NOW })).toBe("lagging")
    expect(freshnessOf(NOW - 10 * min, t, { now: NOW })).toBe("stale")
  })

  it("never reported is never, not stale; air-gapped is not-applicable even with no report", () => {
    expect(freshnessOf(null, t, { now: NOW })).toBe("never")
    expect(freshnessOf(undefined, t, { now: NOW })).toBe("never")
    expect(freshnessOf("garbage", t, { now: NOW })).toBe("never")
    expect(freshnessOf(null, t, { now: NOW, airGapped: true })).toBe("not-applicable")
    // A device that reported once and was then moved air-gapped: the deployment wins over an old timestamp.
    expect(freshnessOf(NOW - 30 * 24 * 60 * min, t, { now: NOW, airGapped: true })).toBe("not-applicable")
    // Air-gapped wins over the server's offline verdict too.
    expect(freshnessOf(null, t, { now: NOW, airGapped: true, offline: true })).toBe("not-applicable")
  })

  it("the server's verdict wins: offline is stale at any age, online is never stale", () => {
    expect(freshnessOf(NOW - 30_000, t, { now: NOW, offline: true })).toBe("stale")
    expect(freshnessOf(NOW - 60 * min, t, { now: NOW, offline: false })).toBe("lagging")
    // But no report at all is still never, whatever the verdict.
    expect(freshnessOf(null, t, { now: NOW, offline: true })).toBe("never")
  })

  it("without staleAfterMs only the server makes it stale", () => {
    expect(freshnessOf(NOW - 24 * 60 * min, { laggingAfterMs: 2 * min }, { now: NOW })).toBe("lagging")
    expect(freshnessOf(NOW - 24 * 60 * min, { laggingAfterMs: 2 * min }, { now: NOW, offline: true })).toBe("stale")
  })

  it("a report from the future (a device clock running fast) is live, never a fault", () => {
    expect(freshnessOf(NOW + 5 * min, t, { now: NOW })).toBe("live")
    expect(freshnessOf(NOW + 365 * 24 * 60 * min, t, { now: NOW })).toBe("live")
  })

  it("reads ISO strings and Dates", () => {
    expect(freshnessOf("2026-11-27T05:58:00Z", t, { now: NOW })).toBe("lagging")
    expect(freshnessOf(new Date(NOW - 11 * min), t, { now: NOW })).toBe("stale")
  })
})

describe("FreshnessStamp", () => {
  it("live: grey, the age in words, the exact time for screen readers", () => {
    render(<FreshnessStamp lastAt={NOW - 40_000} thresholds={t} now={NOW} timeZone="UTC" />)
    expect(stamp().dataset.freshness).toBe("live")
    expect(stamp().className).toContain("text-muted-foreground")
    expect(stamp().textContent).toBe("Reported this minute. Last report at Nov 27, 2026, 06:01")
  })

  it("lagging and stale take colour; the server's offline makes it stale", () => {
    render(<FreshnessStamp lastAt={NOW - 5 * min} thresholds={t} now={NOW} />)
    expect(stamp().dataset.freshness).toBe("lagging")
    expect(stamp().className).toContain("text-warning")
    expect(screen.getByText("Last report 5 minutes ago")).toBeTruthy()
    cleanup()
    render(<FreshnessStamp lastAt={NOW - 5 * min} thresholds={t} offline now={NOW} />)
    expect(stamp().dataset.freshness).toBe("stale")
    expect(stamp().className).toContain("text-danger")
    expect(screen.getByText("Out of date: last report 5 minutes ago")).toBeTruthy()
  })

  it("never and air-gapped are quiet and have no time", () => {
    render(<FreshnessStamp lastAt={null} thresholds={t} now={NOW} />)
    expect(stamp().dataset.freshness).toBe("never")
    expect(stamp().className).toContain("text-muted-foreground")
    expect(stamp().textContent).toBe("Not reported yet")
    cleanup()
    render(<FreshnessStamp lastAt={null} airGapped thresholds={t} />)
    expect(stamp().dataset.freshness).toBe("not-applicable")
    expect(stamp().textContent).toBe("Does not report (air-gapped)")
  })

  it("a future report reads as this minute, not in 5 minutes", () => {
    render(<FreshnessStamp lastAt={NOW + 5 * min} thresholds={t} now={NOW} />)
    expect(stamp().dataset.freshness).toBe("live")
    expect(screen.getByText("Reported this minute")).toBeTruthy()
  })

  it("hideWhenLive renders nothing while live, and the stamp once it lags", () => {
    render(<FreshnessStamp lastAt={NOW - 10_000} thresholds={t} now={NOW} hideWhenLive />)
    expect(document.querySelector("[data-slot=freshness-stamp]")).toBeNull()
    cleanup()
    render(<FreshnessStamp lastAt={NOW - 3 * min} thresholds={t} now={NOW} hideWhenLive />)
    expect(stamp().dataset.freshness).toBe("lagging")
  })

  it("icon: the words are its name", () => {
    render(<FreshnessStamp lastAt={NOW - 3 * min} thresholds={t} now={NOW} variant="icon" timeZone="UTC" />)
    expect(screen.getByRole("img", { name: "Last report 3 minutes ago. Last report at Nov 27, 2026, 05:59" })).toBeTruthy()
  })

  it("zh-TW through the labels and locale", () => {
    render(<FreshnessStamp lastAt={NOW - 3 * min} thresholds={t} now={NOW} locale="zh-TW" timeZone="Asia/Taipei" labels={freshnessStampLabels} />)
    expect(stamp().textContent).toBe("最後回報：3 分鐘前。最後回報時間：2026年11月27日 13:59")
  })
})
