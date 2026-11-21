import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  RobotModel,
  UrdfError,
  applyJointValues,
  axesOnScreen,
  cameraPosition,
  defaultRobotModelLabels,
  describeHighlight,
  describeRobot,
  fitView,
  highlightedLinks,
  jointStateToRecord,
  orbitView,
  panView,
  parseUrdf,
  robotModelSummary,
  viewForKey,
  zoomView,
  type RobotModelView,
} from "@/registry/syncrobotic/ui/robot-model"
import { demoArmPose, demoArmUrdf } from "../../stories/robot-model-arm"

// The DOM here (happy-dom) has no WebGL, so the component shows its words fallback; the 3D view is checked in the
// Storybook screenshots. Parsing the URDF, setting the joints, the words and the camera's keys are pure and tested here.
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// The load runs in an effect and finishes on a later tick.
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })

const meshUrdf = (filename: string) => `<robot name="Mesh bot"><link name="base"><visual><geometry><mesh filename="${filename}"/></geometry></visual></link></robot>`

describe("parseUrdf", () => {
  it("builds the demo arm's links, joints and primitive visuals", () => {
    const robot = parseUrdf(demoArmUrdf)
    expect(robot.robotName).toBe("Demo arm")
    expect(Object.keys(robot.joints)).toHaveLength(7)
    expect(Object.keys(robot.links)).toHaveLength(8)
    const kinds = new Set<string>()
    robot.traverse((o) => {
      const g = (o as { geometry?: { type: string } }).geometry
      if (g) kinds.add(g.type)
    })
    expect([...kinds].sort()).toEqual(["BoxGeometry", "CylinderGeometry", "SphereGeometry"])
  })

  it("skips the visuals when asked, for the words fallback", () => {
    let meshes = 0
    parseUrdf(demoArmUrdf, { visuals: false }).traverse((o) => {
      if ((o as { isMesh?: boolean }).isMesh) meshes++
    })
    expect(meshes).toBe(0)
  })

  it("refuses text that is not a URDF, in words", () => {
    expect(() => parseUrdf("<html><body>Not found</body></html>")).toThrow(UrdfError)
    expect(() => parseUrdf("<robot name='x'><link")).toThrow(defaultRobotModelLabels.invalidUrdf)
  })

  it("names a package:// mesh whose package has no path, without fetching it", () => {
    const ends: [string, string | undefined][] = []
    parseUrdf(meshUrdf("package://arm_description/meshes/base.stl"), { onMeshEnd: (path, error) => ends.push([path, error]) })
    expect(ends).toEqual([["package://arm_description/meshes/base.stl", "no path given for package “arm_description”"]])
  })

  it("says a mesh format it cannot read is not supported", () => {
    const ends: [string, string | undefined][] = []
    parseUrdf(meshUrdf("meshes/base.obj"), { meshBaseUrl: "/robots/bot", onMeshEnd: (path, error) => ends.push([path, error]) })
    expect(ends).toEqual([["/robots/bot/meshes/base.obj", defaultRobotModelLabels.unsupportedMesh]])
  })

  it("resolves package:// paths through `packages`, then under `meshBaseUrl`", () => {
    const starts: string[] = []
    const urdf = `<robot name="r"><link name="a"><visual><geometry><mesh filename="package://arm/a.obj"/></geometry></visual></link><link name="b"><visual><geometry><mesh filename="package://gripper/b.obj"/></geometry></visual></link></robot>`
    parseUrdf(urdf, { packages: { arm: "https://cdn.example/arm/" }, meshBaseUrl: "/pkgs", onMeshStart: (p) => starts.push(p) })
    expect(starts).toEqual(["https://cdn.example/arm/a.obj", "/pkgs/gripper/b.obj"])
  })
})

