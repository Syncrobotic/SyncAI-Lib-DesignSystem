import type { Metadata } from "next"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { px, themeValue } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("radius")

const radii = [
  { key: "xs", cls: "rounded-xs", use: "Tags, small parts flush inside a container" },
  { key: "sm", cls: "rounded-sm", use: "Buttons, inputs, icon tiles" },
  { key: "md", cls: "rounded-md", use: "Cards, parts inside a tray" },
  { key: "lg", cls: "rounded-lg", use: "Floating notices, dialogs" },
  { key: "xl", cls: "rounded-xl", use: "Trays (island, dock), bottom sheets" },
]

export default function RadiusPage() {
  return (
    <article>
      <DocHeader
        eyebrow="Foundations · 05"
        title="Radius"
        lead="Five steps, each 4 px apart, sharing the spacing base. Because steps differ by the padding between them, nested corners are always concentric."
      />

      <Section id="scale" title="Scale">
        <Specimen>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
            {radii.map((r) => (
              <div key={r.key} className="flex flex-col gap-3">
                <div className={`${r.cls} aspect-square border-2 border-foreground/80 bg-card`} />
                <div className="flex flex-col">
                  <span className="font-mono text-sm">
                    rounded-{r.key} · {px(themeValue(`radius-${r.key}`))}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.use}</span>
                </div>
              </div>
            ))}
          </div>
        </Specimen>
      </Section>

      <Section id="concentric" title="Outer radius = inner radius + padding" lead="A tray (24) with 8 padding holds parts at 16. A card (16) with 4 padding holds a tag at 12. The curves stay parallel.">
        <DoDont
          good={{
            visual: (
              <div className="rounded-xl bg-float p-2 ring-1 ring-edge">
                <div className="flex h-24 w-56 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">24 = 16 + 8</div>
              </div>
            ),
            text: "Step the radius down by the padding you add.",
          }}
          bad={{
            visual: (
              <div className="rounded-xl bg-float p-2 ring-1 ring-edge">
                <div className="flex h-24 w-56 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">24 inside 24</div>
              </div>
            ),
            text: "Repeat the outer radius inside. The gap pinches at the corners and the shapes look misaligned.",
          }}
        />
      </Section>

      <Section id="tokens" title="Tokens" lead="shadcn defaults differ: its button and input use `rounded-md`, its card `rounded-xl`. Move them to the steps above when adding them to the registry.">
        <TokenTable
          head={["Token", "Utility", "px", "Use"]}
          rows={radii.map((r) => [
            <Code key="t">--radius-{r.key}</Code>,
            <Code key="u">rounded-{r.key}</Code>,
            px(themeValue(`radius-${r.key}`)),
            <span key="n" className="text-muted-foreground">
              {r.use}
            </span>,
          ])}
        />
      </Section>

      <Pager {...neighbours("radius")} />
    </article>
  )
}
