"use client"

import * as React from "react"
import Link from "next/link"
import { ResultBadge } from "@/registry/syncrobotic/ui/badge"
import { Label } from "@/registry/syncrobotic/ui/label"
import { SearchField } from "@/registry/syncrobotic/ui/search-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import type { AtId, Cell, MatrixRow, ManualStatus } from "./a11y-manual"
import { KeyCell } from "./key-cell"
import { Inline, textLink } from "./prose"

export type AtColumn = { id: AtId; label: string }

let request: Promise<MatrixRow[]> | null = null
const load = () => {
  request ??= fetch("/accessibility-matrix.json").then((r) => {
    if (!r.ok) throw new Error(`matrix: ${r.status}`)
    return r.json() as Promise<MatrixRow[]>
  })
  request.catch(() => (request = null))
  return request
}

const ALL = "all"
const statuses: ManualStatus[] = ["not tested", "pass", "fail"]

function Result({ cell }: { cell: Cell }) {
  if (cell.status === "not tested") return <ResultBadge result="insufficient">Not tested</ResultBadge>
  return <ResultBadge result={cell.status === "pass" ? "passed" : "failed"} />
}

/** Every stable component's tasks and results, filtered by component, group, assistive technology and status. */
export function ManualMatrix({ columns, groups }: { columns: AtColumn[]; groups: string[] }) {
  const [rows, setRows] = React.useState<MatrixRow[] | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [group, setGroup] = React.useState(ALL)
  const [at, setAt] = React.useState(ALL)
  const [status, setStatus] = React.useState(ALL)
  React.useEffect(() => {
    let live = true
    load().then(
      (r) => live && setRows(r),
      () => live && setFailed(true),
    )
    return () => {
      live = false
    }
  }, [])

  if (failed) return <p className="text-sm text-muted-foreground">The matrix did not load. Reload the page to try again.</p>
  if (!rows)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" delay={0} label="" /> Loading the matrix
      </p>
    )

  const q = query.trim().toLowerCase()
  const shownColumns = columns.filter((c) => at === ALL || c.id === at)
  const shown = rows
    .filter((r) => (!q || r.name.includes(q) || r.title.toLowerCase().includes(q)) && (group === ALL || r.group === group))
    .map((r) => ({ row: r, cells: shownColumns.filter((c) => status === ALL || r.cells[c.id].status === status) }))
    .filter((r) => r.cells.length > 0)
  const all = rows.flatMap((r) => columns.map((c) => r.cells[c.id].status))
  const tested = all.filter((s) => s !== "not tested").length

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm">
        {tested} of {all.length} cells tested ({rows.length} components × {columns.length} combinations): {all.filter((s) => s === "pass").length} pass,{" "}
        {all.filter((s) => s === "fail").length} fail.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          {/* The field's own label is read; this one lines it up with the selects beside it. */}
          <span aria-hidden="true" className="text-sm font-medium">
            Component
          </span>
          <SearchField label="Component" placeholder="Name" hotkey={null} value={query} onValueChange={setQuery} />
        </div>
        {(
          [
            ["m-group", "Group", group, setGroup, [[ALL, "All groups"], ...groups.map((g) => [g, g])]],
            ["m-at", "Assistive technology", at, setAt, [[ALL, "All combinations"], ...columns.map((c) => [c.id, c.label])]],
            ["m-status", "Status", status, setStatus, [[ALL, "Any status"], ...statuses.map((s) => [s, s[0].toUpperCase() + s.slice(1)])]],
          ] as [string, string, string, (v: string) => void, string[][]][]
        ).map(([id, label, value, set, options]) => (
          <div key={id} className="flex flex-col gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Select value={value} onValueChange={set}>
              <SelectTrigger id={id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {shown.length === rows.length ? `All ${rows.length} components` : `${shown.length} of ${rows.length} components`}
      </p>
      {shown.map(({ row: r, cells }) => (
        <section key={r.name} aria-labelledby={`m-${r.name}`} className="flex flex-col gap-4 rounded-md border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 id={`m-${r.name}`} className="text-base font-medium">
              <Link href={`/docs/components/${r.name}/accessibility`} className={textLink}>
                {r.title}
              </Link>
            </h3>
            <span className="text-xs text-muted-foreground">
              {r.group} · {r.version}
              {r.patterns.length > 0 && (
                <>
                  {" · WAI-ARIA "}
                  {r.patterns.map((p, i) => (
                    <React.Fragment key={p.href}>
                      {i > 0 && ", "}
                      <a href={p.href} className={textLink}>
                        {p.title}
                      </a>
                    </React.Fragment>
                  ))}
                </>
              )}
            </span>
          </div>
          {/* Task and expectation in two columns from 640 px; stacked on a phone. */}
          <ol aria-label={`Tasks for ${r.title}`} className="flex flex-col gap-2 text-sm [&>li]:grid [&>li]:gap-1 sm:[&>li]:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:[&>li]:gap-4">
            {r.steps.map((s, i) => (
              <li key={i}>
                <span>
                  {i + 1}. <KeyCell keys={s.task} />
                </span>
                <span className="text-muted-foreground">
                  <span className="sr-only">Expect: </span>
                  <Inline text={s.expect} />
                </span>
              </li>
            ))}
          </ol>
          <ul aria-label={`Results for ${r.title}`} className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {cells.map((c) => {
              const cell = r.cells[c.id]
              return (
                <li key={c.id} className="flex flex-col gap-1 rounded-sm bg-muted p-2">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    {c.label}
                    <Result cell={cell} />
                  </span>
                  {cell.status !== "not tested" && (
                    <span className="text-xs text-muted-foreground">
                      {cell.tester}, {cell.date}, {cell.version} · {cell.atVersion}
                      {cell.notes && <span className="block">{cell.notes}</span>}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
