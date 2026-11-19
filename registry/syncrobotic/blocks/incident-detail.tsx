// @syncrobotic/incident-detail v0.13.0 · update: npx shadcn add @syncrobotic/incident-detail --overwrite
"use client"

import * as React from "react"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Stepper, StepperItem } from "@/registry/syncrobotic/ui/stepper"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"
import { Timeline, TimelineItem } from "@/registry/syncrobotic/ui/timeline"

const states = ["Declared", "Investigating", "Monitoring", "Resolved"]

type Update = { at: string; time: string; who: string; text: string; state?: string }
const initial: Update[] = [
  {
    at: "2026-11-17T21:58",
    time: "21:58",
    who: "Kai Chen",
    text: "Facilities say the door controller lost power. Electrician on the way, about 30 min.",
    state: "Investigating",
  },
  { at: "2026-11-17T21:52", time: "21:52", who: "Kai Chen", text: "Taking this. 9E37 is safe at checkpoint 2, waiting." },
  { at: "2026-11-17T21:47", time: "21:47", who: "System", text: "Declared from alarm: Patrol dog 9E37 stopped at door C3.", state: "Declared" },
]

/**
 * One incident: where it stands as steps, what is affected, and the updates, newest first. Posting an update can move it to
 * the next state, so the record and the status never disagree. Nothing here stops a robot; the dock does that.
 */
export function IncidentDetail() {
  const [updates, setUpdates] = React.useState(initial)
  const [text, setText] = React.useState("")
  const [state, setState] = React.useState("Investigating")
  const [next, setNext] = React.useState("Investigating")

  // An empty update says nothing: Post stays off until there is text, and the reason sits beside it.
  const empty = !text.trim()
  const post = (e: React.FormEvent) => {
    e.preventDefault()
    if (empty) return
    setUpdates((u) => [{ at: `now-${u.length}`, time: "Now", who: "Mei Lin", text: text.trim(), state: next !== state ? next : undefined }, ...u])
    setState(next)
    setText("")
  }

  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#alarms"
      title="IN-2041"
      user={{ name: "Mei Lin", initials: "ML" }}
      actions={
        <Button size="sm" variant="secondary">
          Open map
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <StatusEyebrow status="warning">Sev 2 · slows work</StatusEyebrow>
            <h2 className="text-xl font-bold">Door C3 blocks the loading bay route</h2>
          </div>
          <Stepper value={states.indexOf(state) + 1} size="sm">
            {states.map((s) => (
              <StepperItem key={s} title={s} />
            ))}
          </Stepper>

          <form noValidate onSubmit={post} className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
            <Field label="Post an update">
              <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
            </Field>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Field label="State after this update" className="w-56">
                <Select value={next} onValueChange={setNext}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {states.slice(1).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex flex-wrap items-center justify-end gap-3">
                {empty && (
                  <span id="post-update-reason" className="text-sm text-muted-foreground">
                    Write what changed first.
                  </span>
                )}
                <Button type="submit" disabled={empty} aria-describedby={empty ? "post-update-reason" : undefined}>
                  Post update
                </Button>
              </div>
            </div>
          </form>

          <section aria-labelledby="updates-title" className="flex flex-col gap-3">
            <h3 id="updates-title" className="text-sm font-medium">
              Updates
            </h3>
            <Timeline>
              {updates.map((u) => (
                <TimelineItem
                  key={u.at}
                  time={u.time}
                  dateTime={u.at.startsWith("now") ? undefined : u.at}
                  title={u.state ? `${u.who} · moved to ${u.state}` : u.who}
                >
                  {u.text}
                </TimelineItem>
              ))}
            </Timeline>
          </section>
        </div>

        <aside aria-label="Incident facts" className="flex flex-col gap-4">
          <DescriptionList
            columns={1}
            items={[
              { label: "Owner", value: "Kai Chen" },
              { label: "Started", value: "Today, 21:46 · 38 min" },
              { label: "Site", value: "Taoyuan plant, loading bay" },
              { label: "Robots affected", value: "Patrol dog 9E37 (waiting at checkpoint 2)" },
              { label: "From alarm", value: "Stopped: door C3 closed" },
            ]}
          />
          <p className="text-sm text-muted-foreground">Other robots keep their routes. The loading bay sweep resumes when the door opens.</p>
        </aside>
      </div>
    </AppShell>
  )
}
