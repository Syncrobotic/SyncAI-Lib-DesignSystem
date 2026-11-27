// @syncrobotic/offline-licence v0.57.0 · update: npx shadcn add @syncrobotic/offline-licence --overwrite
"use client"

import * as React from "react"
import { Download, FileKey, Plus, Server } from "lucide-react"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatAbsolute, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { AppShell, sampleUser, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { AllOrSomeField, type AllOrSomeFieldLabels, type AllOrSomeOption } from "@/registry/syncrobotic/ui/all-or-some-field"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { CodeBlock } from "@/registry/syncrobotic/ui/code-block"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { DesiredState, type DesiredStateLabels } from "@/registry/syncrobotic/ui/desired-state"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger, DropdownMenuSeparator } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

export type OfflineLicenceDevice = { id: string; name: string; connectivity: "air-gapped" | "connected" }

/** A licence on the server's books. `modules: null` is every module, including future ones. */
export type IssuedLicence = {
  id: string
  modules: readonly string[] | null
  issuedAt: DateInput
  expiresAt?: DateInput | null
  state: "active" | "expired" | "revoked"
  /** How far it got out of the server: issued, or downloaded at least once. Neither means the device applied it. */
  delivery?: "issued" | "downloaded"
}

/** A signed file to carry to the device. */
export type LicenceFile = { blob: string; fileName: string }

/** An order waiting on the device: a new licence, or a revocation, until it is known to be applied. */
export type LicenceOrder = { desired: string; reported: string; orderedAt: DateInput; inEffect?: boolean }

export type OfflineLicenceLabels = {
  title: string
  description: string
  issue: string
  issueTitle: string
  modules: string
  modulesHint: string
  /** Under a module the project is not entitled to. */
  notEntitled: string
  allNotEntitled: string
  expiry: string
  days: (days: number) => string
  never: string
  sign: string
  cancel: string
  handoffTitle: (device: string) => string
  handoffBody: string
  /** The rule this block exists for. */
  notApplied: string
  notAppliedBody: string
  file: string
  qr: string
  download: string
  copy: string
  done: string
  allModules: string
  issued: string
  expires: string
  state: string
  states: Record<IssuedLicence["state"], string>
  downloaded: string
  notDownloaded: string
  noExpiry: string
  renew: string
  revoke: string
  revokeTitle: string
  revokeBody: (airGapped: boolean) => string
  revokeConfirm: string
  keep: string
  actionsColumn: string
  /** The row menu's name: "More actions for {name}". */
  more: (modules: string) => string
  empty: string
  emptyBody: string
  denied: string
  failed: string
  errors: Record<string, string>
  field?: Partial<AllOrSomeFieldLabels>
  desired?: Partial<DesiredStateLabels>
  data?: Partial<DataStateLabels>
}

export const defaultOfflineLicenceLabels: OfflineLicenceLabels = {
  title: "Licences",
  description: "Sign a licence here and carry it to the device: an air-gapped device never checks in to fetch one.",
  issue: "Issue licence",
  issueTitle: "New licence",
  modules: "Modules",
  modulesHint: "What the device may run while the licence lasts.",
  notEntitled: "This project is not licensed for it.",
  allNotEntitled: "This project is licensed for some modules only, so a licence cannot cover future ones.",
  expiry: "Expires",
  days: (d) => (d % 365 === 0 ? `${d / 365} ${d === 365 ? "year" : "years"}` : `${d} days`),
  never: "Never",
  sign: "Sign licence",
  cancel: "Cancel",
  handoffTitle: (device) => `Carry this file to ${device}`,
  handoffBody: "Download it, or show the QR code to the device's camera, then import it on the device.",
  notApplied: "Downloading is not applying",
  notAppliedBody: "The device keeps what it runs now until someone imports this file on it. This page cannot see that happen.",
  file: "File",
  qr: "QR code",
  download: "Download file",
  copy: "Copy the licence",
  done: "Done",
  allModules: "All modules, including future ones",
  issued: "Issued",
  expires: "Expires",
  state: "State",
  states: { active: "Active", expired: "Expired", revoked: "Revoked" },
  downloaded: "Downloaded",
  notDownloaded: "Not downloaded yet",
  noExpiry: "Does not expire",
  renew: "Renew…",
  revoke: "Revoke…",
  revokeTitle: "Revoke this licence?",
  revokeBody: (airGapped) =>
    airGapped
      ? "The server stops honouring it now. The device cannot hear that: it keeps running these modules until the revocation file is imported on it, or the licence expires."
      : "The revocation travels on the device's next check-in. Until it reports back, treat the modules as still running.",
  revokeConfirm: "Revoke licence",
  keep: "Keep it",
  actionsColumn: "Actions",
  more: (modules) => `More actions for the licence of ${modules}`,
  empty: "No licence yet",
  emptyBody: "Sign one to open the device's modules.",
  denied: "You need the devices:write permission. A project admin can grant it.",
  failed: "That did not work. Nothing was signed; try again.",
  errors: {},
}

