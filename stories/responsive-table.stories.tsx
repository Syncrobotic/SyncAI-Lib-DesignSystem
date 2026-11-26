import type { Meta, StoryObj } from "@storybook/react-vite"
import { MapPin, Pencil, SearchX } from "lucide-react"
import { fn } from "storybook/test"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

const meta: Meta = { title: "Data/Responsive table" }
export default meta
type S = StoryObj

type Robot = { id: string; name: string; status: "active" | "normal" | "warning" | "danger"; state: string; site: string; battery: number; missions: number; seen: string }

const robots: Robot[] = [
  { id: "7f3a", name: "Patrol dog 7F3A", status: "active", state: "Patrolling", site: "North gate", battery: 82, missions: 1284, seen: "Now" },
  { id: "2b19", name: "Courier 2B19", status: "warning", state: "Low battery", site: "Hall B", battery: 12, missions: 9876, seen: "1 min ago" },
  { id: "4d21", name: "Courier 4D21", status: "danger", state: "Stopped", site: "Floor 3", battery: 64, missions: 135287, seen: "4 min ago" },
  { id: "9c44", name: "Patrol dog 9C44", status: "normal", state: "Charging", site: "Dock 2", battery: 47, missions: 312, seen: "Now" },
]

// One column list for both layouts: the name is the phone row's title, the state its trailing word, site and battery the
// line under the name; missions and last seen stay in the table.
const columns: ResponsiveTableColumn<Robot>[] = [
  { id: "name", header: "Robot", cell: (r) => r.name },
  { id: "status", header: "Status", cell: (r) => <InlineStatus status={r.status}>{r.state}</InlineStatus>, phone: "trailing", className: "w-44" },
  { id: "site", header: "Site", cell: (r) => r.site },
  {
    id: "battery",
    header: "Battery",
    cell: (r) => <Meter value={r.battery} low={15} label={`Battery, ${r.name}`} inline />,
    phoneCell: (r) => `${r.battery} %`,
    className: "w-48",
  },
  { id: "missions", header: "Missions", cell: (r) => formatCount(r.missions), align: "end", phone: "hidden" },
  { id: "seen", header: "Last seen", cell: (r) => r.seen, phone: "hidden" },
]

/** Wide: a table. Under 36rem of its own width (a phone): the same rows as a grouped list, name, state and two facts. */
export const ResponsiveTableFleet: S = {
  render: () => <ResponsiveTable label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} onRowClick={fn()} />,
}

/** A row's ⋯ menu: the table's last cell, the end of the phone row, outside the row's own button. */
export const ResponsiveTableWithActions: S = {
  render: () => (
    <ResponsiveTable
      label="Robots"
      rows={robots.slice(0, 3)}
      columns={columns.filter((c) => c.id !== "seen")}
      rowKey={(r) => r.id}
      rowActions={(r) => (
        <DropdownMenu modal={false}>
          <DropdownMenuMoreTrigger name={r.name} size="icon-sm" />
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <MapPin aria-hidden="true" /> Show on map
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil aria-hidden="true" /> Rename
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  ),
}

/** Its own width decides, not the screen's: in a narrow column on a wide screen the rows are a list too. */
export const ResponsiveTableNarrowColumn: S = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <SectionHeader title="Needs attention" count={2} />
      <ResponsiveTable label="Robots that need attention" rows={robots.filter((r) => r.status === "warning" || r.status === "danger")} columns={columns} rowKey={(r) => r.id} />
    </div>
  ),
}

/** No rows: an inline EmptyState, in the table's one spanning cell or in the list's surface. */
export const ResponsiveTableEmpty: S = {
  render: () => (
    <ResponsiveTable
      label="Robots"
      rows={[]}
      columns={columns}
      rowKey={(r) => r.id}
      empty={<EmptyState size="inline" icon={SearchX} title="No robots match" description="Clear the search to see the whole fleet." />}
    />
  ),
}
