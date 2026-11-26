import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { IconTile } from "@/registry/syncrobotic/ui/icon-tile"
import { Progress } from "@/registry/syncrobotic/ui/progress"

afterEach(cleanup)

// 0.40 removed the tones that rendered grey under a colour's name: they are type errors now, not a silent neutral.
describe("tones that only ever drew grey are gone", () => {
  it("IconTile takes neutral, warning and danger", () => {
    const { container } = render(
      <>
        <IconTile variant="soft" tone="warning" />
        {/* @ts-expect-error info was removed in 0.40 */}
        <IconTile variant="soft" tone="info" />
        {/* @ts-expect-error success was removed in 0.40 */}
        <IconTile variant="soft" tone="success" />
      </>,
    )
    const [warning, info, success] = container.querySelectorAll("[data-slot=icon-tile]")
    expect(warning.className).toContain("bg-warning-subtle")
    for (const t of [info, success]) expect(t.className).not.toMatch(/(info|success|neutral)-subtle/)
  })

  it("Progress takes info, warning, danger and neutral; a finished bar is neutral", () => {
    const { container } = render(
      <>
        <Progress value={100} tone="neutral" />
        {/* @ts-expect-error success was removed in 0.40 */}
        <Progress value={100} tone="success" />
      </>,
    )
    const bars = container.querySelectorAll("[data-slot=progress] > div")
    expect(bars[0].className).toContain("bg-neutral")
    expect(bars[1].className).not.toContain("bg-neutral")
  })
})
