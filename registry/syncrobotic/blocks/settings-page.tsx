// @syncrobotic/settings-page v0.8.0 · update: npx shadcn add @syncrobotic/settings-page --overwrite
"use client"

import * as React from "react"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
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
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { ChoiceField } from "@/registry/syncrobotic/ui/choice-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

const sections = [
  { id: "general", label: "General" },
  { id: "notifications", label: "Notifications" },
  { id: "danger", label: "Danger zone" },
]

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-6 gap-4 md:grid-cols-[14rem_1fr]">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="font-bold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">{children}</div>
    </section>
  )
}

function SwitchRow({ label, hint, defaultChecked }: { id?: string; label: string; hint: string; defaultChecked?: boolean }) {
  return (
    <ChoiceField
      label={label}
      description={hint}
      controlAt="end"
      control={
        <Switch
          defaultChecked={defaultChecked}
          // Switches apply at once (the Switch rule); say so, there is no save for them.
          onCheckedChange={(on) => toast({ tone: "success", title: `${label} ${on ? "on" : "off"}` })}
        />
      }
    />
  )
}

/**
 * Settings: sections side by side with their explanation. Switches apply at once; text fields collect into one
 * save bar that appears only when something changed. The danger zone confirms with the consequence named.
 */
export function SettingsPage() {
  const saved = { site: "North site", timezone: "Asia/Taipei" }
  const [site, setSite] = React.useState(saved.site)
  const [timezone, setTimezone] = React.useState(saved.timezone)
  const [error, setError] = React.useState<string | null>(null)
  const dirty = site !== saved.site || timezone !== saved.timezone

  const save = () => {
    if (site.trim().length < 2) return setError("At least 2 characters")
    setError(null)
    toast({ tone: "success", title: "Settings saved" })
  }

  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#settings" title="Settings" user={{ name: "Mei Lin", initials: "ML" }}>
      <div className="flex max-w-4xl flex-col gap-8">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="press flex h-(--h-sm) shrink-0 items-center rounded-xs px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <Section id="general" title="General" description="How this site is named and which clock its schedules use.">
          <Field label="Site name" error={error ?? undefined} hint="Shown on the island and in reports.">
            <Input value={site} onChange={(e) => setSite(e.target.value)} />
          </Field>
          <Field label="Time zone">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Taipei">Taipei (UTC+8)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
                <SelectItem value="Europe/Berlin">Berlin (UTC+1)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section id="notifications" title="Notifications" description="Changes here apply at once.">
          <SwitchRow id="n-critical" label="Critical alarms by SMS" hint="Every critical alarm, day and night." defaultChecked />
          <SwitchRow id="n-daily" label="Daily summary email" hint="Patrols, events and battery health at 08:00." />
        </Section>

        <Section id="danger" title="Danger zone" description="Cannot be undone.">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Delete this site</span>
              <span className="text-xs text-muted-foreground">Removes its maps, routes and 14 days of recordings.</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete site</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete North site?</AlertDialogTitle>
                  <AlertDialogDescription>Its 12 routes, 3 maps and 14 days of recordings are deleted. Robots stay in the fleet.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep site</AlertDialogCancel>
                  <AlertDialogAction destructive>Delete site and recordings</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Section>
      </div>

      {/* The save bar sticks to the bottom of the scrolling page, wherever the sidebar is. */}
      {dirty && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="sticky bottom-0 -mx-6 -mb-6 mt-8 animate-appear border-t border-edge bg-float shadow-float backdrop-blur-xl"
        >
          <div className="flex max-w-4xl items-center justify-between gap-3 px-6 py-3">
            <span className="text-sm">Unsaved changes</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSite(saved.site)
                  setTimezone(saved.timezone)
                  setError(null)
                }}
              >
                Discard
              </Button>
              <Button onClick={save}>Save changes</Button>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </AppShell>
  )
}
