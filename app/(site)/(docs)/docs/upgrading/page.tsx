import type { Metadata } from "next"
import { startNeighbours } from "@/site/foundations"
import registry from "../../../../../registry.json"
import { blockHref } from "@/site/block-types"
import { getItem } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { TokenTable, Pager } from "@/site/doc"
import { H2, Inline, PageTitle } from "@/site/prose"
import { VersionTable, type VersionRow } from "@/site/version-table"

const description = "How SYNCROBOTIC components are versioned, how to see what a project has installed, and how to upgrade without losing local changes."

export const metadata: Metadata = pageMeta({ title: "Versions and upgrades", description, path: "/docs/upgrading" })

type Meta = { version: string; changelog: { version: string; date: string; note: string }[] }

const steps = `# 1. Start clean, so the upgrade is one reviewable diff
git status

# 2. See what you have: every installed file starts with its item and version
grep -rh "^// @syncrobotic/\\|^/\\* @syncrobotic/" components lib hooks styles

# 3. Re-install the items whose version moved
npx shadcn add @syncrobotic/stop-button --overwrite

# 4. Review the change, and re-apply any local edits the diff removed
git diff`

/** Old → new for 0.40, one row per change. The codemods below do the mechanical ones. */
const migration: string[][] = [
  ["Timeline, Trace, DataGrid", "`density=\"dense\"`", "`size=\"sm\"`", "Codemod; `density=\"default\"` is just left out."],
  ["StatusGlyph, StatusEyebrow, InlineStatus, Island, TimelineItem, MarkerRow", "`tone`", "`status`", "info → active, success → normal, neutral → offline; warning and danger stay. Codemod for one-line tags."],
  ["Marker", "`tone=\"warning\"`", "`status=\"warning\"`", "Codemod."],
  ["MetaPill", "`tone`", "PageHeader `status`", "A state is not a fact: `status={<InlineStatus status=\"warning\">…</InlineStatus>}` on PageHeader; the pill keeps the fact."],
  ["status-glyph", "`toStatus`, `warnTone`", "removed", "Map an old tone yourself, or pass `status`."],
  ["Badge", "`tone=\"info\" | \"success\" | \"warning\" | \"danger\"`", "`neutral` or `outline`", "A state is an `InlineStatus` with the status; a category keeps a neutral Badge; a count is a CountBadge."],
  ["chart", "`useChartMotion()`", "`chartMotion`", "Codemod: `<Line {...chartMotion} />`."],
  ["table", "`ScrollFades`", "`scrollFadeMask`", "`style={scrollFadeMask(edges)}` on the scrolling box."],
  ["skeleton", "`<Bone onCard />`", "`<Bone />`", "Codemod (it changed nothing)."],
  ["alarm", "`alarmPriority.critical.tint`", "removed", "Rows are not tinted; use `bg-danger-subtle` directly if you must."],
  ["share-bar", "segment `tone: 5`", "`1` to `4` or `\"other\"`", "Or leave `tone` out to follow the order."],
  ["format-count", "`@syncrobotic/format-count`", "`@syncrobotic/format-number`", "Install it and codemod the imports; the functions keep their names."],
  ["sparkline-metric-tiles", "`<SparklineMetricTiles />`", "`<StatsCards stats={…} columns={3} />`", "Install `stats-cards`; pass your own stats."],
]

const codemods = `# Run from your project's root on a clean tree, then read the diff. Each line is safe where noted; the rest need a look.

# density -> size (Timeline, Trace, DataGrid). Safe: the theme's data-density never takes "dense".
grep -rlE '[^-]density="(dense|default)"' src | xargs -r sed -i -E 's/([^-])density="dense"/\\1size="sm"/g; s/ density="default"//g'

# tone -> status on the status parts, one-line tags only (IslandNotice and Badge keep their tone)
grep -rlE '<(StatusGlyph|StatusEyebrow|InlineStatus|TimelineItem|MarkerRow|Island)[ >]' src | xargs -r sed -i -E \\
  '/<(StatusGlyph|StatusEyebrow|InlineStatus|TimelineItem|MarkerRow|Island)[ >]/{s/tone="info"/status="active"/g; s/tone="success"/status="normal"/g; s/tone="neutral"/status="offline"/g; s/ tone=/ status=/g}'

# Marker's tone -> status (warning or danger)
grep -rl '<Marker ' src | xargs -r sed -i -E '/<Marker /s/ tone=/ status=/g'

# useChartMotion() -> chartMotion. Safe.
grep -rl useChartMotion src | xargs -r sed -i -E 's/useChartMotion\\(\\)/chartMotion/g; s/useChartMotion/chartMotion/g'

# Bone's onCard. Safe.
grep -rl '<Bone ' src | xargs -r sed -i -E 's/(<Bone[^>]*) onCard/\\1/g'

# format-count -> format-number. Safe once the new item is installed.
npx shadcn add @syncrobotic/format-number
grep -rl 'format-count' src | xargs -r sed -i 's#lib/format-count#lib/format-number#g; s#@syncrobotic/format-count#@syncrobotic/format-number#g'

# What is left to move by hand: the compiler lists each one
grep -rnE '<Badge[^>]*tone="(info|success|warning|danger)"|<MetaPill[^>]*tone=|ScrollFades|toStatus|warnTone|\\.tint\\b|SparklineMetricTiles' src`

