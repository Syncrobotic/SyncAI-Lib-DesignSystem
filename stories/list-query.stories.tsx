import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { memoryAdapter, useListQuery } from "@/registry/syncrobotic/hooks/use-list-query"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { type ListPage, type ListQuery, pageRange, serializeListQuery } from "@/registry/syncrobotic/lib/list-query"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Code } from "@/registry/syncrobotic/ui/code"
import { DataState } from "@/registry/syncrobotic/ui/data-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

const meta: Meta = { title: "Hooks/List query" }
export default meta
type S = StoryObj

type Device = { id: string; name: string; site: string; online: boolean }
const sites = ["Hsinchu plant", "Taoyuan depot", "Tainan lab"]
const all: Device[] = Array.from({ length: 57 }, (_, i) => ({
  id: `d${i + 1}`,
  name: `Device ${String(i + 1).padStart(3, "0")}`,
  site: sites[i % 3]!,
  online: i % 5 !== 0,
}))

// A stand-in server: filters, sorts and pages, and says how many match in all.
function fetchDevices(q: ListQuery): ListPage<Device> {
  const found = all.filter((d) => !q.search || `${d.name} ${d.site}`.toLowerCase().includes(q.search.toLowerCase()))
  const key = (q.sortBy ?? "name") as "name" | "site"
  const sorted = [...found].sort((a, b) => a[key].localeCompare(b[key]) * (q.order === "desc" ? -1 : 1))
  return { items: sorted.slice((q.page - 1) * q.limit, q.page * q.limit), total: found.length }
}

/**
 * A server-paged table with its query in the URL (here a URL held in memory, shown under the table). Type to search:
 * the box answers at once, the URL when typing pauses, and the page goes back to 1. The count is the server's total.
 */
export const UseListQueryTable: S = {
  render: function Render() {
    const [adapter] = React.useState(() => memoryAdapter("?limit=8"))
    const list = useListQuery({ adapter, defaults: { limit: 8 }, sortable: ["name", "site"] })
    const { query } = list
    const page = fetchDevices(query)
    const { from, to } = pageRange(query, page.total)
    const sort = (col: string) => (query.sortBy === col || (!query.sortBy && col === "name") ? (query.order ?? "asc") : false)
    return (
      <div className="flex w-full max-w-xl flex-col gap-3">
        <Input type="search" aria-label="Search devices" placeholder="Search devices" value={list.search} onChange={(e) => list.setSearch(e.target.value)} />
        <p className="text-sm text-muted-foreground tabular-nums">
          {page.total ? `${formatCount(from)}–${formatCount(to)} of ${formatCount(page.total)} devices` : "No devices"}
        </p>
        <DataState state={page.total ? "ready" : "empty"} size="inline" empty={{ title: `No devices match “${query.search ?? ""}”` }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead sort={sort("name")} onSort={() => list.setSort("name")}>
                  Name
                </TableHead>
                <TableHead sort={sort("site")} onSort={() => list.setSort("site")}>
                  Site
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.site}</TableCell>
                  <TableCell>
                    <InlineStatus status={d.online ? "normal" : "offline"}>{d.online ? "Online" : "Offline"}</InlineStatus>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
        <Pagination page={query.page - 1} pageSize={query.limit} total={page.total} onPageChange={(p) => list.setPage(p + 1)} />
        <p className="text-xs text-muted-foreground">
          URL: <Code>?{adapter.current()}</Code> · request: <Code>?{serializeListQuery(query, { complete: true }).toString()}</Code>
        </p>
      </div>
    )
  },
}
