import type { Metadata } from "next"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { MotionDemo } from "@/site/motion-demo"
import { MotionPatterns } from "@/site/motion-patterns"
import { themeValue } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("motion")

const durations = [
  { key: "motion-fast", use: "Press feedback, hover" },
  { key: "motion-base", use: "State changes, spring-back, switches" },
  { key: "motion-sheet", use: "Sheets and panels in and out" },
]

const timings = [
  { t: "120 ms", what: "Press feedback appears" },
  { t: "200 ms", what: "Slide to release springs back" },
  { t: "300 ms", what: "Spinner may appear; faster work shows none" },
  { t: "1.2 s", what: "Skeleton breath cycle" },
  { t: "1.5 s", what: "No reply from the robot: stop is marked unconfirmed, Bluetooth takes over" },
  { t: "2 s", what: "Hold to stop all; hold Enter or Space to release" },
]

/** Plots cubic-bezier(x1, y1, x2, y2) in a 100 × 100 box. */
function Curve({ value }: { value: string }) {
  const [x1, y1, x2, y2] = value.match(/[\d.]+/g)!.map(Number)
  const p = (x: number, y: number) => `${x * 100},${100 - y * 100}`
  return (
    <svg viewBox="-4 -4 108 108" className="size-40 text-foreground" aria-label={`Easing curve ${value}`}>
      <rect x="0" y="0" width="100" height="100" fill="none" stroke="var(--border)" />
      <line x1="0" y1="100" x2={x1 * 100} y2={100 - y1 * 100} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
      <line x1="100" y1="0" x2={x2 * 100} y2={100 - y2 * 100} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
      <path d={`M0,100 C${p(x1, y1)} ${p(x2, y2)} 100,0`} fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  )
}

export default function MotionPage() {
  const ease = themeValue("ease-standard")
  return (
    <article>
      <DocHeader
        eyebrow="Foundations · 07"
        title="Motion"
        lead="Movement only marks a change of state: pressed, opened, stopped, released. Nothing moves to decorate or to attract attention."
      />

      <Section id="durations" title="Durations" lead="Three tokens. Press Play to compare them.">
        <Specimen>
          <MotionDemo durations={durations.map((d) => ({ ...d, ms: themeValue(d.key) }))} />
        </Specimen>
      </Section>

      <Section id="easing" title="Easing" lead="One curve for everything: fast out, gentle settle. Things respond immediately and land softly.">
        <Specimen className="flex flex-wrap items-center gap-8">
          <Curve value={ease} />
          <div className="flex flex-col gap-1">
            <Code>--ease-standard</Code>
            <Code>{ease}</Code>
            <span className="text-sm text-muted-foreground">
              Utility: <Code>ease-(--ease-standard)</Code>
            </span>
          </div>
        </Specimen>
      </Section>

      <Section
        id="patterns"
        title="Patterns"
        lead="Five movements cover every state change. This site uses exactly these: pages and tab panels appear, the mobile menu opens as a sheet, controls press, icons swap, and the current-page marker moves."
      >
        <MotionPatterns />
        <p className="text-sm text-muted-foreground">
          CSS uses the tokens directly (<Code>duration-(--motion-base) ease-(--ease-standard)</Code>). JavaScript animation (motion/react) imports the same
          values from <Code>site/motion.ts</Code>; a unit test fails if they drift from the theme file.
        </p>
      </Section>

      <Section id="components" title="In the components" lead="Every component uses one of the patterns, from the theme. CI fails a component that skips them.">
        <TokenTable
          head={["Pattern", "Utility", "Components"]}
          rows={[
            [
              "Appear / disappear",
              <Code key="u">animate-appear · animate-disappear</Code>,
              "Dialog, Alert dialog, Popover, Dropdown menu, Select, Tooltip, Toast, Alert, Alarm, island notices, tab panels, field errors",
            ],
            ["Sheet", <Code key="u">animate-sheet-in-* · animate-sheet-out-*</Code>, "Sheet (bottom, right, left); scrims fade in with animate-fade-in"],
            ["Expand / collapse", <Code key="u">animate-expand · animate-collapse</Code>, "Accordion"],
            ["Press", <Code key="u">press</Code>, "Button, Toggle, Segmented control, Emergency stop, Dock, island zones, list rows, app-shell navigation"],
            ["Move", <Code key="u">transition · duration-(--motion-base) ease-(--ease-standard)</Code>, "Switch thumb, Slide to release, Progress"],
          ]}
        />
        <p className="text-sm text-muted-foreground">
          <Code>npm run lint:motion</Code> checks that overlays animate in and out, that every button presses, and that no component writes its own duration or
          easing.
        </p>
      </Section>

      <Section id="timing" title="Timing rules" lead="Shared across products, so every app behaves the same under pressure.">
        <ol className="relative flex flex-col border-l border-border pl-6">
          {timings.map((x) => (
            <li key={x.t} className="relative pb-6 last:pb-0">
              <span className="absolute top-1.5 -left-6 size-2 -translate-x-1/2 rounded-full bg-foreground" />
              <span className="font-mono text-sm">{x.t}</span>
              <p className="text-sm text-muted-foreground">{x.what}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="reduced"
        title="Reduced motion"
        lead="When the system asks for reduced motion, every duration drops to 0.01 ms and the skeleton stops breathing. State still changes; it just does not travel."
      >
        <DoDont
          good={{
            visual: <span className="rounded-sm bg-success-subtle px-3 py-2 text-sm text-success">Released</span>,
            text: "Animate the change from stopped to released.",
          }}
          bad={{
            // motion-ok: the "don't" example shows the loop it forbids
            visual: <span className="animate-pulse rounded-sm bg-info-subtle px-3 py-2 text-sm text-info">New</span>,
            text: "Loop animations to draw the eye. A pulsing badge competes with the emergency stop.",
          }}
        />
      </Section>

      <Pager {...neighbours("motion")} />
    </article>
  )
}
