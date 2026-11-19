import type { Metadata } from "next"
import Link from "next/link"
// tokens-ok: Radio and RotateCcw are the counter-example in "One icon, one meaning"
import { Battery, Bell, Bluetooth, Bot, CircleAlert, House, ListChecks, Map, Radio, RotateCcw, Settings, Square, Trash2, Video, Wifi } from "lucide-react"
import { ChargingDock } from "@/registry/syncrobotic/ui/robot-icons"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { iconCount } from "@/site/icons"

export const metadata: Metadata = metaFor("iconography")

const set = [Square, Bluetooth, Wifi, Battery, Bell, Bot, House, ListChecks, Map, Video, Settings, CircleAlert]

export default function IconographyPage() {
  return (
    <article>
      <DocHeader
        title="Iconography"
        lead="Lucide icons at a 2 px stroke, in three sizes tied to component heights. An icon always has a name, either a visible label or an accessible one."
      />

      <Section
        id="set"
        title="Library"
        lead="Lucide (lucide.dev): outline, 2 px stroke, 24 px grid. Do not mix in filled icons or other sets. The kit uses a fixed subset; the icon set lists each one with its meaning."
      >
        <Specimen>
          <div className="grid grid-cols-4 gap-6 sm:grid-cols-6">
            {set.map((Icon, i) => (
              <div key={i} className="flex aspect-square items-center justify-center rounded-sm bg-card ring-1 ring-border">
                <Icon aria-hidden className="size-6" />
              </div>
            ))}
          </div>
        </Specimen>
        <p className="text-sm">
          <Link href="/icons" className="underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
            Browse all {iconCount} icons and what each means
          </Link>
        </p>
      </Section>

      <Section
        id="meaning"
        title="One icon, one meaning"
        lead="An icon is a word. Once the dock is ChargingDock, it is ChargingDock on every screen, and ChargingDock means nothing else. Lint rejects a Lucide import outside the set, so a new icon or a second icon for a meaning is a reviewed change to `site/icons.ts`."
      >
        <DoDont
          good={{
            visual: (
              <span className="flex items-center gap-6">
                {["Send to dock", "Return to dock", "Dock"].map((t) => (
                  <span key={t} className="flex items-center gap-2 text-sm">
                    <ChargingDock aria-hidden className="size-5" /> {t}
                  </span>
                ))}
              </span>
            ),
            text: "Look the meaning up in the icon set and use its icon, every time.",
          }}
          bad={{
            visual: (
              <span className="flex items-center gap-6">
                {(
                  [
                    [House, "Send to dock"],
                    [RotateCcw, "Return to dock"],
                    [Radio, "Dock"],
                  ] as const
                ).map(([I, t]) => (
                  <span key={t} className="flex items-center gap-2 text-sm">
                    <I aria-hidden className="size-5" /> {t}
                  </span>
                ))}
              </span>
            ),
            text: "Pick whatever looks close on each screen. This kit had three icons for the dock until the set existed.",
          }}
        />
      </Section>

      <Section id="sizes" title="Sizes">
        <Specimen className="flex flex-wrap items-end gap-8">
          {[
            { cls: "size-4", px: 16, use: "Inside 36 px controls, menus, inline" },
            { cls: "size-5", px: 20, use: "Inside 44–56 px controls, dock tabs" },
            { cls: "size-6", px: 24, use: "Standalone, empty states" },
          ].map((s) => (
            <div key={s.cls} className="flex flex-col items-start gap-3">
              <Bot aria-hidden className={s.cls} />
              <span className="font-mono text-xs">
                {s.cls} · {s.px}
              </span>
              <span className="max-w-40 text-xs text-muted-foreground">{s.use}</span>
            </div>
          ))}
        </Specimen>
      </Section>

      <Section id="status" title="Status is a shape, not an icon" lead="State uses the status glyph so it reads in colour and without it. Icons name things; glyphs say how they are.">
        <TokenTable
          head={["Glyph", "Status", "Means"]}
          rows={(
            [
              ["active", "Busy, on a mission"],
              ["normal", "Fine, waiting"],
              ["warning", "Needs attention"],
              ["danger", "Stopped or failed"],
              ["offline", "Offline"],
            ] as const
          ).map(([t, m]) => [<StatusGlyph key="g" status={t} className="size-4" />, <Code key="t">{t}</Code>, m])}
        />
      </Section>

      <Section id="rules" title="Rules">
        <DoDont
          good={{
            visual: (
              <button type="button" className="press flex h-(--h-md) items-center gap-2 rounded-sm px-4 text-sm text-danger ring-1 ring-danger">
                <Trash2 aria-hidden className="size-5" /> Delete route
              </button>
            ),
            text: "Pair an icon with a label, or give an icon-only button an `aria-label` and a tooltip.",
          }}
          bad={{
            visual: (
              <span aria-hidden className="flex size-(--h-md) items-center justify-center rounded-sm ring-1 ring-border">
                <Trash2 className="size-5" />
              </span>
            ),
            text: "Ship an icon-only button with no name. Screen readers announce “button” and nothing else.",
          }}
        />
      </Section>

      <Pager {...neighbours("iconography")} />
    </article>
  )
}
