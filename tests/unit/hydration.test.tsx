import * as React from "react"
import { act } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { hydrateRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AlarmList, type AlarmData } from "@/registry/syncrobotic/ui/alarm"
import { AttitudeIndicator, Gauge } from "@/registry/syncrobotic/ui/attitude"
import { Diagnostics } from "@/registry/syncrobotic/ui/diagnostics"
import { JointState } from "@/registry/syncrobotic/ui/joint-state"
import { LogViewer, type LogLine } from "@/registry/syncrobotic/ui/log-viewer"
import { StreamingChart } from "@/registry/syncrobotic/ui/streaming-chart"

/*
  A product renders these on its server (Next.js) and the browser hydrates them. The two rarely agree on the clock or the
  time zone: the server here renders in UTC at one instant, the browser hydrates in New York 40 minutes later. Anything
  read from the clock or formatted in the local zone during render comes out different, and React throws the server's
  HTML away (a hydration error) or, worse, keeps a page that says something else than the browser's state.
  Each component must hydrate without a single recoverable error or console error.
*/

const SERVER_AT = Date.UTC(2026, 10, 21, 14, 2, 31)
const BROWSER_AT = SERVER_AT + 40 * 60_000
const TZ = process.env.TZ

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  if (TZ === undefined) delete process.env.TZ
  else process.env.TZ = TZ
  document.body.innerHTML = ""
})

/** Renders on "the server" (UTC, SERVER_AT), then hydrates in "the browser" (New York, BROWSER_AT); returns what went wrong. */
async function hydrate(node: () => React.ReactElement, browserAt = BROWSER_AT) {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] })
  process.env.TZ = "UTC"
  vi.setSystemTime(SERVER_AT)
  const html = renderToString(node())

  process.env.TZ = "America/New_York"
  vi.setSystemTime(browserAt)
  const container = document.createElement("div")
  container.innerHTML = html
  document.body.append(container)
  const recoverable: unknown[] = []
  const errors = vi.spyOn(console, "error").mockImplementation(() => {})
  let root: ReturnType<typeof hydrateRoot> | undefined
  await act(async () => {
    root = hydrateRoot(container, node(), { onRecoverableError: (error) => recoverable.push(error) })
  })
  await act(async () => {
    vi.advanceTimersByTime(10)
  })
  const logged = errors.mock.calls.map((c) => c.map(String).join(" "))
  const after = container.innerHTML
  act(() => root!.unmount())
  return { recoverable: recoverable.map(String), logged, html, after }
}

// The time zone really moves: the same instant reads differently, so a test that passes is not passing by accident.
it("the server and the browser here disagree on the local time", () => {
  process.env.TZ = "UTC"
  const utc = new Date(SERVER_AT).getHours()
  process.env.TZ = "America/New_York"
  expect(new Date(SERVER_AT).getHours()).not.toBe(utc)
})

const raised = (minutesAgo: number) => SERVER_AT - minutesAgo * 60_000
const flood: AlarmData[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  priority: i < 2 ? "high" : "low",
  title: `Alarm ${i}`,
  time: "14:02",
  active: true,
  acknowledged: false,
  // Within the server's 10-minute flood window, out of it by the time the browser hydrates.
  raisedAt: raised(1 + (i % 5)),
}))

const lines: LogLine[] = Array.from({ length: 5 }, (_, i) => ({ time: SERVER_AT - i * 5000, level: "info", source: "/planner", message: `Line ${i}` }))

describe("hydrates without a mismatch across a time zone and a later clock", () => {
  it.each([
    ["AlarmList", () => <AlarmList alarms={flood} feedback={false} />],
    ["LogViewer, relative times", () => <LogViewer lines={lines} defaultTimeMode="relative" timeZone="UTC" />],
    ["LogViewer, times of day in a fixed zone", () => <LogViewer lines={lines} timeZone="UTC" />],
    ["Diagnostics", () => <Diagnostics label="AMR-07" statuses={[{ name: "/Lidar/Front", level: "ok", message: "15 Hz", receivedAt: SERVER_AT - 3000 }]} />],
    ["StreamingChart", () => <StreamingChart label="Motor current" config={{ left: { label: "Left", unit: "A", color: 1 } }} />],
    ["JointState", () => <JointState label="Arm" joints={[{ name: "elbow", position: 0.5, lower: -1, upper: 1 }]} updatedAt={SERVER_AT - 2000} />],
    ["AttitudeIndicator", () => <AttitudeIndicator label="Attitude" roll={4} pitch={-2} heading={271} updatedAt={SERVER_AT - 2000} />],
    ["Gauge", () => <Gauge label="Speed" value={1.2} max={2} unit="m/s" updatedAt={SERVER_AT - 2000} />],
  ])("%s", async (_, node) => {
    const { recoverable, logged, html } = await hydrate(node)
    expect(html.length).toBeGreaterThan(0)
    expect(recoverable).toEqual([])
    expect(logged.filter((m) => /hydrat|did not match|server rendered/i.test(m))).toEqual([])
  })

  it("AlarmList counts a flood only in the browser, once hydrated, by the browser's clock", async () => {
    // Hydrated a minute later, the alarms are still within the window: the server's HTML has no flood (it cannot know the
    // browser's clock), the hydrated list has one.
    const { html, after, recoverable } = await hydrate(() => <AlarmList alarms={flood} feedback={false} />, SERVER_AT + 60_000)
    expect(recoverable).toEqual([])
    expect(html).not.toContain("Alarm flood")
    expect(after).toContain("Alarm flood")
  })
})
