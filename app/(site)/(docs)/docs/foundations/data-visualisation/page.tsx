import type { Metadata } from "next"
import Link from "next/link"
import { blockHref } from "@/site/block-types"
import { Code, DocHeader, DoDont, Pager, Section, Swatch, TokenTable } from "@/site/doc"
import { Stage } from "@/site/examples"
import { metaFor, neighbours } from "@/site/foundations"
import { CVD_MIN, CVD_TARGET, chroma, NORMAL_MIN, separation } from "@/site/palette-check"
import { Rules } from "@/site/prose"
import { color, contrast, type Mode } from "@/site/theme-tokens"

export const metadata: Metadata = metaFor("data-visualisation")

// The job decides the form; the form decides the item. Sometimes the answer is not a chart.
const forms: { job: string; form: string; items: string[] }[] = [
  { job: "One number someone acts on", form: "The number itself, large, with its unit and change", items: ["radial-chart-goal"] },
  { job: "A level within a known range", form: "A meter, neutral until it crosses a threshold", items: ["meter", "radial-chart-battery"] },
  { job: "A value over time", form: "A line, one y axis", items: ["line-chart-telemetry", "line-chart-limit", "line-chart-compare"] },
  { job: "How a whole splits, over time", form: "Stacked areas that add up to the whole", items: ["area-chart-fleet-states", "area-chart-cumulative"] },
  { job: "Compare categories", form: "Bars from zero, sorted unless the order means something", items: ["bar-chart-missions", "bar-chart-ranked", "bar-chart-stacked"] },
  { job: "Above and below a target", form: "Bars in one hue around a drawn zero", items: ["bar-chart-variance"] },
  { job: "When something happens (day × hour)", form: "A heatmap in one hue", items: ["heatmap-week-hours"] },
  { job: "Where something happens", form: "A heatmap by zone, with each cell's number", items: ["heatmap-zones"] },
  { job: "The steps of a run, or events in order", form: "Not a chart: a trace or a timeline", items: ["trace", "timeline"] },
  { job: "Exact values, or many columns", form: "Not a chart: a table", items: ["data-grid"] },
]

const components = new Set(["meter", "trace", "timeline", "data-grid"])
const ItemLink = ({ name }: { name: string }) => (
  <Link href={components.has(name) ? `/docs/components/${name}` : blockHref(name)} className="inline-flex min-h-6 items-center font-mono text-xs underline underline-offset-4">
    {name}
  </Link>
)

const jobs = [
  {
    job: "Categorical",
    means: "Which series: identity, not amount",
    tokens: "--chart-1 … 5",
    rule: "Fixed order, kept with the series when others are filtered out. Slot 5 is grey on purpose: Other, an earlier period, a baseline.",
  },
  {
    job: "Sequential",
    means: "How much: one hue, light to dark",
    tokens: "--foreground, or --chart-1",
    rule: "Mixed into the card, darker always meaning more, with a Fewer–More scale. Cells with no number: ink, the calmest (heatmap-week-hours). Cells that carry their number, and anything on the map: --chart-1 up to 45 %, so the number keeps its contrast in dark and the ramp stands apart from the grey scans (heatmap-zones).",
  },
  {
    job: "Status",
    means: "A threshold was crossed",
    tokens: "--warning, --danger",
    rule: "Only on the value or segment that crossed it, with a word or a shape. Never a series colour; a battery never turns danger.",
  },
  {
    job: "Process",
    means: "Something running that someone waits on",
    tokens: "--info",
    rule: "Progress, a running stage, the route a robot is driving now. Not a series.",
  },
]

const slots = [1, 2, 3, 4, 5]
const hex = (n: number, mode: Mode) => color(`chart-${n}`)[mode]
const adjacent = slots.slice(0, -1).map((n) => [n, n + 1] as const)
const anyPair = [
  [1, 2],
  [1, 3],
  [2, 3],
] as const

function Delta({ a, b, mode }: { a: number; b: number; mode: Mode }) {
  const s = separation(hex(a, mode), hex(b, mode))
  const weak = s.normal < NORMAL_MIN || s.cvd < CVD_MIN
  return (
    <span className={`font-mono text-xs whitespace-nowrap tabular-nums ${weak ? "text-danger" : ""}`}>
      {s.normal.toFixed(0)} · {s.cvd.toFixed(1)}
    </span>
  )
}

const PairName = ({ a, b }: { a: number; b: number }) => (
  <span className="flex items-center gap-2">
    <Swatch value={hex(a, "light")} />
    <Swatch value={hex(b, "light")} />
    <Code>
      {a} · {b}
    </Code>
  </span>
)

