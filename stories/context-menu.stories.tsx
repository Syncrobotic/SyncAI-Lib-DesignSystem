import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowRight, Bot, Download, Ellipsis, Pause, Play, Route, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/syncrobotic/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/registry/syncrobotic/ui/item"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"

const meta: Meta = { title: "Overlays/Context menu" }
export default meta
type S = StoryObj

type Robot = { id: string; name: string; site: string; state: "Patrolling" | "Paused" | "Offline" }
const fleet: Robot[] = [
  { id: "7F3A", name: "Patrol dog 7F3A", site: "Warehouse 2", state: "Patrolling" },
  { id: "4D21", name: "Patrol dog 4D21", site: "Warehouse 2", state: "Paused" },
  { id: "2B10", name: "Patrol dog 2B10", site: "Loading bay", state: "Offline" },
]
const glyph: Record<Robot["state"], Status> = { Patrolling: "active", Paused: "normal", Offline: "offline" }

/**
 * One list of actions, drawn into whichever menu asks: the ⋯ button's dropdown and the row's context menu always offer the
 * same things, so the context menu is only ever a shortcut.
 */
type MenuParts = {
  Item: React.ComponentType<{ destructive?: boolean; disabled?: boolean; onSelect?: () => void; children: React.ReactNode }>
  Label: React.ComponentType<{ children: React.ReactNode }>
  Separator: React.ComponentType
}
function RobotActions({ robot, parts: P, onToggle, onRemove }: { robot: Robot; parts: MenuParts; onToggle: () => void; onRemove: () => void }) {
  const paused = robot.state === "Paused"
  return (
    <>
      <P.Label>
        {robot.name} · {robot.state}
      </P.Label>
      <P.Item>
        <ArrowRight aria-hidden="true" /> Open
      </P.Item>
      <P.Item disabled={robot.state === "Offline"}>
        <Route aria-hidden="true" /> Assign mission…
      </P.Item>
      <P.Item disabled={robot.state === "Offline"} onSelect={onToggle}>
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />} {paused ? "Resume" : "Pause"}
      </P.Item>
      <P.Separator />
      <P.Item destructive onSelect={onRemove}>
        <Trash2 aria-hidden="true" /> Remove from fleet
      </P.Item>
    </>
  )
}
const dropdownParts: MenuParts = { Item: DropdownMenuItem, Label: DropdownMenuLabel, Separator: DropdownMenuSeparator }
const contextParts: MenuParts = { Item: ContextMenuItem, Label: ContextMenuLabel, Separator: ContextMenuSeparator }

function RobotList() {
  const [robots, setRobots] = React.useState(fleet)
  const toggle = (id: string) => setRobots((rs) => rs.map((r) => (r.id === id ? { ...r, state: r.state === "Paused" ? "Patrolling" : "Paused" } : r)))
  const remove = (id: string) => setRobots((rs) => rs.filter((r) => r.id !== id))
  if (robots.length === 0)
    return (
      <div className="flex flex-col items-start gap-3 rounded-md bg-card p-4 text-sm ring-1 ring-border">
        <p className="text-muted-foreground">No robots on these sites. Removed robots can be added again from Commissioning.</p>
        <Button variant="outline" onClick={() => setRobots(fleet)}>
          Add the 3 robots back
        </Button>
      </div>
    )
  return (
    <ItemGroup className="max-w-xl rounded-md bg-card p-1 ring-1 ring-border">
      {robots.map((r) => (
        <ContextMenu key={r.id}>
          {/* The row opens the context menu; Shift+F10 on its link or button opens it too, so the row needs no Tab stop of its own. */}
          <ContextMenuTrigger asChild>
            <Item role="listitem">
              <ItemMedia>
                <Bot aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <a href={`#robots/${r.id}`} className="truncate underline-offset-4 hover:underline">
                    {r.name}
                  </a>
                </ItemTitle>
                <ItemDescription className="flex items-center gap-2">
                  <StatusGlyph status={glyph[r.state]} /> {r.state} · {r.site}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                {/* The visible way to the same actions. Without it, nobody would know they are there, and a mouse-less tablet could not reach them. */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${r.name}`}>
                      <Ellipsis aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <RobotActions robot={r} parts={dropdownParts} onToggle={() => toggle(r.id)} onRemove={() => remove(r.id)} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </ItemActions>
            </Item>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <RobotActions robot={r} parts={contextParts} onToggle={() => toggle(r.id)} onRemove={() => remove(r.id)} />
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </ItemGroup>
  )
}

/** Right-click a robot (or press and hold on a touch screen) for Open, Assign mission, Pause and Remove. The ⋯ button offers the same actions. */
export const ContextMenuDefault: S = { render: () => <RobotList /> }

const columns = ["Robot", "Site", "Battery", "Firmware"] as const

function EventView() {
  const [shown, setShown] = React.useState<string[]>(["Robot", "Site", "Battery"])
  const [group, setGroup] = React.useState("robot")
  const toggle = (c: string) => setShown((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))
  return (
    <div className="flex max-w-xl flex-col gap-3">
      {/* The visible controls: the same columns, grouping and exports as the context menu. */}
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Show columns</DropdownMenuLabel>
            {columns.map((c) => (
              <DropdownMenuCheckboxItem key={c} checked={shown.includes(c)} onCheckedChange={() => toggle(c)} onSelect={(e) => e.preventDefault()}>
                {c}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger aria-label="Group by" className="basis-full sm:w-40 sm:basis-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="robot">By robot</SelectItem>
            <SelectItem value="site">By site</SelectItem>
            <SelectItem value="none">No grouping</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download aria-hidden="true" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>CSV, 24 events</DropdownMenuItem>
            <DropdownMenuItem>JSON, 24 events</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {/* Focusable, so Shift+F10 or the Menu key can open the menu from the keyboard. */}
          <div tabIndex={0} className="flex flex-col gap-1 rounded-md bg-card p-4 text-sm ring-1 ring-border">
            <p className="font-medium">24 events this week</p>
            <p className="text-muted-foreground">
              Grouped {group === "none" ? "by nothing" : `by ${group}`}; showing {shown.length ? shown.join(", ") : "no columns"}. Right-click here for the
              same options.
            </p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Show columns</ContextMenuLabel>
          {columns.map((c) => (
            <ContextMenuCheckboxItem key={c} checked={shown.includes(c)} onCheckedChange={() => toggle(c)}>
              {c}
            </ContextMenuCheckboxItem>
          ))}
          <ContextMenuSeparator />
          <ContextMenuLabel>Group by</ContextMenuLabel>
          <ContextMenuRadioGroup value={group} onValueChange={setGroup}>
            <ContextMenuRadioItem value="robot">Robot</ContextMenuRadioItem>
            <ContextMenuRadioItem value="site">Site</ContextMenuRadioItem>
            <ContextMenuRadioItem value="none">No grouping</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Download aria-hidden="true" /> Export
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>CSV, 24 events</ContextMenuItem>
              <ContextMenuItem>JSON, 24 events</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

/** Ticks (columns), one-of-several (group by) and a submenu (export). Each choice is also in the toolbar above the list. */
export const ContextMenuWithOptions: S = { render: () => <EventView /> }
