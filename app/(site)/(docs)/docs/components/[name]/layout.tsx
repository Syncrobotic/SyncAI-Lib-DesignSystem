import * as React from "react"
import { notFound } from "next/navigation"
import { site } from "@/site/config"
import { CodeSheet } from "@/site/code-sheet"
import { getItem, readSource } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { PageTitle } from "@/site/prose"
import { aiPrompt, componentMarkdown } from "@/site/ai"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { ComponentPanel, ComponentTabs } from "@/site/component-tabs"
import { tabsOf } from "@/site/component-tabs-data"

type Props = { params: Promise<{ name: string }>; children: React.ReactNode }

// The head every component page shares, above its tabs: it stays put while a tab's content changes beneath it.
export default async function ComponentLayout({ params, children }: Props) {
  const item = getItem((await params).name)
  if (!item) notFound()
  const meta = (item as { meta?: { version: string; status?: "beta" | "stable" } }).meta
  const installBlock = <CodeBlock code={`npx shadcn add @syncrobotic/${item.name}`} lang="bash" title="Terminal" />
  const sourceFiles = await Promise.all(
    item.files.map(async (f) => ({
      name: f.path.split("/").pop()!,
      code: <CodeBlock code={readSource(f.path)} lang={f.path.endsWith(".ts") ? "ts" : "tsx"} title={f.path} />,
    })),
  )
  // Hooks (and the tray) have no examples: their source is the page, so it stays inline.
  const inlineSource = !item.examples
  const tabs = tabsOf(item.name)

  return (
    <article>
      {/* The same head on every component page: the title with its version and status beside it, one line, then the tools. */}
      <PageTitle title={item.title} lead={item.description} aside={meta && <VersionTag name={item.name} version={meta.version} beta={meta.status === "beta"} />} />
      {/* On a phone the tools share one line in equal columns, so none is left alone on a line of its own; from 640 px they
          sit in a row at their own widths. All three are the same height. */}
      <div className="-mt-4 pb-6">
        <div className={`grid gap-2 sm:flex sm:flex-wrap ${inlineSource ? "grid-cols-2" : "grid-cols-3"}`}>
          {/* For AI agents: the page as markdown, or a prompt that points an agent at it. */}
          <CopyButton value={componentMarkdown(item.name) ?? ""} variant="outline" label="Copy as Markdown">
            Markdown
          </CopyButton>
          <CopyButton value={aiPrompt(item.title, `/docs/components/${item.name}`, item.name)} variant="outline" label="Copy prompt for AI">
            Prompt
          </CopyButton>
          {!inlineSource && (
            <CodeSheet
              label="Source"
              variant="outline"
              title={`${item.name}${sourceFiles.length > 1 ? ` · ${sourceFiles.length} files` : ".tsx"}`}
              meta={meta ? `v${meta.version}` : undefined}
              install={installBlock}
              files={sourceFiles}
              href={`${site.repo}/blob/main/${item.files[0].path}`}
            />
          )}
        </div>
      </div>

      {tabs.length > 1 && <ComponentTabs tabs={tabs} />}
      <ComponentPanel>{children}</ComponentPanel>
    </article>
  )
}

// Version and status as one tag of two halves, at the height of a tag, set beside the title: each half is a link (the
// changelog, what Beta means), with the 44 px target drawn around it so the small tag stays easy to hit.
function VersionTag({ name, version, beta }: { name: string; version: string; beta: boolean }) {
  const half =
    "relative flex items-center px-2 transition-colors duration-(--motion-fast) ease-(--ease-standard) after:absolute after:inset-x-0 after:-inset-y-2.5 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
  return (
    <span className="inline-flex h-(--h-tag) items-stretch rounded-xs text-xs ring-1 ring-border ring-inset">
      <a href={`/docs/components/${name}#changelog`} aria-label={`Version ${version}, changelog`} className={`${half} rounded-s-xs font-mono text-muted-foreground tabular-nums`}>
        v{version}
      </a>
      {beta && (
        <a href="/docs/upgrading#status" title="The API may still change in a minor release" className={`${half} rounded-e-xs border-s border-border font-medium`}>
          Beta
        </a>
      )}
    </span>
  )
}
