// @syncrobotic/project-switcher v0.57.0 · update: npx shadcn add @syncrobotic/project-switcher --overwrite
"use client"

import * as React from "react"
import { Building2, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/registry/syncrobotic/hooks/use-reduced-motion"
import { Command, CommandCheck, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/registry/syncrobotic/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/syncrobotic/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"

/** A project the viewer can open. `detail` is one fact under its name (its slug, its device count). */
export type SwitcherProject = { id: string; name: string; detail?: string }

export type ProjectSwitcherLabels = {
  /** The trigger's line under the name, and the sheet's title. */
  title: string
  none: string
  search: string
  recent: string
  results: string
  all: string
  current: string
  empty: (query: string) => string
  loading: string
  create: string
  viewAll: string
}

export const defaultProjectSwitcherLabels: ProjectSwitcherLabels = {
  title: "Project",
  none: "Choose a project",
  search: "Search projects",
  recent: "Recent",
  results: "Projects",
  all: "All projects",
  current: "Current",
  empty: (q) => (q ? `No project matches "${q}".` : "No projects yet."),
  loading: "Searching…",
  create: "New project",
  viewAll: "View all projects",
}

export type ProjectSwitcherProps = {
  /** The projects to list: all of them, or the server's matches for `search`. */
  projects: readonly SwitcherProject[]
  /** The project the page shows. It may be outside `projects` (a search result list): it still names the trigger. */
  current?: SwitcherProject | null
  /** Most recent first; shown above the list while nothing is typed. */
  recent?: readonly SwitcherProject[]
  onSelect: (project: SwitcherProject) => void
  /** With `onSearchChange`, the server searches: the list shows `projects` as given and filters nothing itself. */
  search?: string
  onSearchChange?: (search: string) => void
  /** A server search is under way. */
  loading?: boolean
  /** Shows "New project" at the end; hide it from a viewer who may not create one. */
  onCreate?: () => void
  onViewAll?: () => void
  /** The mark before a name (a logo); default its first letter on a tile. */
  mark?: (project: SwitcherProject) => React.ReactNode
  /** Open from outside (a shortcut of your own); leave both out and the trigger opens it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  labels?: Partial<ProjectSwitcherLabels>
  className?: string
}

const Mark = ({ project, mark }: { project: SwitcherProject; mark?: ProjectSwitcherProps["mark"] }) => (
  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-muted text-sm font-medium text-foreground">
    {mark ? mark(project) : project.name.trim().slice(0, 1).toUpperCase()}
  </span>
)

/**
 * The current project, and a searchable list to switch to another: recent first, then all of them or the server's
 * matches, with New project at the end. A popover from 640 px and a bottom sheet on phones, the same keys in both.
 */
export function ProjectSwitcher({
  projects,
  current,
  recent = [],
  onSelect,
  search,
  onSearchChange,
  loading,
  onCreate,
  onViewAll,
  mark,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  labels,
  className,
}: ProjectSwitcherProps) {
  const l = { ...defaultProjectSwitcherLabels, ...labels }
  const wide = useMediaQuery("(min-width: 40rem)", true)
  const [inner, setInnerOpen] = React.useState(defaultOpen)
  const open = openProp ?? inner
  const setOpen = (o: boolean) => {
    setInnerOpen(o)
    onOpenChange?.(o)
  }
  const [typed, setTyped] = React.useState("")
  const query = search ?? typed
  const remote = !!onSearchChange
  const shownRecent = query.trim() ? [] : recent.filter((r) => r.id !== current?.id)
  // A recent project is listed once: under Recent while nothing is typed.
  const rest = projects.filter((p) => !shownRecent.some((r) => r.id === p.id))
  const choose = (p: SwitcherProject) => {
    setOpen(false)
    if (p.id !== current?.id) onSelect(p)
  }
  const after = (fn?: () => void) => () => {
    setOpen(false)
    fn?.()
  }
  const row = (p: SwitcherProject) => (
    // The id keeps two projects of one name apart; the name and detail are what a search matches.
    <CommandItem key={p.id} value={`${p.id} ${p.name}`} keywords={[p.name, p.detail ?? ""]} onSelect={() => choose(p)} className="h-auto min-h-(--h-md) py-1">
      <Mark project={p} mark={mark} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-foreground">{p.name}</span>
        {p.detail && <span className="truncate text-xs text-muted-foreground">{p.detail}</span>}
      </span>
      <CommandCheck checked={p.id === current?.id} />
      {p.id === current?.id && <span className="sr-only">{l.current}</span>}
    </CommandItem>
  )

  const list = (
    <Command shouldFilter={!remote} label={l.search} className="bg-transparent">
      <CommandInput
        value={query}
        onValueChange={(v) => (remote ? onSearchChange?.(v) : setTyped(v))}
        placeholder={l.search}
        aria-label={l.search}
        end={loading ? <Spinner label={l.loading} /> : undefined}
      />
      <CommandList className="max-h-80">
        <CommandEmpty>{(q) => (loading ? l.loading : l.empty(q))}</CommandEmpty>
        {shownRecent.length > 0 && <CommandGroup heading={l.recent}>{shownRecent.map(row)}</CommandGroup>}
        {rest.length > 0 && <CommandGroup heading={query.trim() ? l.results : l.all}>{rest.map(row)}</CommandGroup>}
        {(onCreate || onViewAll) && (
          <>
            <CommandSeparator />
            <CommandGroup>
              {onViewAll && (
                <CommandItem value="__view-all" forceMount onSelect={after(onViewAll)}>
                  <Building2 aria-hidden="true" />
                  {l.viewAll}
                </CommandItem>
              )}
              {onCreate && (
                <CommandItem value="__create" forceMount onSelect={after(onCreate)}>
                  <Plus aria-hidden="true" />
                  {l.create}
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )

  const name = current?.name ?? l.none
  const trigger = (
    <button
      type="button"
      data-slot="project-switcher-trigger"
      className={cn(
        "press flex h-(--h-row) w-full min-w-0 items-center gap-2 rounded-sm px-2 text-start text-sm transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent focus-visible:-outline-offset-2 data-[state=open]:bg-accent",
        // On a collapsed sidebar rail only the mark shows.
        "[&>:not(:first-child)]:transition-opacity [&>:not(:first-child)]:duration-(--motion-base) [&>:not(:first-child)]:ease-(--ease-standard) group-data-[collapsible=icon]/sidebar:[&>:not(:first-child)]:opacity-0",
        className,
      )}
    >
      {current ? (
        <Mark project={current} mark={mark} />
      ) : (
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-muted">
          <Building2 className="size-5 text-muted-foreground" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col whitespace-nowrap">
        <span className={cn("truncate font-medium", current ? "text-foreground" : "text-muted-foreground")}>{name}</span>
        <span className="truncate text-xs text-muted-foreground">{l.title}</span>
      </span>
      <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )

  if (!wide)
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="gap-2 p-2 pt-4" data-slot="project-switcher-sheet">
          <SheetHeader className="sr-only">
            <SheetTitle>{l.title}</SheetTitle>
            <SheetDescription>{l.search}</SheetDescription>
          </SheetHeader>
          {list}
        </SheetContent>
      </Sheet>
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-72 overflow-hidden p-0" data-slot="project-switcher-content">
        {list}
      </PopoverContent>
    </Popover>
  )
}
