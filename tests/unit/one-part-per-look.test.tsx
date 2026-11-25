import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { SearchX } from "lucide-react"
import * as zh from "@/registry/syncrobotic/lib/labels-zh-tw"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"

afterEach(cleanup)

const more = (props: React.ComponentProps<typeof DropdownMenuMoreTrigger>) =>
  render(
    <DropdownMenu>
      <DropdownMenuMoreTrigger {...props} />
      <DropdownMenuContent>
        <DropdownMenuItem>Rename</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  )

describe("DropdownMenuMoreTrigger", () => {
  it("names a row's menu after the row and a toolbar's menu plainly", () => {
    more({ name: "Patrol dog 7F3A" })
    expect(screen.getByRole("button", { name: "More actions for Patrol dog 7F3A" }).getAttribute("data-slot")).toBe("dropdown-menu-more")
    cleanup()
    more({})
    expect(screen.getByRole("button", { name: "More actions" }).getAttribute("aria-haspopup")).toBe("menu")
  })

  it("takes an aria-label for a view menu, and zh-TW labels", () => {
    more({ "aria-label": "View options" })
    expect(screen.getByRole("button", { name: "View options" })).toBeTruthy()
    cleanup()
    more({ name: "巡邏犬 7F3A", labels: zh.dropdownMenuMoreTriggerLabels })
    expect(screen.getByRole("button", { name: "巡邏犬 7F3A 的更多動作" })).toBeTruthy()
  })
})

describe("EmptyState", () => {
  it("panel by default, with its icon on a tile", () => {
    const { container } = render(<EmptyState icon={SearchX} title="No robots match" />)
    const root = container.querySelector("[data-slot=empty-state]")!
    expect(root.getAttribute("data-size")).toBe("panel")
    expect(root.querySelector("[data-slot=icon-tile]")).toBeTruthy()
  })

  it("inline and overlay draw the icon bare; overlay is inline-sized and passes div props", () => {
    const { container } = render(
      <>
        <EmptyState size="inline" icon={SearchX} title="No entries match" />
        <EmptyState variant="overlay" icon={SearchX} title="No scan yet" role="alert" />
      </>,
    )
    const [inline, overlay] = [...container.querySelectorAll("[data-slot=empty-state]")]
    expect(inline!.querySelector("[data-slot=icon-tile]")).toBeNull()
    expect(overlay!.getAttribute("data-size")).toBe("inline")
    expect(overlay!.getAttribute("data-variant")).toBe("overlay")
    expect(screen.getByRole("alert").textContent).toBe("No scan yet")
  })
})