describe("joints", () => {
  it("describes the joints that move, with their limits and the link each moves", () => {
    const info = describeRobot(parseUrdf(demoArmUrdf))
    expect(info.name).toBe("Demo arm")
    expect(info.joints.map((j) => j.name)).toEqual(["shoulder_pan", "shoulder_lift", "elbow", "wrist_1", "wrist_2", "wrist_3"])
    expect(info.joints.find((j) => j.name === "wrist_2")).toEqual({ name: "wrist_2", type: "revolute", lower: -2.8, upper: 2.8, child: "wrist_2_link" })
    expect(info.links).toContain("gripper_link")
  })

  it("sets each joint, even past its limit, and returns the names the model does not have", () => {
    const robot = parseUrdf(demoArmUrdf)
    const unknown = applyJointValues(robot, { ...demoArmPose, wrist_2: 3.0, finger: 0.01 })
    expect(unknown).toEqual(["finger"])
    expect(robot.joints.elbow!.angle).toBeCloseTo(1.1)
    // 3.0 is past wrist_2's 2.8 limit: drawn where the robot says it is.
    expect(robot.joints.wrist_2!.angle).toBeCloseTo(3.0)
  })

  it("turns a JointState message into the record, skipping missing and non-finite positions", () => {
    expect(jointStateToRecord({ name: ["a", "b", "c", "d"], position: [0.5, Number.NaN, -1] })).toEqual({ a: 0.5, c: -1 })
  })

  it("highlights the link a joint moves, and a link by its own name", () => {
    const info = describeRobot(parseUrdf(demoArmUrdf))
    expect([...highlightedLinks(info, ["wrist_2", "gripper_link", "nope"])].sort()).toEqual(["gripper_link", "wrist_2_link"])
  })
})

describe("words", () => {
  const info = describeRobot(parseUrdf(demoArmUrdf))

  it("reads the robot, that it is 3D, its joint count and what is highlighted", () => {
    expect(robotModelSummary(info, demoArmPose, undefined, defaultRobotModelLabels)).toBe("Demo arm, 3D view, 6 joints")
    expect(robotModelSummary(info, { ...demoArmPose, wrist_2: 2.71 }, ["wrist_2", "gripper_link", "ghost"], defaultRobotModelLabels)).toBe(
      "Demo arm, 3D view, 6 joints. Highlighted: wrist_2 at 155°, limits −160° to 160°; gripper_link (link)",
    )
  })

  it("prefers the label to the URDF's name", () => {
    expect(robotModelSummary(info, {}, [], defaultRobotModelLabels, "Cell 3 arm")).toBe("Cell 3 arm, 3D view, 6 joints")
  })

  it("writes prismatic joints in millimetres and a joint without a value without one", () => {
    const slide = { name: "slider", type: "prismatic" as const, lower: -0.25, upper: 0.25, child: "carriage" }
    const withSlide = { ...info, joints: [...info.joints, slide] }
    expect(describeHighlight("slider", withSlide, { slider: 0.2 }, defaultRobotModelLabels)).toBe("slider at 200 mm, limits −250 mm to 250 mm")
    expect(describeHighlight("slider", withSlide, {}, defaultRobotModelLabels)).toBe("slider limits −250 mm to 250 mm")
  })

  it("takes translated words", () => {
    const zh = { ...defaultRobotModelLabels, summary: (r: string, n: number) => `${r}，3D 檢視，${n} 個關節`, highlighted: (items: string[]) => `標示：${items.join("；")}` }
    expect(robotModelSummary(info, demoArmPose, ["wrist_2"], zh)).toBe("Demo arm，3D 檢視，6 個關節. 標示：wrist_2 at 23°, limits −160° to 160°")
  })
})

