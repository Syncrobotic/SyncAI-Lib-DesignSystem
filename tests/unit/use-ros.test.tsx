import * as React from "react"
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createRosConnection, isZeroTwist, zeroTwist, type RosConnection, type RosTwist } from "@/registry/syncrobotic/lib/ros"
import { RosProvider, useRosPublisher, useRosService, useRosStatus, useRosTopic } from "@/registry/syncrobotic/hooks/use-ros"
import { fakeRosbridge } from "./fake-rosbridge"

// The hooks over a fake rosbridge: what they render, what goes on the wire, and what is left behind after unmount.

const drive: RosTwist = { linear: { x: 0.4, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } }
const flush = () => act(async () => {})

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
  vi.unstubAllGlobals()
})

function Status() {
  const s = useRosStatus()
  return <p data-testid="status">{s.state}</p>
}

function Odom({ id }: { id: string }) {
  const msg = useRosTopic<{ x: number }>("/odom", "nav_msgs/Odometry", { throttleMs: 100 })
  return <p data-testid={id}>{msg ? `x ${msg.x}` : "waiting"}</p>
}

describe("useRosStatus and useRosTopic", () => {
  it("renders the state and the latest message, shared by two components on one subscription", async () => {
    render(
      <RosProvider connection={ros}>
        <Status />
        <Odom id="a" />
        <Odom id="b" />
      </RosProvider>,
    )
    expect(screen.getByTestId("status").textContent).toBe("connecting")
    expect(screen.getByTestId("a").textContent).toBe("waiting")
    act(() => bridge.last.open())
    expect(screen.getByTestId("status").textContent).toBe("open")
    expect(bridge.ops("subscribe")).toHaveLength(1)
    act(() => bridge.last.emit({ op: "publish", topic: "/odom", msg: { x: 2 } }))
    expect(screen.getByTestId("a").textContent).toBe("x 2")
    expect(screen.getByTestId("b").textContent).toBe("x 2")
  })

  it("unsubscribes after the last component unmounts", async () => {
    act(() => bridge.last.open())
    const { unmount } = render(
      <RosProvider connection={ros}>
        <Odom id="a" />
      </RosProvider>,
    )
    unmount()
    await flush()
    expect(bridge.ops("unsubscribe")).toHaveLength(1)
  })

  it("subscribes once under StrictMode's double mount, and never unsubscribes on the wire", async () => {
    act(() => bridge.last.open())
    render(
      <React.StrictMode>
        <RosProvider connection={ros}>
          <Odom id="a" />
        </RosProvider>
      </React.StrictMode>,
    )
    await flush()
    expect(bridge.ops("subscribe")).toHaveLength(1)
    expect(bridge.ops("unsubscribe")).toHaveLength(0)
  })

  it("enabled: false unsubscribes and returns undefined", async () => {
    act(() => bridge.last.open())
    function Toggle({ on }: { on: boolean }) {
      const msg = useRosTopic<{ x: number }>("/odom", "nav_msgs/Odometry", { enabled: on })
      return <p data-testid="t">{msg ? "has" : "none"}</p>
    }
    const { rerender } = render(
      <RosProvider connection={ros}>
        <Toggle on />
      </RosProvider>,
    )
    act(() => bridge.last.emit({ op: "publish", topic: "/odom", msg: { x: 1 } }))
    expect(screen.getByTestId("t").textContent).toBe("has")
    rerender(
      <RosProvider connection={ros}>
        <Toggle on={false} />
      </RosProvider>,
    )
    await flush()
    expect(screen.getByTestId("t").textContent).toBe("none")
    expect(bridge.ops("unsubscribe")).toHaveLength(1)
  })

  it("throws a clear error outside a RosProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<Status />)).toThrow(/RosProvider/)
  })
})

describe("RosProvider with a url", () => {
  it("opens one connection on mount (also under StrictMode) and closes it on unmount", () => {
    const own = fakeRosbridge()
    vi.stubGlobal("WebSocket", own.WebSocket)
    const { unmount } = render(
      <React.StrictMode>
        <RosProvider url="ws://other:9090">
          <Status />
        </RosProvider>
      </React.StrictMode>,
    )
    // StrictMode connects, closes and connects again: the first socket is closed, the second is the live one.
    const live = own.sockets.filter((s) => !s.closedByClient)
    expect(live).toHaveLength(1)
    act(() => live[0]!.open())
    expect(screen.getByTestId("status").textContent).toBe("open")
    unmount()
    expect(live[0]!.closedByClient).toBe(true)
  })

  it("makes a new connection for a new url", () => {
    const own = fakeRosbridge()
    vi.stubGlobal("WebSocket", own.WebSocket)
    const { rerender } = render(<RosProvider url="ws://a:9090" />)
    rerender(<RosProvider url="ws://b:9090" />)
    expect(own.sockets.map((s) => [s.url, s.closedByClient])).toEqual([
      ["ws://a:9090", true],
      ["ws://b:9090", false],
    ])
  })
})

