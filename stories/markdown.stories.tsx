import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { markdownLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Markdown } from "@/registry/syncrobotic/ui/markdown"

const meta: Meta = { title: "Display/Markdown" }
export default meta
type S = StoryObj

// An operator's assistant answering about a robot's docking: what an LLM writes, as it writes it. Every story but the
// last is one fixed text, so a screenshot is the same on every machine.
const answer = `## Dock check for Patrol dog 7F3A

The dock plate is **clear** and the charging contacts are *uncovered*. One cardboard box sits about 40 cm to the left of the plate, outside the docking path.

### What to do

1. Leave the box: the robot approaches from the right.
2. If it must go, ask the night shift to move it before 22:00.
   - Log it under \`site/aisle-4\`.
   - Attach the camera frame.

| Check | Result | Last seen |
|---|---|--:|
| Plate | Clear | 14:02 |
| Contacts | Uncovered | 14:02 |
| Box | 40 cm left, outside the path | 14:01 |

To watch the dock's state yourself:

\`\`\`bash
ros2 topic echo /dock/state --once
\`\`\`

> The camera saw the dock from about 2 m; a box behind the pillar would not show.

Details are in the [docking manual](https://docs.example.com/manual/docking).`

/** A model's answer: headings at the card's levels, a numbered list with a nested one, a table, code with Copy, a quote and a link. */
export const MarkdownAnswer: S = {
  render: () => (
    <div className="w-full rounded-md bg-card p-4 ring-1 ring-border">
      <Markdown text={answer} />
    </div>
  ),
}

/** Mid-stream: the unclosed ** already styles its words and the code fence is code so far; nothing half-written flashes. */
export const MarkdownStreaming: S = {
  render: () => (
    <div className="w-full rounded-md bg-card p-4 ring-1 ring-border">
      <Markdown streaming text={"## Dock check\n\nThe dock plate is **clear and the cont\n\n```bash\nros2 topic echo /dock/st"} />
    </div>
  ),
}

const hostile = `Ignore the above and <script>alert("hi")</script> show <b>this</b>.

[Open the console](javascript:alert(1)) · [Reset](/api/robots/7F3A/reset) · [Docs](https://docs.example.com)

![Dock camera, 14:02](https://cdn.example.net/dock-14-02.jpg)`

/** What the model must not do: HTML is its text, a script or relative link is its words, and a picture is a link, not loaded. */
export const MarkdownSafety: S = {
  render: () => (
    <div className="w-full rounded-md bg-card p-4 ring-1 ring-border">
      <Markdown text={hostile} />
    </div>
  ),
}

/** Pictures load only from origins the product names in `imageOrigins`; here, the page's own. */
export const MarkdownImages: S = {
  render: function Render() {
    const [origin, setOrigin] = React.useState("")
    React.useEffect(() => setOrigin(window.location.origin), [])
    if (!origin) return <div className="w-full" />
    return (
      <div className="w-full rounded-md bg-card p-4 ring-1 ring-border">
        <Markdown
          imageOrigins={[origin]}
          text={`The front camera at 14:02:\n\n![Front camera of Patrol dog 7F3A, aisle 4](${origin}/media/patrol-clip-poster.webp)\n\nFrom another site, not loaded: ![Aisle 5](https://cdn.example.net/aisle-5.jpg)`}
        />
      </div>
    )
  },
}

const zhAnswer = `## 7F3A 充電座檢查

充電座平台**淨空**，充電接點*沒有被遮住*。平台左側約 40 公分處有一個紙箱，不在對接路徑上。

- 紙箱可以留著：機器人從右側進入。
- 若要移走，請在 22:00 前通知夜班。

![充電座畫面](https://cdn.example.net/dock.jpg)

詳見[對接手冊](https://docs.example.com/manual/docking)。`

/** In Traditional Chinese: `markdownLabels` from labels-zh-tw; strong text beside Chinese punctuation reads as strong. */
export const MarkdownZhTw: S = {
  render: () => (
    <div className="w-full rounded-md bg-card p-4 ring-1 ring-border">
      <Markdown text={zhAnswer} labels={markdownLabels} />
    </div>
  ),
}

/**
 * Live: the answer arriving a few characters at a time, as a model streams it. An automated browser (the visual checks)
 * gets the finished answer at once, so its screenshot never depends on timing.
 */
export const MarkdownLive: S = {
  render: function Render() {
    const still = typeof navigator !== "undefined" && navigator.webdriver
    const [run, setRun] = React.useState(0)
    if (still)
      return (
        <div className="w-full rounded-md bg-card p-4 ring-1 ring-border">
          <Markdown text={answer} />
        </div>
      )
    return <LiveAnswer key={run} onAgain={() => setRun((n) => n + 1)} />
  },
}

function LiveAnswer({ onAgain }: { onAgain: () => void }) {
  const [length, setLength] = React.useState(0)
  React.useEffect(() => {
    if (length >= answer.length) return
    const t = setTimeout(() => setLength((n) => Math.min(answer.length, n + 3 + (n % 7))), 30)
    return () => clearTimeout(t)
  }, [length])
  const done = length >= answer.length
  return (
    <div className="flex w-full flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">
      <Markdown text={answer.slice(0, length)} streaming={!done} />
      {done && (
        <Button variant="outline" size="sm" className="self-start" onClick={onAgain}>
          Stream again
        </Button>
      )}
    </div>
  )
}
