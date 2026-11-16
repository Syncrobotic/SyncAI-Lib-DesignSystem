import type { Metadata } from "next"
import { H2, PageTitle, Rules } from "@/site/prose"
import { color, note, themeValue } from "@/site/theme-tokens"

const description =
  "Design tokens of the SYNCROBOTIC design system: colour rules for dark and light mode, type scale, radius, heights, spacing and motion for robot control apps."

export const metadata: Metadata = {
  title: "Foundations — design tokens",
  description,
  alternates: { canonical: "/docs/foundations" },
  openGraph: { title: "Foundations — design tokens", description, url: "/docs/foundations" },
}

const colorGroups: { title: string; lead: string; tokens: string[] }[] = [
  {
    title: "Surfaces and text",
    lead: "A neutral greyscale carries the interface. Primary is neutral high contrast: white in dark mode, black in light mode.",
    tokens: ["background", "card", "secondary", "border", "foreground", "muted-foreground", "primary", "disabled", "ring"],
  },
  {
    title: "Status colours (always in pairs)",
    lead: "Foreground on its subtle tint, e.g. text-info on bg-info-subtle. Blue only means “in progress”.",
    tokens: ["info", "info-subtle", "success", "success-subtle", "warning", "warning-subtle", "danger", "danger-subtle", "neutral", "neutral-subtle"],
  },
  {
    title: "Emergency stop",
    lead: "Solid red is for the emergency stop only and is the same in both modes. Other destructive actions use the danger outline and text.",
    tokens: ["stop", "stop-deep"],
  },
  {
    title: "Map and overlays",
    lead: "The map surface, trays floating over it and the scrim behind sheets.",
    tokens: ["map", "map-point", "float", "edge", "scrim"],
  },
]

const principles = [
  "Dark is the default. Teleoperation and intercom screens stay dark whatever the appearance setting.",
  "Selected states are inverted (white on black in dark mode); a switch that is on uses success.",
  "Actions in the lower part of the dock are never solid white, so nothing competes with the emergency stop.",
  "Alerts other than the stop, such as event counts, use danger on danger-subtle, never solid red.",
  "Motion only marks a change of state, and drops to zero under reduced motion.",
  "Fonts ship with the app, never from a CDN. Numbers are always tabular.",
]

function Chip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-8 shrink-0 rounded-xs border border-edge" style={{ background: value }} />
      <span className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs">{value}</span>
      </span>
    </div>
  )
}

const typeScale = [
  { cls: "text-3xl", name: "display", key: "3xl" },
  { cls: "text-xl", name: "title", key: "xl" },
  { cls: "text-lg", name: "heading", key: "lg" },
  { cls: "text-base", name: "body", key: "base" },
  { cls: "text-sm", name: "label", key: "sm" },
  { cls: "text-xs", name: "caption", key: "xs" },
]

const px = (rem: string) => `${Math.round(parseFloat(rem) * 16)}`

const radii = [
  { cls: "rounded-xs", key: "xs", use: "Tags, small parts flush inside a container" },
  { cls: "rounded-sm", key: "sm", use: "Buttons, inputs, icon tiles" },
  { cls: "rounded-md", key: "md", use: "Cards, parts inside a tray" },
  { cls: "rounded-lg", key: "lg", use: "Floating notices, dialogs" },
  { cls: "rounded-xl", key: "xl", use: "Trays (island, dock), bottom sheets" },
]

const heights = ["h-tag", "h-sm", "h-md", "h-lg", "h-row", "h-stop"]
const spacing = [1, 2, 3, 4, 6, 8]
const motion = [
  { key: "motion-fast", use: "Press feedback" },
  { key: "motion-base", use: "State changes, slide-to-release spring-back" },
  { key: "motion-sheet", use: "Bottom sheets in and out" },
]

