import type { Metadata } from "next"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { TokenTable, Pager } from "@/site/doc"
import { H2, Inline, PageTitle } from "@/site/prose"

const description = "Upgrading to SYNCROBOTIC 0.40: every rename and removal, old to new, and the codemods that do the mechanical part."

export const metadata: Metadata = pageMeta({ title: "0.40 migration", description, path: "/docs/upgrading/0-40" })

/** Old → new for 0.40, one row per change. The codemods below do the mechanical ones. */
const migration: string[][] = [
  ["Timeline, Trace, DataGrid", "`density=\"dense\"`", "`size=\"sm\"`", "Codemod; `density=\"default\"` is just left out."],
  ["StatusGlyph, StatusEyebrow, InlineStatus, Island, TimelineItem, MarkerRow", "`tone`", "`status`", "info → active, success → normal, neutral → offline; warning and danger stay. Codemod for one-line tags."],
  ["Marker", "`tone=\"warning\"`", "`status=\"warning\"`", "Codemod."],
  ["MetaPill", "`tone`", "PageHeader `status`", "A state is not a fact: `status={<InlineStatus status=\"warning\">…</InlineStatus>}` on PageHeader; the pill keeps the fact."],
  ["status-glyph", "`toStatus`, `warnTone`", "removed", "Map an old tone yourself, or pass `status`."],
  ["Badge", "`tone=\"info\" | \"success\" | \"warning\" | \"danger\"`", "`neutral` or `outline`", "A state is an `InlineStatus` with the status; a category keeps a neutral Badge; a count is a CountBadge."],
  ["IconTile", "`tone=\"info\" | \"success\"`", "`tone=\"neutral\"`", "They drew neutral already; `neutral`, `warning` and `danger` remain."],
  ["Progress", "`tone=\"success\"`", "`tone=\"neutral\"`", "It drew neutral already: a finished bar is grey."],
  ["chart", "`useChartMotion()`", "`chartMotion`", "Codemod: `<Line {...chartMotion} />`."],
  ["table", "`ScrollFades`", "`scrollFadeMask`", "`style={scrollFadeMask(edges)}` on the scrolling box."],
  ["skeleton", "`<Bone onCard />`", "`<Bone />`", "Codemod (it changed nothing)."],
  ["alarm", "`alarmPriority.critical.tint`", "removed", "Rows are not tinted; use `bg-danger-subtle` directly if you must."],
  ["share-bar", "segment `tone: 5`", "`1` to `4` or `\"other\"`", "Or leave `tone` out to follow the order."],
  ["format-count", "`@syncrobotic/format-count`", "`@syncrobotic/format-number`", "Install it and codemod the imports; the functions keep their names. The old name does not install: `npx shadcn add @syncrobotic/format-count` fails with a 404."],
  ["sparkline-metric-tiles", "`<SparklineMetricTiles />`", "`<StatsCards stats={…} columns={3} />`", "Install `stats-cards`; pass your own stats. The old name fails with a 404."],
]

const codemods = `# Run from your project's root on a clean tree, then read the diff. Each line is safe where noted; the rest need a look.

# density -> size (Timeline, Trace, DataGrid). Safe: the theme's data-density never takes "dense".
grep -rlE '[^-]density="(dense|default)"' src | xargs -r sed -i -E 's/([^-])density="dense"/\\1size="sm"/g; s/ density="default"//g'

# tone -> status on the status parts, one-line tags only (IslandNotice and Badge keep their tone)
grep -rlE '<(StatusGlyph|StatusEyebrow|InlineStatus|TimelineItem|MarkerRow|Island)[ >]' src | xargs -r sed -i -E \\
  '/<(StatusGlyph|StatusEyebrow|InlineStatus|TimelineItem|MarkerRow|Island)[ >]/{s/tone="info"/status="active"/g; s/tone="success"/status="normal"/g; s/tone="neutral"/status="offline"/g; s/ tone=/ status=/g}'

# Marker's tone -> status (warning or danger)
grep -rl '<Marker ' src | xargs -r sed -i -E '/<Marker /s/ tone=/ status=/g'

# IconTile info/success and Progress success -> neutral (they drew neutral already). Safe on one-line tags.
grep -rlE '<IconTile[ >]' src | xargs -r sed -i -E '/<IconTile[ >]/s/tone="(info|success)"/tone="neutral"/g'
grep -rlE '<Progress[ >]' src | xargs -r sed -i -E '/<Progress[ >]/s/tone="success"/tone="neutral"/g'

# useChartMotion() -> chartMotion. Safe.
grep -rl useChartMotion src | xargs -r sed -i -E 's/useChartMotion\\(\\)/chartMotion/g; s/useChartMotion/chartMotion/g'

# Bone's onCard. Safe.
grep -rl '<Bone ' src | xargs -r sed -i -E 's/(<Bone[^>]*) onCard/\\1/g'

# format-count -> format-number. Safe once the new item is installed.
npx shadcn add @syncrobotic/format-number
grep -rl 'format-count' src | xargs -r sed -i 's#lib/format-count#lib/format-number#g; s#@syncrobotic/format-count#@syncrobotic/format-number#g'

# What is left to move by hand: the compiler lists each one
grep -rnE '<Badge[^>]*tone="(info|success|warning|danger)"|<MetaPill[^>]*tone=|ScrollFades|toStatus|warnTone|\\.tint\\b|SparklineMetricTiles' src`

export default function Migration040Page() {
  return (
    <article>
      <PageTitle title="0.40 migration" lead="0.40 removes every compatibility shim the kit still carried and renames what was misnamed. Each change below is a type error where it is used, not a silent fallback." />

      <H2 id="changes">What changed</H2>
      <p className="max-w-3xl text-base">
        <Inline text="0.40 removes every compatibility shim the kit still carried and renames what was misnamed. Before 1.0 a rename or a removal is a minor version (above), so read this before you take 0.40. The TypeScript compiler finds every call site: each old prop, tone and name is now a type error, not a silent fallback." />
      </p>
      <TokenTable
        head={["Item", "Before", "0.40", "How"]}
        rows={migration.map((r) => r.map((c) => <Inline key={c} text={c} />))}
      />
      <p className="max-w-3xl pt-3 text-sm text-muted-foreground">
        <Inline text="Removed and renamed items are not redirected in the registry: installing an old name fails (a 404) rather than install something else under it. `npm run adoption` names the item to install instead. A warning or danger TimelineItem or MarkerRow no longer colours its title (only its glyph or icon), and a ResponsiveTable phone row's title wraps to two lines: neither needs a change in your code." />
      </p>
      <div className="pt-4">
        <CodeBlock code={codemods} lang="bash" title="0.40 codemods" />
      </div>

      <Pager
        prev={{ href: "/docs/upgrading", title: "Versions and upgrades" }}
        next={{ href: "/docs/ai", title: "For AI agents" }}
        trail={[
          { name: "Docs", path: "/docs" },
          { name: "Versions and upgrades", path: "/docs/upgrading" },
          { name: "0.40 migration", path: "/docs/upgrading/0-40" },
        ]}
      />
    </article>
  )
}
