import { describe, expect, it } from "vitest"
import { a11yOf, keyParts } from "@/site/a11y"
import { storyTitle } from "@/site/catalog"

describe("example captions", () => {
  it("keep acronyms and names with an inner capital", () => {
    expect(storyTitle("PointCloudNoWebGL")).toBe("Point cloud no WebGL")
    expect(storyTitle("InputOTPDigits")).toBe("Input OTP digits")
    expect(storyTitle("DeliveredOverBluetooth")).toBe("Delivered over Bluetooth")
    expect(storyTitle("TeleopPadDrivingASimulatedRobot")).toBe("Teleop pad driving a simulated robot")
  })
})

// The Accessibility tab draws keys as keycaps; the words around them ("Hold", "2 s", "away") stay words.
const drawn = (keys: string) => keyParts(keys).map((p) => (p.key ? `[${p.text}]` : p.text)).join("")

describe("keyboard rows", () => {
  it("draws only the keys as keycaps", () => {
    expect(drawn("Hold Enter / Space 2 s")).toBe("Hold [Enter] / [Space] 2 s")
    expect(drawn("Hold ↑ / W, ↓ / S")).toBe("Hold [↑] / [W], [↓] / [S]")
    expect(drawn("Release every drive key")).toBe("Release every drive key")
    expect(drawn("Tab away")).toBe("[Tab] away")
    expect(drawn("Enter / Space on a group")).toBe("[Enter] / [Space] on a group")
    expect(drawn("Page Up / Page Down")).toBe("[Page Up] / [Page Down]")
    expect(drawn("Shift+F10 / Menu key")).toBe("[Shift+F10] / [Menu key]")
    expect(drawn("⌘B / Ctrl+B")).toBe("[⌘B] / [Ctrl+B]")
    expect(drawn("+ / -")).toBe("[+] / [-]")
    expect(drawn("/")).toBe("[/]")
    expect(drawn("Type a letter")).toBe("Type a letter")
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
