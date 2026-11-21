import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  RobotModel,
  applyJointValues,
  defaultRobotModelLabels,
  describeHighlight,
  describeRobot,
  highlightedLinks,
  jointValueOf,
  jointValueWords,
  parseUrdf,
  robotModelSummary,
} from "@/registry/syncrobotic/ui/robot-model"

// Mimic, planar and floating joints: the parts that are pure (parsing, setting joints, the words) are tested here. The
// DOM here has no WebGL, so the component renders its words fallback.
afterEach(cleanup)

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })

// A mobile base on a planar joint, a gripper whose right finger mirrors the left one (and a third pad that mimics the
// right finger, to test a chain), and a floating marker.
const urdf = `<robot name="Gripper bot">
  <link name="world"/>
  <link name="base"/>
  <link name="finger_left_link"/>
  <link name="finger_right_link"/>
  <link name="pad_link"/>
  <link name="marker"/>
  <joint name="base_planar" type="planar"><parent link="world"/><child link="base"/></joint>
  <joint name="finger_left" type="prismatic"><parent link="base"/><child link="finger_left_link"/><axis xyz="0 1 0"/><limit lower="0" upper="0.04" effort="1" velocity="1"/></joint>
  <joint name="finger_right" type="prismatic"><parent link="base"/><child link="finger_right_link"/><axis xyz="0 1 0"/><limit lower="-0.04" upper="0" effort="1" velocity="1"/><mimic joint="finger_left" multiplier="-1" offset="0"/></joint>
  <joint name="pad" type="prismatic"><parent link="finger_right_link"/><child link="pad_link"/><axis xyz="0 0 1"/><limit lower="0" upper="0.01" effort="1" velocity="1"/><mimic joint="finger_right" multiplier="-0.5" offset="0.001"/></joint>
  <joint name="marker_float" type="floating"><parent link="world"/><child link="marker"/></joint>
</robot>`

const l = defaultRobotModelLabels

describe("describeRobot with mimic joints", () => {
  it("counts the joints that move on their own and lists the mimic joints apart, with what they follow", () => {
    const info = describeRobot(parseUrdf(urdf))
    expect(info.joints.map((j) => j.name)).toEqual(["base_planar", "finger_left", "marker_float"])
    expect(info.mimics?.map((j) => [j.name, j.mimic])).toEqual([
      ["finger_right", { joint: "finger_left", multiplier: -1, offset: 0 }],
      ["pad", { joint: "finger_right", multiplier: -0.5, offset: 0.001 }],
    ])
    expect(robotModelSummary(info, {}, undefined, l)).toBe("Gripper bot, 3D view, 3 joints")
  })
})

describe("applyJointValues with mimic joints", () => {
  it("moves a mimic joint (and a mimic of a mimic) with the joint it follows", () => {
    const robot = parseUrdf(urdf)
    applyJointValues(robot, { finger_left: 0.03 })
    expect(robot.joints.finger_right!.jointValue[0]).toBeCloseTo(-0.03)
    expect(robot.joints.pad!.jointValue[0]).toBeCloseTo(0.016)
  })

  it("applies no limits to a mimic joint either, so it follows a value past the limit", () => {
    const robot = parseUrdf(urdf)
    // 0.06 is past finger_left's 0.04 and the mirrored −0.06 past finger_right's −0.04: both drawn where reported.
    applyJointValues(robot, { finger_left: 0.06 })
    expect(robot.joints.finger_left!.jointValue[0]).toBeCloseTo(0.06)
    expect(robot.joints.finger_right!.jointValue[0]).toBeCloseTo(-0.06)
    expect(Object.values(robot.joints).every((j) => j.ignoreLimits)).toBe(true)
  })

  it("keeps the driving joint's value over a mimic joint's own, in either order", () => {
    const records: Record<string, number>[] = [
      { finger_right: -0.01, finger_left: 0.02 },
      { finger_left: 0.02, finger_right: -0.01 },
      { pad: 0.5, finger_right: -0.01, finger_left: 0.02 },
    ]
    for (const record of records) {
      const robot = parseUrdf(urdf)
      applyJointValues(robot, record)
      expect(robot.joints.finger_right!.jointValue[0]).toBeCloseTo(-0.02)
      expect(robot.joints.pad!.jointValue[0]).toBeCloseTo(0.011)
    }
  })

  it("uses a mimic joint's own value when the joint it follows has none", () => {
    const robot = parseUrdf(urdf)
    applyJointValues(robot, { finger_right: -0.01 })
    expect(robot.joints.finger_right!.jointValue[0]).toBeCloseTo(-0.01)
  })
})

