// @syncrobotic/marketing-hero v0.28.0 · update: npx shadcn add @syncrobotic/marketing-hero --overwrite
import * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"

type Cta = { label: string; href: string }

/**
 * Landing page hero. Uses the marketing-only tokens: text-5xl for the headline and
 * --space-section for vertical rhythm. Neutral primary CTA; red stays reserved for the stop.
 */
export function MarketingHero({
  eyebrow = "New · Fleet v2.4",
  title = "Security patrols that run themselves.",
  lead = "Quadruped robots patrol your site day and night, report what they find, and stop the moment you need them to.",
  primary = { label: "Book a demo", href: "#demo" },
  secondary = { label: "See how it works", href: "#how" },
  visual,
  className,
}: {
  eyebrow?: string
  title?: string
  lead?: string
  primary?: Cta
  secondary?: Cta
  /** Product shot or live component on the right. Defaults to a fleet summary. */
  visual?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("py-(--space-section-sm) md:py-(--space-section)", className)}>
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <Badge tone="outline">{eyebrow}</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
          <p className="max-w-lg text-lg text-muted-foreground">{lead}</p>
          {/* Below 640 px the two stack at full width, one per line by design; beside each other they would wrap one
              alone onto a second line. */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button size="lg" asChild>
              <a href={primary.href}>
                {primary.label} <ArrowRight aria-hidden="true" className="size-5" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          </div>
        </div>
        {visual ?? <FleetSummary />}
      </div>
    </section>
  )
}

function FleetSummary() {
  const rows = [
    { tone: "active" as const, name: "Patrol dog 7F3A", meta: "North gate · patrolling" },
    { tone: "normal" as const, name: "Patrol dog 2B10", meta: "Dock A · charging" },
    { tone: "warning" as const, name: "Patrol dog 9C44", meta: "Parking lot · low battery" },
  ]
  return (
    <div className="flex flex-col gap-4 rounded-md bg-card p-6 ring-1 ring-border">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Tonight</span>
        <span className="text-sm text-muted-foreground">02:41</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { v: "12", l: "robots out" },
          { v: "41 km", l: "patrolled" },
          { v: "3", l: "events" },
        ].map((s) => (
          <div key={s.l} className="flex flex-col gap-1 rounded-md bg-muted p-3">
            <span className="text-xl font-bold">{s.v}</span>
            <span className="text-xs text-muted-foreground">{s.l}</span>
          </div>
        ))}
      </div>
      <ul className="flex flex-col">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2 border-b border-border py-3 last:border-b-0">
            <StatusGlyph status={r.tone} />
            <span className="flex flex-col">
              <span className="text-sm font-medium">{r.name}</span>
              <span className="text-xs text-muted-foreground">{r.meta}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
