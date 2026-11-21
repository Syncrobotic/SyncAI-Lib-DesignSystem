import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  JointState,
  classifyJointLimit,
  defaultJointStateLabels,
  toDisplayUnit,
  type JointStateJoint,
} from "@/registry/syncrobotic/ui/joint-state"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// The panel reads Date.now() to count from the last update, so the clock is faked along with the timers (the config's
// default leaves Date real).
const fakeClock = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
const deg = (d: number) => (d * Math.PI) / 180
const root = () => screen.getByRole("region")
const rows = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>("[data-slot=joint-state-row]")]

describe("unit conversion", () => {
  it("shows radians as degrees and metres as millimetres", () => {
    expect(toDisplayUnit(Math.PI)).toBeCloseTo(180)
    expect(toDisplayUnit(-Math.PI / 2, "rad")).toBeCloseTo(-90)
    expect(toDisplayUnit(0.1205, "m")).toBeCloseTo(120.5)
  })

  it("writes each row in its own unit, with velocity and effort", () => {
    const joints: JointStateJoint[] = [
      { name: "elbow", position: deg(42), lower: deg(-180), upper: deg(180), velocity: deg(-12.5), effort: 33, effortLimit: 150 },
      { name: "lift", unit: "m", position: 0.1205, lower: 0, upper: 0.9, velocity: 0.02, effort: 310 },
    ]
    const { container } = render(<JointState joints={joints} />)
    const [elbow, lift] = rows(container)
    expect(elbow!.textContent).toContain("42.0°")
    expect(elbow!.textContent).toContain("-12.5 °/s")
    expect(elbow!.textContent).toContain("22 %")
    expect(lift!.textContent).toContain("120.5 mm")
    expect(lift!.textContent).toContain("20.0 mm/s")
    expect(lift!.textContent).toContain("310.0 N")
  })

  it("never writes a rounded reading as -0.0", () => {
    const { container } = render(<JointState joints={[{ name: "wrist", position: -0.0004, lower: -1, upper: 1 }]} />)
    expect(rows(container)[0]!.textContent).toContain("0.0°")
    expect(rows(container)[0]!.textContent).not.toContain("-0.0°")
  })

  it("formats numbers in the given locale", () => {
    const { container } = render(<JointState locale="de" joints={[{ name: "a1", position: deg(1234.5), velocity: deg(0.5) }]} />)
    expect(rows(container)[0]!.textContent).toContain("1.234,5°")
  })
})

describe("limit and margin classification", () => {
  const lo = -1
  const hi = 1 // a range of 2: 5 % is 0.1, the "at" tolerance 0.002

  it("is within the limits away from both ends", () => {
    expect(classifyJointLimit(0, lo, hi)).toEqual({ level: "within" })
    expect(classifyJointLimit(0.899, lo, hi)).toEqual({ level: "within" })
  })

  it("is near inside the margin, on the side it is near", () => {
    expect(classifyJointLimit(0.91, lo, hi)).toEqual({ level: "near", side: "upper" })
    expect(classifyJointLimit(-0.95, lo, hi)).toEqual({ level: "near", side: "lower" })
  })

  it("is at a limit within 0.1 % of the range, and past it beyond that", () => {
    expect(classifyJointLimit(1, lo, hi)).toEqual({ level: "at", side: "upper" })
    expect(classifyJointLimit(-1.0015, lo, hi)).toEqual({ level: "at", side: "lower" })
    expect(classifyJointLimit(1.01, lo, hi)).toEqual({ level: "beyond", side: "upper" })
    expect(classifyJointLimit(-1.5, lo, hi)).toEqual({ level: "beyond", side: "lower" })
  })

  it("takes the margin as a fraction of the range", () => {
    expect(classifyJointLimit(0.75, lo, hi, 0.2)).toEqual({ level: "near", side: "upper" })
    expect(classifyJointLimit(0.75, lo, hi, 0.1)).toEqual({ level: "within" })
    expect(classifyJointLimit(0.99, lo, hi, 0)).toEqual({ level: "within" })
  })

  it("has no level without both limits (a continuous joint)", () => {
    expect(classifyJointLimit(42, undefined, undefined)).toEqual({ level: "none" })
    expect(classifyJointLimit(0, -1, undefined)).toEqual({ level: "none" })
    expect(classifyJointLimit(0, 1, -1)).toEqual({ level: "none" })
  })

  it("says near, at and past in words with an icon, not by colour alone", () => {
    const joints: JointStateJoint[] = [
      { name: "ok", position: 0, lower: lo, upper: hi },
      { name: "near", position: 0.95, lower: lo, upper: hi },
      { name: "at", position: -1, lower: lo, upper: hi },
      { name: "past", position: 1.2, lower: lo, upper: hi },
      { name: "spin", position: 12 },
    ]
    const { container } = render(<JointState joints={joints} />)
    const [ok, near, at, past, spin] = rows(container)
    expect(ok!.dataset.limit).toBe("within")
    expect(near!.dataset.limit).toBe("near")
    expect(near!.textContent).toContain("Near upper limit")
    expect(near!.querySelector("svg")).toBeTruthy()
    expect(at!.textContent).toContain("At lower limit")
    expect(past!.textContent).toContain("Past upper limit")
    expect(past!.querySelector("svg")).toBeTruthy()
    expect(spin!.dataset.limit).toBe("none")
    expect(spin!.textContent).toContain("No limits (continuous)")
    expect(spin!.querySelector("[data-slot=joint-state-track]")).toBeNull()
    // The marker past a limit is pinned to the end it went past.
    expect((past!.querySelector("[data-slot=joint-state-marker]") as HTMLElement).style.left).toBe("100%")
  })

  it("applies the margin prop to the rows", () => {
    const { container } = render(<JointState margin={0.2} joints={[{ name: "a", position: 0.75, lower: lo, upper: hi }]} />)
    expect(rows(container)[0]!.dataset.limit).toBe("near")
  })
})

