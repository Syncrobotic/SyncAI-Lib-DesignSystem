// @syncrobotic/tier-badge v0.51.0 · update: npx shadcn add @syncrobotic/tier-badge --overwrite
import { Badge } from "@/registry/syncrobotic/ui/badge"

/** A dataset's licence tier: T0 may enter product releases, T1–T3 restrict what you may do with it. */
export type Tier = "T0" | "T1" | "T2" | "T3"

/** The words for each tier, after its code. */
export type TierBadgeLabels = Record<Tier, string>

export const tierBadgeLabels: TierBadgeLabels = {
  T0: "Commercial",
  T1: "Non-commercial",
  T2: "Restricted",
  T3: "On-premises only",
}

/**
 * Licence tiers. None carries colour (a tier is a category, not a state): T0 is a grey tag and the restricted tiers are
 * outlined, so the ones that change what you may do stand apart without a status colour.
 */
export const tiers: Record<Tier, { label: string; tone: "neutral" | "outline" }> = {
  T0: { label: tierBadgeLabels.T0, tone: "neutral" },
  T1: { label: tierBadgeLabels.T1, tone: "outline" },
  T2: { label: tierBadgeLabels.T2, tone: "outline" },
  T3: { label: tierBadgeLabels.T3, tone: "outline" },
}

type TierBadgeProps = {
  /** The dataset's licence tier, T0 to T3. */
  tier: Tier
  /** The code alone on screen, for a column headed Tier. Screen readers still hear the words. */
  compact?: boolean
  /** The words for each tier (English by default; `tierBadgeLabels` in labels-zh-tw). */
  labels?: Partial<TierBadgeLabels>
}

/**
 * A dataset's licence tier as a tag: its code and its meaning ("T1 · Non-commercial"); `compact` shows only the code (a
 * screen reader still hears the words). A tier is a category, never a status colour.
 */
export function TierBadge({ tier, compact, labels }: TierBadgeProps) {
  const label = labels?.[tier] ?? tierBadgeLabels[tier]
  return (
    <Badge tone={tiers[tier].tone}>
      <span className="font-mono">{tier}</span>
      {/* Compact still says what the code means to a screen reader. */}
      <span className={compact ? "sr-only" : undefined}> · {label}</span>
    </Badge>
  )
}
