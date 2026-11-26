"use client"

import * as React from "react"
import type { StoryFile } from "./catalog"

type Meta = { component?: React.ComponentType<Record<string, unknown>>; args?: Record<string, unknown> }
type Story = { args?: Record<string, unknown>; render?: (args: Record<string, unknown>) => React.ReactNode }
type StoryModule = { default: Meta } & Record<string, unknown>

// Each story file loads on demand, so a page downloads only the examples it shows (and their libraries: three.js,
// recharts, the code highlighter). On the server the import resolves before the HTML is sent, so the examples are in it;
// in the browser they hydrate once their file has arrived, and until then the server's HTML stays as it is.
const files = {
  "robot-model": () => import("@/stories/robot-model.stories"),
  "stop-button": () => import("@/stories/stop-button.stories"),
  "slide-to-release": () => import("@/stories/slide-to-release.stories"),
  "teleop-pad": () => import("@/stories/teleop-pad.stories"),
  dock: () => import("@/stories/dock.stories"),
  island: () => import("@/stories/island.stories"),
  list: () => import("@/stories/list.stories"),
  actions: () => import("@/stories/actions.stories"),
  inputs: () => import("@/stories/inputs.stories"),
  display: () => import("@/stories/display.stories"),
  feedback: () => import("@/stories/feedback.stories"),
  navigation: () => import("@/stories/navigation.stories"),
  overlays: () => import("@/stories/overlays.stories"),
  charts: () => import("@/stories/charts.stories"),
  "data-grid": () => import("@/stories/data-grid.stories"),
  "log-viewer": () => import("@/stories/log-viewer.stories"),
  "streaming-text": () => import("@/stories/streaming-text.stories"),
  "prompt-composer": () => import("@/stories/prompt-composer.stories"),
  "message-actions": () => import("@/stories/message-actions.stories"),
  message: () => import("@/stories/message.stories"),
  stepper: () => import("@/stories/stepper.stories"),
  trace: () => import("@/stories/trace.stories"),
  marker: () => import("@/stories/marker.stories"),
  timeline: () => import("@/stories/timeline.stories"),
  scrollspy: () => import("@/stories/scrollspy.stories"),
  "navigation-menu": () => import("@/stories/navigation-menu.stories"),
  questionnaire: () => import("@/stories/questionnaire.stories"),
  sortable: () => import("@/stories/sortable.stories"),
  resizable: () => import("@/stories/resizable.stories"),
  "file-upload": () => import("@/stories/file-upload.stories"),
  attachment: () => import("@/stories/attachment.stories"),
  "file-type": () => import("@/stories/file-type.stories"),
  autocomplete: () => import("@/stories/autocomplete.stories"),
  "input-otp": () => import("@/stories/input-otp.stories"),
  "phone-input": () => import("@/stories/phone-input.stories"),
  calendar: () => import("@/stories/calendar.stories"),
  "date-selector": () => import("@/stories/date-selector.stories"),
  "time-picker": () => import("@/stories/time-picker.stories"),
  item: () => import("@/stories/item.stories"),
  "icon-tile": () => import("@/stories/icon-tile.stories"),
  kbd: () => import("@/stories/kbd.stories"),
  code: () => import("@/stories/code.stories"),
  "code-block": () => import("@/stories/code-block.stories"),
  "button-group": () => import("@/stories/button-group.stories"),
  "scroll-area": () => import("@/stories/scroll-area.stories"),
  "toggle-group": () => import("@/stories/toggle-group.stories"),
  "page-header": () => import("@/stories/page-header.stories"),
  "section-header": () => import("@/stories/section-header.stories"),
  "responsive-table": () => import("@/stories/responsive-table.stories"),
  form: () => import("@/stories/form.stories"),
  "data-pieces": () => import("@/stories/data-pieces.stories"),
  "bar-list": () => import("@/stories/bar-list.stories"),
  thumbnail: () => import("@/stories/thumbnail.stories"),
  "viewport-overlay": () => import("@/stories/viewport-overlay.stories"),
  "image-grid": () => import("@/stories/image-grid.stories"),
  "annotated-image": () => import("@/stories/annotated-image.stories"),
  "grounded-text": () => import("@/stories/grounded-text.stories"),
  "media-player": () => import("@/stories/media-player.stories"),
  "camera-feed": () => import("@/stories/camera-feed.stories"),
  "camera-wall": () => import("@/stories/camera-wall.stories"),
  "joint-state": () => import("@/stories/joint-state.stories"),
  diagnostics: () => import("@/stories/diagnostics.stories"),
  tree: () => import("@/stories/tree.stories"),
  collapsible: () => import("@/stories/collapsible.stories"),
  sidebar: () => import("@/stories/sidebar.stories"),
  graph: () => import("@/stories/graph.stories"),
  "robot-map": () => import("@/stories/robot-map.stories"),
  "waypoint-editor": () => import("@/stories/waypoint-editor.stories"),
  "geo-map": () => import("@/stories/geo-map.stories"),
  "point-cloud": () => import("@/stories/point-cloud.stories"),
  "chip-group": () => import("@/stories/chip-group.stories"),
  facets: () => import("@/stories/facets.stories"),
  "filter-form": () => import("@/stories/filter-form.stories"),
  filters: () => import("@/stories/filters.stories"),
  "search-field": () => import("@/stories/search-field.stories"),
  "theme-toggle": () => import("@/stories/theme-toggle.stories"),
  "route-progress": () => import("@/stories/route-progress.stories"),
  hooks: () => import("@/stories/hooks.stories"),
  "metric-card": () => import("@/stories/metric-card.stories"),
  "context-menu": () => import("@/stories/context-menu.stories"),
  "hover-card": () => import("@/stories/hover-card.stories"),
  banner: () => import("@/stories/banner.stories"),
  "streaming-chart": () => import("@/stories/streaming-chart.stories"),
  attitude: () => import("@/stories/attitude.stories"),
  "tier-badge": () => import("@/stories/tier-badge.stories"),
} satisfies Record<StoryFile, () => Promise<unknown>>

