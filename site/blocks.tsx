import registry from "../registry.json"
import { blockGroups, blockTypes, placement } from "./block-types"
import { blockList } from "./block-list"

// Blocks are composed sections. Each renders alone at /preview/<name> (its component in site/block-renders.tsx) so the
// docs can frame it at any width. This file is data only: a page that lists or frames blocks does not load them.
/** The part of a block a /blocks card shows, in the block's own pixels: its left and top edge and its width. The height is the card's 16:10. */
export type ThumbView = { x?: number; y?: number; width: number }

type Meta = {
  viewport: "desktop" | "mobile"
  /** Width the overview thumbnail renders at. Charts are dashboard cards, so they render at a card's width, not a screen's. */
  thumbWidth?: number
  /** The region the /blocks card shows, when the default (a desktop screen's top-left 480 px; a section whole) is not the telling part. */
  thumb?: ThumbView
  /** Shown on /blocks for its type instead of the type's first block (when the first is a bare frame with nothing in it). */
  cover?: boolean
  /** Starting height: an app shell fills it like a screen; a section starts at it, so it is the section's measured height at its starting width (the frame then follows the content, and a wrong number shows as a jump). */
  height: number
}

const meta: Record<string, Meta> = {
  // Charts: one card each, shown at a dashboard card's width.
  "line-chart-telemetry": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 392
  },
  "histogram-battery": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 400
  },
  "line-chart-limit": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 368
  },
  "line-chart-compare": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 408
  },
  "area-chart-battery": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 364
  },
  "area-chart-fleet-states": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 392
  },
  "area-chart-cumulative": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 364
  },
  "bar-chart-missions": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 392
  },
  "bar-chart-ranked": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 360
  },
  "bar-chart-stacked": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 388
  },
  "bar-chart-variance": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 328
  },
  "sparkline-robot-list": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 317
  },
  "sparkline-table": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 361
  },
  "status-tracker-uptime": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 328
  },
  "status-tracker-runs": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 278
  },
  "status-tracker-rollout": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 192
  },
  "radial-chart-battery": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 264
  },
  "radial-chart-goal": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 260
  },
  "radial-chart-capacity": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 276
  },
  "heatmap-week-hours": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 380
  },
  "heatmap-zones": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 484
  },
  // App shells: whole screens for internal engineering tools. Install one, replace the sample data, and you have a prototype.
  "app-shell": {
    viewport: "desktop",
    height: 720
  },
  // Data tools: internal tools for datasets, after DataCore. Same shell, same rules.
  "data-catalog": { viewport: "desktop", height: 760},
  "dataset-detail": { viewport: "desktop", height: 820},
  "governance-todo": { viewport: "desktop", height: 600},
  // Keyboard review: a focused screen of its own, without the shell, so nothing competes with the item.
  "review-queue": { viewport: "desktop", thumbWidth: 960, height: 820},
  "settings-page": { viewport: "desktop", height: 820},
  "record-form": { viewport: "desktop", height: 820},
  "users-roles": { viewport: "desktop", height: 620},
  "sign-in": { viewport: "desktop", height: 640, thumb: { x: 400, y: 112, width: 480 }},
  "status-pages": {
    viewport: "desktop",
    height: 1304,
    thumb: { x: 84, y: 72, width: 480 }
  },
  "top-bar-shell": { viewport: "desktop", height: 720},
  // The bare shells hold an empty page; this one holds frames and its next step, so it stands for the type on /blocks.
  "action-rail-shell": { viewport: "desktop", height: 720, cover: true, thumb: { x: 704, width: 576 }},
  "console-overview": { viewport: "desktop", height: 900},
  "list-detail": { viewport: "desktop", height: 720},
  "event-log": { viewport: "desktop", height: 720},
  "map-workspace": { viewport: "desktop", height: 720},

  "stats-cards": {
    viewport: "desktop",
    height: 172,
    thumb: { x: 8, y: -36, width: 400 }
  },
  "fleet-table": {
    viewport: "desktop",
    height: 484
  },
  "robot-status-card": {
    viewport: "mobile",
    height: 340
  },
  "marketing-hero": { viewport: "desktop", height: 548, thumb: { x: 56, y: 104, width: 600 }},
  // Solutions, batch 4: whole screens in the app shell.
  "mission-schedule": { viewport: "desktop", height: 720},
  "users-invitations": { viewport: "desktop", height: 680},
  "users-audit-log": { viewport: "desktop", height: 680},
  "incident-queue": { viewport: "desktop", height: 620},
  "incident-detail": { viewport: "desktop", height: 900},
  "maintenance-due": { viewport: "desktop", height: 600},
  "maintenance-work-order": { viewport: "desktop", height: 1000},
  "rollout-overview": { viewport: "desktop", height: 900},
  "rollout-plan": { viewport: "desktop", height: 960},
  "agent-runs": { viewport: "desktop", height: 620},
  "agent-trace": { viewport: "desktop", height: 820},
  "agent-approval": { viewport: "desktop", height: 880},
  "agent-chat": { viewport: "desktop", height: 880},
  "agent-run-gate": { viewport: "desktop", height: 1200},
  "agent-run-outcome": { viewport: "desktop", height: 960},
  // Application, batch 3. Dialogs and sheets open on load in the preview without taking the page's focus.
  "app-shell-mobile-tabs": { viewport: "mobile", height: 720},
  "stats-meters": {
    viewport: "desktop",
    height: 145
  },
  "stats-filtered": {
    viewport: "desktop",
    height: 232
  },
  "card-site": {
    viewport: "desktop",
    height: 272
  },
  "card-mission": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 376
  },
  "auth-passkey": { viewport: "desktop", height: 640},
  "auth-invite": { viewport: "desktop", height: 760},
  "auth-2fa": { viewport: "desktop", height: 720},
  "settings-notifications": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 564
  },
  "settings-api-keys": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 289
  },
  "settings-billing": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 1101
  },
  // The bell in a real top bar, its popover open on load so the card shows the list, not a closed bell.
  "notification-center": { viewport: "desktop", height: 720, thumb: { x: 760, y: 0, width: 520 }},
  "settings-webhooks": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 766
  },
  "settings-sessions": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 646
  },
  "dialog-confirm-destructive": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 640
  },
  "dialog-form": { viewport: "desktop", thumbWidth: 960, height: 600},
  "dialog-share": { viewport: "desktop", thumbWidth: 960, height: 680},
  "sheet-robot-detail": { viewport: "desktop", thumbWidth: 960, height: 760},
  "sheet-filters": { viewport: "mobile", height: 760},
  "timeline-activity": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 632
  },
  "timeline-audit": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 452
  },
  "wizard-commission": { viewport: "desktop", height: 520, thumb: { x: 296, width: 560 }},
  "wizard-import": { viewport: "desktop", thumbWidth: 960, height: 760},
}

