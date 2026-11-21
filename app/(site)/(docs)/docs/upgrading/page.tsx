import type { Metadata } from "next"
import { startNeighbours } from "@/site/foundations"
import registry from "../../../../../registry.json"
import Link from "next/link"
import { blockHref } from "@/site/block-types"
import { getItem } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { migrations } from "@/site/migrations"
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

      <H2 id="status">Beta and stable</H2>
      <p className="max-w-3xl text-base">
        <Inline text="An item marked Beta on its page may still change its API in a minor release: read its changelog before you upgrade. Every item starts in beta and becomes stable once a product has used it and its API has settled. Unmarked items are stable. Blocks and patterns have no status: you copy them and make them yours." />
      </p>

      <H2 id="upgrade">Upgrade</H2>
      <CodeBlock code={steps} lang="bash" title="Terminal" />
      <p className="pt-3 text-sm text-muted-foreground">
        <Inline text="Across many products: in a checkout of the design system repository, `npm run adoption -- ../app-a ../app-b` (or `--github <org>` with the gh CLI) lists each product's items and versions, how far each is behind and the changelog lines in between." />
      </p>

      <H2 id="guides">Upgrades that change your code</H2>
      <p className="max-w-3xl pb-3 text-base">
        <Inline text="When a new version needs changes in the code that uses an item, its page has a guide: the steps, a prompt for a coding agent and a checklist that must find nothing once you are done." />
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        {Object.entries(migrations).map(([name, m]) => (
          <li key={name}>
            <Link
              href={`/docs/components/${name}#${m.id}`}
              className="inline-flex min-h-(--h-sm) items-center underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"
            >
              {getItem(name)?.title ?? name}: {m.title}
            </Link>
          </li>
        ))}
      </ul>

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
            pageOf(i.name, i.type) ? (
              <Link
                key="n"
                href={pageOf(i.name, i.type)!}
                className="font-mono text-sm underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"
              >
                {i.name}
              </Link>
            ) : (
              // No page of its own: the same name, unlinked, with what it is in place of a link.
              <span key="n" className="flex flex-col">
                <span className="font-mono text-sm">{i.name}</span>
                <span className="text-xs text-muted-foreground">Utility, no page</span>
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