// Two tiny charts for the rules below, drawn with the same tokens as the kit's charts.
const Lines = ({ dual }: { dual?: boolean }) => (
  <svg viewBox="0 0 200 90" className="h-24 w-56" role="img" aria-label={dual ? "One chart with two y axes" : "Two charts, one axis each"}>
    {dual ? (
      <>
        <line x1="20" y1="80" x2="180" y2="80" stroke="var(--border)" />
        <polyline points="20,60 60,50 100,55 140,30 180,35" fill="none" stroke="var(--chart-1)" strokeWidth="2" />
        <polyline points="20,20 60,40 100,30 140,55 180,45" fill="none" stroke="var(--chart-2)" strokeWidth="2" />
        <text x="4" y="24" className="fill-muted-foreground" fontSize="9">
          °C
        </text>
        <text x="184" y="24" className="fill-muted-foreground" fontSize="9">
          %
        </text>
      </>
    ) : (
      <>
        <line x1="10" y1="38" x2="190" y2="38" stroke="var(--border)" />
        <polyline points="10,30 55,24 100,27 145,10 190,13" fill="none" stroke="var(--chart-1)" strokeWidth="2" />
        <line x1="10" y1="86" x2="190" y2="86" stroke="var(--border)" />
        <polyline points="10,52 55,68 100,60 145,80 190,74" fill="none" stroke="var(--chart-2)" strokeWidth="2" />
      </>
    )}
  </svg>
)

const Bars = ({ status }: { status?: boolean }) => (
  <svg viewBox="0 0 200 90" className="h-24 w-56" role="img" aria-label={status ? "Bars coloured green, amber and red by rank" : "Bars in one hue with the one over the limit marked"}>
    <line x1="10" y1="84" x2="190" y2="84" stroke="var(--border)" />
    {[50, 34, 62, 28, 74].map((h, i) => {
      const over = h > 70
      const fill = status ? (h > 60 ? "var(--danger)" : h > 40 ? "var(--warning)" : "var(--success)") : over ? "var(--warning)" : "var(--chart-1)"
      return <rect key={i} x={20 + i * 36} y={84 - h} width="22" height={h} rx="3" fill={fill} />
    })}
    {!status && <line x1="10" y1="14" x2="190" y2="14" stroke="var(--muted-foreground)" strokeDasharray="4 3" />}
  </svg>
)

