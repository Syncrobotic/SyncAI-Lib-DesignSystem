import type { Metadata } from "next"
import { cn } from "@/lib/utils"
import { DensityDemo } from "@/site/density-demo"
import { Code, DocHeader, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { contrast, level, type Mode } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("accessibility")

const pairs: { fg: string; bg: string; use: string }[] = [
  { fg: "foreground", bg: "background", use: "Body text" },
  { fg: "foreground", bg: "card", use: "Text on cards" },
  { fg: "muted-foreground", bg: "background", use: "Secondary text" },
  { fg: "muted-foreground", bg: "card", use: "Secondary text on cards" },
  { fg: "primary-foreground", bg: "primary", use: "Primary button" },
  { fg: "info", bg: "info-subtle", use: "Info badge" },
  { fg: "success", bg: "success-subtle", use: "Success badge" },
  { fg: "warning", bg: "warning-subtle", use: "Warning badge" },
  { fg: "danger", bg: "danger-subtle", use: "Danger badge" },
  { fg: "danger", bg: "background", use: "Destructive button text" },
  { fg: "warning", bg: "background", use: "Warning text in a page" },
  { fg: "warning", bg: "card", use: "Warning text in a card" },
  { fg: "success", bg: "background", use: "Success text in a page" },
  { fg: "success", bg: "card", use: "Success text in a card" },
  { fg: "info", bg: "background", use: "Links" },
  { fg: "white", bg: "stop", use: "Emergency stop label" },
]

function Ratio({ fg, bg, mode }: { fg: string; bg: string; mode: Mode }) {
  const r = contrast(fg, bg, mode)
  if (r === null) return <span className="text-muted-foreground">—</span>
  const l = level(r)
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-xs">{r.toFixed(1)}:1</span>
      <span
        className={cn(
          "rounded-xs px-2 text-xs font-medium",
          l === "Fail" ? "bg-danger-subtle text-danger" : l === "AA large" ? "bg-warning-subtle text-warning" : "bg-success-subtle text-success",
        )}
      >
        {l}
      </span>
    </span>
  )
}

export default function AccessibilityPage() {
  return (
    <article>
      <DocHeader
        title="Accessibility"
        lead="Accessibility is part of the tokens, not a review step. Contrast below is computed from the theme file on every build."
      />

      <Section id="contrast" title="Contrast" lead="WCAG 2.2: AA needs 4.5:1 for text, 3:1 for large text (18 px bold or 24 px) and UI parts.">
        <TokenTable
          head={["Foreground", "Background", "Use", "Dark", "Light"]}
          rows={pairs.map((p) => [
            <Code key="f">{p.fg}</Code>,
            <Code key="b">{p.bg}</Code>,
            <span key="u" className="text-muted-foreground">
              {p.use}
            </span>,
            <Ratio key="d" {...p} mode="dark" />,
            <Ratio key="l" {...p} mode="light" />,
          ])}
        />
        <p className="text-sm text-muted-foreground">The emergency stop label is 18 px bold, so it is held to the large-text threshold of 3:1.</p>
      </Section>

      <Section
        id="targets"
        title="Target size"
        lead="Anything interactive is at least 44 × 44 px (`--h-md`) on touch. With a mouse, compact controls may be 36 px (`--h-sm`) for dense tools; on touch screens `--h-sm` becomes 44 by itself, so the island, the dock and phone layouts are never smaller. Small visuals, like a 20 px checkbox, sit inside a 44 px row that is tappable as a whole."
      >
        <Specimen className="flex flex-wrap items-center gap-8">
          {[
            { h: "--h-sm", n: "36 · compact, mouse only (44 on touch)" },
            { h: "--h-md", n: "44 · minimum" },
            { h: "--h-lg", n: "48 · primary actions" },
            { h: "--h-stop", n: "56 · emergency stop" },
          ].map((t) => (
            <div key={t.h} className="flex flex-col items-center gap-2">
              <div className="rounded-sm bg-secondary ring-1 ring-border" style={{ height: `var(${t.h})`, width: `var(${t.h})` }} />
              <span className="text-xs text-muted-foreground">{t.n}</span>
            </div>
          ))}
        </Specimen>
      </Section>

      <Section
        id="focus"
        title="Focus"
        lead="Every focusable element shows a 2 px `--ring` outline with a 2 px offset on keyboard focus. It is set globally; do not remove it."
      >
        <Specimen className="flex gap-4">
          <span className="flex h-(--h-md) items-center rounded-sm bg-secondary px-4 text-sm font-medium outline-2 outline-offset-2 outline-ring">
            Focused button
          </span>
          <span className="flex h-(--h-md) items-center rounded-sm bg-secondary px-4 text-sm font-medium">Resting button</span>
        </Specimen>
      </Section>

      <Section
        id="density"
        title="Density"
        lead="One attribute sets how big every control is, because every height is a token. Put `data-density` on `<html>` for the whole app or on a container for one area; type and spacing stay the same. Glove for outdoor work in gloves, compact for a control-room console with a mouse."
      >
        <Specimen>
          <DensityDemo />
        </Specimen>
      </Section>

      <Section id="checklist" title="Checklist">
        <ul className="flex flex-col gap-2 text-sm">
          {[
            "Status is shape plus colour plus word, never colour alone.",
            "Every icon-only control has an accessible name.",
            "Errors say how to fix them and sit next to the field (`aria-describedby`).",
            "Hold and slide gestures have a keyboard alternative: hold Enter or Space for 2 s.",
            "Motion respects `prefers-reduced-motion`.",
            "Inputs use 16 px text so iOS does not zoom.",
          ].map((x) => (
            <li key={x} className="flex gap-3 rounded-sm bg-card p-3 ring-1 ring-border">
              <span aria-hidden className="text-success">
                ✓
              </span>
              <span>{x.split("`").map((part, i) => (i % 2 ? <Code key={i}>{part}</Code> : part))}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Pager {...neighbours("accessibility")} />
    </article>
  )
}
