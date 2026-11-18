import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import {
  Bell,
  Bot,
  Check,
  History,
  CirclePlus,
  Menu,
  Share2,
  Wrench,
  Copy,
  Ellipsis,
  SlidersHorizontal,
  Info,
  Keyboard,
  LayoutDashboard,
  Map,
  PanelRight,
  Pencil,
  Search,
  Trash2,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { StatusGlyph, type Tone } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/registry/syncrobotic/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/syncrobotic/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { NumberField } from "@/registry/syncrobotic/ui/number-field"
import { Label } from "@/registry/syncrobotic/ui/label"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/syncrobotic/ui/popover"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

// Each overlay has a closed story (click to open; used on the docs site) and an *Open story for visual tests.
const meta: Meta = { title: "Overlays", parameters: { layout: "fullscreen" } }
export default meta
type S = StoryObj

const RenameDialog = ({ open }: { open?: boolean }) => (
  <Dialog defaultOpen={open}>
    <DialogTrigger asChild>
      <Button variant="secondary">Rename robot</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename robot</DialogTitle>
        <DialogDescription>The new name shows on the island and in event logs.</DialogDescription>
      </DialogHeader>
      <Field label="Name">
        <Input defaultValue="Patrol dog 7F3A" />
      </Field>
      <DialogFooter>
        <Button>Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
export const DialogDefault: S = { render: () => <RenameDialog /> }
export const DialogOpen: S = { render: () => <RenameDialog open /> }

const DeleteConfirm = ({ open }: { open?: boolean }) => (
  <AlertDialog defaultOpen={open}>
    <AlertDialogTrigger asChild>
      <Button variant="destructive">Delete video</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete 38 GB of video?</AlertDialogTitle>
        <AlertDialogDescription>Footage from 11/01 to 11/14 is removed from the robot and the cloud. This cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep video</AlertDialogCancel>
        <AlertDialogAction destructive>Delete 38 GB</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
export const AlertDialogDefault: S = { render: () => <DeleteConfirm /> }
export const AlertDialogOpen: S = { render: () => <DeleteConfirm open /> }

const FilterSheet = ({ open }: { open?: boolean }) => (
  <Sheet defaultOpen={open}>
    <SheetTrigger asChild>
      <Button variant="secondary">Filter events</Button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Filter events</SheetTitle>
        <SheetDescription>Showing 24 events from the last 7 days.</SheetDescription>
      </SheetHeader>
      <Field label="Robot">
        <Input placeholder="All robots" />
      </Field>
      <SheetFooter>
        <Button>Show 24 events</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
)
export const SheetDefault: S = { render: () => <FilterSheet /> }
export const SheetOpen: S = { render: () => <FilterSheet open /> }

const InfoPopover = ({ open }: { open?: boolean }) => (
  <Popover defaultOpen={open}>
    <PopoverTrigger asChild>
      <Button variant="outline">
        <Info aria-hidden="true" /> Signal
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <p className="font-medium">Wi-Fi −61 dBm</p>
      <p className="text-muted-foreground">Good. Video streams at 1080p. Below −75 dBm the app drops to 480p.</p>
    </PopoverContent>
  </Popover>
)
export const PopoverDefault: S = { render: () => <InfoPopover /> }
export const PopoverOpen: S = { render: () => <InfoPopover open /> }

const CopyTooltip = ({ open }: { open?: boolean }) => (
  <Tooltip defaultOpen={open}>
    <TooltipTrigger asChild>
      <Button variant="outline" size="icon" aria-label="Copy serial number">
        <Copy aria-hidden="true" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Copy serial number</TooltipContent>
  </Tooltip>
)
export const TooltipDefault: S = { render: () => <CopyTooltip /> }
export const TooltipOpen: S = { render: () => <CopyTooltip open /> }

const RowMenu = ({ open }: { open?: boolean }) => (
  <DropdownMenu defaultOpen={open} modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="More actions">
        <Ellipsis aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuLabel>Route · Perimeter</DropdownMenuLabel>
      <DropdownMenuItem>
        <Pencil aria-hidden="true" /> Rename
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Copy aria-hidden="true" /> Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive>
        <Trash2 aria-hidden="true" /> Delete route
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)
export const DropdownMenuDefault: S = { render: () => <RowMenu /> }
export const DropdownMenuOpen: S = { render: () => <RowMenu open /> }

export const DialogInformation: S = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Keyboard aria-hidden="true" /> Keyboard shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Work in the console without a mouse.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-sm">
          {[
            ["Emergency stop selected robot", "Space"],
            ["Stop all robots", "Hold Space 2 s"],
            ["Next robot", "J"],
            ["Previous robot", "K"],
          ].map(([a, k]) => (
            <div key={a} className="contents">
              <dt>{a}</dt>
              <dd className="rounded-xs bg-muted px-2 font-mono text-xs leading-6">{k}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  ),
}

export const AlertDialogConfirm: S = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Send all robots home</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send 12 robots back to their docks?</AlertDialogTitle>
          <AlertDialogDescription>Current patrols end now. You can restart them from the schedule.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep patrolling</AlertDialogCancel>
          <AlertDialogAction>Send 12 home</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const SheetSidePanel: S = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <PanelRight aria-hidden="true" /> Robot details
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Patrol dog 7F3A</SheetTitle>
          <SheetDescription>Firmware 2.4.1 · 412 h in service</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-1">
          {[
            { id: "sp1", t: "Night vision", on: true },
            { id: "sp2", t: "Two-way audio", on: false },
          ].map((x) => (
            <div key={x.id} className="flex min-h-(--h-md) items-center justify-between">
              <Label htmlFor={x.id}>{x.t}</Label>
              <Switch id={x.id} defaultChecked={x.on} />
            </div>
          ))}
        </div>
        <SheetFooter>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const PopoverWithForm: S = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal aria-hidden="true" /> Battery filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-3">
        <Field label="Show robots below" hint="Battery, 0 to 100 %">
          <NumberField defaultValue={30} min={0} max={100} step={5} unit="%" />
        </Field>
        <Button size="sm">Apply</Button>
      </PopoverContent>
    </Popover>
  ),
}

export const TooltipOnToolbar: S = {
  render: () => (
    <div className="flex gap-1 rounded-sm bg-card p-1 ring-1 ring-border">
      {[
        { l: "Rename", I: Pencil },
        { l: "Duplicate", I: Copy },
        { l: "Delete", I: Trash2 },
      ].map(({ l, I }) => (
        <Tooltip key={l}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={l}>
              <I aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{l}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}

export const DropdownMenuWithCheckboxes: S = {
  render: () => (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Columns</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>Status</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Battery</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>Firmware</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Reset view <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

const PaletteResults = () => (
  <>
    <CommandEmpty>No robot, page or action matches. Try a robot ID such as 7F3A.</CommandEmpty>
    <CommandGroup heading="Robots">
      <CommandItem value="Patrol dog 7F3A">
        <Bot /> <span className="flex-1">Patrol dog 7F3A</span>
        <span className="text-xs text-muted-foreground">Patrolling</span>
      </CommandItem>
      <CommandItem value="Patrol dog 2B10">
        <Bot /> <span className="flex-1">Patrol dog 2B10</span>
        <span className="text-xs text-muted-foreground">Docked</span>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Pages">
      <CommandItem>
        <LayoutDashboard /> Overview
      </CommandItem>
      <CommandItem>
        <Map /> Map
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Actions">
      <CommandItem>
        <CirclePlus /> New mission <CommandShortcut>N</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </>
)

/** Inline: the same list in a panel, e.g. a picker. */
export const CommandInline: S = {
  render: () => (
    <div className="p-6">
      <Command className="max-w-md rounded-md ring-1 ring-border">
        <CommandInput placeholder="Search robots, pages and actions" />
        <CommandList>
          <PaletteResults />
        </CommandList>
      </Command>
    </div>
  ),
}

const Palette = ({ open: initial = false }: { open?: boolean }) => {
  const [open, setOpen] = React.useState(initial)
  return (
    <div className="p-6">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Search /> Search <CommandShortcut className="ml-2">⌘K</CommandShortcut>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search robots, pages and actions" />
        <CommandList>
          <PaletteResults />
        </CommandList>
      </CommandDialog>
    </div>
  )
}
/** The ⌘K palette. In an app, AppShell's search prop wires the field, the scope and the shortcut. */
export const CommandPalette: S = { render: () => <Palette /> }
export const CommandPaletteOpen: S = { render: () => <Palette open /> }

/** Navigation drawer: opens from the side the navigation lives on. */
export const SheetNavigationDrawer: S = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open navigation">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Taipei warehouse</SheetTitle>
          <SheetDescription>6 robots · 2 docks</SheetDescription>
        </SheetHeader>
        <nav aria-label="Main">
          <ul className="flex flex-col">
            {[
              { icon: LayoutDashboard, t: "Overview" },
              { icon: Bot, t: "Robots" },
              { icon: Map, t: "Maps" },
              { icon: Bell, t: "Alarms" },
            ].map(({ icon: Icon, t }) => (
              <li key={t}>
                <a href={`#${t.toLowerCase()}`} className="flex min-h-(--h-md) items-center gap-2 rounded-sm px-2 text-sm hover:bg-muted">
                  <Icon aria-hidden="true" className="size-5 text-muted-foreground" /> {t}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  ),
}

/** Phones: a bottom sheet of actions, each a full-width 44 px row. */
export const SheetBottomActions: S = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Ellipsis aria-hidden="true" /> Robot actions
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Patrol dog 7F3A</SheetTitle>
          <SheetDescription>Docked · 94 %</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col">
          {[
            { icon: Wrench, t: "Schedule maintenance" },
            { icon: Share2, t: "Share live view" },
            { icon: Pencil, t: "Rename" },
          ].map(({ icon: Icon, t }) => (
            <SheetClose key={t} asChild>
              <button type="button" className="press flex min-h-(--h-md) items-center gap-2 rounded-sm px-2 text-left text-sm hover:bg-muted">
                <Icon aria-hidden="true" className="size-5 text-muted-foreground" /> {t}
              </button>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  ),
}

/** An edit form in a side panel: Save and Cancel at the bottom, Cancel keeps what was there. */
export const SheetEditForm: S = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <Pencil aria-hidden="true" /> Edit robot
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit robot</SheetTitle>
          <SheetDescription>Changes apply on the next patrol.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <Input defaultValue="Patrol dog 7F3A" />
          </Field>
          <Field label="Home dock" hint="Where it charges between patrols.">
            <Input defaultValue="Dock 2 · Hall B" />
          </Field>
        </div>
        <SheetFooter className="flex-row justify-end">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Save</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

/** Robots with their state: the glyph and a word, never colour alone. */
export const CommandWithStatus: S = {
  render: () => (
    <Command className="max-w-md rounded-md ring-1 ring-border">
      <CommandInput placeholder="Find a robot" />
      <CommandList>
        <CommandEmpty>No robot matches.</CommandEmpty>
        <CommandGroup heading="Robots">
          {[
            ["Patrol dog 7F3A", "info", "Patrolling"],
            ["Courier 9E37", "warning", "Needs attention"],
            ["Patrol dog DAA6", "success", "Docked"],
            ["Courier 1715", "neutral", "Offline"],
          ].map(([n, tone, label]) => (
            <CommandItem key={n} value={n}>
              <StatusGlyph tone={tone as Tone} />
              <span className="flex-1">{n}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

/** Nothing matches: say what can be searched. */
export const CommandNoResults: S = {
  render: () => (
    <Command className="max-w-md rounded-md ring-1 ring-border">
      <CommandInput placeholder="Find a robot" value="gate x" readOnly />
      <CommandList>
        <CommandEmpty>No robot, page or action matches “gate x”. Try a robot ID such as 7F3A.</CommandEmpty>
        <CommandGroup heading="Robots">
          <CommandItem value="Patrol dog 7F3A">Patrol dog 7F3A</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

/** Several picks: a check marks each chosen item and Enter toggles it. */
export const CommandMultiSelect: S = {
  render: function M() {
    const [picked, setPicked] = React.useState<string[]>(["North gate"])
    const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
    return (
      <Command className="max-w-md rounded-md ring-1 ring-border">
        <CommandInput placeholder="Filter by site" />
        <CommandList>
          <CommandGroup heading={`Sites · ${picked.length} selected`}>
            {["North gate", "Hall B", "Warehouse 3", "Parking lot"].map((site) => (
              <CommandItem key={site} value={site} onSelect={() => toggle(site)} data-checked={picked.includes(site)}>
                <Check aria-hidden="true" className={picked.includes(site) ? "opacity-100" : "opacity-0"} />
                {site}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    )
  },
}

/** Pages inside the palette: pick a robot, then an action for it. Backspace on an empty field goes back. */
export const CommandNestedPages: S = {
  render: function P() {
    const [robot, setRobot] = React.useState<string>()
    const [q, setQ] = React.useState("")
    return (
      <Command
        className="max-w-md rounded-md ring-1 ring-border"
        onKeyDown={(e) => {
          if (e.key === "Backspace" && !q && robot) {
            e.preventDefault()
            setRobot(undefined)
          }
        }}
      >
        {robot && (
          <div className="flex items-center gap-2 px-3 pt-3 text-xs text-muted-foreground">
            <button type="button" className="press rounded-xs underline-offset-4 hover:underline" onClick={() => setRobot(undefined)}>
              Robots
            </button>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">{robot}</span>
          </div>
        )}
        <CommandInput value={q} onValueChange={setQ} placeholder={robot ? `Action for ${robot}` : "Find a robot"} />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          {robot ? (
            <CommandGroup heading="Actions">
              <CommandItem>
                <Map /> Show on map
              </CommandItem>
              <CommandItem>
                <Pencil /> Rename
              </CommandItem>
              <CommandItem>
                <Copy /> Copy ID
              </CommandItem>
            </CommandGroup>
          ) : (
            <CommandGroup heading="Robots">
              {["Patrol dog 7F3A", "Courier 9E37", "Patrol dog DAA6"].map((r) => (
                <CommandItem
                  key={r}
                  onSelect={() => {
                    setRobot(r)
                    setQ("")
                  }}
                >
                  <Bot /> {r}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    )
  },
}

/** Results from the server: a spinner row while the search runs, results replace it. */
export const CommandLoading: S = {
  render: () => (
    <Command className="max-w-md rounded-md ring-1 ring-border" shouldFilter={false}>
      <CommandInput placeholder="Search events" value="door" readOnly />
      <CommandList>
        <CommandEmpty className="flex items-center justify-center gap-2 py-6">
          <Spinner delay={0} className="size-4" label="" /> Searching 30 days of events…
        </CommandEmpty>
      </CommandList>
    </Command>
  ),
}

/** Recent first: what the operator opened last, then everything. */
export const CommandRecent: S = {
  render: () => (
    <Command className="max-w-md rounded-md ring-1 ring-border">
      <CommandInput placeholder="Search robots, pages and actions" />
      <CommandList>
        <CommandGroup heading="Recent">
          <CommandItem>
            <History /> Hall B map
          </CommandItem>
          <CommandItem>
            <History /> Patrol dog 7F3A
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <PaletteResults />
      </CommandList>
    </Command>
  ),
}

/** Actions with their keyboard shortcuts, learned from the palette. */
export const CommandShortcuts: S = {
  render: () => (
    <Command className="max-w-md rounded-md ring-1 ring-border">
      <CommandInput placeholder="Type a command" />
      <CommandList>
        <CommandGroup heading="Actions">
          <CommandItem>
            <CirclePlus /> <span className="flex-1">New mission</span> <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Map /> <span className="flex-1">Open map</span> <CommandShortcut>G M</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Bell /> <span className="flex-1">Alarms</span> <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Keyboard /> <span className="flex-1">All shortcuts</span> <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

/** Items with a second line, for actions whose name alone is not enough. */
export const CommandDescriptions: S = {
  render: () => (
    <Command className="max-w-md rounded-md ring-1 ring-border">
      <CommandInput placeholder="What do you want to do?" />
      <CommandList>
        <CommandGroup heading="Fleet">
          {[
            ["Send all to dock", "Every robot finishes its stop, then charges."],
            ["Pause patrols", "Robots hold where they are until resumed."],
            ["Export today’s events", "CSV of every event since 00:00."],
          ].map(([t, d]) => (
            <CommandItem key={t} value={t} className="h-auto py-2">
              <span className="flex flex-col">
                <span>{t}</span>
                <span className="text-xs text-muted-foreground">{d}</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

/** A destructive action stays last, apart, and names what it does. */
export const CommandDestructive: S = {
  render: () => (
    <Command className="max-w-md rounded-md ring-1 ring-border">
      <CommandInput placeholder="Actions for Patrol dog 7F3A" />
      <CommandList>
        <CommandGroup heading="Patrol dog 7F3A">
          <CommandItem>
            <Map /> Show on map
          </CommandItem>
          <CommandItem>
            <Pencil /> Rename
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup>
          <CommandItem className="text-danger [&_svg]:text-danger">
            <Trash2 /> Remove 7F3A from this site
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}
