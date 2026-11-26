import type { Meta, StoryObj } from "@storybook/react-vite"
import { citationsLabels, markdownLabels, streamingTextLabels, locale as zhTW } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Citations, CitationSources, citationMarker, type CitationSource } from "@/registry/syncrobotic/ui/citations"
import { Markdown } from "@/registry/syncrobotic/ui/markdown"
import { StreamingText } from "@/registry/syncrobotic/ui/streaming-text"

const meta: Meta = { title: "Display/Citations" }
export default meta
type S = StoryObj

// An operator's assistant answering from the site's documents (retrieval): the answer cites them as [1], and the list
// under it says what each one is. Fixed texts, so screenshots are the same on every machine.
const sources: CitationSource[] = [
  {
    title: "Docking station manual, section 4.2",
    url: "https://docs.example.com/manuals/dock/clearance",
    snippet: "Keep 30 cm clear on each side of the plate. Objects outside the approach corridor do not block docking.",
  },
  {
    title: "Aisle 4 floor plan",
    location: "site-maps/warehouse-b.pdf, page 12",
    snippet: "The dock in aisle 4 is approached from the east; the corridor is 1.2 m wide.",
  },
  {
    title: "Night shift handover, 25 Nov",
    url: "https://wiki.example.com/ops/handover/2026-11-25",
  },
]

const answer = `## Can Patrol dog 7F3A dock tonight?

**Yes.** The plate is clear and the box sits outside the approach corridor [1][2].

| Check | Result | Source |
|---|---|---|
| Plate | Clear of objects within 30 cm | [1] |
| Approach | From the east, 1.2 m corridor | [2] |
| Box | 40 cm west, outside the corridor | [2] |

1. Leave the box where it is.
2. If it must move, the night shift can take it before 22:00 [3].

\`\`\`bash
ros2 topic echo /dock/state --once
\`\`\``

/** A model's answer with its sources: markers in the text and the table, the list under it. Hover or focus a marker. */
export const CitationsAnswer: S = {
  render: () => (
    <div className="flex w-full flex-col gap-6 rounded-md bg-card p-4 ring-1 ring-border">
      <Citations sources={sources}>
        <Markdown text={answer} cite={citationMarker} />
        <CitationSources />
      </Citations>
    </div>
  ),
}

/** Sources that are files or pages rather than web pages: `location` says where, and the title is not a link. */
export const CitationsLocations: S = {
  render: () => (
    <div className="flex w-full flex-col gap-6 rounded-md bg-card p-4 ring-1 ring-border">
      <Citations sources={sources.slice(1, 2)}>
        <Markdown text="The dock in aisle 4 is approached from the east [1]." cite={citationMarker} />
        <CitationSources />
      </Citations>
    </div>
  ),
}

/** Inside StreamingText's flow: `format="markdown"` with `markdownProps={{ cite: citationMarker }}`, all inside Citations. */
export const CitationsStreaming: S = {
  render: () => (
    <div className="flex w-full flex-col gap-6 rounded-md bg-card p-4 ring-1 ring-border">
      <Citations sources={sources}>
        <StreamingText
          text={"**Yes.** The plate is clear [1] and the box sits outside the approach corridor [2]."}
          phase="done"
          durationMs={3100}
          firstTokenMs={420}
          format="markdown"
          markdownProps={{ cite: citationMarker }}
        />
        <CitationSources />
      </Citations>
    </div>
  ),
}

const zhSources: CitationSource[] = [
  { title: "充電座手冊 4.2 節", url: "https://docs.example.com/zh-tw/manuals/dock/clearance", snippet: "平台兩側各保留 30 公分淨空；對接路徑外的物品不影響對接。" },
  { title: "倉庫 B 平面圖", location: "site-maps/warehouse-b.pdf，第 12 頁" },
]

/** In Traditional Chinese: `citationsLabels` and `markdownLabels` from labels-zh-tw. */
export const CitationsZhTw: S = {
  render: () => (
    <div className="flex w-full flex-col gap-6 rounded-md bg-card p-4 ring-1 ring-border">
      <Citations sources={zhSources} labels={citationsLabels}>
        <StreamingText
          text={"**可以。**平台淨空 [1]，紙箱在對接路徑之外 [2]。"}
          phase="done"
          durationMs={2400}
          format="markdown"
          markdownProps={{ cite: citationMarker, labels: markdownLabels }}
          labels={streamingTextLabels}
          locale={zhTW}
        />
        <CitationSources />
      </Citations>
    </div>
  ),
}