describe("stale timing", () => {
  const joints: JointStateJoint[] = [{ name: "elbow", position: 0.5, lower: -1, upper: 1 }]

  it("goes stale after staleAfterMs without a new joints array, and a new one clears it", () => {
    fakeClock()
    vi.setSystemTime(new Date(2026, 10, 21, 14, 2, 31))
    const { rerender } = render(<JointState joints={joints} />)
    expect(root().dataset.state).toBe("live")
    act(() => void vi.advanceTimersByTime(999))
    expect(root().dataset.state).toBe("live")
    act(() => void vi.advanceTimersByTime(1))
    expect(root().dataset.state).toBe("stale")
    expect(screen.getByRole("status").textContent).toBe("Stale, last update 14:02:31")
    rerender(<JointState joints={[...joints]} />)
    expect(root().dataset.state).toBe("live")
    expect(screen.getByRole("status").textContent).toBe("")
  })

  it("dims the values while stale", () => {
    fakeClock()
    const { container } = render(<JointState joints={joints} staleAfterMs={500} />)
    act(() => void vi.advanceTimersByTime(500))
    const position = rows(container)[0]!.querySelector("p.tabular-nums")!
    expect(position.className).toContain("text-muted-foreground")
  })

  it("times the wait by this browser's clock, whatever the robot's stamp says, and shows the stamp", () => {
    fakeClock()
    vi.setSystemTime(new Date(2026, 10, 21, 14, 10, 0))
    // The robot's clock is a minute ahead: still live until staleAfterMs passes here.
    render(<JointState joints={joints} updatedAt={new Date(2026, 10, 21, 14, 11, 0).getTime()} />)
    act(() => void vi.advanceTimersByTime(999))
    expect(root().dataset.state).toBe("live")
    act(() => void vi.advanceTimersByTime(1))
    expect(root().dataset.state).toBe("stale")
    expect(screen.getByText("· last update 14:11:00")).toBeTruthy()
  })

  it("with a stamp, a re-sent message with the same stamp is not an update", () => {
    fakeClock()
    const t0 = Date.now()
    const { rerender } = render(<JointState joints={joints} updatedAt={t0} />)
    act(() => void vi.advanceTimersByTime(600))
    rerender(<JointState joints={[...joints]} updatedAt={t0} />)
    act(() => void vi.advanceTimersByTime(400))
    expect(root().dataset.state).toBe("stale")
  })

  it("a newer updatedAt keeps it live even with the same joints array", () => {
    fakeClock()
    const t0 = Date.now()
    const { rerender } = render(<JointState joints={joints} updatedAt={t0} staleAfterMs={1000} />)
    act(() => void vi.advanceTimersByTime(800))
    rerender(<JointState joints={joints} updatedAt={t0 + 800} staleAfterMs={1000} />)
    act(() => void vi.advanceTimersByTime(800))
    expect(root().dataset.state).toBe("live")
    act(() => void vi.advanceTimersByTime(200))
    expect(root().dataset.state).toBe("stale")
  })

  it("is never stale while loading or empty", () => {
    fakeClock()
    const { rerender } = render(<JointState joints={[]} loading />)
    act(() => void vi.advanceTimersByTime(5000))
    expect(root().dataset.state).toBe("loading")
    expect(screen.getByText("Loading joint states…")).toBeTruthy()
    rerender(<JointState joints={[]} />)
    act(() => void vi.advanceTimersByTime(5000))
    expect(root().dataset.state).toBe("empty")
    expect(screen.getByText("No joint states yet")).toBeTruthy()
  })
})

describe("labels", () => {
  it("names the panel by label, else by the title label", () => {
    const { rerender } = render(<JointState joints={[]} label="Arm 2" />)
    expect(screen.getByRole("region", { name: "Arm 2" })).toBeTruthy()
    rerender(<JointState joints={[]} />)
    expect(screen.getByRole("region", { name: defaultJointStateLabels.title })).toBeTruthy()
  })

  it("replaces only the words passed, including units and the time", () => {
    fakeClock()
    const joints: JointStateJoint[] = [
      { name: "j1", position: deg(170), lower: deg(-180), upper: deg(180), velocity: deg(10) },
      { name: "j2", unit: "m", position: 0.5, lower: 0, upper: 1 },
    ]
    const { container } = render(
      <JointState
        joints={joints}
        labels={{
          title: "關節狀態",
          degrees: (v) => `${v} 度`,
          millimetres: (v) => `${v} 毫米`,
          nearUpper: "接近上限",
          velocity: "速度",
          stale: "已過時",
          lastUpdate: (t) => `最後更新 ${t}`,
          formatTime: () => "下午 2:02:31",
        }}
      />,
    )
    expect(screen.getByRole("region", { name: "關節狀態" })).toBeTruthy()
    const [j1, j2] = rows(container)
    expect(j1!.textContent).toContain("170.0 度")
    expect(j1!.textContent).toContain("接近上限")
    expect(j1!.textContent).toContain("速度")
    // Keys left out keep their English words.
    expect(j1!.textContent).toContain("10.0 °/s")
    expect(j2!.textContent).toContain("500.0 毫米")
    act(() => void vi.advanceTimersByTime(1000))
    expect(screen.getByRole("status").textContent).toBe("已過時, 最後更新 下午 2:02:31")
  })

  it("formats the time in the locale when one is given", () => {
    const d = new Date(2026, 10, 21, 14, 2, 31)
    expect(defaultJointStateLabels.formatTime(d)).toBe("14:02:31")
    expect(defaultJointStateLabels.formatTime(d, "en-GB")).toBe("14:02:31")
  })
})
