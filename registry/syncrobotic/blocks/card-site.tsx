// @syncrobotic/card-site v0.17.3 · update: npx shadcn add @syncrobotic/card-site --overwrite
import * as React from "react"
import { ChevronRight, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Card } from "@/registry/syncrobotic/ui/card"

export type Site = {
  name: string
  address: string
  state: { tone: Status; label: string }
  robots: { active: number; total: number }
  missionsToday: number
  /** What needs someone, in words. Empty when all is well. */
  attention?: string
  href: string
}

export const sampleSites: Site[] = [
  {
    name: "Taipei HQ",
    address: "Neihu District, Taipei",
    state: { tone: "normal", label: "All normal" },
    robots: { active: 9, total: 10 },
    missionsToday: 64,
    href: "#taipei",
  },
  {
    name: "Taoyuan plant",
    address: "Guishan District, Taoyuan",
    state: { tone: "warning", label: "Needs attention" },
    robots: { active: 5, total: 7 },
    missionsToday: 38,
    attention: "9E37 battery at 14 %, dock blocked",
    href: "#taoyuan",
  },
  {
    name: "Hsinchu lab",
    address: "East District, Hsinchu",
    state: { tone: "offline", label: "Closed until 08:00" },
    robots: { active: 0, total: 4 },
    missionsToday: 0,
    href: "#hsinchu",
  },
]

/**
 * Sites to pick from: each card is one link, state first, then the two numbers people compare sites by, and what needs
 * someone written out. A calm site is grey; only the site with a problem carries colour.
 */
export function CardSite({ sites = sampleSites, className }: { sites?: Site[]; className?: string }) {
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 md:grid-cols-3", className)}>
      {sites.map((s) => (
        <li key={s.name} className="flex">
          <Card className="press relative flex-1 gap-4 hover:ring-muted-foreground has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <StatusEyebrow status={s.state.tone}>{s.state.label}</StatusEyebrow>
                <h3 className="truncate text-lg font-bold">
                  {/* The whole card is the link's target; the name is its text. */}
                  {/* focus-ring: the whole card draws the ring (has-[a:focus-visible] on Card), since the link covers it. */}
                  <a href={s.href} className="outline-none after:absolute after:inset-0 after:rounded-[inherit]">
                    {s.name}
                  </a>
                </h3>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{s.address}</span>
                </span>
              </div>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-1 rounded-sm bg-muted p-3">
                <dt className="text-xs text-muted-foreground">Robots active</dt>
                <dd className="font-medium tabular-nums">
                  {s.robots.active} <span className="text-muted-foreground">of {s.robots.total}</span>
                </dd>
              </div>
              <div className="flex flex-col gap-1 rounded-sm bg-muted p-3">
                <dt className="text-xs text-muted-foreground">Missions today</dt>
                <dd className="font-medium tabular-nums">{s.missionsToday}</dd>
              </div>
            </dl>
            <p className={cn("text-sm", s.attention ? "text-warning" : "text-muted-foreground")}>{s.attention ?? "Nothing needs you."}</p>
          </Card>
        </li>
      ))}
    </ul>
  )
}
