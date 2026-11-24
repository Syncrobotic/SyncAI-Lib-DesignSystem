import type * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MetaPill, PageHeader } from "@/registry/syncrobotic/ui/page-header"

afterEach(cleanup)

describe("MetaPill", () => {
  it("without href is a list item with no link, as before", () => {
    render(<PageHeader title="Catalog" meta={<MetaPill tone="warning">2 open issues</MetaPill>} />)
    const item = screen.getByRole("listitem")
    expect(item.getAttribute("data-slot")).toBe("meta-pill")
    expect(item.className).toContain("h-(--h-tag)")
    expect(item.className).toContain("text-warning")
    expect(screen.queryByRole("link")).toBeNull()
  })
  it("with href is a link inside the list item: the pill's height on screen, a taller target, underlined, the focus ring", () => {
    render(
      <PageHeader
        title="warehouse-forklifts"
        meta={
          <MetaPill tone="warning" href="#compliance" className="extra">
            2 compliance items open
          </MetaPill>
        }
      />,
    )
    const link = screen.getByRole("link", { name: "2 compliance items open" })
    expect(link.getAttribute("href")).toBe("#compliance")
    expect(link.parentElement!.getAttribute("role")).toBe("listitem")
    expect(link.className).toContain("h-(--h-tag)")
    expect(link.className).toContain("after:h-(--h-sm)")
    expect(link.className).toContain("underline")
    expect(link.className).toContain("focus-visible:outline-ring")
    expect(link.className).toContain("text-warning")
    expect(link.className).toContain("extra")
    expect(link.querySelector("svg[aria-hidden=true]")).not.toBeNull()
  })
  it("writes a link without a tone in the foreground, and renders through linkAs", () => {
    const Router = ({ href, ...rest }: React.ComponentProps<"a">) => <a data-router="" href={`/app${href}`} {...rest} />
    render(
      <PageHeader
        title="x"
        meta={
          <MetaPill href="/releases" linkAs={Router}>
            Used by 3 releases
          </MetaPill>
        }
      />,
    )
    const link = screen.getByRole("link")
    expect(link.getAttribute("href")).toBe("/app/releases")
    expect(link.hasAttribute("data-router")).toBe(true)
    expect(link.className).toContain("text-foreground")
    expect(link.className).not.toContain("text-muted-foreground")
  })
})
