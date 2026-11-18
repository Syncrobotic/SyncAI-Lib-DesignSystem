import type { Metadata } from "next"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, Swatch, TokenTable } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { color, contrast } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("color")

const neutrals = ["background", "card", "secondary", "border", "muted-foreground", "foreground"]
const tones = [
  { t: "info", means: "In progress, and nothing else" },
  { t: "success", means: "Just done: a confirmation that comes and goes (toast, alert). A calm state stays grey." },
  { t: "warning", means: "Needs attention soon" },
  { t: "danger", means: "Failed, destructive, stopped" },
  { t: "neutral", means: "Offline, inactive" },
]
const groups: { title: string; tokens: string[]; use: Record<string, string> }[] = [
  {
    title: "Surface and text",
    tokens: ["background", "card", "popover", "secondary", "muted", "border", "input", "foreground", "muted-foreground", "disabled"],
    use: {
      background: "Page only. Never fill a control with it: a field on a panel takes the panel's surface (card) and an input edge, or it reads as a hole",
      card: "Cards, list groups, app-shell panels, and the fields on them",
      popover: "Menus, dialogs",
      secondary: "Secondary buttons",
      muted: "Tracks, current page in navigation (hover is accent)",
      border: "Dividers, outlines",
      input: "Field outlines",
      foreground: "Body text",
      "muted-foreground": "Secondary text",
      disabled: "Disabled fill",
    },
  },
  {
    title: "Emphasis",
    tokens: ["primary", "primary-foreground", "ring"],
    use: { primary: "Primary action, selected", "primary-foreground": "Text on primary", ring: "Focus ring: the foreground colour, so focus never looks like a status" },
  },
  {
    title: "Status (pairs)",
    tokens: tones.flatMap(({ t }) => [t, `${t}-subtle`]),
    use: Object.fromEntries(
      tones.flatMap(({ t, means }) => [
        [t, means],
        [`${t}-subtle`, `Tint behind ${t}`],
      ]),
    ),
  },
  {
    title: "Emergency stop",
    tokens: ["stop", "stop-deep"],
    use: { stop: "Emergency stop only", "stop-deep": "Stopped state, sent over Bluetooth" },
  },
  {
    title: "Map and overlays",
    tokens: ["map", "map-point", "float", "edge", "scrim"],
    use: { map: "Map surface", "map-point": "Point cloud", float: "Trays over the map", edge: "Tray outline", scrim: "Behind dialogs and sheets" },
  },
]

const utility = (t: string) =>
  t.endsWith("foreground")
    ? `text-${t}`
    : t === "border" || t === "input"
      ? `border-${t}`
      : t === "ring" || t === "edge"
        ? `ring-${t}`
        : t === "scrim"
          ? "bg-(--scrim)"
          : `bg-${t}`

const fmt = (r: number | null) => (r ? `${r.toFixed(1)}:1` : "—")

