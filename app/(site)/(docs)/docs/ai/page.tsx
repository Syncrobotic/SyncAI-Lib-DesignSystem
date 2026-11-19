import type { Metadata } from "next"
import { startNeighbours } from "@/site/foundations"
import { Pager } from "@/site/doc"
import { CodeBlock } from "@/site/code-block"
import { pageMeta, site } from "@/site/config"
import { H2, Inline, PageTitle, Rules } from "@/site/prose"

const description =
  "How coding agents read and build with the kit: llms.txt, a markdown twin of every page, and an agent skill that carries the workflow and the design language."

export const metadata: Metadata = pageMeta({ title: "For AI agents", description, path: "/docs/ai" })

export default function AiPage() {
  return (
    <article>
      <PageTitle title="For AI agents" lead={description} />

      <H2 id="read">What an agent can read</H2>
      <Rules
        rules={[
          `\`${site.url}/llms.txt\`: the index. What the kit is, how to install, every foundation, block and component with one line each.`,
          `\`${site.url}/llms-full.txt\`: everything in one file: the design language, every block, every component with when to use it and its agent notes.`,
          "Any component or block page plus `.md`: its markdown twin. `/docs/components/meter.md`, `/blocks/app-shell.md`. What it is, when to use it, when not to and what to use instead, rules, keyboard, agent notes, install command and version.",
          "A foundation page plus `.md` (`/docs/foundations/motion.md`) carries the whole design language, not that page alone: the same text as the skill's design-language reference.",
          "On every component and block page, **Markdown** copies that twin and **Prompt** copies a ready instruction for an agent.",
        ]}
      />

      <H2 id="skill">The agent skill</H2>
      <p className="max-w-2xl pb-4 text-sm text-muted-foreground">
        <Inline text="A skill teaches the agent the workflow (plan, start from a block, read the twin, reuse, check) and the rules it must never break. It installs into `.claude/skills/syncrobotic-ui/`, where Claude Code and other skill-aware agents load it." />
      </p>
      <CodeBlock code="npx shadcn add @syncrobotic/agent-skill" lang="bash" title="Install" />

      <H2 id="mcp">MCP server</H2>
      <p className="max-w-2xl pb-4 text-sm text-muted-foreground">
        <Inline text="The same content as tools an agent calls while it works: `search` (find the item for a need), `get_item` (its markdown twin), `get_install_command`, `get_design_language` and `get_checklist`. Read-only and public: it answers from these pages and writes nothing." />
      </p>
      <CodeBlock code={`claude mcp add --transport http syncrobotic ${site.url}/mcp`} lang="bash" title="Claude Code" />
      <div className="pt-3">
        <CodeBlock code={JSON.stringify({ mcpServers: { syncrobotic: { url: `${site.url}/mcp` } } }, null, 2)} lang="json" title="Other clients (mcp.json)" />
      </div>

      <H2 id="prompt">Starting an agent</H2>
      <CodeBlock
        lang="bash"
        title="Prompt"
        code={`Build this screen with the SYNCROBOTIC design system.
Read ${site.url}/llms.txt, start from the closest block, and read the .md twin of every component you use.
Follow the agent skill in .claude/skills/syncrobotic-ui; run its checklist before you report.`}
      />
      <Pager {...startNeighbours("/docs/ai")} />
    </article>
  )
}