function Drive({ onReady }: { onReady: (publish: (t: RosTwist) => boolean) => void }) {
  const publish = useRosPublisher<RosTwist>("/cmd_vel", "geometry_msgs/Twist")
  React.useEffect(() => {
    onReady(publish)
  }, [publish, onReady])
  return null
}

describe("useRosPublisher", () => {
  const twists = () => bridge.ops("publish").map((f) => (isZeroTwist(f.msg as RosTwist) ? "zero" : "drive"))

  it("returns the same function across renders and advertises only on the first publish", () => {
    act(() => bridge.last.open())
    const seen: unknown[] = []
    const onReady = (p: unknown) => seen.push(p)
    const { rerender } = render(
      <RosProvider connection={ros}>
        <Drive onReady={onReady} />
      </RosProvider>,
    )
    rerender(
      <RosProvider connection={ros}>
        <Drive onReady={onReady} />
      </RosProvider>,
    )
    expect(new Set(seen).size).toBe(1)
    expect(bridge.ops("advertise")).toHaveLength(0)
  })

  it("sends a zero Twist on unmount mid-drive, then unadvertises", () => {
    act(() => bridge.last.open())
    let publish!: (t: RosTwist) => boolean
    const { unmount } = render(
      <RosProvider connection={ros}>
        <Drive onReady={(p) => (publish = p)} />
      </RosProvider>,
    )
    act(() => void publish(drive))
    unmount()
    expect(twists()).toEqual(["drive", "zero"])
    act(() => vi.advanceTimersByTime(500))
    expect(bridge.ops("unadvertise")).toHaveLength(1)
  })

  it("sends a zero Twist when the page hides mid-drive, and drives again only after a stop", () => {
    act(() => bridge.last.open())
    let publish!: (t: RosTwist) => boolean
    render(
      <RosProvider connection={ros}>
        <Drive onReady={(p) => (publish = p)} />
      </RosProvider>,
    )
    act(() => void publish(drive))
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")
    act(() => void document.dispatchEvent(new Event("visibilitychange")))
    expect(twists()).toEqual(["drive", "zero"])
    expect(publish(drive)).toBe(false)
    expect(publish(zeroTwist())).toBe(true)
    expect(publish(drive)).toBe(true)
  })

  it("sends a zero Twist first when the link comes back after dropping mid-drive", () => {
    act(() => bridge.last.open())
    let publish!: (t: RosTwist) => boolean
    render(
      <RosProvider connection={ros}>
        <Drive onReady={(p) => (publish = p)} />
      </RosProvider>,
    )
    act(() => void publish(drive))
    act(() => bridge.last.drop())
    act(() => vi.advanceTimersByTime(10_000))
    act(() => bridge.last.open())
    expect(bridge.last.sent.find((f) => f.op === "publish")!.msg).toEqual(zeroTwist())
  })

  it("keeps working after StrictMode's double mount", () => {
    act(() => bridge.last.open())
    let publish!: (t: RosTwist) => boolean
    render(
      <React.StrictMode>
        <RosProvider connection={ros}>
          <Drive onReady={(p) => (publish = p)} />
        </RosProvider>
      </React.StrictMode>,
    )
    expect(publish(drive)).toBe(true)
    expect(bridge.ops("advertise")).toHaveLength(1)
    expect(twists()).toEqual(["drive"])
  })
})

describe("useRosService", () => {
  it("calls the service and resolves with its values", async () => {
    act(() => bridge.last.open())
    let call!: (r: { data: boolean }) => Promise<{ success: boolean }>
    function Dock() {
      const dock = useRosService<{ data: boolean }, { success: boolean }>("/dock", "std_srvs/SetBool", { timeoutMs: 3000 })
      React.useEffect(() => {
        call = dock
      }, [dock])
      return null
    }
    render(
      <RosProvider connection={ros}>
        <Dock />
      </RosProvider>,
    )
    const done = call({ data: true })
    const req = bridge.ops("call_service")[0]!
    expect(req).toMatchObject({ service: "/dock", type: "std_srvs/SetBool", args: { data: true } })
    bridge.last.emit({ op: "service_response", id: req.id, service: "/dock", result: true, values: { success: true } })
    await expect(done).resolves.toEqual({ success: true })
  })
})
