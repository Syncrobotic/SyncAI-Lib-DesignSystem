import type { Meta, StoryObj } from "@storybook/react-vite"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/syncrobotic/ui/card"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/syncrobotic/ui/collapsible"
import { Label } from "@/registry/syncrobotic/ui/label"

const meta: Meta = { title: "Navigation/Collapsible" }
export default meta
type S = StoryObj

const filters = ["Has ground truth", "Night shift only", "Reviewed in the last 7 days"]

/** One "More filters" trigger that opens one region; closed by default. The chevron turns up while it is open. */
export const CollapsibleMoreFilters: S = {
  render: () => (
    <Collapsible className="max-w-sm">
      <CollapsibleTrigger>More filters</CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1">
        {filters.map((f, i) => (
          <div key={f} className="flex min-h-(--h-sm) items-center gap-2">
            <Checkbox id={`filter-${i}`} />
            <Label htmlFor={`filter-${i}`}>{f}</Label>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  ),
}

/** Open from the start (`defaultOpen`): shown at once, with no animation on first paint. Inside a card, under its header. */
export const CollapsibleOpenInCard: S = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>forklift-aisles v3</CardTitle>
        <CardDescription>12,480 images from two warehouses, day and night shifts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>How to use this</CollapsibleTrigger>
          <CollapsibleContent className="text-sm text-muted-foreground">
            Import it with DVC, then train on the train split only. Validation and test stay untouched until the release check.
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  ),
}

/** A long note: its first line shows, the rest opens under it from Details. No heading needed. */
export const CollapsibleLongNote: S = {
  render: () => (
    <Collapsible className="flex max-w-md flex-col text-sm">
      <p>Night captures from Hall A were relabelled after the October review.</p>
      <CollapsibleContent className="text-muted-foreground">
        The first pass missed pallets stacked above 2 m and marked reflective tape as forks. 1,140 boxes were removed and 212
        added; the label set went from v6 to v7. Masks were not affected.
      </CollapsibleContent>
      <CollapsibleTrigger className="self-start">Details</CollapsibleTrigger>
    </Collapsible>
  ),
}