describe("camera", () => {
  const v: RobotModelView = { yaw: 0, pitch: 0, distance: 2, target: [0, 0.5, 0] }
  const frame = { width: 400, height: 300 }

  it("turns, tilts, moves and zooms from the keys, and leaves other keys alone", () => {
    expect((viewForKey("ArrowLeft", false, v, frame) as RobotModelView).yaw).toBeCloseTo(Math.PI / 12)
    expect((viewForKey("ArrowRight", false, v, frame) as RobotModelView).yaw).toBeCloseTo(-Math.PI / 12)
    expect((viewForKey("ArrowUp", false, v, frame) as RobotModelView).pitch).toBeCloseTo(Math.PI / 12)
    expect((viewForKey("+", false, v, frame) as RobotModelView).distance).toBeCloseTo(1.6)
    expect((viewForKey("-", false, v, frame) as RobotModelView).distance).toBeCloseTo(2.5)
    const moved = viewForKey("ArrowRight", true, v, frame) as RobotModelView
    expect(moved.yaw).toBe(0)
    expect(moved.target[0]).toBeLessThan(0)
    expect(viewForKey("0", false, v, frame)).toBe("reset")
    expect(viewForKey("f", false, v, frame)).toBe("fit")
    expect(viewForKey("Enter", false, v, frame)).toBeNull()
    expect(viewForKey("a", false, v, frame)).toBeNull()
  })

  it("stops the tilt short of straight down and just below the floor, and keeps the zoom in range", () => {
    expect(orbitView(v, 0, 10).pitch).toBe(1.5)
    expect(orbitView(v, 0, -10).pitch).toBe(-0.25)
    expect(zoomView(v, 1e6).distance).toBe(0.05)
    expect(zoomView(v, 1e-6).distance).toBe(200)
  })

  it("moves the target with the drag, so what is under the pointer stays under it", () => {
    const p = panView(v, 0, 100, 300)
    expect(p.target[1]).toBeGreaterThan(v.target[1])
    expect(p.target[0]).toBeCloseTo(0)
  })

  it("fits a bounding sphere, by the narrower field of view in a portrait frame", () => {
    const b = { center: [0, 0.4, 0] as [number, number, number], radius: 0.5, floor: 0 }
    const wide = fitView(b, 4 / 3)
    const tall = fitView(b, 0.5)
    expect(wide.target).toEqual([0, 0.4, 0])
    expect(tall.distance).toBeGreaterThan(wide.distance)
    const [x, y, z] = cameraPosition(wide)
    expect(Math.hypot(x, y - 0.4, z)).toBeCloseTo(wide.distance)
  })

  it("draws ROS's axes: z up on screen, x across when looking along -y", () => {
    const [x, y, z] = axesOnScreen({ yaw: 0, pitch: 0 }, "z")
    expect(x!.x).toBeCloseTo(1)
    expect(z!.y).toBeCloseTo(-1)
    // y (left) points straight away from this camera, so it has no length on screen.
    expect(Math.hypot(y!.x, y!.y)).toBeCloseTo(0)
  })
})

describe("RobotModel without WebGL", () => {
  it("lists the joints in words, the highlighted one marked with an icon and its detail", async () => {
    const { container } = render(<RobotModel urdf={demoArmUrdf} joints={{ ...demoArmPose, wrist_2: 2.71 }} highlight={["wrist_2"]} />)
    await flush()
    const root = container.querySelector("[data-slot=robot-model]")!
    expect(root.getAttribute("data-state")).toBe("no-webgl")
    expect(screen.getByText(defaultRobotModelLabels.noWebgl)).toBeTruthy()
    const list = screen.getByRole("region", { name: "Joint positions" })
    expect(list.textContent).toContain("shoulder_pan")
    expect(list.textContent).toContain("63°")
    const lit = container.querySelector("[data-highlighted]")!
    expect(lit.textContent).toContain("wrist_2")
    expect(lit.textContent).toContain("155°")
    expect(lit.textContent).toContain("limits −160° to 160°")
    expect(lit.querySelector("svg")).toBeTruthy()
    // Words only: nothing to Tab to, nothing drawn.
    expect(container.querySelector("canvas")).toBeNull()
    expect(container.querySelector("[tabindex]")).toBeNull()
  })

  it("is the same with webgl={false} where WebGL would work", async () => {
    render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} webgl={false} label="Cell 3 arm" />)
    await flush()
    expect(screen.getByText("Cell 3 arm")).toBeTruthy()
    expect(screen.getByText("6 joints", { exact: false })).toBeTruthy()
  })

  it("says No value for a joint the message did not carry", async () => {
    render(<RobotModel urdf={demoArmUrdf} joints={{ elbow: 1 }} />)
    await flush()
    expect(screen.getAllByText("No value")).toHaveLength(5)
  })
})

