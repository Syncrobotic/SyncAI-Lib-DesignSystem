import type { Metadata } from "next"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { px, themeValue } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("typography")

const scale = [
  { key: "5xl", cls: "text-5xl", role: "Hero", use: "Marketing page headlines only" },
  { key: "4xl", cls: "text-4xl", role: "Hero, phone", use: "Marketing headlines on phones" },
  { key: "3xl", cls: "text-3xl", role: "Display", use: "Page titles" },
  { key: "2xl", cls: "text-2xl", role: "Figure", use: "The number that leads a card or chart; a page's title in an app shell's top bar" },
  { key: "xl", cls: "text-xl", role: "Title", use: "Section and sheet titles" },
  { key: "lg", cls: "text-lg", role: "Heading", use: "Card titles, emergency stop label" },
  { key: "base", cls: "text-base", role: "Body", use: "Paragraphs, inputs" },
  { key: "sm", cls: "text-sm", role: "Label", use: "Buttons, list rows, labels" },
  { key: "xs", cls: "text-xs", role: "Caption", use: "Hints, metadata, tags" },
]

// Where a count is written in full and where it may be abbreviated (#386). The examples are formatCount's own output.
const counts = [
  { where: "Tables, headers, detail pages, figures, a section's count", form: "Full, with grouping", n: 135287, compact: false },
  { where: "A count on a tab, a chart's axis ticks, a compact chip", form: "Abbreviated, because space is the constraint", n: 135287, compact: true },
]

export default function TypographyPage() {
  const family = themeValue("font-sans")
  return (
    <article>
      <DocHeader
        title="Typography"
        lead="Nine sizes, three weights, one family. Every line height is a multiple of 4, so text sits on the same grid as spacing and components. A size off the scale produces nothing and CI reports it."
      />

      <Section id="family" title="Typeface" lead="Geist for Latin, with a Traditional Chinese fallback. Fonts ship with the product; they are never loaded from a CDN.">
        <Specimen className="flex flex-col gap-6">
          <p className="text-5xl font-bold tracking-tight">Aa 7F3A</p>
          <p className="max-w-xl text-muted-foreground">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 · %/°→</p>
          <Code>font-family: {family}</Code>
        </Specimen>
      </Section>

      <Section id="scale" title="Scale" lead="Size / line height in px. Inputs use body (16) so iOS does not zoom on focus.">
        <div className="overflow-hidden rounded-md border border-border">
          {scale.map((s) => (
            <div key={s.key} className="grid items-baseline gap-2 border-b border-border bg-card px-6 py-4 last:border-b-0 sm:grid-cols-[10rem_1fr]">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{s.role}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.cls} · {px(themeValue(`text-${s.key}`))}/{px(themeValue(`text-${s.key}--line-height`))}
                </span>
              </div>
              <span className={s.cls}>Patrol dog 7F3A is back on the dock</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="rhythm" title="Rhythm" lead="Line heights land on the 4 px grid, so a block of text ends exactly where spacing expects it.">
        <Specimen>
          <div
            className="max-w-xl"
            style={{
              backgroundImage: "linear-gradient(to bottom, var(--info-subtle) 1px, transparent 1px)",
              backgroundSize: "100% 4px",
            }}
          >
            <p className="text-xl font-bold">Night patrol finished</p>
            <p className="text-base text-muted-foreground">
              41 minutes, 2.3 km, two events. The robot returned to the dock at 02:41 and is charging. Footage is uploading over Wi-Fi.
            </p>
          </div>
        </Specimen>
      </Section>

      <Section id="weight" title="Weight" lead="Three weights. Hierarchy comes from size and weight together, never from colour alone.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { w: "font-normal", n: "400 Regular", u: "Body, secondary text" },
            { w: "font-medium", n: "500 Medium", u: "Labels, buttons, list titles, selected" },
            { w: "font-bold", n: "700 Bold", u: "Titles, figures, the stop" },
          ].map((x) => (
            <div key={x.w} className="flex flex-col gap-2 rounded-md border border-border bg-card p-4">
              <span className={`text-3xl ${x.w}`}>Aa</span>
              <span className="text-sm font-medium">{x.n}</span>
              <span className="text-xs text-muted-foreground">{x.u}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="numbers" title="Numbers" lead="Figures are tabular everywhere, so telemetry does not jitter as values change. Counts are written in full, and abbreviated only where space is the constraint.">
        <DoDont
          good={{
            visual: (
              <div className="flex flex-col items-end font-mono text-xl tabular-nums">
                <span>1.18 m/s</span>
                <span>11.42 m/s</span>
                <span>0.07 m/s</span>
              </div>
            ),
            text: "Keep the default `tabular-nums` so digits line up and do not shift.",
          }}
          bad={{
            visual: (
              <div className="flex flex-col items-end text-xl" style={{ fontVariantNumeric: "proportional-nums" }}>
                <span>1.18 m/s</span>
                <span>11.42 m/s</span>
                <span>0.07 m/s</span>
              </div>
            ),
            text: "Switch to proportional figures for live values.",
          }}
        />
        <p className="max-w-2xl text-sm text-muted-foreground">
          A count is written in full, with grouping, wherever it is read or compared. Abbreviate it only where space is the
          constraint, and keep the full number one step away: the table view under a chart, a tooltip on a tab. Write both with{" "}
          <Code>formatCount(n, {"{ compact, locale }"})</Code> from <Code>@syncrobotic/format-number</Code>, never a hand-made
          “k”: the locale decides the words (135K in English, 14萬 in Traditional Chinese).
        </p>
        <TokenTable
          head={["Where", "Form", "en", "zh-TW"]}
          rows={counts.map((c) => [
            c.where,
            c.form,
            <span key="en" className="tabular-nums">
              {formatCount(c.n, { compact: c.compact })}
            </span>,
            <span key="zh" className="tabular-nums">
              {formatCount(c.n, { compact: c.compact, locale: "zh-TW" })}
            </span>,
          ])}
        />
        <DoDont
          good={{
            visual: (
              <div className="flex flex-col items-end text-xl tabular-nums">
                <span>135,287 images</span>
                <span>1,204 labelled today</span>
              </div>
            ),
            text: "Write a count in a header or a table in full: 135,287.",
          }}
          bad={{
            visual: (
              <div className="flex flex-col items-end text-xl tabular-nums">
                <span>135k images</span>
                <span>1.2k labelled today</span>
              </div>
            ),
            text: "Abbreviate where there is room for the number: 135k hides 287 images and cannot be compared with the row below.",
          }}
        />
      </Section>

      <Section id="tokens" title="Tokens">
        <TokenTable
          head={["Role", "Utility", "Size", "Line height", "Use"]}
          rows={scale.map((s) => [
            s.role,
            <Code key="c">{s.cls}</Code>,
            `${px(themeValue(`text-${s.key}`))} px`,
            `${px(themeValue(`text-${s.key}--line-height`))} px`,
            <span key="u" className="text-muted-foreground">
              {s.use}
            </span>,
          ])}
        />
      </Section>

      <Pager {...neighbours("typography")} />
    </article>
  )
}
