import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
import { MarkerRow } from "@/registry/syncrobotic/ui/marker"
import { MessageMeta } from "@/registry/syncrobotic/ui/message"
import { Stepper, StepperItem } from "@/registry/syncrobotic/ui/stepper"
import { Timeline, TimelineItem } from "@/registry/syncrobotic/ui/timeline"
import { Trace, TraceHeader, TraceItem } from "@/registry/syncrobotic/ui/trace"

afterEach(cleanup)

// A browser reads a positioned sr-only span as its own run, so one that opens with punctuation is heard with a stray
// space ("Stop , 7F3A"). Names are built from content instead: real spaces between visible parts, and sr-only words.
const strays = () => [...document.querySelectorAll(".sr-only")].map((n) => n.textContent ?? "").filter((t) => /^\s*[,:;.·]/.test(t))

describe("ui names read without a stray space before a separator", () => {
  it("Stepper says the state after the title and description", () => {
    render(
      <Stepper value={2} navigable="all" onValueChange={() => {}}>
        <StepperItem title="Connect" description="Wi-Fi" />
        <StepperItem title="Calibrate" />
      </Stepper>,
    )
    expect(screen.getByRole("button", { name: "Connect Wi-Fi completed" }).textContent).toBe("Connect Wi-Fi completed")
    expect(strays()).toEqual([])
  })

  it("Trace says the status after the title and meta", () => {
    render(
      <Trace>
        <TraceHeader title="Plan" status="running" />
        <TraceItem status="error" title="open_door" meta="nav2" />
      </Trace>,
    )
    expect(screen.getByText("Plan").parentElement!.textContent).toBe("Plan Running")
    expect(screen.getByText("open_door").parentElement!.textContent).toBe("open_door nav2 Failed")
    expect(strays()).toEqual([])
  })

  it("MarkerRow and TimelineItem say the status as a word", () => {
    render(
      <>
        <MarkerRow status="warning" title="Takeover" />
        <Timeline>
          <TimelineItem status="danger" title="Dock" />
        </Timeline>
      </>,
    )
    expect(screen.getByText("Takeover").textContent).toBe("Takeover warning")
    expect(screen.getByText("Dock").textContent).toBe("Dock failed")
    expect(strays()).toEqual([])
  })

  it("ChipGroup separates the label from the count and says a chosen link is selected", () => {
    render(
      <ChipGroup
        type="multiple"
        label="Class"
        value={["car"]}
        items={[
          { value: "car", label: "Car", count: 12, href: "?c=car" },
          { value: "bus", label: "Bus", count: 3, href: "?c=bus" },
        ]}
      />,
    )
    expect(screen.getByRole("link", { name: "Car 12 selected" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Bus 3" })).toBeTruthy()
    expect(strays()).toEqual([])
  })

  it("MessageMeta keeps real spaces around the hidden dot", () => {
    const { container } = render(<MessageMeta model="Large" durationMs={2400} />)
    expect(container.textContent).toBe("Large · 2.4 s")
    expect(container.querySelector(".sr-only")).toBeNull()
  })
})