// One React.lazy per file, made once at module scope: the import starts the first time one of its stories renders.
const lazyStories = Object.fromEntries(
  Object.entries(files).map(([file, load]) => [
    file,
    React.lazy(async () => {
      const mod = (await load()) as unknown as StoryModule
      return { default: ({ name }: { name: string }) => renderStory(mod, name) }
    }),
  ]),
) as Record<StoryFile, React.LazyExoticComponent<(props: { name: string }) => React.ReactNode>>

// On the server every story file is imported once, before the first page, and each example renders in place. No Suspense
// boundary around it: React streams a large finished boundary as a placeholder and swaps it in with a script, which moved
// everything under it. In the browser a story file loads on demand; while it does, hydration keeps the server's HTML, and
// a navigation (a transition) keeps the page you are leaving until the new page's examples are there.
const onServer = typeof window === "undefined"
const loaded: Partial<Record<StoryFile, StoryModule>> = {}
if (onServer)
  await Promise.all(Object.entries(files).map(async ([file, load]) => (loaded[file as StoryFile] = (await load()) as unknown as StoryModule)))

function render(file: StoryFile, name: string) {
  const ready = onServer ? loaded[file] : undefined
  if (ready) return renderStory(ready, name)
  const Story = lazyStories[file]
  return <Story name={name} />
}

// Same rule as Storybook: story args override meta args; a story's own render wins over meta.component.
function renderStory(mod: StoryModule, name: string) {
  const meta = mod.default
  const story = (mod[name] ?? {}) as Story
  const args = { ...meta.args, ...story.args }
  if (story.render) return story.render(args)
  const Component = meta.component
  return Component ? <Component {...args} /> : null
}

/** One state on a phone-width stage, the size components ship at. */
export function Stage({ file, name, className, wide }: { file: StoryFile; name: string; className?: string; /** Full width, for charts. */ wide?: boolean }) {
  return (
    <div className={className ?? "flex justify-center rounded-md border border-border bg-background px-4 py-8"}>
      {/* Not wide: a column as wide as the example needs, at least 384 px (fields and grids fill it) and at most the
          frame, so a row of badges or an alarm's meta stays on one line. The column is centred, and so is anything
          narrower inside it: a lone trigger (inline, by text-align), a calendar or a fixed-width list (by margin). */}
      <div
        className={
          wide
            ? "w-full"
            : // A row of small things (badges, buttons, avatars) shrinks to its content and sits in the middle; an example with a
              // field, a table, a card, a bar or navigation keeps the column's width, so inputs and grids still fill it. The rule
              // has no specificity (:where), so a width the story sets itself (w-md, w-2xl) always wins.
              "mx-auto w-fit max-w-full min-w-full text-center sm:min-w-sm [&>*]:mx-auto [&>*]:text-start [:where(&>*:not(:has(input,textarea,table,img,video,canvas,nav,[role=combobox],[role=grid],[role=tree],[role=progressbar],[role=meter],[role=slider],[data-slot=card],[data-slot=metric-card],[data-slot=table-container])))]:w-fit"
        }
      >
        {render(file, name)}
      </div>
    </div>
  )
}
