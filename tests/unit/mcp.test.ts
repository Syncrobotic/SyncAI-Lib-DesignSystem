// @vitest-environment node
import { describe, expect, it } from "vitest"
import { POST } from "@/app/mcp/route"

const call = async (body: unknown) => {
  const res = await POST(new Request("http://x/mcp", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }))
  return { status: res.status, json: res.status === 202 ? null : await res.json() }
}

describe("MCP server", () => {
  it("initializes and lists the tools", async () => {
    const init = await call({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {} } })
    expect(init.json.result.serverInfo.name).toBe("syncrobotic-ui")
    expect((await call({ jsonrpc: "2.0", method: "notifications/initialized" })).status).toBe(202)
    const list = await call({ jsonrpc: "2.0", id: 2, method: "tools/list" })
    expect(list.json.result.tools.map((t: { name: string }) => t.name)).toEqual(["search", "get_item", "get_install_command", "get_design_language", "get_checklist"])
  })

  it("finds an item for a need and returns its twin", async () => {
    const text = async (name: string, args: unknown) =>
      (await call({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name, arguments: args } })).json.result.content[0].text as string
    expect(await text("search", { query: "battery level" })).toMatch(/^- meter /)
    expect(await text("get_item", { name: "meter" })).toMatch(/^# Meter/)
    expect(await text("get_install_command", { names: ["meter"] })).toContain("npx shadcn add @syncrobotic/meter")
    expect(await text("get_install_command", { names: ["nope"] })).toContain("Unknown: nope")
  })

  it("answers unknown methods and bad JSON with JSON-RPC errors", async () => {
    expect((await call({ jsonrpc: "2.0", id: 4, method: "nope" })).json.error.code).toBe(-32601)
    const bad = await POST(new Request("http://x/mcp", { method: "POST", body: "{" }))
    expect(bad.status).toBe(400)
  })
})
