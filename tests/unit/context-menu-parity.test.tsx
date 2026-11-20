import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from "@/registry/syncrobotic/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"

// Its own file: Radix menus opened in earlier tests leave focus traps that close a non-modal menu opened after them.
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })
const open = async (el: HTMLElement) => {
  fireEvent.contextMenu(el, { clientX: 40, clientY: 40 })
  await flush()
}

describe("ContextMenu and DropdownMenu", () => {
  it("looks exactly like the dropdown menu: items, labels, separators and the panel share their classes", async () => {
    const cls = (el: Element) => el.className.split(/\s+/).sort().join(" ")
    const snapshot = () => {
      const menu = document.querySelector("[role=menu]")!
      const of = (role: string) => [...menu.querySelectorAll(`[role=${role}]`)].map(cls)
      return { menu: cls(menu), item: of("menuitem"), checkbox: of("menuitemcheckbox"), separator: of("separator"), label: cls(screen.getByText("Robot 7F3A")) }
    }
    fireEvent.pointerDown(document.body)
    render(
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Robot 7F3A</DropdownMenuLabel>
          <DropdownMenuItem>Open</DropdownMenuItem>
          <DropdownMenuItem destructive>Remove</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Battery</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    fireEvent.pointerDown(screen.getByRole("button", { name: "Actions" }), { button: 0, pointerType: "mouse" })
    await flush()
    const dropdown = snapshot()
    cleanup()
    fireEvent.pointerDown(document.body)
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div data-testid="row">Row</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Robot 7F3A</ContextMenuLabel>
          <ContextMenuItem>Open</ContextMenuItem>
          <ContextMenuItem destructive>Remove</ContextMenuItem>
          <ContextMenuCheckboxItem checked>Battery</ContextMenuCheckboxItem>
          <ContextMenuSeparator />
        </ContextMenuContent>
      </ContextMenu>,
    )
    await open(screen.getByTestId("row"))
    expect(snapshot()).toEqual(dropdown)
  })
})
