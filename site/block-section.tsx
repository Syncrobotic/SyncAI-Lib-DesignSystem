import { blockMarkdown } from "./ai"
import { blockHref, placement } from "./block-types"
import type { blocks } from "./blocks"
import { BlockSectionView, type BlockSectionData } from "./block-section-view"
import { getItem } from "./catalog"
import { CodeBlock } from "./code-block"
import { sourceListing } from "./code-data"
import { site } from "./config"

/** Where a "Built from" chip goes: a component's page, the icon gallery for the robot icons, or another block's place.
 *  Anything else (a hook without a page of its own) is a plain chip, never a link to a page that does not exist. */
const usesHref = (u: string) => (getItem(u) ? `/docs/components/${u}` : u === "robot-icons" ? "/icons" : placement[u] ? blockHref(u) : null)

/**
 * One block as the docs show it, on a Blocks page or under a component's Patterns: title and tools on one row, the
 * description, the install command, what it is built from, then the preview with its code (site/block-section-view.tsx).
 * `near` draws all but the title and the description only as the section nears the screen, for a page of many blocks.
 */
export function BlockSection({ block: b, heading = "h3", near = false }: { block: (typeof blocks)[number]; heading?: "h3" | "h4"; near?: boolean }) {
  const uses = (b.registryDependencies ?? []).filter((d) => d !== "@syncrobotic/cn").map((d) => d.replace("@syncrobotic/", ""))
  const data: BlockSectionData = {
    name: b.name,
    title: b.title,
    description: b.description,
    markdown: blockMarkdown(b.name) ?? "",
    href: blockHref(b.name),
    origin: site.url,
    uses: uses.map((u) => ({ name: u, href: usesHref(u) })),
    height: b.height,
    fit: b.fit,
    viewport: b.viewport,
    listings: b.files.map((f) => sourceListing(f.path)),
  }
  return <BlockSectionView block={data} heading={heading} near={near} install={<CodeBlock code={`npx shadcn add @syncrobotic/${b.name}`} lang="bash" title="Install" />} />
}
