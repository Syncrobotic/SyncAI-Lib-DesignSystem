import Link from "next/link"
import { Bell, Bot, CircleAlert, Map, OctagonAlert, TriangleAlert, Wifi } from "lucide-react"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { type FoundationSlug, foundations } from "./foundations"
import { contrast } from "./theme-tokens"

const bodyContrast = contrast("foreground", "background", "dark")!.toFixed(1)

// One small, real exhibit per foundation. Every value comes from the theme through Tailwind utilities.
const previews: Record<FoundationSlug, React.ReactNode> = {
  principles: (
    <div className="flex flex-col items-start gap-1 font-mono text-xs text-muted-foreground">
      {["01 Safety is a colour", "02 One meaning per colour", "03 Readable anywhere", "04 One geometry", "05 Calm by default"].map((p) => (
        <span key={p}>{p}</span>
      ))}
    </div>
  ),
  color: (
    <div className="grid h-full w-full grid-cols-6 gap-1">
      {["bg-background", "bg-card", "bg-secondary", "bg-muted-foreground", "bg-foreground", "bg-stop", "bg-info-subtle", "bg-success-subtle", "bg-warning-subtle", "bg-danger-subtle", "bg-neutral-subtle", "bg-stop-deep", "bg-info", "bg-success", "bg-warning", "bg-danger", "bg-neutral", "bg-primary"].map((c) => (
        <span key={c} className={`${c} rounded-xs ring-1 ring-edge`} />
      ))}
    </div>
  ),
  typography: (
    <div className="flex items-baseline gap-3">
      <span className="text-5xl font-bold">Aa</span>
      <span className="flex flex-col text-xs text-muted-foreground">
        <span>28 / 20 / 18</span>
        <span>16 / 14 / 12</span>
      </span>
    </div>
  ),
  spacing: (
    <div className="flex items-end gap-2">
      {[4, 8, 12, 16, 24, 32].map((s) => (
        <span key={s} className="w-3 bg-info" style={{ height: s * 2 }} />
      ))}
    </div>
  ),
  radius: (
    <div className="rounded-xl bg-float p-2 ring-1 ring-edge">
      <div className="rounded-md bg-muted p-1">
        <div className="flex h-10 w-28 items-center justify-center rounded-sm bg-card font-mono text-xs text-muted-foreground">24 · 16 · 12</div>
      </div>
    </div>
  ),
  elevation: (
    <div className="relative h-20 w-32">
      <span className="absolute inset-x-0 top-0 h-12 rounded-sm bg-card ring-1 ring-border" />
      <span className="absolute inset-x-3 top-4 h-12 rounded-sm bg-float shadow-float ring-1 ring-edge" />
      <span className="absolute inset-x-6 top-8 h-12 rounded-sm bg-popover shadow-overlay ring-1 ring-border" />
    </div>
  ),
  motion: (
    <svg viewBox="0 0 100 60" className="h-16 w-28 text-foreground">
      <path d="M0,58 C20,58 0,2 100,2" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <line x1="0" y1="59" x2="100" y2="59" stroke="var(--border)" />
    </svg>
  ),
  iconography: (
    <div className="flex items-center gap-3">
      <Bot className="size-6" />
      <Map className="size-6" />
      <Wifi className="size-5" />
      <Bell className="size-4" />
    </div>
  ),
  alarms: (
    <div className="flex flex-col gap-1 text-sm">
      <span className="flex items-center gap-2 text-danger">
        <OctagonAlert aria-hidden className="size-4" /> Critical
      </span>
      <span className="flex items-center gap-2 text-warning">
        <TriangleAlert aria-hidden className="size-4" /> High
      </span>
      <span className="flex items-center gap-2 text-neutral">
        <CircleAlert aria-hidden className="size-4" /> Low
      </span>
    </div>
  ),
  accessibility: (
    <div className="flex flex-col items-start gap-2">
      <span className="font-mono text-2xl font-bold">
        {bodyContrast}
        <span className="text-muted-foreground">:1</span>
      </span>
      <span className="flex gap-2">
        {(["info", "success", "warning", "danger", "neutral"] as const).map((t) => (
          <StatusGlyph key={t} tone={t} />
        ))}
      </span>
    </div>
  ),
}

export function FoundationGrid() {
  return (
    <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {foundations.map((f, i) => (
        <Link key={f.slug} href={`/docs/foundations/${f.slug}`} className="press group flex flex-col gap-6 bg-background p-6 hover:bg-card">
          <div aria-hidden className="specimen flex h-32 items-center justify-center rounded-sm border border-border p-4">
            {previews[f.slug]}
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-bold group-hover:underline">{f.title}</span>
            </span>
            <span className="text-sm text-muted-foreground">{f.lead}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
