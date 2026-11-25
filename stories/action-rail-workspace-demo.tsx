"use client"

import * as React from "react"
import { CircleCheck, Copy, Cpu, History, Moon, Undo2, Share2, Sun } from "lucide-react"
import { ActionRailColumnHeader, ActionRailShell } from "@/registry/syncrobotic/blocks/action-rail-shell"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"
import { placeholderPhoto } from "./placeholder-photos"

// The action-rail shell as a full-screen workspace (#343, #312): the run history left of main from 1280 px, the fields for
// the next step right of it from 1024 px with the rail pinned at their foot, and a top bar whose items fold into ⋯
// instead of wrapping. Below 1280 px the history is a Sheet opened from the top bar's History button, the product's own.
const runs = Array.from({ length: 14 }, (_, i) => ({
  id: `run-${42 - i}`,
  name: `Run ${42 - i}`,
  skill: ["Describe", "Detect", "Count"][i % 3]!,
  time: `${String(14 - Math.floor(i / 3)).padStart(2, "0")}:${String((i * 17) % 60).padStart(2, "0")}`,
}))

function RunHistory() {
  return (
    <ul className="-mx-2 flex flex-col">
      {runs.map((r, i) => (
        <li key={r.id}>
          <button
            type="button"
            aria-current={i === 0 ? "true" : undefined}
            className="press flex min-h-(--h-md) w-full items-center justify-between gap-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-accent aria-[current]:bg-accent aria-[current]:font-medium"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{r.name}</span>
              <span className="text-xs text-muted-foreground">{r.skill}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{r.time}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** The action-rail shell as a model playground: history, picture and results, controls with the rail at their foot. */
export function ActionRailWorkspaceDemo() {
  const [dark, setDark] = React.useState(false)
  return (
    <ActionRailShell
      title="Run 42 · Shelf audit, aisle 7"
      breadcrumb={<span className="text-sm text-muted-foreground">Playground /</span>}
      headerItems={[
        { id: "research", label: "Research preview", node: <Badge tone="outline">Research preview</Badge> },
        {
          id: "engine",
          label: "Engine: Qwen2.5-VL 7B on GPU 0",
          node: (
            <span className="flex items-center gap-1 text-sm whitespace-nowrap text-muted-foreground">
              <Cpu aria-hidden="true" className="size-4" />
              Qwen2.5-VL 7B · GPU 0
            </span>
          ),
        },
        {
          id: "status",
          label: "Engine ready",
          node: (
            <span className="flex items-center gap-1 text-sm whitespace-nowrap">
              <CircleCheck aria-hidden="true" className="size-4 text-muted-foreground" />
              Ready
            </span>
          ),
        },
        { id: "share", label: "Share run", icon: Share2, onSelect: () => {} },
        { id: "theme", label: dark ? "Switch to light theme" : "Switch to dark theme", icon: dark ? Sun : Moon, iconOnly: true, onSelect: () => setDark((d) => !d) },
      ]}
      actions={
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="md" className="xl:hidden">
              <History aria-hidden="true" />
              History
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetTitle className="pb-4">History</SheetTitle>
            <RunHistory />
          </SheetContent>
        </Sheet>
      }
      leading={{ title: "History", actions: <span className="text-xs text-muted-foreground tabular-nums">{runs.length} runs</span>, children: <RunHistory /> }}
      panel={{
        title: "Controls",
        children: (
          <div className="flex flex-col gap-4">
            <SegmentedControl defaultValue="describe" aria-label="Skill">
              <SegmentedControlItem value="describe">Describe</SegmentedControlItem>
              <SegmentedControlItem value="detect">Detect</SegmentedControlItem>
              <SegmentedControlItem value="count">Count</SegmentedControlItem>
            </SegmentedControl>
            <Field label="Prompt" hint="What to look for in the picture.">
              <Textarea defaultValue="List every product facing out on the middle shelf, left to right." rows={4} />
            </Field>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Sample prompts</p>
              {["Which shelf spaces are empty?", "Read the price labels", "Is anything blocking the aisle?"].map((p) => (
                <Button key={p} variant="outline" size="md" className="justify-start">
                  {p}
                </Button>
              ))}
            </div>
          </div>
        ),
      }}
      step={{ title: "Describe this picture", description: "Runs the prompt on the picture with the engine above." }}
      primary={{ label: "Run" }}
      secondary={[
        { label: "Reset fields", icon: Undo2 },
        { label: "Copy as API call", icon: Copy },
      ]}
    >
      <ActionRailColumnHeader title="Picture">
        <span className="text-xs text-muted-foreground">camera-07.jpg</span>
      </ActionRailColumnHeader>
      <div className="flex flex-col gap-4">
        <img src={placeholderPhoto(7, "camera-07")} alt="Aisle 7, middle shelf" className="aspect-[4/3] w-full max-w-3xl rounded-sm object-cover" />
        <section aria-labelledby="results" className="flex flex-col gap-2">
          <h3 id="results" className="text-sm font-bold">
            Results
          </h3>
          <ol className="flex list-decimal flex-col gap-1 pl-6 text-sm">
            {["Cereal, 6 boxes", "Oat drink, 4 cartons", "Empty space, about 40 cm", "Rice, 3 bags"].map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>
      </div>
    </ActionRailShell>
  )
}
