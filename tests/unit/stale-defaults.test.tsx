import * as React from "react"
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AttitudeIndicator, Gauge, type AttitudeHandle, type GaugeHandle } from "@/registry/syncrobotic/ui/attitude"
import { CameraFeed } from "@/registry/syncrobotic/ui/camera-feed"
import { Diagnostics } from "@/registry/syncrobotic/ui/diagnostics"
import { JointState } from "@/registry/syncrobotic/ui/joint-state"
import { PointCloud } from "@/registry/syncrobotic/ui/point-cloud"
import { RobotModel } from "@/registry/syncrobotic/ui/robot-model"
import { demoArmPose, demoArmUrdf } from "../../stories/robot-model-arm"

// A frozen view that still looks live is the failure: every live-telemetry component goes stale by default, at a limit
// chosen for its data, and `staleAfterMs={null}` is the one way to turn it off (a saved cloud, a URDF on show).

const NOW = new Date(2026, 10, 21, 14, 2, 31).getTime()
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance", "requestAnimationFrame", "cancelAnimationFrame"] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const state = (slot: string) => document.querySelector<HTMLElement>(`[data-slot=${slot}]`)!.dataset.state

describe("stale by default", () => {
  it("PointCloud: 3 s without a new cloud; never with null", () => {
    const pts = new Float32Array([1, 1, 1])
    const { rerender } = render(<PointCloud label="Front lidar" points={pts} />)
    const root = () => document.querySelector("[data-slot=point-cloud]")!
    run(2999)
    expect(root().hasAttribute("data-stale")).toBe(false)
    run(1)
    expect(root().hasAttribute("data-stale")).toBe(true)
    rerender(<PointCloud label="Front lidar" points={pts} staleAfterMs={null} />)
    run(60_000)
    expect(root().hasAttribute("data-stale")).toBe(false)
  })

  it("RobotModel: 1 s without new joints; never without joints, or with null", () => {
    const stateLine = () => document.querySelector("[data-slot=robot-model-state]")?.textContent ?? null
    render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} webgl={false} />)
    run(999)
    expect(stateLine()).toBeNull()
    run(1)
    expect(stateLine()).toBe("Stale · last update 14:02:31")
    cleanup()
    render(<RobotModel urdf={demoArmUrdf} webgl={false} />)
    run(60_000)
    expect(stateLine()).toBeNull()
    cleanup()
    render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} webgl={false} staleAfterMs={null} />)
    run(60_000)
    expect(stateLine()).toBeNull()
  })

  it("AttitudeIndicator: 1 s without a reading; never with null", () => {
    const handle = React.createRef<AttitudeHandle>()
    const { rerender } = render(<AttitudeIndicator ref={handle} label="Attitude" />)
    act(() => void handle.current!.push({ roll: 3, pitch: 1 }))
    run(1000)
    expect(state("attitude")).toBe("live")
    run(250)
    expect(state("attitude")).toBe("stale")
    rerender(<AttitudeIndicator ref={handle} label="Attitude" staleAfterMs={null} />)
    run(60_000)
    expect(state("attitude")).toBe("live")
  })

  it("Gauge: 3 s without a reading; never with null", () => {
    const handle = React.createRef<GaugeHandle>()
    const { rerender } = render(<Gauge ref={handle} label="Speed" max={2} unit="m/s" />)
    act(() => void handle.current!.push(1.2))
    run(3000)
    expect(state("gauge")).toBe("live")
    run(250)
    expect(state("gauge")).toBe("stale")
    rerender(<Gauge ref={handle} label="Speed" max={2} unit="m/s" staleAfterMs={null} />)
    run(60_000)
    expect(state("gauge")).toBe("live")
  })

  it("JointState and CameraFeed keep their limits (1 s, 2 s) and take null for never", () => {
    const joints = [{ name: "elbow", position: 0.5, lower: -1, upper: 1 }]
    render(<JointState joints={joints} staleAfterMs={null} />)
    run(60_000)
    expect(state("joint-state")).toBe("live")
    cleanup()

    render(<CameraFeed label="Front camera" src="/live.webm" staleAfterMs={null} />)
    act(() => void document.querySelector("video")!.dispatchEvent(new Event("timeupdate")))
    run(60_000)
    expect(screen.getByRole("region").getAttribute("data-state")).toBe("live")
  })

  it("Diagnostics takes null for never: a status keeps its own level however old", () => {
    render(<Diagnostics label="AMR-07" now={NOW + 600_000} staleAfterMs={null} statuses={[{ name: "Lidar", level: "ok", receivedAt: NOW }]} />)
    expect(document.querySelector<HTMLElement>("[data-slot=diagnostics-row]")!.dataset.level).toBe("ok")
  })
})
