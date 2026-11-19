import Link from "next/link"
import { ArrowRight, Bell, Bot, CircleAlert, Map, OctagonAlert, TriangleAlert, Wifi } from "lucide-react"
import { AppearItem, Reveal } from "./appear"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { type FoundationSlug, foundations } from "./foundations"
import { contrast, px, themeValue } from "./theme-tokens"

const bodyContrast = contrast("foreground", "background", "light")!.toFixed(1)
// The type scale as shipped, largest first, read from the theme so the preview cannot drift from it.
const typeScale = ["5xl", "4xl", "3xl", "2xl", "xl", "lg", "base", "sm", "xs"].map((k) => px(themeValue(`text-${k}`)))

// One small, real exhibit per foundation. Every value comes from the theme through Tailwind utilities.
const previews: Record<FoundationSlug, React.ReactNode> = {
  principles: (
    <ul className="flex w-full max-w-48 flex-col text-sm">
      {["Safety is a colour", "One meaning per colour", "Readable anywhere", "One geometry", "Calm by default"].map((p) => (
        <li key={p} className="border-b border-border py-2 last:border-b-0">
          {p}
        </li>
      ))}
    </ul>
  ),
  color: (
    <div className="grid h-full w-full grid-cols-6 gap-1 p-px">
      {["bg-background", "bg-card", "bg-secondary", "bg-muted-foreground", "bg-foreground", "bg-stop"].map((c) => (
        <span key={c} className={`${c} rounded-xs ring-1 ring-edge`} />
      ))}
    </div>
  ),
  typography: (
    <div className="flex items-baseline gap-3">
      <span className="text-5xl font-bold">Aa</span>
      <span className="flex flex-col text-xs text-muted-foreground">
        <span>{typeScale.slice(0, 5).join(" / ")}</span>
        <span>{typeScale.slice(5).join(" / ")}</span>
      </span>
    </div>
  ),
  spacing: (
    <div className="flex items-end gap-2">
      {[4, 8, 12, 16, 24, 32].map((s) => (
        <span key={s} className="w-3 bg-muted-foreground" style={{ height: s * 2 }} />
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
  "data-visualisation": (
    <svg viewBox="0 0 120 64" className="h-16 w-32">
      <line x1="0" y1="62" x2="120" y2="62" stroke="var(--border)" />
      <line x1="0" y1="32" x2="120" y2="32" stroke="var(--border)" />
      <polyline points="0,50 20,44 40,47 60,30 80,34 100,18 120,22" fill="none" stroke="var(--chart-1)" strokeWidth="2.5" />
      <polyline points="0,58 20,54 40,56 60,48 80,50 100,42 120,44" fill="none" stroke="var(--chart-2)" strokeWidth="2.5" />
    </svg>
  ),
  accessibility: (
    <div className="flex flex-col items-start gap-2">
      <span className="font-mono text-2xl font-bold">
        {bodyContrast}
        <span className="text-muted-foreground">:1</span>
      </span>
      <span className="flex gap-2">
        {(["active", "normal", "warning", "danger", "offline"] as const).map((t) => (
          <StatusGlyph key={t} status={t} />
        ))}
      </span>
    </div>
  ),
}

// Bento: principles lead (two rows), the rest in threes, so the grid reads as one composition, not eleven equal cards.
const span: Record<FoundationSlug, string> = {
  principles: "lg:col-span-2 lg:row-span-2",
  color: "lg:col-span-2",
  typography: "lg:col-span-2",
  spacing: "lg:col-span-2",
  radius: "lg:col-span-2",
  elevation: "lg:col-span-2",
  motion: "lg:col-span-2",
  iconography: "lg:col-span-2",
  accessibility: "lg:col-span-2",
  alarms: "lg:col-span-2",
  "data-visualisation": "lg:col-span-2",
}

// Hover is a state change, so it moves the way the Motion foundation says: --motion-fast, standard easing, a 2 px lift
// of the exhibit and the arrow fading in. Reduced motion keeps the colour change and drops the travel.
export const fast = "duration-(--motion-fast) ease-(--ease-standard)"

/**
 * The foundations as one ruled sheet, not a pile of cards: cells split by hairlines (the grid's 1 px gap over the border
 * colour), open at the sides, each a specimen with its name under it. The sheet arrives as one piece, so a moving cell
 * never shows the lines behind it.
 */
export function FoundationGrid() {
  return (
    <Reveal>
      <AppearItem className="grid gap-px border-y border-border bg-border sm:grid-cols-2 lg:grid-cols-6">
        {foundations.map((f) => (
          <Link
            key={f.slug}
            href={`/docs/foundations/${f.slug}`}
            className={`group flex flex-col gap-6 bg-background p-6 outline-none transition-colors hover:bg-card focus-visible:bg-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${fast} ${span[f.slug]}`}
          >
            {/* A fixed height, so titles in a row line up whatever the length of their lead; principles spans two rows and fills. */}
            <div
              aria-hidden
              className={`flex items-center justify-center overflow-hidden ${f.slug === "principles" ? "min-h-32 flex-1" : "h-32"}`}
            >
              <div
                className={`flex size-full items-center justify-center transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 ${fast}`}
              >
                {previews[f.slug]}
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-bold">{f.title}</span>
                <span className="text-sm text-muted-foreground">{f.lead}</span>
              </div>
              <ArrowRight
                aria-hidden
                className={`size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,translate] group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:group-hover:translate-x-0 ${fast}`}
              />
            </div>
          </Link>
        ))}
      </AppearItem>
    </Reveal>
  )
}