describe("RobotModel states", () => {
  it("is empty with no URDF, and loading while the app is still getting one", () => {
    const { container, rerender } = render(<RobotModel />)
    expect(container.querySelector("[data-slot=robot-model]")!.getAttribute("data-state")).toBe("empty")
    expect(screen.getByText(defaultRobotModelLabels.empty)).toBeTruthy()
    rerender(<RobotModel loading label="Demo arm" />)
    expect(container.querySelector("[data-slot=robot-model]")!.getAttribute("data-state")).toBe("loading")
    expect(screen.getByRole("status").textContent).toBe(defaultRobotModelLabels.loading)
  })

  it("names the URL that failed and loads it again on request", async () => {
    const fetch = vi.fn(async () => new Response("", { status: 404, statusText: "Not Found" }))
    vi.stubGlobal("fetch", fetch)
    const { container } = render(<RobotModel urdfUrl="/robots/arm.urdf" />)
    await flush()
    expect(container.querySelector("[data-slot=robot-model]")!.getAttribute("data-state")).toBe("error")
    expect(screen.getByText("/robots/arm.urdf: HTTP 404 Not Found")).toBeTruthy()
    fetch.mockImplementation(async () => new Response(demoArmUrdf, { status: 200 }))
    await act(async () => screen.getByRole("button", { name: "Load again" }).click())
    await flush()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(container.querySelector("[data-slot=robot-model]")!.getAttribute("data-state")).toBe("no-webgl")
    vi.unstubAllGlobals()
  })

  it("says a URDF that is not one is broken, and hands Load again to onRetry", async () => {
    const onRetry = vi.fn()
    render(<RobotModel urdf="<robot" onRetry={onRetry} />)
    await flush()
    expect(screen.getByText(`URDF: ${defaultRobotModelLabels.invalidUrdf}`)).toBeTruthy()
    screen.getByRole("button", { name: "Load again" }).click()
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("goes stale after staleAfterMs without new joints, with the last update's time, and clears on the next", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date(2026, 10, 21, 14, 2, 31))
    const { container, rerender } = render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={1000} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    const root = () => container.querySelector("[data-slot=robot-model]")!
    expect(root().getAttribute("data-state")).toBe("no-webgl")
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(container.querySelector("[data-slot=robot-model-state]")!.textContent).toBe("Stale · last update 14:02:31")
    expect(screen.getByRole("status").textContent).toBe("Stale, last update 14:02:31")
    rerender(<RobotModel urdf={demoArmUrdf} joints={{ ...demoArmPose, elbow: demoArmPose.elbow + 0.01 }} staleAfterMs={1000} />)
    expect(container.querySelector("[data-slot=robot-model-state]")).toBeNull()
  })

  it("goes stale from a message stamp that is already old, and from one ahead of this clock after staleAfterMs", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date(2026, 10, 21, 14, 5, 0))
    const { container, rerender } = render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} updatedAt={new Date(2026, 10, 21, 14, 2, 31)} staleAfterMs={1000} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(container.querySelector("[data-slot=robot-model-state]")!.textContent).toContain("14:02:31")
    rerender(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} updatedAt={new Date(2026, 10, 21, 15, 0, 0)} staleAfterMs={1000} />)
    expect(container.querySelector("[data-slot=robot-model-state]")).toBeNull()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(container.querySelector("[data-slot=robot-model-state]")!.textContent).toContain("15:00:00")
  })

  it("takes translated labels", async () => {
    render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} labels={{ jointCount: (n) => `${n} 個關節`, jointsHeading: "關節位置", noWebgl: "無法顯示 3D。" }} />)
    await flush()
    expect(screen.getByText("· 6 個關節", { exact: false })).toBeTruthy()
    expect(screen.getByRole("region", { name: "關節位置" })).toBeTruthy()
    expect(screen.getByText("無法顯示 3D。")).toBeTruthy()
  })
})

