"use client"

import * as React from "react"
import * as actions from "@/stories/actions.stories"
import * as charts from "@/stories/charts.stories"
import * as display from "@/stories/display.stories"
import * as dock from "@/stories/dock.stories"
import * as feedback from "@/stories/feedback.stories"
import * as inputs from "@/stories/inputs.stories"
import * as island from "@/stories/island.stories"
import * as list from "@/stories/list.stories"
import * as navigation from "@/stories/navigation.stories"
import * as overlays from "@/stories/overlays.stories"
import * as slide from "@/stories/slide-to-release.stories"
import * as stop from "@/stories/stop-button.stories"
import * as s_item from "@/stories/item.stories"
import * as s_icon_tile from "@/stories/icon-tile.stories"
import * as s_kbd from "@/stories/kbd.stories"
import * as s_code_block from "@/stories/code-block.stories"
import * as s_button_group from "@/stories/button-group.stories"
import * as s_scroll_area from "@/stories/scroll-area.stories"
import * as s_toggle_group from "@/stories/toggle-group.stories"
import * as s_page_header from "@/stories/page-header.stories"
import * as s_form from "@/stories/form.stories"
import * as s_data_pieces from "@/stories/data-pieces.stories"
import * as s_image_grid from "@/stories/image-grid.stories"
import * as s_annotated_image from "@/stories/annotated-image.stories"
import * as s_tree from "@/stories/tree.stories"
import * as s_chip_group from "@/stories/chip-group.stories"
import * as s_filter_form from "@/stories/filter-form.stories"
import * as s_filters from "@/stories/filters.stories"
import * as s_search_field from "@/stories/search-field.stories"
import * as s_theme_toggle from "@/stories/theme-toggle.stories"
import * as s_route_progress from "@/stories/route-progress.stories"
import * as s_autocomplete from "@/stories/autocomplete.stories"
import * as s_input_otp from "@/stories/input-otp.stories"
import * as s_phone_input from "@/stories/phone-input.stories"
import * as s_calendar from "@/stories/calendar.stories"
import * as s_date_selector from "@/stories/date-selector.stories"
import * as s_time_picker from "@/stories/time-picker.stories"
import * as s_data_grid from "@/stories/data-grid.stories"
import * as s_stepper from "@/stories/stepper.stories"
import * as s_trace from "@/stories/trace.stories"
import * as s_marker from "@/stories/marker.stories"
import * as s_timeline from "@/stories/timeline.stories"
import * as s_scrollspy from "@/stories/scrollspy.stories"
import * as s_navigation_menu from "@/stories/navigation-menu.stories"
import * as s_questionnaire from "@/stories/questionnaire.stories"
import * as s_sortable from "@/stories/sortable.stories"
import * as s_resizable from "@/stories/resizable.stories"
import * as s_file_upload from "@/stories/file-upload.stories"
import * as s_attachment from "@/stories/attachment.stories"
import * as s_file_type from "@/stories/file-type.stories"
import * as s_hooks from "@/stories/hooks.stories"
import * as s_metric_card from "@/stories/metric-card.stories"
import type { StoryFile } from "./catalog"

type Meta = { component?: React.ComponentType<Record<string, unknown>>; args?: Record<string, unknown> }
type Story = { args?: Record<string, unknown>; render?: (args: Record<string, unknown>) => React.ReactNode }
type StoryModule = { default: Meta } & Record<string, unknown>

const files: Record<StoryFile, StoryModule> = {
  "stop-button": stop as unknown as StoryModule,
  "slide-to-release": slide as unknown as StoryModule,
  dock: dock as unknown as StoryModule,
  island: island as unknown as StoryModule,
  list: list as unknown as StoryModule,
  actions: actions as unknown as StoryModule,
  inputs: inputs as unknown as StoryModule,
  display: display as unknown as StoryModule,
  feedback: feedback as unknown as StoryModule,
  navigation: navigation as unknown as StoryModule,
  overlays: overlays as unknown as StoryModule,
  charts: charts as unknown as StoryModule,
  "data-grid": s_data_grid as unknown as StoryModule,
  stepper: s_stepper as unknown as StoryModule,
  trace: s_trace as unknown as StoryModule,
  marker: s_marker as unknown as StoryModule,
  timeline: s_timeline as unknown as StoryModule,
  scrollspy: s_scrollspy as unknown as StoryModule,
  "navigation-menu": s_navigation_menu as unknown as StoryModule,
  questionnaire: s_questionnaire as unknown as StoryModule,
  sortable: s_sortable as unknown as StoryModule,
  resizable: s_resizable as unknown as StoryModule,
  "file-upload": s_file_upload as unknown as StoryModule,
  attachment: s_attachment as unknown as StoryModule,
  "file-type": s_file_type as unknown as StoryModule,
  autocomplete: s_autocomplete as unknown as StoryModule,
  "input-otp": s_input_otp as unknown as StoryModule,
  "phone-input": s_phone_input as unknown as StoryModule,
  calendar: s_calendar as unknown as StoryModule,
  "date-selector": s_date_selector as unknown as StoryModule,
  "time-picker": s_time_picker as unknown as StoryModule,
  item: s_item as unknown as StoryModule,
  "icon-tile": s_icon_tile as unknown as StoryModule,
  kbd: s_kbd as unknown as StoryModule,
  "code-block": s_code_block as unknown as StoryModule,
  "button-group": s_button_group as unknown as StoryModule,
  "scroll-area": s_scroll_area as unknown as StoryModule,
  "toggle-group": s_toggle_group as unknown as StoryModule,
  "page-header": s_page_header as unknown as StoryModule,
  form: s_form as unknown as StoryModule,
  "data-pieces": s_data_pieces as unknown as StoryModule,
  "image-grid": s_image_grid as unknown as StoryModule,
  "annotated-image": s_annotated_image as unknown as StoryModule,
  tree: s_tree as unknown as StoryModule,
  "chip-group": s_chip_group as unknown as StoryModule,
  "filter-form": s_filter_form as unknown as StoryModule,
  filters: s_filters as unknown as StoryModule,
  "search-field": s_search_field as unknown as StoryModule,
  "theme-toggle": s_theme_toggle as unknown as StoryModule,
  "route-progress": s_route_progress as unknown as StoryModule,
  hooks: s_hooks as unknown as StoryModule,
  "metric-card": s_metric_card as unknown as StoryModule,
}

// Same rule as Storybook: story args override meta args; a story's own render wins over meta.component.
function render(file: StoryFile, name: string) {
  const mod = files[file]
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
            : "mx-auto w-fit max-w-full min-w-full text-center sm:min-w-sm [&>*]:mx-auto [&>*]:text-start"
        }
      >
        {render(file, name)}
      </div>
    </div>
  )
}