/** Where an item is documented: its component or block page, or the page that covers it (the theme, the feedback, the
 *  agent skill). Null when nothing does. */
const covered: Record<string, string> = {
  "syncrobotic-theme": "/docs/tokens",
  feedback: "/docs/foundations/alarms#touch-and-sound",
  "agent-skill": "/docs/ai",
  "robot-icons": "/icons",
}
function pageOf(name: string, type: string) {
  if (getItem(name)) return `/docs/components/${name}`
  if (type === "registry:block") return blockHref(name)
  return covered[name] ?? null
}

export default function UpgradingPage() {
  return (
    <article>
      <PageTitle
        title="Versions and upgrades"
        lead="Components install as source, so a project keeps what it installed. Every item has its own version; read it from the first line of the file."
      />

      <H2 id="versions">How versions move</H2>
      <TokenTable
        head={["Change", "Version", "Example"]}
        rows={[
          ["Fix, no API change", "patch · 0.5.1", "Contrast fix, keyboard bug"],
          ["New item, token or prop, or a compatible change of behaviour", "minor · 0.6.0", "Combobox, --space-section, a labels prop"],
          ["Rename or remove a prop, token or item", "major (minor before 1.0)", "tone renamed"],
        ]}
      />
      <p className="pt-3 text-sm text-muted-foreground">
        <Inline text="CI refuses a change to an item's files without a version bump and a changelog line, so the header never lies." />
      </p>
      <p className="max-w-3xl pt-3 text-sm text-muted-foreground">
        <Inline text={"To compare an installed file with its source, check out the kit tag that shipped it: an item at `v0.24.0` is in the tag `v0.24.0`. Some older items carry a version no kit release was called, such as `slider` `v0.21.1`; `/r/kit-tags.json` maps each of those to its tag (`\"slider@0.21.1\": \"v0.24.0\"`)."} />
      </p>

      <H2 id="status">Beta and stable</H2>
      <p className="max-w-3xl text-base">
        <Inline text="An item marked Beta on its page may still change its API in a minor release: read its changelog before you upgrade. Every item starts in beta and becomes stable once a product has used it and its API has settled. Unmarked items are stable. Blocks and patterns have no status: you copy them and make them yours." />
      </p>

      <H2 id="upgrade">Upgrade</H2>
      <CodeBlock code={steps} lang="bash" title="Terminal" />
      <p className="pt-3 text-sm text-muted-foreground">
        <Inline text="Across many products: in a checkout of the design system repository, `npm run adoption -- ../app-a ../app-b` (or `--github <org>` with the gh CLI) lists each product's items and versions, how far each is behind and the changelog lines in between." />
      </p>

      <H2 id="0-40">0.40 migration</H2>
      <p className="max-w-3xl text-base">
        <Inline text="0.40 removes every compatibility shim the kit still carried and renames what was misnamed. Before 1.0 a rename or a removal is a minor version (above), so read this before you take 0.40. The TypeScript compiler finds every call site: each old prop, tone and name is now a type error, not a silent fallback." />
      </p>
      <TokenTable
        head={["Item", "Before", "0.40", "How"]}
        rows={migration.map((r) => r.map((c) => <Inline key={c} text={c} />))}
      />
      <p className="max-w-3xl pt-3 text-sm text-muted-foreground">
        <Inline text="A warning or danger TimelineItem no longer colours its title (only its glyph or icon), and a ResponsiveTable phone row's title wraps to two lines: neither needs a change in your code." />
      </p>
      <div className="pt-4">
        <CodeBlock code={codemods} lang="bash" title="0.40 codemods" />
      </div>

      <H2 id="current">Current versions</H2>
      <VersionTable
        // Most recently changed first, then by name; each name opens its page.
        rows={[...registry.items]
          .sort((a, b) => {
            const d = (i: typeof a) => (i as { meta?: Meta }).meta?.changelog[0]?.date ?? ""
            return d(b).localeCompare(d(a)) || a.name.localeCompare(b.name)
          })
          .map((i): VersionRow => {
            const m = (i as { meta?: Meta }).meta
            const last = m?.changelog.find((c) => c.version === m.version)
            return [i.name, pageOf(i.name, i.type), m?.version ?? "", last ? `${last.date} · ${last.note}` : ""]
          })}
      />
      <Pager {...startNeighbours("/docs/upgrading")} />
    </article>
  )
}