describe("applyJointValues with planar and floating joints", () => {
  it("sets a planar joint's x, y and θ from an array", () => {
    const robot = parseUrdf(urdf)
    applyJointValues(robot, { base_planar: [0.12, -0.04, Math.PI / 6] })
    expect(robot.joints.base_planar!.jointValue).toEqual([0.12, -0.04, Math.PI / 6])
    const p = robot.joints.base_planar!.position
    expect([p.x, p.y, p.z].map((v) => Number(v.toFixed(6)))).toEqual([0.12, -0.04, 0])
  })

  it("reads one number as x and keeps the other components, never NaN", () => {
    const robot = parseUrdf(urdf)
    applyJointValues(robot, { base_planar: [0.1, 0.2, 0.3] })
    applyJointValues(robot, { base_planar: 0.5, marker_float: [1, 2, 3, NaN] })
    expect(robot.joints.base_planar!.jointValue).toEqual([0.5, 0.2, 0.3])
    expect(robot.joints.marker_float!.jointValue).toEqual([1, 2, 3, 0, 0, 0])
    for (const j of Object.values(robot.joints)) {
      expect(j.position.toArray().every(Number.isFinite)).toBe(true)
      expect(j.quaternion.toArray().every(Number.isFinite)).toBe(true)
    }
  })
})

describe("words for mimic, planar and floating joints", () => {
  const info = describeRobot(parseUrdf(urdf))

  it("highlights a mimic joint by name: its link is drawn and its value follows the joint it mimics", () => {
    expect([...highlightedLinks(info, ["finger_right"])]).toEqual(["finger_right_link"])
    expect(jointValueOf("finger_right", info, { finger_left: 0.03 })).toBeCloseTo(-0.03)
    expect(jointValueOf("finger_right", info, { finger_right: -0.01 })).toBeCloseTo(-0.01)
    expect(describeHighlight("finger_right", info, { finger_left: 0.03 }, l)).toBe("finger_right at −30 mm, limits −40 mm to 0 mm")
    expect(describeHighlight("pad", info, { finger_left: 0.03 }, l)).toBe("pad at 16 mm, limits 0 mm to 10 mm")
  })

  it("writes a planar joint as x and y in millimetres and θ in degrees, never x in degrees", () => {
    expect(jointValueWords([0.12, -0.04, Math.PI / 6], "planar", l)).toBe("x 120 mm, y −40 mm, θ 30°")
    expect(jointValueWords(0.12, "planar", l)).toBe("x 120 mm")
    expect(l.jointValue(0.12, "planar")).toBe("120 mm")
    expect(describeHighlight("base_planar", info, { base_planar: [0.12, -0.04, Math.PI / 6] }, l)).toBe("base_planar at x 120 mm, y −40 mm, θ 30°")
  })

  it("writes all six components of a floating joint, each with its unit", () => {
    expect(jointValueWords([1, 0, 0.5, 0, Math.PI / 2, -Math.PI], "floating", l)).toBe("x 1000 mm, y 0 mm, z 500 mm, roll 0°, pitch 90°, yaw −180°")
    expect(jointValueWords([NaN, NaN], "floating", l)).toBeUndefined()
  })

  it("writes one-number joints as before, and the first component when given an array", () => {
    expect(jointValueWords(Math.PI / 2, "revolute", l)).toBe("90°")
    expect(jointValueWords([0.02], "prismatic", l)).toBe("20 mm")
    expect(jointValueWords(NaN, "revolute", l)).toBeUndefined()
  })

  it("lists planar joints with their units in the fallback and marks the row a highlighted mimic joint follows", async () => {
    render(<RobotModel urdf={urdf} joints={{ base_planar: [0.12, -0.04, Math.PI / 6], finger_left: 0.03 }} highlight={["finger_right"]} />)
    await flush()
    const list = screen.getByRole("region", { name: "Joint positions" })
    expect(list.textContent).toContain("x 120 mm, y −40 mm, θ 30°")
    expect(list.textContent).not.toMatch(/x \d+°/)
    const lit = list.querySelectorAll("[data-highlighted]")
    expect([...lit].map((row) => row.querySelector("dt")?.textContent)).toEqual(["finger_left"])
  })
})
