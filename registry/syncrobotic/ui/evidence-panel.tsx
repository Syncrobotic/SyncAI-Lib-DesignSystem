// @syncrobotic/evidence-panel v0.56.0 · update: npx shadcn add @syncrobotic/evidence-panel --overwrite
"use client"

import * as React from "react"
import { CircleAlert, CircleCheck, CircleDashed, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"

/** A claim's value: one string, or a set (GPU UUIDs) compared without regard to order. */
export type EvidenceValue = string | string[] | null | undefined

export type EvidenceRow = {
  /** Stable key, and the row's name when `label` is not text. */
  id: string
  label: React.ReactNode
  /** What the device says. null or undefined: it did not say. */
  reported: EvidenceValue
  /** What the record expects. undefined: nothing to compare against, so no verdict. */
  expected?: EvidenceValue
  /** A caveat under the row ("Anyone with the project's slug can send this"). */
  hint?: React.ReactNode
  /** Monospace and broken anywhere: ids, fingerprints, versions. */
  mono?: boolean
  /** A copy button for the reported value (the one value a reviewer can check elsewhere). */
  copy?: boolean
  /** Your own comparison, e.g. case-insensitive; exact (as sets for lists) by default. */
  matches?: (reported: string[], expected: string[]) => boolean
}

/** match and mismatch compare two values; missing is a value the record expects and the device did not send. */
export type EvidenceVerdict = "match" | "mismatch" | "missing" | "unchecked"

const list = (v: EvidenceValue): string[] => (v === null || v === undefined ? [] : (Array.isArray(v) ? v : [v]).map((s) => s.trim()).filter(Boolean))

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i])

/** The verdict on one row: unchecked with nothing expected, missing when the device sent nothing, else match or mismatch. */
export function compareEvidence(row: Pick<EvidenceRow, "reported" | "expected" | "matches">): EvidenceVerdict {
  const expected = list(row.expected)
  if (row.expected === undefined || expected.length === 0) return "unchecked"
  const reported = list(row.reported)
  if (reported.length === 0) return "missing"
  return (row.matches ?? sameSet)(reported, expected) ? "match" : "mismatch"
}

export type EvidencePanelLabels = {
  /** The panel's heading: who said this. */
  source: string
  /** Under it: that nothing has checked it. */
  unverified: string
  field: string
  reported: string
  expected: string
  verdict: string
  match: string
  mismatch: string
  missing: string
  /** No value on record to compare with. */
  unchecked: string
  /** A value the device did not send. */
  notReported: string
  /** A value the record does not hold. */
  noRecord: string
  /** The count of rows that differ, above the rows. */
  summary: (mismatches: number, missing: number) => string
  copy: (field: string) => string
}

export const defaultEvidencePanelLabels: EvidencePanelLabels = {
  source: "Reported by the device",
  unverified: "Unverified: the device sent this about itself, and nothing has checked it. Weigh it; do not treat it as fact.",
  field: "Field",
  reported: "Device says",
  expected: "On record",
  verdict: "Check",
  match: "Matches",
  mismatch: "Does not match",
  missing: "Not reported",
  unchecked: "Nothing to compare",
  notReported: "Not reported",
  noRecord: "No record",
  summary: (mismatches, missing) =>
    [mismatches && `${mismatches} ${mismatches === 1 ? "value does" : "values do"} not match the record`, missing && `${missing} not reported`].filter(Boolean).join(", ") ||
    "Every value on record matches",
  copy: (field) => `Copy ${field}`,
}

const verdictIcon = { match: CircleCheck, mismatch: CircleAlert, missing: TriangleAlert } as const
// A match is the expected state: grey with a check, as a test pass. Only what a reviewer must weigh takes colour.
const verdictInk = { match: "text-muted-foreground", mismatch: "text-danger", missing: "text-warning" } as const

