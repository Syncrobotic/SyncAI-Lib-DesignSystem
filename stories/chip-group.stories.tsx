import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ChipGroup, type Chip } from "@/registry/syncrobotic/ui/chip-group"

const meta: Meta = { title: "Inputs/Chip group" }
export default meta
type S = StoryObj

const tasks: Chip[] = [
  { value: "detect", label: "Detection", count: 42 },
  { value: "segment", label: "Segmentation", count: 18 },
  { value: "pose", label: "Pose", count: 9 },
  { value: "depth", label: "Depth", count: 7 },
  { value: "track", label: "Tracking", count: 5 },
  { value: "ocr", label: "OCR", count: 3 },
  { value: "anomaly", label: "Anomaly", count: 2 },
]

function Facet({ initial, max }: { initial?: string; max?: number }) {
  const [v, setV] = React.useState<string | undefined>(initial)
  return <ChipGroup label="Task" items={tasks} value={v} onValueChange={setV} max={max} />
}

export const ChipGroupFacet: S = { render: () => <Facet initial="detect" /> }

export const ChipGroupFolded: S = { render: () => <Facet initial="ocr" max={4} /> }

export const ChipGroupSavedViews: S = {
  render: () => (
    <ChipGroup
      label="Saved views"
      value="night"
      items={[
        { value: "commercial", label: "Commercial only", href: "#tier=T0" },
        { value: "night", label: "Night shift", href: "#q=night" },
        { value: "review", label: "Needs review", href: "#status=review" },
      ]}
    />
  ),
}

export const ChipGroupLevels: S = {
  render: () => {
    function Levels() {
      const [v, setV] = React.useState<string | undefined>("blocking")
      return (
        <ChipGroup
          label="Level"
          allowNone={false}
          value={v}
          onValueChange={setV}
          items={[
            { value: "blocking", label: "Blocking", count: 3 },
            { value: "review", label: "Review", count: 11 },
            { value: "all", label: "All", count: 27 },
          ]}
        />
      )
    }
    return <Levels />
  },
}
