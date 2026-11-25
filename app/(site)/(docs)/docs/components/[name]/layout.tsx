import * as React from "react"
import { notFound } from "next/navigation"
import { site } from "@/site/config"
import { CodeSheet } from "@/site/code-sheet"
import { getItem } from "@/site/catalog"
import { sourceListing, sourceUrl } from "@/site/code-data"
import { LazyCode } from "@/site/lazy-code"
import { CodeBlock } from "@/site/code-block"
import { PageTitle } from "@/site/prose"
import { DocJsonLd } from "@/site/json-ld"
import { aiPrompt, componentMarkdown } from "@/site/ai"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { MetaPill } from "@/registry/syncrobotic/ui/page-header"
import { ComponentPanel, ComponentTabs } from "@/site/component-tabs"
import { tabsOf } from "@/site/component-tabs-data"

type Props = { params: Promise<{ name: string }>; children: React.ReactNode }

// The head every component page shares, above its tabs: it stays put while a tab's content changes beneath it.
export default async function ComponentLayout({ params, children }: Props) {
  const item = getItem((await params).name)
  if (!item) notFound()
  const meta = (item as { meta?: { version: string; status?: "beta" | "stable" } }).meta
  const installBlock = <CodeBlock code={`npx shadcn add @syncrobotic/${item.name}`} lang="bash" title="Terminal" />
  // Fetched when the sheet opens (site/code-data.ts): a component's source was most of every tab's payload (robot-map's
  // 1.4 MB), on its Properties and Accessibility tabs too.
  const sourceFiles = item.files.map((f) => ({ name: f.path.split("/").pop()!, code: <LazyCode {...sourceListing(f.path)} /> }))
  const tabs = tabsOf(item.name)

  return (
    <article>
      <DocJsonLd
        trail={[
          { name: "Components", path: "/docs/components" },
          { name: item.title, path: `/docs/components/${item.name}` },
        ]}
        description={item.description}
      />
      {/* The same head on every component page: the title with its version and status beside it, one line, then the tools. */}
      <PageTitle title={item.title} lead={item.description} aside={meta && <VersionTag name={item.name} version={meta.version} beta={meta.status === "beta"} />} />
      {/* On a phone the tools share one line in equal columns, so none is left alone on a line of its own; from 640 px they
          sit in a row at their own widths. All three are the same height. */}
      <div className="-mt-4 pb-6">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {/* For AI agents: the page as markdown, or a prompt that points an agent at it. */}
          <CopyButton value={componentMarkdown(item.name) ?? ""} variant="outline" label="Copy as Markdown">
            Markdown
          </CopyButton>
          <CopyButton value={aiPrompt(item.title, `/docs/components/${item.name}`, item.name)} variant="outline" label="Copy prompt for AI">
            Prompt
          </CopyButton>
          {/* Every item's source is here, a library's too (ros is a thousand lines): the page shows its API instead. */}
          <CodeSheet
            label="Source"
            variant="outline"
            title={`${item.name}${sourceFiles.length > 1 ? ` · ${sourceFiles.length} files` : item.files[0].path.endsWith(".ts") ? ".ts" : ".tsx"}`}
            meta={meta ? `v${meta.version}` : undefined}
            install={installBlock}
            files={sourceFiles}
            prefetch={item.files.map((f) => sourceUrl(f.path))}
            href={`${site.repo}/blob/main/${item.files[0].path}`}
          />
        </div>
      </div>

      {tabs.length > 1 && <ComponentTabs tabs={tabs} />}
      <ComponentPanel>{children}</ComponentPanel>
    </article>
  )
}

// Version and status as meta pills beside the title, the kit's own (page-header's MetaPill with href): each is a link (the
// changelog, what Beta means), underlined like every link, with a 36 px target (44 on touch) drawn around the small pill.
function VersionTag({ name, version, beta }: { name: string; version: string; beta: boolean }) {
  return (
    <span role="list" aria-label="Version and status" className="flex flex-wrap items-center gap-2">
      <MetaPill href={`/docs/components/${name}#changelog`} className="font-mono tabular-nums">
        v{version}
        <span className="sr-only">, changelog</span>
      </MetaPill>
      {beta && <MetaPill href="/docs/upgrading#status">Beta</MetaPill>}
    </span>
  )
}
