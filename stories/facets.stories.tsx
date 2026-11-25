import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { facetsLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { FacetList, Facets, FacetsDrawer, type Facet, type FacetValue } from "@/registry/syncrobotic/ui/facets"

const meta: Meta = { title: "Inputs/Facets" }
export default meta
type S = StoryObj

type Recording = { name: string; site: string; sensor: string; task: string }

const sites = ["Taipei HQ", "Taoyuan plant", "Hsinchu lab"]
const sensors = ["Camera", "LiDAR", "Depth camera", "IMU", "Thermal", "Radar", "Microphone"]
const tasks = ["Patrol", "Inspection", "Delivery", "Mapping"]
const recordings: Recording[] = Array.from({ length: 24 }, (_, i) => ({
  name: `Recording ${String(i + 1).padStart(2, "0")}`,
  site: sites[i % 3]!,
  sensor: sensors[(i * 5) % 7]!,
  task: tasks[i % 4]!,
}))

const keys = ["site", "sensor", "task"] as const
const names = { site: "Site", sensor: "Sensor", task: "Task" }
const values = { site: sites, sensor: sensors, task: tasks }

/** The facets with how many recordings have each value: the page counts, the facets show it. */
const facetsOf = (rows: Recording[]): Facet[] =>
  keys.map((key) => ({
    key,
    label: names[key],
    options: values[key].map((v) => ({ value: v, label: v, count: rows.filter((r) => r[key] === v).length })),
  }))

const filter = (rows: Recording[], picks: FacetValue) => rows.filter((r) => keys.every((k) => !picks[k]?.length || picks[k].includes(r[k])))

/**
 * Beside a list: the column from 1024 px, pinned while the list scrolls (here the box scrolls, as app-shell's page
 * does), and the drawer's button in the toolbar below that. Both take the same value.
 */
export const FacetsBesideList: S = {
  render: function Render() {
    const [picks, setPicks] = React.useState<FacetValue>({ site: ["Taipei HQ"] })
    const facets = facetsOf(recordings)
    const rows = filter(recordings, picks)
    return (
      <div className="h-96 w-full overflow-y-auto rounded-md bg-background p-4 ring-1 ring-border [--shell-top:0px]">
        <div className="flex gap-8">
          <Facets facets={facets} value={picks} onValueChange={setPicks} max={4} />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex items-center gap-2">
              <FacetsDrawer facets={facets} value={picks} onValueChange={setPicks} max={4} />
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {rows.length} of {recordings.length} recordings
              </p>
            </div>
            <ul className="flex flex-col divide-y divide-border rounded-md bg-card ring-1 ring-border">
              {rows.map((r) => (
                <li key={r.name} className="flex min-h-(--h-row) items-center justify-between gap-4 px-4 text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="truncate text-muted-foreground">
                    {r.sensor} · {r.site}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  },
}

/** Past `max`, "Show all N" unfolds the rest; a picked option stays in view while folded. */
export const FacetsShowAll: S = {
  render: () => (
    <div className="w-full max-w-xs">
      <FacetList facets={facetsOf(recordings)} max={4} defaultValue={{ sensor: ["Microphone"] }} />
    </div>
  ),
}

/** On phones: the button says how many options are on and opens the same list in a bottom sheet. */
export const FacetsOnPhones: S = {
  render: () => <FacetsDrawer facets={facetsOf(recordings)} max={4} defaultValue={{ sensor: ["LiDAR", "Radar"] }} className="lg:inline-flex" />,
}

/** The words from the zh-TW pack, counts grouped by the locale. */
export const FacetsZhTw: S = {
  render: () => (
    <div className="w-full max-w-xs">
      <FacetList
        facets={[{ key: "sensor", label: "感測器", options: sensors.map((s, i) => ({ value: s, label: s, count: 1200 * (7 - i) })) }]}
        max={4}
        locale="zh-TW"
        labels={facetsLabels}
      />
    </div>
  ),
}

/** The drawer open, for the visual tests. */
export const FacetsDrawerOpen: S = {
  render: () => <FacetsDrawer facets={facetsOf(recordings)} max={4} defaultOpen defaultValue={{ site: ["Hsinchu lab"] }} className="lg:inline-flex" />,
}