function Values({ values, mono, empty }: { values: string[]; mono?: boolean; empty: string }) {
  if (!values.length) return <span className="text-muted-foreground">{empty}</span>
  return (
    <ul className={cn("flex min-w-0 flex-col gap-1", mono && "font-mono text-xs break-all")}>
      {values.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  )
}

/**
 * Claims a device made about itself, framed and labelled by their source, beside the value on record, each marked as
 * matching, not matching or missing. For reviewing an enrolment; a claim is never shown as a fact.
 */
export function EvidencePanel({
  rows,
  meta,
  labels,
  headingAs: Heading = "h3",
  className,
}: {
  rows: EvidenceRow[]
  /** Where and when it came from, under the heading ("From 203.0.113.7 · first seen Nov 27, 2026, 14:02"). */
  meta?: React.ReactNode
  labels?: Partial<EvidencePanelLabels>
  /** The heading's level: h3 by default, h2 right under the page's h1, h4 under an h3. */
  headingAs?: "h2" | "h3" | "h4"
  className?: string
}) {
  const l = { ...defaultEvidencePanelLabels, ...labels }
  const headingId = React.useId()
  const verdicts = rows.map((r) => compareEvidence(r))
  const compared = verdicts.some((v) => v !== "unchecked")
  const mismatches = verdicts.filter((v) => v === "mismatch").length
  const missing = verdicts.filter((v) => v === "missing").length
  return (
    <section
      data-slot="evidence-panel"
      aria-labelledby={headingId}
      // Dashed: the frame of what is unverified, so it never reads as the record's own card beside it.
      className={cn("@container flex min-w-0 flex-col gap-4 rounded-md border border-dashed border-input p-4", className)}
    >
      <header className="flex flex-col gap-1">
        <Heading id={headingId} className="text-sm font-medium">
          {l.source}
        </Heading>
        <p className="text-xs text-muted-foreground">{l.unverified}</p>
        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
      </header>
      {compared && (
        <p data-slot="evidence-panel-summary" className={cn("flex items-center gap-2 text-sm", mismatches ? "text-danger" : missing ? "text-warning" : "text-muted-foreground")}>
          {(() => {
            const Icon = verdictIcon[mismatches ? "mismatch" : missing ? "missing" : "match"]
            return <Icon aria-hidden="true" className="size-4 shrink-0" />
          })()}
          {l.summary(mismatches, missing)}
        </p>
      )}
      <div role="table" aria-labelledby={headingId} className="flex flex-col">
        <div role="rowgroup" className="sr-only @xl:not-sr-only">
          <div role="row" className={cn("@xl:grid @xl:gap-4 @xl:border-b @xl:border-border @xl:pb-2 @xl:text-xs @xl:text-muted-foreground", compared ? "@xl:grid-cols-4" : "@xl:grid-cols-3")}>
            <span role="columnheader">{l.field}</span>
            <span role="columnheader" className={cn(!compared && "@xl:col-span-2")}>
              {l.reported}
            </span>
            {compared && <span role="columnheader">{l.expected}</span>}
            {compared && <span role="columnheader">{l.verdict}</span>}
          </div>
        </div>
        <div role="rowgroup" className="flex flex-col">
          {rows.map((r) => {
            const v = compareEvidence(r)
            const reported = list(r.reported)
            const name = typeof r.label === "string" ? r.label : r.id
            const Icon = v === "unchecked" ? null : verdictIcon[v]
            return (
              <div
                key={r.id}
                role="row"
                data-verdict={v}
                className={cn(
                  "grid gap-2 border-b border-border py-3 last:border-b-0 @xl:items-start @xl:gap-4",
                  compared ? "@xl:grid-cols-4" : "@xl:grid-cols-3",
                )}
              >
                <span role="rowheader" className="flex flex-col gap-1 text-xs text-muted-foreground @xl:text-sm @xl:text-foreground">
                  {r.label}
                  {r.hint && <span className="text-xs text-muted-foreground">{r.hint}</span>}
                </span>
                <span role="cell" className={cn("flex min-w-0 items-start gap-2 text-sm", !compared && "@xl:col-span-2")}>
                  <span aria-hidden="true" className="w-20 shrink-0 text-xs text-muted-foreground @xl:hidden">{l.reported}</span>
                  <Values values={reported} mono={r.mono} empty={l.notReported} />
                  {r.copy && reported.length > 0 && <CopyButton value={reported.join("\n")} label={l.copy(name)} className="-my-2 ml-auto shrink-0" />}
                </span>
                {compared && (
                  // A row with nothing on record keeps its cells for the table's columns; a phone shows only the claim.
                  <span role="cell" className={cn("flex min-w-0 items-start gap-2 text-sm", v === "unchecked" && "hidden @xl:flex")}>
                    <span aria-hidden="true" className="w-20 shrink-0 text-xs text-muted-foreground @xl:hidden">{l.expected}</span>
                    {r.expected === undefined ? <span className="text-muted-foreground">{l.noRecord}</span> : <Values values={list(r.expected)} mono={r.mono} empty={l.noRecord} />}
                  </span>
                )}
                {compared && (
                  <span role="cell" className={cn("flex items-center gap-2 text-sm", v === "unchecked" ? "hidden text-muted-foreground @xl:flex" : verdictInk[v])}>
                    {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : <CircleDashed aria-hidden="true" className="size-4 shrink-0" />}
                    {v === "unchecked" ? l.unchecked : l[v]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
