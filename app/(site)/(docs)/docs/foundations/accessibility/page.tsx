import type { Metadata } from "next"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ContrastDemo } from "@/site/contrast-demo"
import { DensityDemo } from "@/site/density-demo"
import { Code, DocHeader, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { textLink } from "@/site/prose"
import { contrast, level, type Mode } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("accessibility")

const pairs: { fg: string; bg: string; use: string }[] = [
  { fg: "foreground", bg: "background", use: "Body text" },
  { fg: "foreground", bg: "card", use: "Text on cards" },
  { fg: "muted-foreground", bg: "background", use: "Secondary text" },
  { fg: "muted-foreground", bg: "card", use: "Secondary text on cards" },
  { fg: "primary-foreground", bg: "primary", use: "Primary button" },
  { fg: "info", bg: "info-subtle", use: "Info badge" },
  { fg: "success", bg: "success-subtle", use: "Toast or alert confirmation" },
  { fg: "warning", bg: "warning-subtle", use: "Warning badge" },
  { fg: "danger", bg: "danger-subtle", use: "Danger badge" },
  { fg: "danger", bg: "background", use: "Destructive button text" },
  { fg: "warning", bg: "background", use: "Warning text in a page" },
  { fg: "warning", bg: "card", use: "Warning text in a card" },
  { fg: "success", bg: "background", use: "Success text in a page" },
  { fg: "success", bg: "card", use: "Success text in a card" },
  { fg: "info", bg: "background", use: "A process being waited on: progress, a running stage" },
  { fg: "white", bg: "stop", use: "Emergency stop label" },
]

// UI parts: WCAG 1.4.11 asks 3:1 for what identifies a control. Field edges meet it in every theme; card and divider edges
// only group things (the content inside identifies them), so they stay quiet.
const edges = [
  { fg: "border", bg: "background", use: "Card and divider edge", ui: true },
  { fg: "input", bg: "card", use: "Field, checkbox and switch edge on a card", ui: true },
  { fg: "input", bg: "background", use: "Field edge on the page", ui: true },
]

/** A ratio and its grade. Text is graded on the WCAG text levels; a UI part (`ui`, an edge) passes at 3:1 and has no AA large. */
function Ratio({ fg, bg, mode, ui = false }: { fg: string; bg: string; mode: Mode; ui?: boolean }) {
  const r = contrast(fg, bg, mode)
  if (r === null) return <span className="text-muted-foreground">—</span>
  const l = ui ? (r >= 3 ? "Pass" : "Fail") : level(r)
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-xs">{r.toFixed(1)}:1</span>
      <span
        className={cn(
          "rounded-xs px-2 text-xs font-medium",
          l === "Fail" ? "bg-danger-subtle text-danger" : l === "AA large" ? "bg-warning-subtle text-warning" : "bg-muted text-foreground",
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

      <Section id="contrast" title="Contrast" lead="WCAG 2.2: AA needs 4.5:1 for text, 3:1 for large text (24 px, or 18.66 px (14 pt) bold) and UI parts.">
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
        <p className="text-sm text-muted-foreground">The emergency stop label is 18 px bold, just under large text, so it is held to 4.5:1 and passes in every theme.</p>
      </Section>

      <Section
        id="targets"
        title="Target size"
        lead="Anything interactive is at least 44 × 44 px (`--h-md`) on touch. With a mouse, compact controls may be 36 px (`--h-sm`) for dense tools; on touch screens `--h-sm` becomes 44 by itself, so the island, the dock and phone layouts are never smaller. Small visuals, like a 20 px checkbox, sit inside a 44 px row that is tappable as a whole."
      >
        <Specimen className="flex flex-wrap items-center gap-8">
          {[
            { h: "--h-sm", n: "36 · with a mouse only, at any density (44 on touch)" },
            { h: "--h-md", n: "44 · minimum" },
            { h: "--h-lg", n: "48 · primary actions" },
            { h: "--h-stop", n: "56 · emergency stop (64 in glove density; never smaller)" },
          ].map((t) => (
            <div key={t.h} className="flex flex-col items-center gap-2">
              <div className="rounded-sm bg-track" style={{ height: `var(${t.h})`, width: `var(${t.h})` }} />
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

      <Section
        id="high-contrast"
        title="High contrast"
        lead={"For a tablet in bright sun, glare on an outdoor robot's screen, and low vision. Put `data-contrast=\"more\"` on `<html>` or on a container, in light or dark. Text and status reach 7:1 on every surface they sit on (the emergency stop's label is held to 4.5:1, as in every theme: its ratio is in the table below), field and card edges reach 3:1 so they show without their fill, and trays over the map turn opaque. Meanings stay the same: blue is still a process, solid red still only the stop."}
      >
        <Specimen>
          <ContrastDemo />
        </Specimen>
        <TokenTable
          head={["Foreground", "Background", "Use", "Dark", "Light"]}
          rows={[...pairs, ...edges].map((p) => [
            <Code key="f">{p.fg}</Code>,
            <Code key="b">{p.bg}</Code>,
            <span key="u" className="text-muted-foreground">
              {p.use}
            </span>,
            <Ratio key="d" {...p} mode="dark-hc" />,
            <Ratio key="l" {...p} mode="light-hc" />,
          ])}
        />
        <p className="text-sm text-muted-foreground">
          Edges are UI parts, held to 3:1. To follow the system setting, set the attribute from{" "}
          <Code>{'matchMedia("(prefers-contrast: more)")'}</Code>; on a robot&apos;s own screen, offer it as a setting beside the appearance.
        </p>
      </Section>

      <Section id="checklist" title="Checklist">
        <ul className="flex flex-col gap-2 text-sm">
          {[
            "Status is a shape and a word; colour only when it is abnormal. Never colour alone.",
            "Every icon-only control has an accessible name.",
            "Errors say how to fix them and sit next to the field (`aria-describedby`).",
            "Hold and slide gestures have a keyboard alternative: hold Enter or Space for 2 s.",
            "Motion respects `prefers-reduced-motion`.",
            "Inputs use 16 px text so iOS does not zoom.",
          ].map((x) => (
            <li key={x} className="flex gap-3 rounded-sm bg-card p-3 ring-1 ring-border">
              <span aria-hidden className="text-foreground">
                ✓
              </span>
              <span>{x.split("`").map((part, i) => (i % 2 ? <Code key={i}>{part}</Code> : part))}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="evidence"
        title="Evidence"
        lead="What is checked automatically, and what still needs a person with a screen reader: the WCAG 2.2 conformance report and the manual test matrix for every stable component."
      >
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href="/docs/accessibility/conformance" className={textLink}>
              Accessibility conformance report
            </Link>
          </li>
          <li>
            <Link href="/docs/accessibility/manual-testing" className={textLink}>
              Manual accessibility testing
            </Link>
          </li>
        </ul>
      </Section>

      <Pager {...neighbours("accessibility")} />
    </article>
  )
}
