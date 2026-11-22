import type { Meta, StoryObj } from "@storybook/react-vite"
import { tierBadgeLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { TierBadge, type Tier } from "@/registry/syncrobotic/ui/tier-badge"

const meta: Meta = { title: "Display/Tier badge" }
export default meta
type S = StoryObj

const all: Tier[] = ["T0", "T1", "T2", "T3"]

/** Every tier with its words: T0 grey, the restricted tiers outlined. A tier is a category, never a status colour. */
export const TierBadgeTiers: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {all.map((t) => (
        <TierBadge key={t} tier={t} />
      ))}
    </div>
  ),
}

/** In a table column headed Tier: the code alone on screen; a screen reader still hears "T1 · Non-commercial". */
export const TierBadgeCompact: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {all.map((t) => (
        <TierBadge key={t} tier={t} compact />
      ))}
    </div>
  ),
}

/** The words from the zh-TW pack (`labels`). */
export const TierBadgeZhTw: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {all.map((t) => (
        <TierBadge key={t} tier={t} labels={tierBadgeLabels} />
      ))}
    </div>
  ),
}
