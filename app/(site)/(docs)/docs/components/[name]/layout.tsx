import * as React from "react"
import { notFound } from "next/navigation"
import { site } from "@/site/config"
import { CodeSheet } from "@/site/code-sheet"
import { getItem, readSource } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { PageTitle } from "@/site/prose"
import { aiPrompt, componentMarkdown } from "@/site/ai"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { Badge } from "@/registry/syncrobotic/ui/badge"
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
      {/* The same head on every component page: title, one line, then the version and the tools, always below. */}
      <PageTitle title={item.title} lead={item.description} />
      {/* On a phone the version is one line and the three tools share the next one in equal columns, so none is left alone
          on a line of its own; from 640 px they all sit in one row. */}
      <div className="-mt-4 flex flex-col gap-2 pb-6 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          {meta && (
            <a href={`/docs/components/${item.name}#changelog`} className="inline-flex h-(--h-sm) items-center font-mono text-sm text-muted-foreground tabular-nums underline-offset-4 hover:underline">
              v{meta.version}
            </a>
          )}
          {meta?.status === "beta" && (
            <a href="/docs/upgrading#status" title="The API may still change in a minor release" className="inline-flex h-(--h-sm) items-center">
              <Badge tone="outline">Beta</Badge>
            </a>
          )}
        </div>
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
