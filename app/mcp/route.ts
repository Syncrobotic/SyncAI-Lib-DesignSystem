import pkg from "../../package.json"
import registry from "../../registry.json"
import { blockMarkdown, componentMarkdown, designLanguage } from "@/site/ai"
import { getItem, items, readSource } from "@/site/catalog"
import { site } from "@/site/config"
import { overviews } from "@/site/overview"

// A read-only MCP server (Streamable HTTP, stateless, JSON responses) so coding agents can look the kit up while they
// work. It answers from the same data as the pages and their markdown twins; it reads nothing private and writes nothing.
// Connect: claude mcp add --transport http syncrobotic <site>/mcp

const PROTOCOL = "2025-06-18"
const blocks = registry.items.filter((i) => i.type === "registry:block")
const install = (names: string[]) => `npx shadcn add ${names.map((n) => `@syncrobotic/${n}`).join(" ")}`

type Tool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  run: (args: Record<string, unknown>) => string
}

const tools: Tool[] = [
  {
    name: "search",
    description:
      "Find SYNCROBOTIC components and blocks for a need (e.g. 'battery level', 'confirm delete', 'robot list'). Returns name, kind, one-line description and when to use it.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    run: ({ query }) => {
      const words = String(query ?? "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
      const rows = [
        ...items.map((i) => ({
          name: i.name,
          kind: `component · ${i.group}`,
          text: i.description ?? "",
          use: overviews[i.name]?.use.join(" ") ?? "",
        })),
        ...blocks.map((b) => ({ name: b.name, kind: "block", text: b.description ?? "", use: "" })),
      ]
      // Rank by how many of the query's words an item matches; at a tie, components before blocks (blocks are built from
      // components, so the component is the answer to a need and the block an example of it); then by weight (a word in
      // the name counts more). "battery level" finds Meter before the chart blocks that show a battery.
      const score = (r: (typeof rows)[number]) => {
        const hay = `${r.name} ${r.text} ${r.use}`.toLowerCase()
        const matched = words.filter((w) => hay.includes(w)).length
        const weight = words.reduce((s, w) => s + (r.name.includes(w) ? 3 : 0) + (hay.includes(w) ? 1 : 0), 0)
        return { matched, weight }
      }
      const hits = rows
        .map((r) => ({ r, s: score(r) }))
        .filter((x) => x.s.matched > 0)
        .sort((a, b) => b.s.matched - a.s.matched || Number(a.r.kind === "block") - Number(b.r.kind === "block") || b.s.weight - a.s.weight)
        .slice(0, 10)
      if (!hits.length) return `Nothing matches "${query}". Read ${site.url}/llms.txt for the full index.`
      return hits.map(({ r }) => `- ${r.name} (${r.kind}): ${r.text}${r.use ? `\n  Use for: ${r.use}` : ""}`).join("\n")
    },
  },
  {
    name: "get_item",
    description:
      "Everything about one component or block: what it is, when to use it and what to use instead, rules, keyboard, agent notes, install command, version. Call this before using an item.",
    inputSchema: { type: "object", properties: { name: { type: "string", description: "e.g. meter, app-shell" } }, required: ["name"] },
    run: ({ name }) => {
      const n = String(name ?? "")
      return componentMarkdown(n) ?? blockMarkdown(n) ?? `No item "${n}". Use search, or read ${site.url}/llms.txt.`
    },
  },
  {
    name: "get_install_command",
    description: "The shadcn CLI command that installs these items (and their dependencies) into the project.",
    inputSchema: { type: "object", properties: { names: { type: "array", items: { type: "string" } } }, required: ["names"] },
    run: ({ names }) => {
      const list = (Array.isArray(names) ? names : []).map(String)
      const unknown = list.filter((n) => !getItem(n) && !blocks.some((b) => b.name === n) && n !== "syncrobotic-theme" && n !== "agent-skill")
      if (unknown.length) return `Unknown: ${unknown.join(", ")}. Use search to find the right names.`
      return `${install(list)}\n\nFirst time in a project: ${install(["syncrobotic-theme"])}`
    },
  },
  {
    name: "get_design_language",
    description: "The design language every screen must follow: colour, spacing, type, radius, motion, touch and accessibility rules.",
    inputSchema: { type: "object", properties: {} },
    run: () => designLanguage(),
  },
  {
    name: "get_checklist",
    description: "The checks to run on every UI change before reporting it done.",
    inputSchema: { type: "object", properties: {} },
    run: () => readSource("registry/syncrobotic/skill/references/checklist.md").trim(),
  },
]

type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> }

const result = (id: Rpc["id"], value: unknown) => ({ jsonrpc: "2.0", id, result: value })
const failure = (id: Rpc["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } })

function handle(msg: Rpc) {
  switch (msg.method) {
    case "initialize":
      return result(msg.id, {
        protocolVersion: PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: "syncrobotic-ui", version: pkg.version },
        instructions:
          "SYNCROBOTIC design system. Before building UI: search for the need, get_item for each item you use, follow its rules and agent notes, install with get_install_command, and run get_checklist on what you changed.",
      })
    case "ping":
      return result(msg.id, {})
    case "tools/list":
      return result(msg.id, { tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) })
    case "tools/call": {
      const tool = tools.find((t) => t.name === msg.params?.name)
      if (!tool) return failure(msg.id, -32602, `Unknown tool: ${String(msg.params?.name)}`)
      try {
        const text = tool.run((msg.params?.arguments as Record<string, unknown>) ?? {})
        return result(msg.id, { content: [{ type: "text", text }] })
      } catch (e) {
        return result(msg.id, { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true })
      }
    }
    default:
      return msg.id === undefined ? null : failure(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

export async function POST(req: Request) {
  let body: Rpc | Rpc[]
  try {
    body = await req.json()
  } catch {
    return Response.json(failure(null, -32700, "Parse error"), { status: 400 })
  }
  const replies = (Array.isArray(body) ? body : [body]).map(handle).filter((r) => r !== null)
  // Notifications only (no id): accepted, nothing to say.
  if (!replies.length) return new Response(null, { status: 202 })
  return Response.json(Array.isArray(body) ? replies : replies[0], { headers: { "mcp-protocol-version": PROTOCOL } })
}

// Stateless server: no server-to-client stream and no sessions to end.
export function GET() {
  return new Response("This MCP server answers POST requests (Streamable HTTP, JSON responses).", { status: 405, headers: { allow: "POST" } })
}
export const DELETE = GET