export default function DataVisualisationPage() {
  return (
    <article>
      <DocHeader
        title="Data visualisation"
        lead="A chart answers one question for someone who is also watching robots. Pick the form from the question, colour each mark by the job it does, and keep everything else quiet. The palette below is checked for colour blindness on every build."
      />

      <Section id="form" title="Pick the form first" lead="Colour comes last. Most bad charts start by picking colours; start from what the reader has to do.">
        <TokenTable
          head={["The job", "Form", "In the kit"]}
          rows={forms.map((f) => [
            <span key="j" className="font-medium">
              {f.job}
            </span>,
            <span key="f" className="text-muted-foreground">
              {f.form}
            </span>,
            <span key="i" className="flex flex-wrap gap-x-3 gap-y-1">
              {f.items.map((n) => (
                <ItemLink key={n} name={n} />
              ))}
            </span>,
          ])}
        />
      </Section>

      <Section id="colour" title="Colour by job" lead="Four jobs, one rule each. A mark gets colour for one of these reasons or it stays neutral.">
        <TokenTable
          head={["Job", "Means", "Tokens", "Rule"]}
          rows={jobs.map((j) => [
            <span key="j" className="font-medium">
              {j.job}
            </span>,
            j.means,
            <span key="t" className="flex flex-col gap-1">
              {j.tokens.split(/, or |, /).map((t) => (
                <span key={t} className="font-mono text-xs whitespace-nowrap">
                  {t}
                </span>
              ))}
            </span>,
            <span key="r" className="text-muted-foreground">
              {j.rule}
            </span>,
          ])}
        />
        <div className="grid grid-cols-5 overflow-hidden rounded-md border border-border">
          {slots.map((n) => (
            <div key={n} className="flex flex-col">
              <div className="h-16" style={{ background: `var(--chart-${n})` }} />
              <div className="flex flex-col gap-0.5 bg-card p-3 text-xs">
                <span className="font-mono">--chart-{n}</span>
                <span className="text-muted-foreground tabular-nums">
                  {contrast(`chart-${n}`, "card", "light")!.toFixed(1)}:1 · {contrast(`chart-${n}`, "card", "dark")!.toFixed(1)}:1
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Contrast against a card, light · dark. Every slot is at least 3:1, the minimum for a mark. Slot 5 has a chroma of{" "}
          {chroma(hex(5, "light")).toFixed(2)}: grey, so Other and the earlier period recede.
        </p>
      </Section>

      <Section
        id="palette"
        title="How many series"
        lead={`Two series are distinct when they differ by ΔE ${NORMAL_MIN} to normal vision and ${CVD_TARGET} under red-green colour blindness (${CVD_MIN}–${CVD_TARGET} is allowed only with a legend and a table, which every chart has). Measured here from the theme, ΔE normal · colour-blind, red when it fails.`}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Lines, bars, stacks: up to five</h3>
            <p className="text-sm text-muted-foreground">Only neighbouring slots touch, in a legend, a stack or a group, so neighbours are what must differ.</p>
            <TokenTable
              head={["Slots", "Light", "Dark"]}
              rows={adjacent.map(([a, b]) => [<PairName key="p" a={a} b={b} />, <Delta key="l" a={a} b={b} mode="light" />, <Delta key="d" a={a} b={b} mode="dark" />])}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Scatter and maps: up to three</h3>
            <p className="text-sm text-muted-foreground">
              Any two marks can sit side by side, so every pair must differ. Slots 1 and 4 do not ({separation(hex(1, "light"), hex(4, "light")).normal.toFixed(0)}{" "}
              to normal vision), so use 1–3; for more, label marks directly or split into small multiples.
            </p>
            <TokenTable
              head={["Slots", "Light", "Dark"]}
              rows={anyPair.map(([a, b]) => [<PairName key="p" a={a} b={b} />, <Delta key="l" a={a} b={b} mode="light" />, <Delta key="d" a={a} b={b} mode="dark" />])}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          A sixth series is never a new colour: fold the smallest into Other (slot 5) or split the chart. Simulation: Machado, Oliveira and Fernandes (2009); ΔE
          in OKLab.
        </p>
      </Section>

      <Section id="marks" title="Marks and axes" lead="The data carries the contrast; the frame recedes.">
        <Stage file="charts" name="ChartLine" wide className="rounded-md border border-border bg-card p-4" />
        <Rules
          rules={[
            "One y axis. Two measures on different scales are two charts, stacked, sharing the time axis.",
            "Lines 2 px. Bars start at zero, with 4 px rounded data ends and a 2 px gap in the surface colour between segments.",
            "A horizontal hairline grid (--border); no axis lines; tick labels in --muted-foreground, tabular numbers.",
            "A limit is a dashed line with its label at the end, in --muted-foreground. Only the value past it turns warning.",
            "Two series or more: a legend above the plot. One series: no legend; the title names it. Up to four series may also be labelled at the line's end.",
            "Text is never in the series colour: values, labels and legend stay in text colours; the swatch beside them carries the identity.",
            "Every chart has a table view (ChartTable), for exact values and for anyone who cannot tell two hues apart.",
            "No data is said in words in the plot's place, not an empty frame.",
          ]}
        />
      </Section>

      <Section id="rules" title="Rules">
        <DoDont
          good={{ visual: <Lines />, text: "Two measures, two charts on the same time axis. Each reads against its own scale." }}
          bad={{
            visual: <Lines dual />,
            text: "Put two scales on one chart. Where the lines cross means nothing, and the reader has to work out which axis is whose.",
          }}
        />
        <DoDont
          good={{ visual: <Bars />, text: "One hue for the series; warning only on the bar past the dashed limit." }}
          bad={{
            visual: <Bars status />,
            text: "Colour bars green, amber and red by size. Status colours mean a threshold was crossed; here they only mean bigger, and an operator reads three alarms.",
          }}
        />
      </Section>

      <Section
        id="maps"
        title="Maps and robot tracks"
        lead="The map is a chart too, and the busiest one: scans, zones, routes and robots share one surface. Each layer keeps one job."
      >
        <TokenTable
          head={["Layer", "Drawn with", "Why"]}
          rows={[
            ["Floor and scans", <Code key="c">--map, --map-point</Code>, "Grey, the quietest layer: it is where things happen, not what happens."],
            ["Grid, zones and walls", <Code key="c">--edge, --map-point outline</Code>, "Hairlines, no fills. A safety zone is named with its icon (SafetyZone) and a word, not painted red."],
            ["Route being driven", <Code key="c">--info, dashed</Code>, "A process someone waits on: the one place blue appears on the map."],
            ["Robots", <Code key="c">StatusGlyph + ID</Code>, "The status shape and the robot's ID, as in every list; colour only when a robot needs attention. The selected one gets the focus ring's ink."],
            ["Density over the floor", <Code key="c">--chart-1 ramp</Code>, "One hue over the grey scans, light to dark, with a scale."],
          ].map((r) => r.map((c, i) => (typeof c === "string" ? <span key={i} className={i === 0 ? "font-medium" : "text-muted-foreground"}>{c}</span> : c)))}
        />
      </Section>

      <Section id="motion" title="Motion and hover" lead="Movement only marks a change of state, so charts do not perform.">
        <Rules
          rules={[
            "The chart fades in when it mounts (--motion-base). Marks do not grow or slide in; nothing moves under reduced motion.",
            "Hover is the reading layer: a crosshair and one card with every series on lines and areas, a band on bars. The hit area is wider than the mark.",
            "Time range and filters sit in one row above the chart (a segmented control: 1 h, 24 h, 7 d). Changing them never repaints the surviving series.",
          ]}
        />
      </Section>

      <Pager {...neighbours("data-visualisation")} />
    </article>
  )
}