/** Saves a signed file through the browser, without a round trip that could log it again. */
function saveFile(file: LicenceFile) {
  if (typeof URL.createObjectURL !== "function") return
  const url = URL.createObjectURL(new Blob([file.blob], { type: "application/octet-stream" }))
  const a = document.createElement("a")
  a.href = url
  a.download = file.fileName
  a.click()
  URL.revokeObjectURL(url)
}

export type OfflineLicenceContentProps = {
  device: OfflineLicenceDevice
  /** Every module a licence can hold. */
  modules: readonly AllOrSomeOption[]
  /** The project's entitlement: `null` is all, including future ones. A module outside it shows disabled with the reason. */
  entitled?: readonly string[] | null
  /** Newest first. */
  licences: readonly IssuedLicence[]
  /** A licence or a revocation not yet known to be applied: pending, never "in effect". */
  order?: LicenceOrder | null
  expiryOptions?: readonly (number | null)[]
  defaultExpiry?: number | null
  /** Signs a licence; resolves with the file. Run it through your step-up. */
  onIssue?: (licence: { modules: string[] | null; expiresAt: string | null }) => Promise<LicenceFile>
  onRenew?: (licence: IssuedLicence) => Promise<LicenceFile>
  /** Resolves with a revocation file to carry when the device is air-gapped. */
  onRevoke?: (licence: IssuedLicence) => Promise<LicenceFile | void>
  /** The file was saved: record "downloaded", never "applied". */
  onDownloaded?: (file: LicenceFile) => void
  /** Your QR encoder, for a file small enough for one code; return null when it is too large. */
  renderQr?: (blob: string) => React.ReactNode
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  headingLevel?: 2 | 3
  now?: number
  locale?: string
  timeZone?: string
  labels?: Partial<OfflineLicenceLabels>
}

/**
 * A device's module licences, signed here and carried to it: issue, renew and revoke, the signed file as a download
 * or a QR code that says downloading is not applying, and an order shown as pending until the device has it.
 */
