import { describe, expect, it } from "vitest"
import { a11yOf } from "@/site/a11y"
import { storyTitle } from "@/site/catalog"

describe("example captions", () => {
  it("keep acronyms and names with an inner capital", () => {
    expect(storyTitle("PointCloudNoWebGL")).toBe("Point cloud no WebGL")
    expect(storyTitle("InputOTPDigits")).toBe("Input OTP digits")
    expect(storyTitle("DeliveredOverBluetooth")).toBe("Delivered over Bluetooth")
    expect(storyTitle("TeleopPadDrivingASimulatedRobot")).toBe("Teleop pad driving a simulated robot")
  })
})

describe("contrast rows", () => {
  it("list white on the stop's reds for the stop, slide to release and the dock", () => {
    for (const name of ["stop-button", "slide-to-release", "dock"]) {
      const labels = a11yOf(name)!.contrast.map((c) => c.label)
      expect(labels, name).toContain("Label on the deep red")
    }
    expect(a11yOf("stop-button")!.contrast.map((c) => c.label)).toContain("Stop label")
  })

  it("do not claim the Slider pattern for slide to release, and say why it is a slider", () => {
    const a = a11yOf("slide-to-release")!
    expect(a.patterns.map((p) => p.title)).not.toContain("Slider")
    expect(a.patternNote).toMatch(/arrow keys do nothing/)
  })
})
