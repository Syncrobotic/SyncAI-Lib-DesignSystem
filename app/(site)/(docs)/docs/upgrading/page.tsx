import type { Metadata } from "next"
import { startNeighbours } from "@/site/foundations"
import registry from "../../../../../registry.json"
import { blockHref } from "@/site/block-types"
import { getItem } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { TokenTable, Pager } from "@/site/doc"
import { H2, Inline, PageTitle, textLink } from "@/site/prose"
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

      <H2 id="cadence">Release cadence</H2>
      <p className="max-w-3xl text-base">
        <Inline text="At most one minor release a week, so a product team reads one changelog per sprint week rather than one a day; a patch (fixes only, no API change) ships when it is needed. Breaking changes wait for the next minor and ship together in it, each with its migration line, and that release gets a migration guide. A stable item is deprecated in one release and changed in a later one, never in the same." />
      </p>

      <H2 id="status">Beta and stable</H2>
      <p className="max-w-3xl text-base">
        <Inline text="Stable promises that its API (props, exports, `data-slot` names, the tokens it reads) breaks only in a release whose changelog says Breaking, with a migration line, and only after an earlier release marked the old way Deprecated and kept it working. Fixes and additions come in any release. Beta means the API may still change in any minor release: read its changelog before you upgrade. Every item starts in beta; unmarked items are stable." />
      </p>
      <p className="max-w-3xl pt-3 text-base">
        <Inline text="An item can become stable when it meets every criterion below. `npm run stability` checks them and lists the candidates; a release promotes them with a `Stable:` changelog line, and when in doubt an item stays beta." />
      </p>
      <TokenTable
        head={["Criterion", "Evidence"]}
        rows={[
          ["Settled", "Shipped in each of the last ten releases, and no Breaking entry in them names it"],
          ["Tested", "A unit test exercises it; a block's test renders its `Content` export from props"],
          ["Measured", "A component's roles and Tab stops are in the accessibility data"],
          ["Documented", "Its page says when to use it and what to use instead; a block's type does"],
          ["Dependencies", "Every item it installs is stable"],
          ["Controlled", "Blocks only: it renders from props, with no sample data inside"],
          ["Proven", "Robot and AI parts only: a product has installed it. Other items need no product"],
        ]}
      />
      <p className="max-w-3xl pt-3 text-base">
        <Inline text="`lint:registry` fails when a stable item loses its tests, its accessibility data, its docs or a stable dependency, or breaks without a Deprecated release first. Restore what it lost, or demote it to beta in a release that says so." />
      </p>
      <p id="wiring" className="max-w-3xl scroll-mt-20 pt-3 text-base">
        <Inline text="A block also says how it is wired. Demo data: it renders built-in sample data, and a screen its own app shell; install it as a starting point and wire your data in. Controlled: it renders only from its props and callbacks, with no sample data or app shell inside, so it takes your data as it is." />
      </p>

      <H2 id="upgrade">Upgrade</H2>
      <CodeBlock code={steps} lang="bash" title="Terminal" />
      <p className="pt-3 text-sm text-muted-foreground">
        <Inline text="Across many products: in a checkout of the design system repository, `npm run adoption -- ../app-a ../app-b` (or `--github <org>` with the gh CLI) lists each product's items and versions, how far each is behind and the changelog lines in between, and in a local checkout the product's own look-alikes of kit items (a PageHeader of its own), each with its kit item and the migration guide." />
      </p>

      <H2 id="migrations">Migration guides</H2>
      <p className="max-w-3xl text-base">
        <Inline text="A release that renames or removes something has its own page: what changed, old to new, and the codemods that do the mechanical part." />
      </p>
      <ul className="list-disc space-y-1 pt-2 pl-6 text-base">
        <li id="local-components">
          <a href="/docs/migrating-from-local-components" className={textLink}>
            From local components
          </a>
          <span className="text-muted-foreground"> · a product's own PageHeader, MetricCard or StatusDot to the kit's, with a codemod</span>
        </li>
        <li id="0-42">
          <a href="/docs/upgrading/0-42" className={textLink}>
            0.42: resizable on react-resizable-panels 4
          </a>
          <span className="text-muted-foreground"> · onLayout → onLayoutChanged, ref → panelRef and groupRef, data-separator</span>
        </li>
        <li id="0-40">
          <a href="/docs/upgrading/0-40" className={textLink}>
            0.40: the pre-1.0 cleanup
          </a>
          <span className="text-muted-foreground"> · tone → status, density → size, Badge states, format-number, removed shims</span>
        </li>
      </ul>

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