export function OfflineLicenceContent({
  device,
  modules,
  entitled = null,
  licences,
  order,
  expiryOptions = [30, 90, 365, null],
  defaultExpiry = 365,
  onIssue,
  onRenew,
  onRevoke,
  onDownloaded,
  renderQr,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  headingLevel = 2,
  now,
  locale,
  timeZone,
  labels,
}: OfflineLicenceContentProps) {
  const l = { ...defaultOfflineLicenceLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "devices:write") : true
  const airGapped = device.connectivity === "air-gapped"
  const [clock] = React.useState(() => Date.now())
  const at = now ?? clock
  const [creating, setCreating] = React.useState(false)
  const [picked, setPicked] = React.useState<string[] | null>(() => (entitled === null ? null : [...entitled]))
  const [expiry, setExpiry] = React.useState(String(defaultExpiry))
  const [busy, setBusy] = React.useState(false)
  const [failure, setFailure] = React.useState<string | null>(null)
  // The signed file lives only here, only until Done: it is the licence itself.
  const [file, setFile] = React.useState<LicenceFile | null>(null)
  const [view, setView] = React.useState<"file" | "qr">("file")
  const [revoking, setRevoking] = React.useState<IssuedLicence | null>(null)
  const date = (d: DateInput) => formatAbsolute(d, { locale, timeZone, precision: "date" })
  const name = (m: readonly string[] | null) => (m === null ? l.allModules : m.map((v) => modules.find((o) => o.value === v)?.label ?? v).join(", "))
  const options = modules.map((m) => (entitled === null || entitled.includes(m.value) ? m : { ...m, disabled: true, reason: l.notEntitled }))

  const run = async (fn: () => Promise<LicenceFile | void>) => {
    setBusy(true)
    setFailure(null)
    try {
      const out = await fn()
      if (out) {
        setView("file")
        setFile(out)
      }
      setCreating(false)
      setRevoking(null)
    } catch (e) {
      // A cancelled step-up signed nothing: the form stays as it was, with nothing to say.
      if (!isStepUpCancelled(e)) setFailure(l.errors[errorCodeOf(e) ?? ""] ?? l.failed)
    } finally {
      setBusy(false)
    }
  }
  const sign = () =>
    onIssue && run(() => onIssue({ modules: picked, expiresAt: expiry === "null" ? null : new Date(at + Number(expiry) * 86_400_000).toISOString() }))
  const qr = file && renderQr ? renderQr(file.blob) : null

  const issueButton = onIssue && !creating && !file && (mayWrite || denied === "disabled") && (
    <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied}>
      <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
        <Plus aria-hidden="true" />
        {l.issue}
      </Button>
    </PermissionGate>
  )
  const Heading = headingLevel === 2 ? "h2" : "h3"

  return (
    <section aria-labelledby={`offline-licence-${device.id}`} data-slot="offline-licence" className="flex flex-col gap-4">
      <SectionHeader id={`offline-licence-${device.id}`} as={Heading} title={l.title} description={l.description} actions={state === "ready" || state === "stale" ? issueButton : undefined} />

      {order && (
        <DesiredState
          desired={order.desired}
          reported={order.reported}
          orderedAt={order.orderedAt}
          inEffect={order.inEffect}
          airGapped={airGapped}
          now={at}
          locale={locale}
          timeZone={timeZone}
          labels={l.desired}
          headingAs={headingLevel === 2 ? "h3" : "h4"}
        />
      )}

      {creating && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void sign()
          }}
          className="flex animate-appear flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border"
          aria-label={l.issueTitle}
        >
          <AllOrSomeField
            legend={l.modules}
            hint={l.modulesHint}
            options={options}
            value={picked}
            onValueChange={setPicked}
            allDisabledReason={entitled === null ? undefined : l.allNotEntitled}
            labels={l.field}
          />
          <Field label={l.expiry}>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expiryOptions.map((d) => (
                  <SelectItem key={String(d)} value={String(d)}>
                    {d === null ? l.never : l.days(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {failure && (
            <p role="alert" className="text-sm text-danger">
              {failure}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" loading={busy} disabled={picked !== null && picked.length === 0}>
              {l.sign}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              {l.cancel}
            </Button>
          </div>
        </form>
      )}

      {file && (
        <div role="status" data-slot="offline-licence-handoff" className="flex animate-appear flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{l.handoffTitle(device.name)}</span>
            <span className="text-sm text-muted-foreground">{l.handoffBody}</span>
          </div>
          <Alert>
            <FileKey aria-hidden="true" />
            <AlertTitle>{l.notApplied}</AlertTitle>
            <AlertDescription>{l.notAppliedBody}</AlertDescription>
          </Alert>
          {qr && (
            <SegmentedControl value={view} onValueChange={(v) => v && setView(v as "file" | "qr")} aria-label={l.handoffTitle(device.name)} className="sm:w-auto sm:self-start">
              <SegmentedControlItem value="file">{l.file}</SegmentedControlItem>
              <SegmentedControlItem value="qr">{l.qr}</SegmentedControlItem>
            </SegmentedControl>
          )}
          {view === "qr" && qr ? (
            <div data-slot="offline-licence-qr" className="flex justify-center rounded-md bg-background p-4 ring-1 ring-border">
              {qr}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <CodeBlock code={file.blob} title={file.fileName} wrap="words" copyLabel={l.copy} />
              <Button
                variant="secondary"
                className="self-start"
                onClick={() => {
                  saveFile(file)
                  onDownloaded?.(file)
                }}
              >
                <Download aria-hidden="true" />
                {l.download}
              </Button>
            </div>
          )}
          <Button variant="ghost" className="self-start" onClick={() => setFile(null)}>
            {l.done}
          </Button>
        </div>
      )}

      {!creating && failure && (
        <p role="alert" className="text-sm text-danger">
          {failure}
        </p>
      )}

      <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
        <Card className="gap-0 p-0">
          {licences.length === 0 ? (
            <EmptyState size="inline" icon={FileKey} title={l.empty} description={l.emptyBody} />
          ) : (
            <Table bare aria-label={l.title}>
              <TableHeader>
                <TableRow>
                  <TableHead>{l.modules}</TableHead>
                  <TableHead className="hidden md:table-cell">{l.issued}</TableHead>
                  <TableHead className="hidden sm:table-cell">{l.expires}</TableHead>
                  <TableHead>{l.state}</TableHead>
                  <TableHead className="w-0">
                    <span className="sr-only">{l.actionsColumn}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licences.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="whitespace-normal">
                      {name(x.modules)}
                      <span className="block text-xs text-muted-foreground sm:hidden">{x.expiresAt ? `${l.expires} ${date(x.expiresAt)}` : l.noExpiry}</span>
                    </TableCell>
                    <TableCell className="hidden tabular-nums md:table-cell">{date(x.issuedAt)}</TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{x.expiresAt ? date(x.expiresAt) : l.noExpiry}</TableCell>
                    <TableCell className="whitespace-normal">
                      {/* The server's books, grey in every state: whether the device has it is the order's to say. */}
                      <InlineStatus status={x.state === "active" ? "normal" : "offline"}>{l.states[x.state]}</InlineStatus>
                      {x.state === "active" && x.delivery && (
                        <span className="block text-xs text-muted-foreground">{x.delivery === "downloaded" ? l.downloaded : l.notDownloaded}</span>
                      )}
                    </TableCell>
                    <TableActionsCell>
                      {x.state !== "revoked" && (onRenew || onRevoke) && (mayWrite || denied === "disabled") && (
                        <DropdownMenu>
                          <DropdownMenuMoreTrigger aria-label={l.more(name(x.modules))} size="icon-sm" />
                          <DropdownMenuContent align="end">
                            {onRenew && (
                              <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied} className={mayWrite ? undefined : "text-disabled"}>
                                <DropdownMenuItem onSelect={() => void run(() => onRenew(x))}>{l.renew}</DropdownMenuItem>
                              </PermissionGate>
                            )}
                            {onRevoke && x.state === "active" && (
                              <>
                                <DropdownMenuSeparator />
                                <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied} className={mayWrite ? undefined : "text-disabled"}>
                                  <DropdownMenuItem destructive onSelect={() => setRevoking(x)}>
                                    {l.revoke}
                                  </DropdownMenuItem>
                                </PermissionGate>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </DataState>

      <AlertDialog open={revoking !== null} onOpenChange={(o) => !o && !busy && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{l.revokeTitle}</AlertDialogTitle>
            <AlertDialogDescription>{l.revokeBody(airGapped)}</AlertDialogDescription>
          </AlertDialogHeader>
          {failure && (
            <p role="alert" className="text-sm text-danger">
              {failure}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{l.keep}</AlertDialogCancel>
            <Button variant="destructive" loading={busy} onClick={() => revoking && onRevoke && void run(() => onRevoke(revoking))}>
              {l.revokeConfirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

// ---------- Sample ----------

const sampleAt = Date.parse("2026-11-27T06:00:00Z")
const DAY = 86_400_000

export const sampleLicenceModules: AllOrSomeOption[] = [
  { value: "vision", label: "Vision" },
  { value: "speech", label: "Speech" },
  { value: "search", label: "Search" },
  { value: "agents", label: "Agents" },
  { value: "fine-tuning", label: "Fine-tuning" },
]

export const sampleOfflineLicences: IssuedLicence[] = [
  { id: "lic_2", modules: ["vision", "search"], issuedAt: sampleAt - 3 * DAY, expiresAt: sampleAt + 362 * DAY, state: "active", delivery: "downloaded" },
  { id: "lic_1", modules: ["vision"], issuedAt: sampleAt - 200 * DAY, expiresAt: sampleAt - 3 * DAY, state: "expired" },
]

const nav: AppNavGroup[] = [{ items: [{ label: "Devices", href: "#devices", icon: Server }] }]

// The sample's stand-in for a signed file: a real one comes from your API, once, in the issue response.
const fakeBlob = (seed: string) => `LMLIC1.${btoa(seed).replace(/=+$/, "")}.eyJhbGciOiJFZERTQSJ9.${"Q2x2ZW5kb3Jfa2V5XzIwMjZh".repeat(3)}`

/**
 * A device's module licences, signed here and carried to it: issue, renew and revoke, the signed file as a download
 * or a QR code that says downloading is not applying. This is OfflineLicenceContent on sample data, in a sample shell.
 */
export function OfflineLicence() {
  const [licences, setLicences] = React.useState(sampleOfflineLicences)
  const [order, setOrder] = React.useState<LicenceOrder | null>(null)
  const issue = (modules: readonly string[] | null, expiresAt: string | null): LicenceFile => {
    const id = `lic_${licences.length + 1}`
    setLicences((all) => [{ id, modules, issuedAt: sampleAt, expiresAt, state: "active", delivery: "issued" }, ...all])
    setOrder({ desired: `Licence ${id}`, reported: "Running its previous licence", orderedAt: sampleAt })
    return { blob: fakeBlob(id), fileName: `hsinchu-lab-4-${id}.lic` }
  }
  return (
    <AppShell product="Device console" nav={nav} current="#devices" title="Hsinchu lab 4" user={sampleUser}>
      <div className="flex max-w-5xl flex-col gap-4">
        <OfflineLicenceContent
          device={{ id: "d4", name: "Hsinchu lab 4", connectivity: "air-gapped" }}
          modules={sampleLicenceModules}
          entitled={["vision", "speech", "search", "agents"]}
          licences={licences}
          order={order}
          now={sampleAt}
          timeZone="Asia/Taipei"
          onIssue={async ({ modules, expiresAt }) => issue(modules, expiresAt)}
          onRenew={async (x) => issue(x.modules, new Date(sampleAt + 365 * DAY).toISOString())}
          onRevoke={async (x) => {
            setLicences((all) => all.map((y) => (y.id === x.id ? { ...y, state: "revoked" } : y)))
            setOrder({ desired: `Licence ${x.id} revoked`, reported: "Running it", orderedAt: sampleAt })
            return { blob: fakeBlob(`revoke-${x.id}`), fileName: `hsinchu-lab-4-revoke-${x.id}.lic` }
          }}
          onDownloaded={() => setLicences((all) => all.map((y, i) => (i === 0 ? { ...y, delivery: "downloaded" } : y)))}
        />
      </div>
    </AppShell>
  )
}