export default function ColorPage() {
  return (
    <article>
      <DocHeader
        title="Color"
        lead="Colours are named for what they mean, not what they look like. Components never use a raw value; they use a semantic token, and the token resolves per mode."
      />

      <Section id="model" title="How colour is defined" lead="Three layers. Only the last one appears in product code.">
        <Specimen>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            {[
              { k: "1 · Value", v: color("info").dark, d: "A literal colour. Lives only in the theme file." },
              { k: "2 · Semantic token", v: "--info", d: "A meaning, resolved per mode in :root and .dark." },
              { k: "3 · Utility", v: "text-info", d: "What components write. Tailwind maps it to the token." },
            ].map((s) => (
              <div key={s.k} className="flex flex-col gap-2 rounded-sm bg-card p-4 ring-1 ring-border">
                <span className="text-xs text-muted-foreground">{s.k}</span>
                <span className="font-mono text-base">{s.v}</span>
                <span className="text-muted-foreground">{s.d}</span>
              </div>
            ))}
          </div>
        </Specimen>
      </Section>

      <Section
        id="neutrals"
        title="Neutrals carry the interface"
        lead="Most of every screen is these six. Primary is neutral too: white in dark mode, black in light mode."
      >
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border sm:grid-cols-6">
          {neutrals.map((t) => (
            <div key={t} className="flex flex-col">
              <div className="h-24 dark:hidden" style={{ background: color(t).light }} />
              <div className="hidden h-24 dark:block" style={{ background: color(t).dark }} />
              <div className="flex flex-1 flex-col gap-0.5 bg-card p-3">
                <span className="font-mono text-xs break-all">--{t}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="abnormal"
        title="Colour is for what is abnormal"
        lead="A fleet that is fine should look calm. Normal and in-progress states are shape and neutral text; only warning, danger and the stop carry colour, so the one robot that needs you is the one you see."
      >
        <DoDont
          good={{
            visual: (
              <ul className="flex w-56 flex-col gap-2 text-sm">
                <li className="flex justify-between">
                  7F3A <InlineStatus tone="info">Patrolling</InlineStatus>
                </li>
                <li className="flex justify-between">
                  2B10 <InlineStatus tone="success">Docked</InlineStatus>
                </li>
                <li className="flex justify-between">
                  9C44 <InlineStatus tone="warning">Needs attention</InlineStatus>
                </li>
                <li className="flex justify-between">
                  8F15 <InlineStatus tone="success">Docked</InlineStatus>
                </li>
              </ul>
            ),
            text: "Neutral for normal; colour only on the robot that needs attention.",
          }}
          bad={{
            visual: (
              <ul className="flex w-56 flex-col gap-2 text-sm">
                <li className="flex justify-between">
                  7F3A <span className="text-info">● Patrolling</span>
                </li>
                <li className="flex justify-between">
                  2B10 <span className="text-success">○ Docked</span>
                </li>
                <li className="flex justify-between">
                  9C44 <span className="text-warning">▲ Needs attention</span>
                </li>
                <li className="flex justify-between">
                  8F15 <span className="text-success">○ Docked</span>
                </li>
              </ul>
            ),
            text: "Every row coloured: the problem has to compete with three robots that are fine.",
          }}
        />
      </Section>

      <Section
        id="status"
        title="Status colours come in pairs"
        lead="Each tone has a foreground and a subtle tint. Use them together; never put tone text on another tone's tint."
      >
        <div className="grid gap-3 sm:grid-cols-5">
          {tones.map(({ t, means }) => (
            <div key={t} className="flex flex-col overflow-hidden rounded-md border border-border">
              <div className="flex h-24 items-center justify-center" style={{ background: `var(--${t}-subtle)` }}>
                <span className="text-lg font-bold" style={{ color: `var(--${t})` }}>
                  {t}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1 bg-card p-3 text-xs">
                <span className="font-mono">--{t}</span>
                <span className="text-muted-foreground">{means}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="rules" title="Rules">
        <DoDont
          good={{
            visual: (
              <div className="flex gap-3">
                <Button variant="secondary">Cancel</Button>
                <Button variant="destructive">Delete route</Button>
              </div>
            ),
            text: "Destructive actions use the danger outline and text.",
          }}
          bad={{
            visual: (
              <div className="flex gap-3">
                <Button variant="secondary">Cancel</Button>
                <button type="button" className="press h-(--h-md) rounded-sm bg-stop px-4 text-sm font-medium text-white">
                  Delete route
                </button>
              </div>
            ),
            text: "Use solid red outside the emergency stop. Operators learn that solid red means stop the robot.",
          }}
        />
        <DoDont
          good={{
            visual: (
              <div className="flex gap-2">
                <Badge tone="warning">Low battery</Badge>
                <Badge tone="danger">Motor fault</Badge>
              </div>
            ),
            text: "Pair each tone with its own tint.",
          }}
          bad={{
            visual: (
              <div className="flex gap-2">
                <Badge tone="info">Docked</Badge>
                <Badge tone="danger">Low battery</Badge>
              </div>
            ),
            text: "Pick a tone by looks. Blue means in progress, not docked; low battery is attention (warning), not failure (danger).",
          }}
        />
      </Section>

      <Section
        id="tokens"
        title="All colour tokens"
        lead="Values come straight from the theme file. Contrast is measured against the surface the token sits on."
      >
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-3">
              <h3 className="font-medium">{g.title}</h3>
              <TokenTable
                head={["Token", "Utility", "Light", "Dark", "Use"]}
                rows={g.tokens.map((t) => {
                  const v = color(t)
                  return [
                    <Code key="t">--{t}</Code>,
                    <Code key="u">{utility(t)}</Code>,
                    <span key="l" className="flex items-center gap-2">
                      <Swatch value={v.light} />
                      <Code>{v.light}</Code>
                    </span>,
                    <span key="d" className="flex items-center gap-2">
                      <Swatch value={v.dark} />
                      <Code>{v.dark}</Code>
                    </span>,
                    <span key="use" className="text-muted-foreground">
                      {g.use[t]}
                    </span>,
                  ]
                })}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Text on <Code>--background</Code>: foreground {fmt(contrast("foreground", "background", "dark"))} dark,{" "}
          {fmt(contrast("foreground", "background", "light"))} light. Full table on the Accessibility page.
        </p>
      </Section>

      <Pager {...neighbours("color")} />
    </article>
  )
}
