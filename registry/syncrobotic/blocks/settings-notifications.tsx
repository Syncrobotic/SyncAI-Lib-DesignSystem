// @syncrobotic/settings-notifications v0.17.3 · update: npx shadcn add @syncrobotic/settings-notifications --overwrite
"use client"

import * as React from "react"
import { Lock } from "lucide-react"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

const channels = [
  { key: "app", label: "In app" },
  { key: "email", label: "Email" },
  { key: "push", label: "Phone" },
] as const
type Channel = (typeof channels)[number]["key"]

type Event = { key: string; label: string; hint: string; locked?: Channel[] }
const events: Event[] = [
  { key: "estop", label: "Emergency stop", hint: "Anyone stops a robot.", locked: ["app", "push"] },
  { key: "attention", label: "Robot needs attention", hint: "Stuck, low battery, lost signal." },
  { key: "failed", label: "Mission failed", hint: "A mission ends before its last checkpoint." },
  { key: "firmware", label: "Update finished", hint: "Firmware or a map reaches every robot." },
  { key: "report", label: "Weekly report", hint: "Monday 08:00, your sites only." },
]

// Sample starting choices.
const initial: Record<string, Channel[]> = {
  estop: ["app", "push", "email"],
  attention: ["app", "push"],
  failed: ["app", "email"],
  firmware: ["app"],
  report: ["email"],
}

/**
 * Who hears about what, as a grid of events by channel. Each box applies at once. An emergency stop always reaches the
 * app and the phone; those boxes are locked and say so, rather than disappear.
 */
export function SettingsNotifications() {
  const [on, setOn] = React.useState(initial)
  const [quiet, setQuiet] = React.useState(true)
  // An event missing from the starting choices simply has no channels yet.
  const channelsOf = (s: Record<string, Channel[]>, e: string) => s[e] ?? []
  const toggle = (e: string, c: Channel, v: boolean) =>
    setOn((s) => ({ ...s, [e]: v ? [...channelsOf(s, e), c] : channelsOf(s, e).filter((x) => x !== c) }))

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="notify-title" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="notify-title" className="text-lg font-bold">
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">Changes save as you make them.</p>
        </div>
        <Card className="gap-0 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                {channels.map((c) => (
                  <TableHead key={c.key} className="w-14 px-1 text-center sm:w-24 sm:px-4">
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.key}>
                  <TableCell className="py-2 whitespace-normal">
                    <span className="flex flex-col">
                      <span className="font-medium">{e.label}</span>
                      {/* On a phone the lock leads the line that explains it, not the box, so it never reaches the card's edge
                          and never sits alone under a wrapped name. */}
                      <span className="flex items-start gap-2 text-xs text-muted-foreground">
                        {e.locked && <Lock aria-hidden="true" className="size-4 shrink-0 sm:hidden" />}
                        {e.hint}
                      </span>
                    </span>
                  </TableCell>
                  {channels.map((c) => {
                    const locked = e.locked?.includes(c.key)
                    return (
                      <TableCell key={c.key} className="px-1 text-center sm:px-4">
                        {/* The lock hangs to the right of the box, out of the flow, so every box stays on its column's centre line. */}
                        <span className="relative inline-flex align-middle">
                          <Checkbox
                            aria-label={`${e.label}, ${c.label}${locked ? ", always on" : ""}`}
                            checked={locked || channelsOf(on, e.key).includes(c.key)}
                            disabled={locked}
                            onCheckedChange={(v) => toggle(e.key, c.key, v === true)}
                          />
                          {locked && <Lock aria-hidden="true" className="absolute top-1/2 left-full ml-1 hidden size-4 -translate-y-1/2 text-muted-foreground sm:block" />}
                        </span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock aria-hidden="true" className="size-4" />
          Emergency stops always reach the app and your phone.
        </p>
      </section>

      <section aria-labelledby="quiet-title" className="flex items-start justify-between gap-6 rounded-md bg-card p-4 ring-1 ring-border">
        <div className="flex flex-col gap-1">
          <h2 id="quiet-title" className="text-sm font-medium">
            Quiet hours, 22:00 to 07:00
          </h2>
          <p id="quiet-desc" className="text-sm text-muted-foreground">
            Holds email and phone notifications until morning. Emergency stops still come through.
          </p>
        </div>
        <Switch aria-labelledby="quiet-title" aria-describedby="quiet-desc" checked={quiet} onCheckedChange={setQuiet} />
      </section>
    </div>
  )
}
