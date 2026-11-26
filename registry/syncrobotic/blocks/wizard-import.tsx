// @syncrobotic/wizard-import v0.32.0 · update: npx shadcn add @syncrobotic/wizard-import --overwrite
"use client"

import * as React from "react"
import { FileSpreadsheet } from "lucide-react"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Code } from "@/registry/syncrobotic/ui/code"
import { FileUpload } from "@/registry/syncrobotic/ui/file-upload"
import { PageHeader } from "@/registry/syncrobotic/ui/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Stepper, StepperItem } from "@/registry/syncrobotic/ui/stepper"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

// Sample data: a CSV of checkpoints, its columns, and the fields they map to.
const columns = ["cp_name", "x_m", "y_m", "dwell"]
const fields = [
  { key: "name", label: "Checkpoint name" },
  { key: "x", label: "X (metres)" },
  { key: "y", label: "Y (metres)" },
  { key: "wait", label: "Wait (seconds)" },
  { key: "skip", label: "Do not import" },
]
const guess: Record<string, string> = { cp_name: "name", x_m: "x", y_m: "y", dwell: "wait" }
const rows = [
  { name: "North gate", x: "12.0", y: "88.5", wait: "30", issue: "" },
  { name: "Car park east", x: "64.2", y: "71.0", wait: "20", issue: "" },
  { name: "Loading bay A", x: "102.7", y: "", wait: "45", issue: "Y is empty" },
  { name: "Server room door", x: "40.1", y: "12.3", wait: "60", issue: "" },
]

/**
 * Importing a file in three steps down the page: choose it, match its columns, check the rows. Each step opens under its
 * title and the steps before it stay readable. Rows with a problem are named, and you can import the rest.
 */
export function WizardImport({ onImport }: { onImport?: (count: number) => void }) {
  const [step, setStep] = React.useState(1)
  const [file, setFile] = React.useState<string | null>(null)
  const [map, setMap] = React.useState(guess)
  const [imported, setImported] = React.useState<number | null>(null)
  const whyId = React.useId()
  const good = rows.filter((r) => !r.issue).length
  const bad = rows.length - good

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <PageHeader title="Import checkpoints" description="Add checkpoints to the route Perimeter from a CSV file." className="pb-0" />
      <Stepper value={imported !== null ? 4 : step} onValueChange={setStep} navigable="done" orientation="vertical">
        <StepperItem title="Choose a file" description={file ?? "CSV, one checkpoint per row"}>
          <div className="flex flex-col gap-3">
            {/* Drop a file on it or choose one; it refuses another type or a bigger file before anything is read. */}
            <FileUpload
              accept=".csv,text/csv"
              multiple={false}
              maxSize={5 * 1024 * 1024}
              icon={FileSpreadsheet}
              title={file ?? "Drop a CSV file here or choose one"}
              hint="Up to 5 MB"
              onFiles={(files) => files[0] && setFile(files[0].name)}
            />
            {/* Sample only: lets the preview go on without a file of your own. */}
            {!file && (
              <Button variant="link" className="self-start" onClick={() => setFile("perimeter-checkpoints.csv")}>
                Use the sample file
              </Button>
            )}
            {/* Disabled says why, beside it and to screen readers. */}
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!file} aria-describedby={file ? undefined : whyId} onClick={() => setStep(2)}>
                Next
              </Button>
              {!file && (
                <span id={whyId} className="text-sm text-muted-foreground">
                  Choose a CSV file first
                </span>
              )}
            </div>
          </div>
        </StepperItem>
        {/* What the file holds is said once it has been read, never before there is a file. */}
        <StepperItem title="Match columns" description={file ? `${columns.length} columns found` : undefined}>
          <div className="flex flex-col gap-3">
            {columns.map((c) => (
              <div key={c} className="grid grid-cols-[8rem_1fr] items-center gap-3">
                <span className="text-sm">
                  <Code id={`col-${c}`}>{c}</Code>
                </span>
                <Select value={map[c]} onValueChange={(v) => setMap((m) => ({ ...m, [c]: v }))}>
                  <SelectTrigger aria-labelledby={`col-${c}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button className="self-start" onClick={() => setStep(3)}>
              Next
            </Button>
          </div>
        </StepperItem>
        <StepperItem title="Check and import" description={imported !== null ? `${imported} imported` : file ? `${rows.length} rows` : undefined}>
          <div className="flex flex-col gap-3">
            <p className="text-sm">{good} rows are ready.</p>
            {/* The problem is the warning shape and its words, never words in the warning colour. */}
            <p className="flex items-start gap-2 text-sm">
              <StatusGlyph status="warning" className="mt-1" />
              <span>{bad} row has a problem and will be skipped.</span>
            </p>
            {/* Table draws its own edge, scroll and fades; a second frame around it clipped or doubled them. */}
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">X</TableHead>
                  <TableHead className="text-right">Y</TableHead>
                  <TableHead>Problem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.x}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.y || "—"}</TableCell>
                    <TableCell className={r.issue ? undefined : "text-muted-foreground"}>
                      {r.issue ? (
                        <span className="flex items-center gap-2">
                          <StatusGlyph status="warning" />
                          {r.issue}
                        </span>
                      ) : (
                        "None"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              className="self-start"
              onClick={() => {
                setImported(good)
                onImport?.(good)
              }}
            >
              Import {good} checkpoints
            </Button>
          </div>
        </StepperItem>
      </Stepper>
      {imported !== null && (
        <p role="status" className="animate-appear text-sm">
          {imported} checkpoints added to Perimeter. The skipped row is in your file; fix it and import it on its own.
        </p>
      )}
    </div>
  )
}
