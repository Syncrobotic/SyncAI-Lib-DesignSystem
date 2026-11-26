import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Badge, CountBadge, ResultBadge } from "@/registry/syncrobotic/ui/badge"

afterEach(cleanup)

describe("Badge", () => {
  it("is neutral by default, or an outline", () => {
    render(
      <>
        <Badge>Beta</Badge>
        <Badge tone="outline">Production</Badge>
      </>,
    )
    expect(screen.getByText("Beta").className).toContain("bg-neutral-subtle")
    expect(screen.getByText("Production").className).toContain("ring-border")
  })

  it("has no status tones since 0.40: a state is an InlineStatus", () => {
    render(
      <>
        {/* @ts-expect-error the tinted tones were removed in 0.40 */}
        <Badge tone="warning">Low battery</Badge>
        {/* @ts-expect-error the tinted tones were removed in 0.40 */}
        <Badge tone="success">Docked</Badge>
      </>,
    )
    for (const t of ["Low battery", "Docked"]) expect(screen.getByText(t).className).not.toMatch(/(warning|success|danger|info)/)
  })
})

describe("CountBadge and ResultBadge keep their own looks", () => {
  it("draws a count that needs attention in danger on its tint, and a quiet one in grey", () => {
    const { rerender } = render(<CountBadge count={3} />)
    expect(screen.getByText("3").className).toContain("bg-danger-subtle")
    expect(screen.getByText("3").className).toContain("text-danger")
    rerender(<CountBadge count={3} tone="neutral" />)
    expect(screen.getByText("3").className).toContain("bg-muted")
  })

  it("draws a failed result as a danger outline and a pass in grey", () => {
    render(
      <>
        <ResultBadge result="passed" />
        <ResultBadge result="failed" />
      </>,
    )
    expect(screen.getByText("Passed").className).toContain("bg-neutral-subtle")
    expect(screen.getByText("Failed").className).toContain("ring-danger")
    expect(screen.getByText("Failed").className).toContain("text-danger")
  })
})
