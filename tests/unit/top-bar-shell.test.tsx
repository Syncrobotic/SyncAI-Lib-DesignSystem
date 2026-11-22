import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TopBarShell } from "@/registry/syncrobotic/blocks/top-bar-shell"

afterEach(cleanup)

const links = [
  { label: "Overview", href: "/overview" },
  { label: "Sites", href: "/sites" },
]

/** A client router's link: it stops the browser's navigation and changes the route itself, so the shell stays mounted. */
const routed = vi.fn()
function RouterLink({ href, onClick, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e)
        e.preventDefault()
        routed(href)
      }}
      {...props}
    />
  )
}

const shell = (extra?: Partial<React.ComponentProps<typeof TopBarShell>>) =>
  render(
    <TopBarShell product="Fleet portal" links={links} linkAs={RouterLink} {...extra}>
      Page
    </TopBarShell>,
  )

const openDrawer = async () => {
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open navigation" })))
  return screen.getByRole("dialog")
}

describe("TopBarShell", () => {
  it("links the brand to the first link by default, and to home when given", () => {
    shell()
    expect(screen.getByRole("link", { name: "Fleet portal" }).getAttribute("href")).toBe("/overview")
    cleanup()
    shell({ home: "/" })
    expect(screen.getByRole("link", { name: "Fleet portal" }).getAttribute("href")).toBe("/")
  })

  it("gives main an id for a skip link: main by default, mainId when given", () => {
    shell()
    expect(screen.getByRole("main").id).toBe("main")
    cleanup()
    shell({ mainId: "content" })
    expect(screen.getByRole("main").id).toBe("content")
  })

  it("closes the drawer when a link in it is followed on a client router", async () => {
    routed.mockClear()
    shell()
    const drawer = await openDrawer()
    const link = Array.from(drawer.querySelectorAll("a")).find((a) => a.textContent === "Sites")!
    await act(async () => fireEvent.click(link))
    expect(routed).toHaveBeenCalledWith("/sites")
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("keeps the drawer open on a modified click, which opens a new tab", async () => {
    shell()
    const drawer = await openDrawer()
    const link = Array.from(drawer.querySelectorAll("a")).find((a) => a.textContent === "Sites")!
    await act(async () => fireEvent.click(link, { metaKey: true }))
    expect(screen.queryByRole("dialog")).not.toBeNull()
  })
})
