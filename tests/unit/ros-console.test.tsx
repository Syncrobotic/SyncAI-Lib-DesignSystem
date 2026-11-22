import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createRosConnection, type RosConnection } from "@/registry/syncrobotic/lib/ros"
import { RosProvider } from "@/registry/syncrobotic/hooks/use-ros"
import { RosConnectionLine } from "../../stories/ros-example"
import { fakeRosbridge } from "./fake-rosbridge"

// The "Connect to ROS" page's example: what its connection line says while the link is down and coming back.

let bridge: ReturnType<typeof fakeRosbridge>
let ros: RosConnection
beforeEach(() => {
  vi.useFakeTimers()
  bridge = fakeRosbridge()
  ros = createRosConnection({ url: "ws://robot:9090", WebSocket: bridge.WebSocket, random: () => 1 })
  ros.connect()
})
afterEach(() => {
  cleanup()
  ros.close()
  vi.useRealTimers()
})

const line = () => screen.getByRole("status").textContent
const button = () => screen.queryByRole("button")?.textContent

describe("RosConnectionLine", () => {
  it("holds one steady state through the backoff: Reconnecting, attempt N, with Retry now throughout", () => {
    render(
      <RosProvider connection={ros}>
        <RosConnectionLine />
      </RosProvider>,
    )
    act(() => bridge.last.open())
    expect(line()).toContain("Connected")
    expect(button()).toBeUndefined()

    // The link drops: the connection waits out its backoff (state error), then tries again (state connecting).
    act(() => bridge.last.drop())
    expect(ros.getStatus().state).toBe("error")
    expect(line()).toContain("Reconnecting, attempt 1")
    expect(button()).toBe("Retry now")
    act(() => vi.advanceTimersByTime(10_000))
    expect(ros.getStatus().state).toBe("connecting")
    // The same words and the same button: nothing on the line flips between "lost" and "reconnecting".
    expect(line()).toContain("Reconnecting, attempt 1")
    expect(button()).toBe("Retry now")

    act(() => bridge.last.drop())
    expect(line()).toContain("Reconnecting, attempt 2")
    expect(button()).toBe("Retry now")
  })

  it("says the link is lost, with Reconnect, once it has stopped retrying", () => {
    ros.close()
    ros = createRosConnection({ url: "ws://robot:9090", WebSocket: bridge.WebSocket, reconnect: false })
    ros.connect()
    render(
      <RosProvider connection={ros}>
        <RosConnectionLine />
      </RosProvider>,
    )
    act(() => bridge.last.open())
    act(() => bridge.last.drop())
    expect(line()).toContain("Connection lost")
    expect(button()).toBe("Reconnect")
  })
})
