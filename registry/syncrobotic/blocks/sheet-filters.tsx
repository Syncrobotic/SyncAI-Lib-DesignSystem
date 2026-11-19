// @syncrobotic/sheet-filters v0.17.2 · update: npx shadcn add @syncrobotic/sheet-filters --overwrite
"use client"

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { Label } from "@/registry/syncrobotic/ui/label"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

// Sample data: the robots the filters narrow down.
const robots = [
  { id: "7F3A", state: "patrolling", site: "taipei" },
  { id: "1715", state: "patrolling", site: "taipei" },
  { id: "DAA6", state: "docked", site: "taipei" },
  { id: "9E37", state: "attention", site: "taoyuan" },
  { id: "C2B0", state: "offline", site: "taoyuan" },
  { id: "4A11", state: "docked", site: "taoyuan" },
  { id: "B812", state: "patrolling", site: "hsinchu" },
]
const states = [
  { value: "patrolling", label: "Patrolling" },
  { value: "docked", label: "Docked" },
  { value: "attention", label: "Needs attention" },
  { value: "offline", label: "Offline" },
]
const sites = [
  { value: "all", label: "All sites" },
  { value: "taipei", label: "Taipei HQ" },
  { value: "taoyuan", label: "Taoyuan plant" },
  { value: "hsinchu", label: "Hsinchu lab" },
]

/**
 * Filters in a bottom sheet on phones: options grouped under headings, each with how many robots it has, and one button
 * that says how many results you will see. Nothing applies until you press it; "Clear" resets the sheet, not the page.
 */
export function SheetFilters({
  onApply,
  defaultOpen,
  focusOnOpen = true,
}: {
  onApply?: (filters: { states: string[]; site: string }) => void
  defaultOpen?: boolean
  /** false for previews that open on load, so the page around them keeps its focus. */
  focusOnOpen?: boolean
}) {
  const [open, setOpen] = React.useState(!!defaultOpen)
  const [applied, setApplied] = React.useState<{ states: string[]; site: string }>({ states: [], site: "all" })
  const [picked, setPicked] = React.useState<string[]>(["attention", "offline"])
  const [site, setSite] = React.useState("all")

  const inSite = robots.filter((r) => site === "all" || r.site === site)
  const results = inSite.filter((r) => picked.length === 0 || picked.includes(r.state)).length
  const active = applied.states.length + (applied.site === "all" ? 0 : 1)

  return (
    <div className="flex min-h-dvh flex-col gap-4 bg-background p-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="secondary" className="self-start">
            <SlidersHorizontal aria-hidden="true" />
            Filters
            {active > 0 && (
              <>
                <CountBadge count={active} tone="neutral" />
                <span className="sr-only">active</span>
              </>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md" onOpenAutoFocus={focusOnOpen ? undefined : (e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle>Filter robots</SheetTitle>
            <SheetDescription>Pick what to show; nothing changes until you apply.</SheetDescription>
          </SheetHeader>

          <fieldset className="flex flex-col gap-1">
            <legend className="pb-2 text-sm font-medium">State</legend>
            {states.map((s) => {
              const id = `filter-${s.value}`
              const n = inSite.filter((r) => r.state === s.value).length
              return (
                <div key={s.value} className="flex min-h-(--h-lg) items-center gap-3">
                  <Checkbox
                    id={id}
                    checked={picked.includes(s.value)}
                    onCheckedChange={(v) => setPicked((p) => (v === true ? [...p, s.value] : p.filter((x) => x !== s.value)))}
                  />
                  {/* The count follows the words, not the far edge, so it reads with its option on a wide sheet too. */}
                  <Label htmlFor={id} className="flex flex-1 items-baseline gap-2 font-normal">
                    {s.label}
                    <span className="text-sm text-muted-foreground tabular-nums">{n}</span>
                  </Label>
                </div>
              )
            })}
          </fieldset>

          <fieldset className="flex flex-col gap-1">
            <legend className="pb-2 text-sm font-medium">Site</legend>
            <RadioGroup value={site} onValueChange={setSite} className="gap-0">
              {sites.map((s) => {
                const id = `site-${s.value}`
                return (
                  <div key={s.value} className="flex min-h-(--h-lg) items-center gap-3">
                    <RadioGroupItem id={id} value={s.value} />
                    <Label htmlFor={id} className="flex-1 font-normal">
                      {s.label}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </fieldset>

          <SheetFooter className="flex-row">
            <Button
              variant="ghost"
              onClick={() => {
                setPicked([])
                setSite("all")
              }}
            >
              Clear
            </Button>
            <Button
              className="flex-1"
              disabled={results === 0}
              onClick={() => {
                const f = { states: picked, site }
                setApplied(f)
                onApply?.(f)
                setOpen(false)
              }}
            >
              {results === 0 ? "No robots match" : `Show ${results} ${results === 1 ? "robot" : "robots"}`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <p className="text-sm text-muted-foreground">Your list of robots, filtered by the sheet.</p>
    </div>
  )
}
