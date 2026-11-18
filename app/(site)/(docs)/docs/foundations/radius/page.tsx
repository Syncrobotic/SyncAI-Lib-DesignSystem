import type { Metadata } from "next"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { LogoMark } from "@/site/logo"
import { px, themeValue } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("radius")

// The same uses the token lint allows rounded-full for (scripts/check-tokens.mjs, ROUND).
const round = [
  "Avatars and their placeholders",
  "Status dots and list bullets",
  "Switch track and thumb, radio and its dot",
  "Slider track and thumb, progress track",
  "Count badges (a number in a circle)",
  "The bottom sheet's grabber",
]

const radii = [
  { key: "2xs", cls: "rounded-2xs", use: "Controls 24 px and smaller: checkbox, key caps, a handle in a tight row" },
  { key: "xs", cls: "rounded-xs", use: "Tags, small parts, items inside a panel with 8 px padding (menus, command)" },
  { key: "sm", cls: "rounded-sm", use: "Buttons, inputs, icon tiles" },
  { key: "md", cls: "rounded-md", use: "Cards, parts inside a tray" },
  { key: "lg", cls: "rounded-lg", use: "Floating notices, dialogs" },
  { key: "xl", cls: "rounded-xl", use: "Trays (island, dock), bottom sheets" },
]

export default function RadiusPage() {
  return (
    <article>
      <DocHeader
        title="Radius"
        lead="Six steps, 4 to 24, each 4 px apart, sharing the spacing base. Because steps differ by the padding between them, nested corners can always be concentric. `npm run check:radius` finds corners that are not, on every docs page and block."
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

      <Section id="concentric" title="Outer radius = inner radius + padding" lead="A tray (24) with 8 padding holds parts at 16. A panel (16) with 8 padding holds items at 8, never at 12: a menu, the command list, a row of attachments. When the parts must stay at 12, give the container 20. The curves stay parallel.">
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

      <Section id="full" title="Full: only for things that are round" lead="`rounded-full` is not a seventh step. It is for shapes whose meaning is a circle or a pill, never for a container, card or button.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ul className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-sm">
            {round.map((r) => (
              <li key={r} className="flex items-center gap-3">
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
                {r}
              </li>
            ))}
          </ul>
          <DoDont
            good={{ visual: <span className="flex h-(--h-md) items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground">Start patrol</span>, text: "Buttons use rounded-sm." }}
            bad={{ visual: <span className="flex h-(--h-md) items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">Start patrol</span>, text: "A pill button is a second shape language." }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          CI enforces it: <Code>npm run lint:tokens</Code> fails on <Code>rounded-full</Code> in any file not listed with its use.
        </p>
      </Section>

      <Section id="brand" title="Brand mark and icon tiles" lead="The SYNCROBOTIC mark is a disc by design. It is artwork, not UI, so the radius scale does not reshape it. What holds the mark follows the scale.">
        <Specimen className="flex flex-wrap items-end gap-8">
          <figure className="flex flex-col items-center gap-2">
            <LogoMark className="size-16" />
            <figcaption className="text-xs text-muted-foreground">Mark: never re-cornered</figcaption>
          </figure>
          <figure className="flex flex-col items-center gap-2">
            {/* Icon tiles scale with the icon, so their corner is a proportion: rounded-xl (24) at the 108 px app-icon size = 22 %. */}
            <span className="flex size-16 items-center justify-center bg-foreground" style={{ borderRadius: "22%" }}>
              <LogoMark title="" className="size-12 [&_path:first-child]:fill-background [&_path:not(:first-child)]:fill-foreground" />
            </span>
            <figcaption className="text-xs text-muted-foreground">Favicon tile: corner 22 % of the side</figcaption>
          </figure>
        </Specimen>
        <p className="text-sm text-muted-foreground">
          App icons that the OS masks (iOS, Android adaptive) are drawn full bleed: the OS supplies the tile, and a second radius inside it would not be concentric.
        </p>
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