// Screens in the app shell: their /blocks card skips the sidebar (the same on every one) for the page's title and first panel.
const shellView: ThumbView = { x: 248, width: 480 }
const inShell = new Set([
  "agent-approval",
  "agent-chat",
  "agent-run-gate",
  "agent-run-outcome",
  "agent-runs",
  "agent-trace",
  "console-overview",
  "data-catalog",
  "dataset-detail",
  "event-log",
  "governance-todo",
  "incident-detail",
  "incident-queue",
  "list-detail",
  "maintenance-due",
  "maintenance-work-order",
  "map-workspace",
  "mission-schedule",
  "record-form",
  "rollout-overview",
  "rollout-plan",
  "settings-page",
  "users-audit-log",
  "users-invitations",
  "users-roles",
])

// The navigation lists blocks from site/block-list.ts, which does not import them; each one listed there needs a preview here.
for (const b of blockList) if (!(b.name in meta)) throw new Error(`Block ${b.name} has a place (block-types.ts) but no preview (site/blocks.tsx)`)

export const blocks = Object.keys(placement)
  .map((name) => registry.items.find((i) => i.type === "registry:block" && i.name === name))
  .filter((i): i is NonNullable<typeof i> => !!i && i.name in meta)
  .map((i) => ({ ...i, thumb: inShell.has(i.name) ? shellView : undefined, ...meta[i.name], ...placement[i.name] }))

export const getBlock = (name: string) => blocks.find((b) => b.name === name)
export const blocksOfType = (slug: string) => blocks.filter((b) => b.type === slug)


/**
 * The /blocks cards: one per type of the Application and Solutions groups, showing the block that stands for the type (its
 * cover if one is marked, else the first). Each is a picture taken by scripts/thumbs.mjs (npm run thumbs -- --blocks) from
 * the block's preview at `width`: a desktop screen shows one region of itself (`view`, by default its top-left 480 px) at
 * about half size, where the words still read; a section or a phone sits whole, centred. The page and the script read this
 * one list, so a card never asks for a picture the script did not take.
 */
export function blockCards() {
  return blockTypes
    .filter((t) => (blockGroups as readonly string[]).includes(t.group) && blocksOfType(t.slug).length > 0)
    .map((t) => {
      const list = blocksOfType(t.slug)
      const b = list.find((x) => x.cover) ?? list[0]
      const width = b.thumbWidth ?? (b.viewport === "mobile" ? 390 : 1280)
      const view: ThumbView | undefined = b.thumb ?? (b.fit === "screen" && width > 600 ? { width: 480 } : undefined)
      return { type: t.slug, group: t.group, title: t.title, description: t.description, count: list.length, name: b.name, width, height: b.height, fit: b.fit, view }
    })
}