describe("RobotModel: what counts as an update", () => {
  it("does not take a new object with the same joint values for an update, so an inline joints prop still goes stale", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date(2026, 10, 21, 14, 2, 31))
    const { container, rerender } = render(<RobotModel urdf={demoArmUrdf} joints={{ ...demoArmPose }} staleAfterMs={1000} />)
    const stale = () => container.querySelector("[data-slot=robot-model-state]")?.textContent ?? null
    // A parent that renders every 100 ms with the same values, built anew each time.
    for (let i = 0; i < 15; i++) {
      rerender(<RobotModel urdf={demoArmUrdf} joints={{ ...demoArmPose }} staleAfterMs={1000} />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
    }
    expect(stale()).toBe("Stale · last update 14:02:31")
    // A changed value is an update.
    rerender(<RobotModel urdf={demoArmUrdf} joints={{ ...demoArmPose, elbow: 1.2 }} staleAfterMs={1000} />)
    expect(stale()).toBeNull()
  })

  it("with an old stamp, stays stale across renders that bring the same values, and announces it once", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date(2026, 10, 21, 14, 5, 0))
    const at = new Date(2026, 10, 21, 14, 2, 31).getTime()
    const view = () => <RobotModel urdf={demoArmUrdf} joints={{ ...demoArmPose }} updatedAt={at} staleAfterMs={1000} />
    const { container, rerender } = render(view())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    const status = screen.getByRole("status")
    expect(status.textContent).toBe("Stale, last update 14:02:31")
    const said: string[] = []
    const mo = new MutationObserver(() => said.push(status.textContent ?? ""))
    mo.observe(status, { childList: true, characterData: true, subtree: true })
    for (let i = 0; i < 5; i++) {
      rerender(view())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10)
      })
      expect(container.querySelector("[data-slot=robot-model-state]")?.textContent).toContain("14:02:31")
    }
    mo.disconnect()
    expect(said).toEqual([])
  })
})

describe("RobotModel: loading edge cases", () => {
  it("says an empty URDF file is not one, instead of loading forever", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 200 })))
    const { container } = render(<RobotModel urdfUrl="/robots/empty.urdf" />)
    await flush()
    expect(container.querySelector("[data-slot=robot-model]")!.getAttribute("data-state")).toBe("error")
    expect(screen.getByText(`/robots/empty.urdf: ${defaultRobotModelLabels.invalidUrdf}`)).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it("loads a mesh whose path has a query string, reading the format without it", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})))
    const starts: string[] = []
    const ends: [string, string | undefined][] = []
    parseUrdf(meshUrdf("meshes/base.stl?v=2"), { meshBaseUrl: "https://robots.example/bot", onMeshStart: (p) => starts.push(p), onMeshEnd: (p, e) => ends.push([p, e]) })
    expect(starts).toEqual(["https://robots.example/bot/meshes/base.stl?v=2"])
    // Not refused as an unsupported format: it is being fetched.
    expect(ends).toEqual([])
    vi.unstubAllGlobals()
  })

  it("reports nothing for a mesh that arrives after the view stopped wanting it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404, statusText: "Not Found" })))
    const load = (url: string, signal?: AbortSignal) => {
      const ends: string[] = []
      parseUrdf(meshUrdf(url), { signal, onMeshEnd: (p) => ends.push(p) })
      return ends
    }
    const ctrl = new AbortController()
    const aborted = load("https://robots.example/a/gone.stl", ctrl.signal)
    ctrl.abort()
    const wanted = load("https://robots.example/b/gone.stl")
    await flush()
    await flush()
    expect(wanted).toEqual(["https://robots.example/b/gone.stl"])
    expect(aborted).toEqual([])
    vi.unstubAllGlobals()
  })
})
