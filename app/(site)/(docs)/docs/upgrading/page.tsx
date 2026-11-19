import type { Metadata } from "next"
import { startNeighbours } from "@/site/foundations"
import registry from "../../../../../registry.json"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { TokenTable, Pager } from "@/site/doc"
import { H2, Inline, PageTitle } from "@/site/prose"

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
          ["New prop or behaviour, compatible", "minor · 0.6.0", "A labels prop"],
          ["Rename or remove a prop, token or item", "major (minor before 1.0)", "tone renamed"],
        ]}
      />
      <p className="pt-3 text-sm text-muted-foreground">
        <Inline text="CI refuses a change to an item's files without a version bump and a changelog line, so the header never lies." />
      </p>

      <H2 id="upgrade">Upgrade</H2>
      <CodeBlock code={steps} lang="bash" title="Terminal" />

      <H2 id="current">Current versions</H2>
      <TokenTable
        head={["Item", "Version", "Latest change"]}
        rows={registry.items.map((i) => {
          const m = (i as { meta?: Meta }).meta
          const last = m?.changelog.find((c) => c.version === m.version)
          return [
            <span key="n" className="font-mono text-sm">
              {i.name}
            </span>,
            <span key="v" className="font-mono text-sm tabular-nums">
              {m?.version}
            </span>,
            <span key="c" className="text-muted-foreground">
              {last && <Inline text={`${last.date} · ${last.note}`} />}
            </span>,
          ]
        })}
      />
      <Pager {...startNeighbours("/docs/upgrading")} />
    </article>
  )
}