export default function FoundationsPage() {
  return (
    <article>
      <PageTitle
        eyebrow="Getting started"
        title="Foundations"
        lead="An interface for robot operators: outdoors, one-handed, sometimes in a hurry. Every value on this page is read from syncrobotic-theme.css at build time."
      />

      <H2 id="principles">Principles</H2>
      <Rules rules={principles} />

      <H2 id="color">Colour</H2>
      <div className="flex flex-col gap-8">
        {colorGroups.map((g) => (
          <section key={g.title} className="flex flex-col gap-3">
            <div>
              <h3 className="font-medium">{g.title}</h3>
              <p className="text-sm text-muted-foreground">{g.lead}</p>
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              {g.tokens.map((t) => {
                const v = color(t)
                return (
                  <div key={t} className="grid grid-cols-1 items-center gap-3 border-b border-border bg-card px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:gap-6">
                    <span className="font-mono text-sm">--{t}</span>
                    <Chip value={v.light} label="Light" />
                    <Chip value={v.dark} label="Dark" />
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <H2 id="type">Typography</H2>
      <p className="pb-3 text-sm text-muted-foreground">
        Six steps, every line height a multiple of 4. Inputs use body (16) so iOS does not zoom. Three weights only: 400, 500, 700.
      </p>
      <div className="overflow-hidden rounded-md border border-border">
        {typeScale.map((t) => (
          <div key={t.cls} className="flex flex-col gap-1 border-b border-border bg-card px-4 py-4 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6">
            <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">
              {t.name} {px(themeValue(`text-${t.key}`))}/{px(themeValue(`text-${t.key}--line-height`))}
            </span>
            <span className={t.cls}>Patrol dog 7F3A is back on the dock</span>
          </div>
        ))}
      </div>
      <div className="flex gap-6 pt-3">
        <span className="font-normal">400 Regular</span>
        <span className="font-medium">500 Medium</span>
        <span className="font-bold">700 Bold</span>
      </div>

      <H2 id="radius">Radius</H2>
      <p className="pb-3 text-sm text-muted-foreground">
        All multiples of 4, sharing the spacing base, so nested corners are always concentric: outer radius = inner radius + padding.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {radii.map((r) => (
          <div key={r.cls} className="flex flex-col gap-2">
            <div className={`${r.cls} aspect-square border border-border bg-secondary`} />
            <p className="font-mono text-xs">
              {r.cls} · {px(themeValue(`radius-${r.key}`))}
            </p>
            <p className="text-xs text-muted-foreground">{r.use}</p>
          </div>
        ))}
      </div>

      <H2 id="height">Heights</H2>
      <p className="pb-3 text-sm text-muted-foreground">Anything interactive is at least 44. Only list rows and the emergency stop are 56.</p>
      <div className="flex flex-col gap-2">
        {heights.map((h) => (
          <div key={h} className="flex items-center gap-4">
            <span className="w-24 shrink-0 font-mono text-xs">--{h}</span>
            <div className="w-24 shrink-0 rounded-xs bg-secondary sm:w-40" style={{ height: `var(--${h})` }} />
            <span className="text-sm text-muted-foreground">{note(h)}</span>
          </div>
        ))}
      </div>

      <H2 id="spacing">Spacing</H2>
      <p className="pb-3 text-sm text-muted-foreground">Tailwind&apos;s 4 px base, six steps only. CI rejects any other value.</p>
      <div className="flex flex-col gap-2">
        {spacing.map((s) => (
          <div key={s} className="flex items-center gap-4">
            <span className="w-24 shrink-0 font-mono text-xs">
              {s} · {s * 4}px
            </span>
            <div className="h-3 rounded-full bg-info" style={{ width: s * 4 }} />
          </div>
        ))}
      </div>

      <H2 id="motion">Motion</H2>
      <p className="pb-3 text-sm text-muted-foreground">
        Easing {themeValue("ease-standard")}. Skeletons breathe as a whole over 1.2 s, with no diagonal shimmer.
      </p>
      <div className="overflow-hidden rounded-md border border-border">
        {motion.map((m) => (
          <div key={m.key} className="flex gap-6 border-b border-border bg-card px-4 py-3 text-sm last:border-b-0">
            <span className="w-32 shrink-0 font-mono">--{m.key}</span>
            <span className="w-16 shrink-0">{themeValue(m.key)}</span>
            <span className="text-muted-foreground">{m.use}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
