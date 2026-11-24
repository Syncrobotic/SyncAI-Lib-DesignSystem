// @syncrobotic/governance-todo v0.32.0 · update: npx shadcn add @syncrobotic/governance-todo --overwrite
"use client"

import * as React from "react"
import { usePresenceList } from "@/registry/syncrobotic/hooks/use-presence"
import { CircleCheck } from "lucide-react"
import { dataNav } from "@/registry/syncrobotic/blocks/data-catalog"
import { AppShell, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Separator } from "@/registry/syncrobotic/ui/separator"

export type Todo = { id: string; who: "Maintainer" | "Compliance"; dataset: string; what: string; state: { tone: Status; label: string }; action: string }

export const sampleTodos: Todo[] = [
  {
    id: "t1",
    who: "Compliance",
    dataset: "faces/site-a@v1",
    what: "Customer contract expires in 12 days",
    state: { tone: "danger", label: "Blocks release" },
    action: "Review",
  },
  {
    id: "t2",
    who: "Compliance",
    dataset: "people/night-parking@v3",
    what: "Consent for site B not recorded",
    state: { tone: "warning", label: "Items held back" },
    action: "Record consent",
  },
  {
    id: "t3",
    who: "Maintainer",
    dataset: "lidar/warehouse@v1",
    what: "Validation split has 0 items",
    state: { tone: "warning", label: "Release check fails" },
    action: "Rebuild splits",
  },
  {
    id: "t4",
    who: "Maintainer",
    dataset: "depth/indoor@v2",
    what: "Card owner left the team",
    state: { tone: "offline", label: "No owner" },
    action: "Assign owner",
  },
]

export type GovernanceTodoProps = {
  todos?: Todo[]
  /** No row actions, for people who only read the list (the work is done elsewhere: a pipeline, a pull request). Rows keep their layout. */
  readOnly?: boolean
  /**
   * The app owns completion: a row's action calls this with its id, and the row leaves when `todos` no longer has it.
   * Without it, the block hides a done row itself.
   */
  onDone?: (id: string) => void
}

/** The to-do without a frame: put it in your own shell (top-bar-shell, app-shell). */
export function GovernanceTodoContent({ todos = sampleTodos, readOnly, onDone }: GovernanceTodoProps) {
  const [who, setWho] = React.useState<"all" | Todo["who"]>("all")
  const [done, setDone] = React.useState<string[]>([])
  const open = onDone ? todos : todos.filter((t) => !done.includes(t.id))
  const shown = open.filter((t) => who === "all" || t.who === who)
  const count = (w: Todo["who"]) => open.filter((t) => t.who === w).length

  // A finished task fades out where it was, rather than the list jumping under the pointer.
  const { rendered, done: finish } = usePresenceList(shown, (t) => t.id)

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl value={who} onValueChange={(v) => v && setWho(v as typeof who)} aria-label="Owner" className="sm:w-auto sm:self-start">
        <SegmentedControlItem value="all">All {open.length}</SegmentedControlItem>
        <SegmentedControlItem value="Maintainer">Maintainers {count("Maintainer")}</SegmentedControlItem>
        <SegmentedControlItem value="Compliance">Compliance {count("Compliance")}</SegmentedControlItem>
      </SegmentedControl>

      {rendered.length === 0 ? (
        <EmptyState icon={CircleCheck} title="Nothing to do" description="Every dataset is ready for the releases it is meant for." />
      ) : (
        <ul aria-label="To-do" className="flex flex-col rounded-md bg-card ring-1 ring-border">
          {rendered.map(({ item: t, leaving }, i) => (
            <li
              key={t.id}
              aria-hidden={leaving || undefined}
              className={leaving ? "animate-disappear" : "animate-appear"}
              onAnimationEnd={(e) => leaving && e.target === e.currentTarget && finish(t.id)}
            >
              {i > 0 && <Separator />}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
                  <span className="text-sm font-medium">{t.what}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{t.dataset}</span> · {t.who}
                  </span>
                </div>
                <InlineStatus status={t.state.tone}>{t.state.label}</InlineStatus>
                {!readOnly && (
                  <Button variant="secondary" size="sm" onClick={() => (onDone ? onDone(t.id) : setDone((d) => [...d, t.id]))}>
                    {t.action}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Governance to-do: what needs a maintainer or the compliance reviewer, most blocking first. Done items leave the list. */
export function GovernanceTodo(props: GovernanceTodoProps) {
  return (
    <AppShell product="DataCore" nav={dataNav} current="#governance" title="Governance" user={sampleUser}>
      <GovernanceTodoContent {...props} />
    </AppShell>
  )
}
