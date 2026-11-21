import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createRosConnection, jointStateToJoints, type RosConnection, type RosJointState } from "@/registry/syncrobotic/lib/ros"
import { RosProvider, useRosPublisher, useRosStatus, useRosTopic } from "@/registry/syncrobotic/hooks/use-ros?react-compiler"
import { fakeRosbridge } from "./fake-rosbridge"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own components) and use-ros
// imported with ?react-compiler, so these check the hooks keep following the connection once compiled: a component that
// converts a message in its body re-renders for every new message, and the publish function keeps its identity.

let bridge: ReturnType<typeof fakeRosbridge>
let ros: RosConnection
beforeEach(() => {
  vi.useFakeTimers()
  bridge = fakeRosbridge()
  ros = createRosConnection({ url: "ws://robot:9090", WebSocket: bridge.WebSocket })
  ros.connect()
})
afterEach(() => {
  cleanup()
  ros.close()
  vi.useRealTimers()
})

function Joints() {
  const status = useRosStatus()
  const msg = useRosTopic<RosJointState>("/joint_states", "sensor_msgs/JointState")
  const joints = msg ? jointStateToJoints(msg) : []
  return (
    <p data-testid="joints">
      {status.state}: {joints.map((j) => `${j.name}=${j.position}`).join(" ")}
    </p>
  )
}

describe("compiled", () => {
  it("re-renders for each new message and each state change", () => {
    render(
      <RosProvider connection={ros}>
        <Joints />
      </RosProvider>,
    )
    expect(screen.getByTestId("joints").textContent).toBe("connecting: ")
    act(() => bridge.last.open())
    act(() => bridge.last.emit({ op: "publish", topic: "/joint_states", msg: { name: ["a"], position: [1] } }))
    expect(screen.getByTestId("joints").textContent).toBe("open: a=1")
    act(() => bridge.last.emit({ op: "publish", topic: "/joint_states", msg: { name: ["a"], position: [2] } }))
    expect(screen.getByTestId("joints").textContent).toBe("open: a=2")
  })

  it("keeps one publish function across renders", () => {
    const seen = new Set<unknown>()
    function Pad({ n }: { n: number }) {
      const publish = useRosPublisher("/cmd_vel", "geometry_msgs/Twist")
      seen.add(publish)
      return <p>{n}</p>
    }
    const { rerender } = render(
      <RosProvider connection={ros}>
        <Pad n={1} />
      </RosProvider>,
    )
    rerender(
      <RosProvider connection={ros}>
        <Pad n={2} />
      </RosProvider>,
    )
    expect(seen.size).toBe(1)
  })
})
