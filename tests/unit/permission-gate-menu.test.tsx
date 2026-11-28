import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { TooltipProvider } from "@/registry/syncrobotic/ui/tooltip"

function Menu() {
  return (
    <TooltipProvider delayDuration={0}>
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <PermissionGate allowed={false} mode="disabled" reason="Needs devices:write">
            <DropdownMenuItem>Remove</DropdownMenuItem>
          </PermissionGate>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}

describe("PermissionGate in a menu", () => {
  it("Escape on a disabled item with a reason still closes the menu", async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole("button", { name: "Actions" }))
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(document.activeElement?.textContent).toContain("Remove")
    await user.keyboard("{Escape}")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
  })
})
