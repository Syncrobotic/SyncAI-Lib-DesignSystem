import type { Meta, StoryObj } from "@storybook/react-vite"
import { barListLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { BarList, type BarListItem } from "@/registry/syncrobotic/ui/bar-list"
import { Card, CardContent, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

const meta: Meta = { title: "Charts/Bar list" }
export default meta
type S = StoryObj

const classes: BarListItem[] = [
  { key: "person", label: "person", value: 412345, href: "#classes/person" },
  { key: "pallet", label: "pallet", value: 268110, href: "#classes/pallet" },
  { key: "forklift", label: "forklift", value: 131902, href: "#classes/forklift" },
  { key: "shelf", label: "shelf", value: 88456, href: "#classes/shelf" },
  { key: "box", label: "box", value: 40213, href: "#classes/box" },
  { key: "cart", label: "hand cart", value: 12807, href: "#classes/cart" },
  { key: "helmet", label: "helmet", value: 6120, href: "#classes/helmet" },
  { key: "vest", label: "high-visibility vest", value: 2402, href: "#classes/vest" },
  { key: "sign", label: "floor sign", value: 911, href: "#classes/sign" },
  { key: "cone", label: "traffic cone", value: 37, href: "#classes/cone" },
]

/** In a card: the top classes of a dataset, each row a link to that class, the rest counted under the list. */
export const BarListInCard: S = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardDataHeader title="Items by class" />
      <CardContent>
        <BarList label="Items by class" items={classes} max={6} locale="en-US" />
      </CardContent>
    </Card>
  ),
}

const formats: BarListItem[] = [
  { key: "jpg", label: "JPEG", value: 1284000 },
  { key: "png", label: "PNG", value: 402500 },
  { key: "mcap", label: "MCAP recordings", value: 18400 },
  { key: "pcd", label: "Point clouds (PCD)", value: 9200 },
]

/** Without links, values shortened with `format` ({ notation: "compact" }): the numbers are in the text, so it needs no table view. */
export const BarListCompact: S = {
  render: () => (
    <div className="w-full max-w-xs">
      <BarList label="Files by format" items={formats} locale="en-US" format={{ notation: "compact", maximumFractionDigits: 1 }} />
    </div>
  ),
}

/** In a table cell: no surface of its own, so it sits in the row. */
export const BarListInTable: S = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dataset</TableHead>
          <TableHead>Top classes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="align-top font-medium">Forklift aisles v3</TableCell>
          <TableCell className="w-1/2 min-w-40">
            <BarList label="Top classes in Forklift aisles v3" items={classes.slice(0, 3).map((c) => ({ ...c, href: undefined }))} locale="en-US" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="align-top font-medium">Dock cameras v2</TableCell>
          <TableCell className="w-1/2 min-w-40">
            <BarList label="Top classes in Dock cameras v2" items={classes.slice(3, 6).map((c) => ({ ...c, href: undefined }))} locale="en-US" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

/** The words from the zh-TW pack, numbers grouped by the locale. */
export const BarListZhTw: S = {
  render: () => (
    <div className="w-full max-w-sm">
      <BarList label="各類別項目數" items={classes} max={4} locale="zh-TW" labels={barListLabels} />
    </div>
  ),
}

/** No items: it says so, in place of an empty list. */
export const BarListEmpty: S = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardDataHeader title="Items by class" />
      <CardContent>
        <BarList label="Items by class" items={[]} />
      </CardContent>
    </Card>
  ),
}
