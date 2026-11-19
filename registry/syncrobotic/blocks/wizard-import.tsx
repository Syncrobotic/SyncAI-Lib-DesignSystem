// @syncrobotic/wizard-import v0.9.0 · update: npx shadcn add @syncrobotic/wizard-import --overwrite
"use client"

import * as React from "react"
import { FileSpreadsheet } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
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
  const good = rows.filter((r) => !r.issue).length
  const bad = rows.length - good

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Import checkpoints</h1>
        <p className="text-sm text-muted-foreground">Add checkpoints to the route Perimeter from a CSV file.</p>
      </div>
      <Stepper value={imported !== null ? 4 : step} onValueChange={setStep} navigable="done" orientation="vertical">
        <StepperItem title="Choose a file" description={file ?? "CSV, one checkpoint per row"}>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setFile("perimeter-checkpoints.csv")}
              className="press flex flex-col items-center gap-2 rounded-md p-6 text-sm ring-1 ring-border ring-dashed hover:bg-accent"
            >
              <FileSpreadsheet aria-hidden="true" className="size-6 text-muted-foreground" />
              {file ? <span className="font-medium">{file}</span> : <span>Choose a CSV file</span>}
              <span className="text-xs text-muted-foreground">Up to 5 MB</span>
            </button>
            <Button className="self-start" disabled={!file} onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        </StepperItem>
        <StepperItem title="Match columns" description="4 columns found">
          <div className="flex flex-col gap-3">
            {columns.map((c) => (
              <div key={c} className="grid grid-cols-[8rem_1fr] items-center gap-3">
                <code id={`col-${c}`} className="font-mono text-sm">
                  {c}
                </code>
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
        <StepperItem title="Check and import" description={imported !== null ? `${imported} imported` : `${rows.length} rows`}>
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              {good} rows are ready. <span className="text-warning">{bad} row has a problem and will be skipped.</span>
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
                    <TableCell className={r.issue ? "text-warning" : "text-muted-foreground"}>{r.issue || "None"}</TableCell>
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
