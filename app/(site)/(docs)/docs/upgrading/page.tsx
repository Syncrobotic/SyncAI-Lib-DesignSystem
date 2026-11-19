import type { Metadata } from "next"
import { startNeighbours } from "@/site/foundations"
import registry from "../../../../../registry.json"
import Link from "next/link"
import { blockHref } from "@/site/block-types"
import { getItem } from "@/site/catalog"
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
        // Most recently changed first, then by name; each name opens its page.
        rows={[...registry.items]
          .sort((a, b) => {
            const d = (i: typeof a) => (i as { meta?: Meta }).meta?.changelog[0]?.date ?? ""
            return d(b).localeCompare(d(a)) || a.name.localeCompare(b.name)
          })
          .map((i) => {
          const m = (i as { meta?: Meta }).meta
          const last = m?.changelog.find((c) => c.version === m.version)
          return [
            getItem(i.name) || i.type === "registry:block" ? (
              <Link
                key="n"
                href={getItem(i.name) ? `/docs/components/${i.name}` : blockHref(i.name)}
                className="font-mono text-sm underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"
              >
                {i.name}
              </Link>
            ) : (
              <span key="n" className="font-mono text-sm">
                {i.name}
              </span>
            ),
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
