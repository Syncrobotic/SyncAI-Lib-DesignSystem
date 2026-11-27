import type { Metadata } from "next"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { color } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("elevation")

const layers = [
  { n: "0", name: "Surface", recipe: "bg-card ring-1 ring-border", use: "Cards, list groups, tables. Sits in the page.", shadow: "none" },
  { n: "1", name: "Float", recipe: "bg-float shadow-float ring-1 ring-edge backdrop-blur-xl", use: "Island and dock over the map. Translucent so the map stays visible.", shadow: "shadow-float" },
  { n: "2", name: "Overlay", recipe: "bg-popover shadow-overlay ring-1 ring-border + bg-scrim behind", use: "Dialogs, sheets, menus. Blocks or covers the page.", shadow: "shadow-overlay" },
]

export default function ElevationPage() {
  return (
    <article>
      <DocHeader
        title="Elevation"
        lead="Three layers, no more. Depth tells the operator what is page, what floats over the live view, and what interrupts it."
      />

      <Section id="layers" title="Layers" lead="In dark mode shadows are weak, so every raised layer also gets a hairline edge.">
        <Specimen className="flex justify-center bg-map">
          <div className="relative h-72 w-full max-w-lg">
            <div className="absolute inset-x-0 top-0 flex h-40 flex-col rounded-md bg-card p-4 ring-1 ring-border">
              <span className="font-mono text-xs text-muted-foreground">0 · Surface</span>
            </div>
            <div className="absolute inset-x-8 top-16 flex h-36 flex-col rounded-xl bg-float p-4 shadow-float ring-1 ring-edge backdrop-blur-xl">
              <span className="font-mono text-xs text-muted-foreground">1 · Float</span>
            </div>
            <div className="absolute inset-x-16 top-32 flex h-36 flex-col rounded-lg bg-popover p-4 shadow-overlay ring-1 ring-border">
              <span className="font-mono text-xs text-muted-foreground">2 · Overlay</span>
            </div>
          </div>
        </Specimen>
        <TokenTable
          head={["Layer", "Recipe", "Use"]}
          rows={layers.map((l) => [
            <span key="n" className="font-medium">
              {l.n} · {l.name}
            </span>,
            <Code key="r">{l.recipe}</Code>,
            <span key="u" className="text-muted-foreground">
              {l.use}
            </span>,
          ])}
        />
      </Section>

      <Section id="tokens" title="Shadow and edge tokens">
        <TokenTable
          head={["Token", "Light", "Dark"]}
          rows={["shadow-float", "shadow-overlay", "edge", "float", "scrim"].map((t) => [
            <Code key="t">--{t}</Code>,
            <Code key="l">{color(t).light}</Code>,
            <Code key="d">{color(t).dark}</Code>,
          ])}
        />
      </Section>

      <Section id="rules" title="Rules">
        <DoDont
          good={{
            visual: (
              <div className="flex w-64 flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
                <div className="h-3 w-2/3 rounded-xs bg-muted" />
                <div className="h-3 w-1/2 rounded-xs bg-muted" />
              </div>
            ),
            text: "Keep in-page content flat: one surface, a hairline border.",
          }}
          bad={{
            visual: (
              <div className="flex w-64 flex-col gap-2 rounded-md bg-card p-4 shadow-overlay ring-1 ring-border">
                <div className="rounded-sm bg-card p-3 shadow-float ring-1 ring-border">
                  <div className="h-3 w-2/3 rounded-xs bg-muted" />
                </div>
              </div>
            ),
            text: "Stack shadows on cards inside cards. Shadow means the layer floats; in-page content does not.",
          }}
        />
        <DoDont
          good={{
            visual: (
              <div className="flex w-64 flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
                <div className="h-3 w-1/2 rounded-xs bg-muted" />
                <div className="flex h-8 items-center rounded-sm bg-muted px-3">
                  <div className="h-2 w-1/3 rounded-xs bg-border" />
                </div>
                <div className="border-t border-border pt-3">
                  <div className="h-3 w-2/3 rounded-xs bg-muted" />
                </div>
              </div>
            ),
            text: "One edge per surface. Inside it, a field is filled (no outline), a table or a list is bare, and a part is set apart by a hairline and space. The app shell's inset content panel is the page: cards sit on it as on any page.",
          }}
          bad={{
            visual: (
              <div className="flex w-64 flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
                <div className="h-3 w-1/2 rounded-xs bg-muted" />
                <div className="flex h-8 items-center rounded-sm px-3 ring-1 ring-border">
                  <div className="h-2 w-1/3 rounded-xs bg-border" />
                </div>
                <div className="rounded-sm p-3 ring-1 ring-border">
                  <div className="h-3 w-2/3 rounded-xs bg-muted" />
                </div>
              </div>
            ),
            text: "Draw an edge inside an edge: an outlined field in a bordered bar, a ringed table in a card, a bordered panel in a step. Each box reads as one more layer.",
          }}
        />
      </Section>

      <Pager {...neighbours("elevation")} />
    </article>
  )
}
