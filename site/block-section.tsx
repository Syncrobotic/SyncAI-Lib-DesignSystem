import Link from "next/link"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { aiPrompt, blockMarkdown } from "./ai"
import { BlockFrame } from "./block-frame"
import { blockHref, placement } from "./block-types"
import type { blocks } from "./blocks"
import { getItem, readSource } from "./catalog"
import { CodeBlock } from "./code-block"

/** Where a "Built from" chip goes: a component's page, the icon gallery for the robot icons, or another block's place.
 *  Anything else (a hook without a page of its own) is a plain chip, never a link to a page that does not exist. */
const usesHref = (u: string) => (getItem(u) ? `/docs/components/${u}` : u === "robot-icons" ? "/icons" : placement[u] ? blockHref(u) : null)

/**
 * One block as the docs show it, on a Blocks page or under a component's Patterns: title and tools on one row, the
 * description, the install command, what it is built from, then the preview with its code.
 */
export function BlockSection({ block: b, heading: H = "h3" }: { block: (typeof blocks)[number]; heading?: "h3" | "h4" }) {
  const uses = (b.registryDependencies ?? []).filter((d) => d !== "@syncrobotic/cn").map((d) => d.replace("@syncrobotic/", ""))
  return (
    <section id={b.name} aria-labelledby={`${b.name}-title`} className="flex scroll-mt-20 flex-col gap-3">
      {/* Title and tools share one row, always; the description sits under them, so its length never moves the tools. */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <H id={`${b.name}-title`} className="min-w-0 text-lg font-bold">
            {b.title}
          </H>
          <div className="flex shrink-0 flex-wrap gap-2">
            <CopyButton value={blockMarkdown(b.name) ?? ""} variant="outline" label={`Copy ${b.title} as Markdown`}>
              Markdown
            </CopyButton>
            <CopyButton value={aiPrompt(b.title, blockHref(b.name), b.name)} variant="outline" label={`Copy a prompt for ${b.title}`}>
              Prompt
            </CopyButton>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">{b.description}</p>
      </div>
      <CodeBlock code={`npx shadcn add @syncrobotic/${b.name}`} lang="bash" title="Install" />
      {uses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Built from
          {/* A dependency is a component (its page) or another block (its place on its page). */}
          {uses.map((u) => {
            const href = usesHref(u)
            const chip = "inline-flex min-h-(--h-sm) items-center rounded-xs bg-muted px-2 font-mono text-xs"
            return href ? (
              <Link key={u} href={href} className={`${chip} hover:bg-accent`}>
                {u}
              </Link>
            ) : (
              <span key={u} className={chip}>
                {u}
              </span>
            )
          })}
        </div>
      )}
      <BlockFrame
        name={b.name}
        height={b.height}
        fit={b.fit}
        initial={b.viewport}
        code={b.files.map((f) => (
          <CodeBlock key={f.path} code={readSource(f.path)} title={f.path} />
        ))}
      />
    </section>
  )
}
