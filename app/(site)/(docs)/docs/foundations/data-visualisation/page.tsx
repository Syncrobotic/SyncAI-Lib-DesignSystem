import type { Metadata } from "next"
import Link from "next/link"
import { blockHref } from "@/site/block-types"
import { Code, DocHeader, DoDont, Pager, Section, Swatch, TokenTable } from "@/site/doc"
import { Stage } from "@/site/examples"
import { metaFor, neighbours } from "@/site/foundations"
import { CVD_TARGET, chroma, NORMAL_MIN, separation } from "@/site/palette-check"
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
  { job: "How one value is spread", form: "A histogram: equal bins that touch, one hue, the median drawn", items: ["histogram-battery"] },
  { job: "The steps of a run, or events in order", form: "Not a chart: a trace or a timeline", items: ["trace", "timeline"] },
  { job: "Exact values, or many columns", form: "Not a chart: a table", items: ["data-grid"] },
]

const components = new Set(["meter", "trace", "timeline", "data-grid"])
const ItemLink = ({ name }: { name: string }) => (
  <Link href={components.has(name) ? `/docs/components/${name}` : blockHref(name)} className="inline-flex min-h-(--h-sm) items-center font-mono text-xs underline underline-offset-4">
    {name}
  </Link>
)

const jobs = [
  {
    job: "Categorical",
    means: "Which series: identity, not amount",
    tokens: "--chart-1 … 5",
    rule: "Graphite and one accent. The series the reader should look at is the accent, the brand indigo; the others are graphite, told apart by line style too. Slot 4 is Other, slot 5 the baseline (an earlier period, a plan). Kept with the series when others are filtered out.",
  },
  {
    job: "Sequential",
    means: "How much: the accent's ramp",
    tokens: "--chart-1 into --track",
    rule: "From the bare track at none to the full accent at the most, with a Fewer–More scale: light to dark in light, dark to light in dark, so more is always further from the card (heatmap-week-hours). Cells that carry their number stop at 60 % (36 % in high contrast), so the number keeps 4.5:1 (heatmap-zones).",
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

// The palette, graphite and one accent: what each slot is for and the line style it gets as a line.
const slots = [
  { n: 1, name: "Accent", use: "The series to look at", dash: undefined },
  { n: 2, name: "Graphite", use: "Second series", dash: "6 4" },
  { n: 3, name: "Graphite mid", use: "Third series", dash: "1.5 3.5" },
  { n: 4, name: "Other", use: "What is folded together", dash: undefined },
  { n: 5, name: "Baseline", use: "Earlier period, plan", dash: "6 4" },
] as const
const modes: { mode: Mode; label: string }[] = [
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
  { mode: "light-hc", label: "Light, high contrast" },
  { mode: "dark-hc", label: "Dark, high contrast" },
]
const hex = (n: number, mode: Mode) => color(`chart-${n}`)[mode]
const seriesPairs = [
  [1, 2],
  [1, 3],
  [2, 3],
  [3, 4],
] as const

function Delta({ a, b, mode }: { a: number; b: number; mode: Mode }) {
  const s = separation(hex(a, mode), hex(b, mode))
  const weak = s.normal < NORMAL_MIN || s.cvd < NORMAL_MIN
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

/** A short stretch of a series' line, in its slot's colour and line style, as the chart legend draws it. */
const LineSwatch = ({ n, dash }: { n: number; dash?: string }) => (
  <svg viewBox="0 0 40 8" className="h-2 w-10 shrink-0" aria-hidden="true">
    <line x1="0" y1="4" x2="40" y2="4" stroke={`var(--chart-${n})`} strokeWidth="2" strokeDasharray={dash} />
  </svg>
)

// Two tiny charts for the rules below, drawn with the same tokens as the kit's charts.
const Lines = ({ dual }: { dual?: boolean }) => (
  <svg viewBox="0 0 200 90" className="h-24 w-56" role="img" aria-label={dual ? "One chart with two y axes" : "Two charts, one axis each"}>
    {dual ? (
      <>
        <line x1="20" y1="80" x2="180" y2="80" stroke="var(--border)" />
        <polyline points="20,60 60,50 100,55 140,30 180,35" fill="none" stroke="var(--chart-1)" strokeWidth="2" />
        <polyline points="20,20 60,40 100,30 140,55 180,45" fill="none" stroke="var(--chart-2)" strokeWidth="2" strokeDasharray="6 4" />
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
        <polyline points="10,52 55,68 100,60 145,80 190,74" fill="none" stroke="var(--chart-2)" strokeWidth="2" strokeDasharray="6 4" />
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

// Annotations on images: line style first, colour second. Each mark is drawn twice, the halo (2 px wider) under the stroke.
const annotationKinds = [
  { key: "predicted", label: "Predicted", line: "Solid, 2 px", dash: undefined, width: 2, fade: false, means: "What the model found" },
  { key: "truth", label: "Ground truth", line: "Dashed 6 4, 2 px", dash: "6 4", width: 2, fade: false, means: "What a person labelled" },
  { key: "previous", label: "Previous version", line: "Dotted, faded", dash: "0 5", width: 2, fade: true, means: "The same label in the last version" },
  { key: "selected", label: "Selected", line: "Solid, 3 px, handles", dash: undefined, width: 3, fade: false, means: "The one being edited" },
] as const
type AnnotationKind = (typeof annotationKinds)[number]

const strokeClass = { predicted: "stroke-annotate-predicted", truth: "stroke-annotate-truth", previous: "stroke-annotate-previous", selected: "stroke-annotate-selected" } as const
const fillClass = { predicted: "fill-annotate-predicted", truth: "fill-annotate-truth", previous: "fill-annotate-previous", selected: "fill-annotate-selected" } as const

/** One box: the halo, then the stroke, in the kind's line style; the selected one gets square handles at its corners. */
function AnnotationBox({ kind, x, y, w, h }: { kind: AnnotationKind; x: number; y: number; w: number; h: number }) {
  const common = { x, y, width: w, height: h, fill: "none", strokeDasharray: kind.dash, strokeLinecap: kind.dash === "0 5" ? ("round" as const) : undefined }
  return (
    <g style={kind.fade ? { opacity: "var(--annotate-fade)" } : undefined}>
      <rect {...common} className="stroke-annotate-halo" strokeWidth={kind.width + 2} />
      <rect {...common} className={strokeClass[kind.key]} strokeWidth={kind.width} />
      {kind.key === "selected" &&
        [
          [x, y],
          [x + w, y],
          [x, y + h],
          [x + w, y + h],
        ].map(([cx, cy]) => <rect key={`${cx}-${cy}`} x={cx - 4} y={cy - 4} width="8" height="8" className="fill-annotate-halo stroke-annotate-selected" strokeWidth="2" />)}
    </g>
  )
}

/** One point: predicted a filled dot, ground truth a ring, previous a small faded dot, selected a 3 px ring. */
function AnnotationPoint({ kind, x, y }: { kind: AnnotationKind; x: number; y: number }) {
  const filled = kind.key === "predicted" || kind.key === "previous"
  const r = kind.key === "previous" ? 3 : kind.key === "selected" ? 6 : 5
  return (
    <g style={kind.fade ? { opacity: "var(--annotate-fade)" } : undefined}>
      <circle cx={x} cy={y} r={r + 1.5} className="fill-annotate-halo" />
      {filled ? (
        <circle cx={x} cy={y} r={r} className={fillClass[kind.key]} />
      ) : (
        <circle cx={x} cy={y} r={r - kind.width / 2} fill="none" className={strokeClass[kind.key]} strokeWidth={kind.width} />
      )}
    </g>
  )
}

/** A placeholder "photo" drawn in code (named colours: a camera picture does not follow the theme), bright on the left and dark on
 *  the right, so the specimen shows every mark on both. */
function AnnotationSpecimen() {
  const [predicted, truth, previous, selected] = annotationKinds
  return (
    <svg
      viewBox="0 0 480 270"
      className="block aspect-video w-full"
      role="img"
      aria-label="A warehouse picture, bright on the left and dark on the right, with boxes and points: predicted solid, ground truth dashed, previous dotted and faded, selected thicker with handles."
    >
      <defs>
        <linearGradient id="annotate-photo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="whitesmoke" />
          <stop offset="0.35" stopColor="lightsteelblue" />
          <stop offset="0.65" stopColor="slategray" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <linearGradient id="annotate-floor" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="wheat" />
          <stop offset="0.5" stopColor="peru" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
      </defs>
      <rect width="480" height="270" fill="url(#annotate-photo)" />
      <polygon points="0,170 480,170 480,270 0,270" fill="url(#annotate-floor)" />
      <rect x="44" y="104" width="92" height="74" fill="burlywood" />
      <rect x="196" y="118" width="80" height="62" fill="sienna" />
      <rect x="340" y="96" width="96" height="86" fill="darkslategray" />

      {/* Left, on the bright part: a model's box over a person's label, and last version's box. */}
      <AnnotationBox kind={previous} x={30} y={92} w={100} h={84} />
      <AnnotationBox kind={truth} x={40} y={100} w={100} h={82} />
      <AnnotationBox kind={predicted} x={46} y={106} w={92} h={74} />
      {/* Middle: the selected box, being edited. */}
      <AnnotationBox kind={selected} x={192} y={114} w={88} h={70} />
      {/* Right, on the dark part: the same pair, still visible thanks to the halo. */}
      <AnnotationBox kind={truth} x={334} y={90} w={108} h={96} />
      <AnnotationBox kind={predicted} x={344} y={100} w={92} h={84} />

      {[predicted, truth, previous, selected].map((k, i) => (
        <g key={k.key}>
          <AnnotationPoint kind={k} x={70 + i * 26} y={226} />
          <AnnotationPoint kind={k} x={360 + i * 26} y={226} />
        </g>
      ))}
    </svg>
  )
}

/** The legend: the line itself, so it reads without colour. */
function AnnotationLegend() {
  return (
    <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {annotationKinds.map((k) => (
        <li key={k.key} className="flex items-center gap-3 text-sm">
          <svg viewBox="0 0 40 16" className="h-4 w-10 shrink-0" aria-hidden="true">
            <g style={k.fade ? { opacity: "var(--annotate-fade)" } : undefined}>
              <line x1="4" y1="8" x2="36" y2="8" className="stroke-annotate-halo" strokeWidth={k.width + 2} strokeDasharray={k.dash} strokeLinecap={k.dash === "0 5" ? "round" : undefined} />
              <line x1="4" y1="8" x2="36" y2="8" className={strokeClass[k.key]} strokeWidth={k.width} strokeDasharray={k.dash} strokeLinecap={k.dash === "0 5" ? "round" : undefined} />
            </g>
          </svg>
          <span className="font-medium">{k.label}</span>
          <span className="text-muted-foreground">{k.line}</span>
        </li>
      ))}
    </ul>
  )
}

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
            <span key="i" className="flex flex-col gap-1">
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
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border sm:grid-cols-5">
          {slots.map((s) => (
            <div key={s.n} className="flex flex-col last:col-span-2 sm:last:col-span-1">
              <div className="h-16" style={{ background: `var(--chart-${s.n})` }} />
              <div className="flex flex-1 flex-col gap-1 bg-card p-3 text-xs">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{s.use}</span>
                <LineSwatch n={s.n} dash={s.dash} />
                <span className="font-mono">--chart-{s.n}</span>
                <span className="text-muted-foreground tabular-nums">
                  {contrast(`chart-${s.n}`, "card", "light")!.toFixed(1)}:1 · {contrast(`chart-${s.n}`, "card", "dark")!.toFixed(1)}:1
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Contrast against a card, light · dark. The accent is the SYNCROBOTIC brand indigo ({hex(1, "light")} in light, the same hue in every mode), chroma{" "}
          {chroma(hex(1, "light")).toFixed(2)}; the greys are {chroma(hex(2, "light")).toFixed(2)} or less, so only the series that matters has colour. The
          accent and all three graphite steps are at least 3:1, the minimum for a mark. Other is the quietest of them (
          {contrast("chart-4", "card", "light")!.toFixed(1)}:1 in light, {contrast("chart-4", "card", "dark")!.toFixed(1)}:1 in dark): it recedes, and is still a shape you can see on its own. The baseline is the graphite mid, always dashed. Words and
          numbers drawn on a chart colour take its ink, <Code>text-chart-1-foreground</Code> to <Code>text-chart-5-foreground</Code>: white or
          near-black, 4.5:1 or more on its colour in every mode.
        </p>
      </Section>

      <Section
        id="palette"
        title="How many series"
        lead={`Three series and Other. Any two of the accent and the two greys can sit side by side, in a legend, a stack or a crossing, so every pair must differ, and Other must differ from the grey beside it. The usual floor is ΔE ${NORMAL_MIN} to normal vision and ${CVD_TARGET} under red-green colour blindness; this palette holds ${NORMAL_MIN} for both, in every mode. Measured here from the theme, ΔE normal · colour-blind, red when it fails.`}
      >
        <TokenTable
          head={["Slots", ...modes.map((m) => m.label)]}
          rows={seriesPairs.map(([a, b]) => [<PairName key="p" a={a} b={b} />, ...modes.map((m) => <Delta key={m.mode} a={a} b={b} mode={m.mode} />)])}
        />
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Line style carries the series too</h3>
          <p className="text-sm text-muted-foreground">
            The chart gives each line and area outline its style by its place in the config, and the legend and tooltip draw it, so the series read in
            grey print and to anyone who cannot tell the accent from a grey.
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            {slots.slice(0, 3).map((s) => (
              <li key={s.n} className="flex items-center gap-3">
                <LineSwatch n={s.n} dash={s.dash} />
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{s.dash ? (s.n === 2 ? "Dashed, 6 4" : "Dotted, 1.5 3.5") : "Solid"}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          A fourth series is never a new colour: fold the rest into Other (slot 4), highlight the one that matters and grey the others, or split the chart into
          small multiples, one series each, all in the accent. Scatter plots and maps, where any two marks touch, keep to the accent and one grey. Blue, green,
          amber and red are status, never a series. Simulation: Machado, Oliveira and Fernandes (2009); ΔE in OKLab.
        </p>
      </Section>

      <Section id="marks" title="Marks and axes" lead="The data carries the contrast; the frame recedes.">
        <Stage file="charts" name="ChartLine" wide className="rounded-md border border-border bg-card p-4" />
        <Rules
          rules={[
            "One y axis. Two measures on different scales are two charts, stacked, sharing the time axis.",
            "Lines 2 px: the first series solid, the second dashed (6 4), the third dotted (1.5 3.5); the chart sets this by series order. Bars start at zero, with 4 px rounded data ends and a 2 px gap in the surface colour between bars of a group and segments of a stack.",
            "A horizontal hairline grid (--border); no axis lines; tick labels in --muted-foreground, tabular numbers.",
            "A limit is a dashed line with its label at the end, in --muted-foreground. Only the value past it turns warning.",
            "Two series or more: a legend above the plot, with each series' line style. One series: no legend; the title names it, in the accent. Up to three series may also be labelled at the line's end.",
            "Text is never in the series colour: values, labels and legend stay in text colours; the swatch beside them carries the identity.",
            "Every chart with axes (line, area, bar, heatmap) has a table view (ChartTable), for exact values and for anyone who cannot tell two series apart. Sparklines, rings (radial) and status strips write their numbers in words instead.",
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
            ["Density over the floor", <Code key="c">--chart-1 ramp</Code>, "The accent's ramp over the grey scans, with a scale: the one colour on the floor."],
          ].map((r) => r.map((c, i) => (typeof c === "string" ? <span key={i} className={i === 0 ? "font-medium" : "text-muted-foreground"}>{c}</span> : c)))}
        />
      </Section>

      <Section
        id="annotations"
        title="Annotations on images"
        lead="Boxes and points over a photo: what a model predicted, what a person labelled, the previous version and the one being edited. The photo can be any colour, so the line style carries the meaning and every stroke has a halo."
      >
        <figure className="flex flex-col gap-4 overflow-hidden rounded-md border border-border bg-card p-4">
          <div className="overflow-hidden rounded-xs">
            <AnnotationSpecimen />
          </div>
          <figcaption>
            <AnnotationLegend />
          </figcaption>
        </figure>
        <TokenTable
          head={["Mark", "Line", "Token", "Against its halo, light · dark"]}
          rows={annotationKinds.map((k) => [
            <span key="m" className="flex flex-col">
              <span className="font-medium">{k.label}</span>
              <span className="text-muted-foreground">{k.means}</span>
            </span>,
            <span key="l" className="text-muted-foreground">
              {k.line}
            </span>,
            <Code key="t">--annotate-{k.key}</Code>,
            <span key="c" className="font-mono text-xs whitespace-nowrap tabular-nums">
              {contrast(`annotate-${k.key}`, "annotate-halo", "light")!.toFixed(1)}:1 · {contrast(`annotate-${k.key}`, "annotate-halo", "dark")!.toFixed(1)}:1
            </span>,
          ])}
        />
        <Rules
          rules={[
            "Line style first, colour second: predicted solid 2 px, ground truth dashed (6 4) 2 px, the previous version dotted and faded (--annotate-fade), the selected one 3 px with square handles at its corners. Points: predicted a filled dot, ground truth a ring.",
            "Every stroke is drawn twice: first in --annotate-halo, 2 px wider, then in its colour. The two are at least 3:1 apart, so on a bright or a dark photo one of them shows.",
            "Colours come from the chart palette (predicted --chart-1, the accent indigo, solid; ground truth --chart-2, graphite, dashed), the previous version is the muted ink and the selected one the focus ink. Never status colours: a low score is a number in the label, not a warning box.",
            "The class is a word in the label (text in --foreground on --annotate-halo), not a colour: the colours already say where a box came from.",
            "Two sources at a time, plus the selection: predicted against ground truth, or this version against the previous one. To compare more, put pictures side by side.",
            "High contrast keeps the same strokes and stops fading the previous version: nothing is translucent there.",
          ]}
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
