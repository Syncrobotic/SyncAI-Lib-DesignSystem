"use client"

import * as React from "react"
import * as actions from "@/stories/actions.stories"
import * as display from "@/stories/display.stories"
import * as dock from "@/stories/dock.stories"
import * as inputs from "@/stories/inputs.stories"
import * as island from "@/stories/island.stories"
import * as list from "@/stories/list.stories"
import * as navigation from "@/stories/navigation.stories"
import * as overlays from "@/stories/overlays.stories"
import * as slide from "@/stories/slide-to-release.stories"
import * as stop from "@/stories/stop-button.stories"
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
  navigation: navigation as unknown as StoryModule,
  overlays: overlays as unknown as StoryModule,
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
export function Stage({ file, name, className }: { file: StoryFile; name: string; className?: string }) {
  return (
    <div className={className ?? "flex justify-center rounded-md border border-border bg-background px-4 py-8"}>
      <div className="w-full max-w-sm">{render(file, name)}</div>
    </div>
  )
}
