import type { Meta, StoryObj } from "@storybook/react-vite"
import { CodeBlock } from "@/registry/syncrobotic/ui/code-block"
import { Highlighted } from "@/stories/highlight"

const meta: Meta = { title: "Display/Code block" }
export default meta
type S = StoryObj

const dvcImport = "dvc import https://git.syncrobotic.me/datacore/warehouse-scans data/pallets/2026-11 --rev v3.2.0"

export const CodeBlockCommand: S = {
  render: () => (
    <div className="w-md max-w-full">
      <CodeBlock code={dvcImport} title="Terminal" language="bash" wrap="words">
        <Highlighted code={dvcImport} lang="bash" />
      </CodeBlock>
    </div>
  ),
}

const deviceResponse = `{
  "id": "dev_7Q2M9KX4",
  "name": "Taipei warehouse — line 2",
  "status": "online",
  "lastHeartbeatAt": "2026-11-19T08:42:17.000Z",
  "hardware": { "gpus": [{ "name": "NVIDIA RTX 6000 Ada Generation", "memoryTotalMiB": 49140 }] }
}`

export const CodeBlockScrolls: S = {
  render: () => (
    <div className="w-md max-w-full">
      <CodeBlock code={deviceResponse} language="json">
        <Highlighted code={deviceResponse} lang="json" />
      </CodeBlock>
    </div>
  ),
}

const missionTs = `import { createClient } from "@localmind/portal"

const portal = createClient({ apiKey: process.env.LOCALMIND_API_KEY! })
const devices = await portal.projects.devices.list("prj_warehouse_north", { status: "online", limit: 20 })
console.log(devices.items.map((d) => d.name))`

export const CodeBlockWithTitle: S = {
  render: () => (
    <div className="w-md max-w-full">
      <CodeBlock code={missionTs} title="list-devices.ts" language="ts" lineNumbers>
        <Highlighted code={missionTs} lang="tsx" />
      </CodeBlock>
    </div>
  ),
}

export const CodeBlockSecret: S = {
  render: () => (
    <div className="w-md max-w-full space-y-3">
      <CodeBlock code="lm_live_4f9c2a7e81d34b06a5c1e9f2d7b8a3c6" title="API key" secret wrap="words" />
      <p className="text-sm text-muted-foreground">Copy it now: it is shown once and cannot be retrieved later.</p>
    </div>
  ),
}

const curl = `curl https://portal.syncrobotic.me/api/v1/projects/prj_warehouse_north/devices \\
  -H "Authorization: Bearer $LOCALMIND_API_KEY"`

export const CodeBlockCurl: S = {
  render: () => (
    <div className="w-md max-w-full">
      <CodeBlock code={curl} title="Terminal" language="bash" wrap="words">
        <Highlighted code={curl} lang="bash" />
      </CodeBlock>
    </div>
  ),
}
