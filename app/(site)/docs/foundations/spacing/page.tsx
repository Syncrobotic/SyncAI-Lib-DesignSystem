import type { Metadata } from "next"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { note, px, themeValue } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("spacing")

const steps = [
  { s: 1, use: "Icon to label, tight inline gaps" },
  { s: 2, use: "Inside trays, between buttons, field label to input" },
  { s: 3, use: "List row gaps, input side padding" },
  { s: 4, use: "Card padding, between related groups" },
  { s: 6, use: "Dialog padding, between sections in a card" },
  { s: 8, use: "Between page sections" },
]
const heights = ["h-tag", "h-sm", "h-md", "h-lg", "h-row", "h-stop"]

export default function SpacingPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Foundations · 04"
        title="Spacing"
        lead="Everything sits on a 4 px base and uses six steps. Fewer choices make layouts consistent across teams, and CI rejects any other value in shipped components."
      />

      <Section id="scale" title="Scale" lead="Tailwind's 4 px unit, restricted to 1, 2, 3, 4, 6 and 8.">
        <Specimen className="flex flex-col gap-3">
          {steps.map(({ s, use }) => (
            <div key={s} className="grid items-center gap-4 sm:grid-cols-[7rem_8rem_1fr]">
              <span className="font-mono text-sm">
                {s} · {s * 4}px
              </span>
              <span className="h-6 rounded-xs bg-info" style={{ width: s * 4 * 3 }} />
              <span className="text-sm text-muted-foreground">{use}</span>
            </div>
          ))}
        </Specimen>
      </Section>

      <Section id="nesting" title="Inside out" lead="Padding grows as containers grow. The tray uses 8 inside and 8 between, so its parts read as one object.">
        <Specimen className="flex flex-col items-center gap-3">
          <div className="relative flex w-full max-w-80 flex-col gap-2 rounded-xl bg-float p-2 shadow-float ring-1 ring-edge">
            <div className="flex h-(--h-stop) items-center justify-center rounded-md bg-stop text-lg font-bold text-white">Emergency stop</div>
            <div className="flex gap-2">
              <div className="flex h-(--h-lg) flex-1 items-center justify-center rounded-md bg-muted text-sm">Now</div>
              <div className="flex h-(--h-lg) flex-1 items-center justify-center rounded-md text-sm text-muted-foreground">Events</div>
            </div>
          </div>
          <span className="font-mono text-xs text-info">padding 8 · gap 8 · radius 24 = 16 + 8</span>
        </Specimen>
      </Section>

      <Section id="heights" title="Component heights" lead="Heights are tokens too. Anything interactive is at least 44 px; 56 is reserved for list rows and the emergency stop.">
        <Specimen className="flex flex-wrap items-end gap-4">
          {heights.map((h) => (
            <div key={h} className="flex flex-col items-center gap-2">
              <div className="w-16 rounded-xs bg-secondary ring-1 ring-border" style={{ height: `var(--${h})` }} />
              <span className="font-mono text-xs">{px(themeValue(h))}</span>
            </div>
          ))}
        </Specimen>
        <TokenTable
          head={["Token", "Utility", "px", "Use"]}
          rows={heights.map((h) => [
            <Code key="t">--{h}</Code>,
            <Code key="u">h-(--{h})</Code>,
            px(themeValue(h)),
            <span key="n" className="text-muted-foreground">
              {note(h).replace(/^\d+\s*/, "")}
            </span>,
          ])}
        />
      </Section>

      <Section id="sections" title="Page sections" lead="Marketing pages need more air between sections than product UI. Two layout tokens cover that; never use them inside components.">
        <TokenTable
          head={["Token", "Utility", "px", "Use"]}
          rows={["space-section", "space-section-sm"].map((t) => [
            <Code key="t">--{t}</Code>,
            <Code key="u">py-(--{t})</Code>,
            px(themeValue(t)),
            <span key="n" className="text-muted-foreground">
              {t.endsWith("sm") ? "Between sections on phones" : "Between sections on marketing pages"}
            </span>,
          ])}
        />
      </Section>

      <Section id="rules" title="Rules">
        <DoDont
          good={{
            visual: (
              <div className="flex w-56 flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
                <span className="text-sm font-medium">Wi-Fi</span>
                <span className="text-xs text-muted-foreground">Good signal</span>
                <div className="mt-2 h-2 rounded-full bg-success" />
              </div>
            ),
            text: "Use the scale: 16 card padding, 8 between related lines.",
          }}
          bad={{
            visual: (
              <div className="flex w-56 flex-col rounded-md bg-card ring-1 ring-border" style={{ padding: 13, gap: 5 }}>
                <span className="text-sm font-medium">Wi-Fi</span>
                <span className="text-xs text-muted-foreground">Good signal</span>
                <div className="h-2 rounded-full bg-success" style={{ marginTop: 11 }} />
              </div>
            ),
            text: "Eyeball values like 13, 5 or 11. They drift between screens and teams. `npm run lint:tokens` rejects them.",
          }}
        />
      </Section>

      <Pager {...neighbours("spacing")} />
    </article>
  )
}
