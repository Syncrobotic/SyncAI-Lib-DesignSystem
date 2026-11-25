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
