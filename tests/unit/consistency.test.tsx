import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Island } from "@/registry/syncrobotic/shell/island"
import { toneSubtle } from "@/registry/syncrobotic/shell/status-glyph"
import { Stepper, StepperItem } from "@/registry/syncrobotic/ui/stepper"

afterEach(cleanup)

describe("calm states stay grey", () => {
  it("tints only warning and danger", () => {
    expect(toneSubtle.info).toBe("bg-neutral-subtle")
    expect(toneSubtle.success).toBe("bg-neutral-subtle")
    expect(toneSubtle.warning).toBe("bg-warning-subtle")
  })
})

describe("island status", () => {
  it("says offline and charging, not only a low battery", () => {
    render(<Island name="7F3A" tone="neutral" online={false} charging battery={64} />)
    expect(screen.getByRole("button", { name: "Device status, offline, charging, battery 64%" })).toBeTruthy()
  })
})

describe("stepper", () => {
  it("keeps the current step current when it has an error, and does not offer to jump to it", () => {
    render(
      <Stepper value={2} errors={[2]} navigable="all" onValueChange={() => {}}>
        <StepperItem title="Robot" />
        <StepperItem title="Route" />
        <StepperItem title="Review" />
      </Stepper>,
    )
    const items = screen.getAllByRole("listitem")
    expect(items[1].getAttribute("aria-current")).toBe("step")
    expect(items[1].querySelector("button")).toBeNull()
    expect(items[0].querySelector("button")).toBeTruthy()
  })
})
