import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Scrollspy, useScrollspy } from "@/registry/syncrobotic/ui/scrollspy"

const meta: Meta = { title: "Navigation/Scrollspy" }
export default meta
type S = StoryObj

const sections = [
  { id: "spy-overview", label: "Overview" },
  { id: "spy-battery", label: "Battery" },
  { id: "spy-sensors", label: "Sensors" },
  { id: "spy-lidar", label: "Lidar", level: 2 as const },
  { id: "spy-cameras", label: "Cameras", level: 2 as const },
  { id: "spy-maintenance", label: "Maintenance" },
]

function Body({ prefix = "" }: { prefix?: string }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.id} id={prefix + s.id} aria-labelledby={`${prefix}${s.id}-h`} className="flex flex-col gap-2 pb-8">
          <h3 id={`${prefix}${s.id}-h`} className="text-base font-medium">
            {s.label}
          </h3>
          <p className="text-sm text-muted-foreground">
            Patrol dog 7F3A · {String(s.label).toLowerCase()} readings for the last shift, refreshed every minute while the robot is online.
          </p>
          <div className="h-24 rounded-md bg-muted" />
        </section>
      ))}
    </>
  )
}

export const ScrollspySidebar: S = {
  render: function D() {
    const ref = React.useRef<HTMLDivElement>(null)
    return (
      <div className="flex h-80 gap-6 rounded-md bg-card p-4 ring-1 ring-border">
        <div
          ref={ref}
          tabIndex={0}
          aria-label="Robot details"
          className="min-w-0 flex-1 overflow-y-auto pr-2 [mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <Body />
        </div>
        <Scrollspy items={sections} root={ref} offset={24} className="hidden w-40 shrink-0 sm:flex" />
      </div>
    )
  },
}

export const ScrollspyPills: S = {
  render: function D() {
    const ref = React.useRef<HTMLDivElement>(null)
    const items = sections.filter((s) => !s.level).map((s) => ({ ...s, id: `p-${s.id}` }))
    return (
      <div className="flex h-80 flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
        <Scrollspy items={items} root={ref} offset={24} variant="pills" title="Sections" />
        <div
          ref={ref}
          tabIndex={0}
          aria-label="Robot details"
          className="min-w-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <Body prefix="p-" />
        </div>
      </div>
    )
  },
}

export const ScrollspyHookOnly: S = {
  render: function D() {
    const ref = React.useRef<HTMLDivElement>(null)
    const ids = sections.map((s) => `h-${s.id}`)
    const active = useScrollspy(ids, { root: ref, offset: 24 })
    const label = sections.find((s) => `h-${s.id}` === active)?.label
    return (
      <div className="flex h-80 flex-col rounded-md bg-card ring-1 ring-border">
        <div className="flex min-h-(--h-md) items-center gap-2 border-b border-border px-4 text-sm">
          <span className="text-muted-foreground">Patrol dog 7F3A</span>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <span className="font-medium" aria-live="polite">
            {label}
          </span>
        </div>
        <div
          ref={ref}
          tabIndex={0}
          aria-label="Robot details"
          className="min-w-0 flex-1 overflow-y-auto p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <Body prefix="h-" />
        </div>
      </div>
    )
  },
}

export const ScrollspyNoTitle: S = {
  render: function D() {
    const ref = React.useRef<HTMLDivElement>(null)
    const items = sections.slice(0, 3).map((s) => ({ ...s, id: `n-${s.id}` }))
    return (
      <div className="flex h-64 gap-6 overflow-hidden rounded-md bg-card p-4 ring-1 ring-border">
        <Scrollspy items={items} root={ref} offset={24} title={null} aria-label="Sections" className="w-32 shrink-0" />
        <div
          ref={ref}
          tabIndex={0}
          aria-label="Robot details"
          className="min-w-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <Body prefix="n-" />
        </div>
      </div>
    )
  },
}

const settings = [
  { id: "set-general", label: "General" },
  { id: "set-name", label: "Name and photo", level: 2 as const },
  { id: "set-timezone", label: "Time zone", level: 2 as const },
  { id: "set-safety", label: "Safety" },
  { id: "set-speed", label: "Speed limits", level: 2 as const },
  { id: "set-zones", label: "No-go zones", level: 2 as const },
  { id: "set-estop", label: "Emergency stop", level: 2 as const },
  { id: "set-alerts", label: "Alerts" },
]

/** A settings page: sections and their sub-sections, deeper levels indented. */
export const ScrollspySettings: S = {
  render: function D() {
    const ref = React.useRef<HTMLDivElement>(null)
    return (
      // The card clips what scrolls inside it: the rail scrolls on its own when it is taller than the card, and the pane
      // fades out at its bottom edge instead of cutting a line in half.
      <div className="flex h-80 gap-6 overflow-hidden rounded-md bg-card p-4 ring-1 ring-border">
        <Scrollspy items={settings} root={ref} offset={24} title="Settings" className="hidden w-44 shrink-0 overflow-y-auto sm:flex" />
        <div
          ref={ref}
          tabIndex={0}
          aria-label="Settings"
          className="min-w-0 flex-1 overflow-y-auto pr-2 [mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {settings.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="flex flex-col gap-2 pb-8">
              <h3 id={`${s.id}-h`} className={s.level ? "text-sm font-medium" : "text-base font-bold"}>
                {s.label}
              </h3>
              <div className="h-16 rounded-md bg-muted" />
            </section>
          ))}
        </div>
      </div>
    )
  },
}

/** Long section names wrap in the rail, so the whole name is always readable. */
export const ScrollspyLongNames: S = {
  render: function D() {
    const ref = React.useRef<HTMLDivElement>(null)
    const items = [
      { id: "ln-1", label: "Before the first patrol of the night shift" },
      { id: "ln-2", label: "When a robot reports an obstacle it cannot pass" },
      { id: "ln-3", label: "After an emergency stop" },
    ]
    return (
      <div className="flex h-64 gap-6 overflow-hidden rounded-md bg-card p-4 ring-1 ring-border">
        <Scrollspy items={items} root={ref} offset={24} className="w-40 shrink-0" />
        <div
          ref={ref}
          tabIndex={0}
          aria-label="Procedures"
          className="min-w-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {items.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="flex flex-col gap-2 pb-8">
              <h3 id={`${s.id}-h`} className="text-base font-medium">
                {s.label}
              </h3>
              <div className="h-24 rounded-md bg-muted" />
            </section>
          ))}
        </div>
      </div>
    )
  },
}
