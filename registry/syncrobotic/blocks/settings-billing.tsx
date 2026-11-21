// @syncrobotic/settings-billing v0.21.0 · update: npx shadcn add @syncrobotic/settings-billing --overwrite
"use client"

import * as React from "react"
import { CircleAlert, CircleCheck, Clock, CreditCard, Download, FileText, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

export type InvoiceStatus = "paid" | "due" | "overdue"

export type Invoice = {
  id: string
  /** The number printed on the invoice, e.g. "INV-2026-0147". */
  number: string
  /** Issue date, ISO 8601 (YYYY-MM-DD). */
  date: string
  /** Payment due date, ISO 8601; shown for due and overdue invoices. */
  dueDate?: string
  /** In the currency's major unit (dollars, not cents). */
  amount: number
  status: InvoiceStatus
  pdfHref: string
}

/** Something the plan includes a fixed number of: robots, seats. Past `included`, each one is billed extra. */
export type Allowance = { label: string; used: number; included: number; unit: string; /** What one more costs. */ overage?: number }

/** Something metered over the billing period: robot-hours, storage. `included` gives it a Meter. */
export type Usage = { label: string; used: number; included?: number; unit: string }

export type BillingAccount = {
  plan: { name: string; price: number; interval: "month" | "year"; renewsOn: string }
  allowances: Allowance[]
  period: { start: string; end: string }
  usage: Usage[]
  /** Brand and last four digits only: the card itself stays with your payment provider. */
  payment?: { brand: string; last4: string; expires: string }
  invoices: Invoice[]
}

export const sampleBilling: BillingAccount = {
  plan: { name: "Fleet Pro", price: 1490, interval: "month", renewsOn: "2026-12-01" },
  allowances: [
    { label: "Robots", used: 46, included: 50, unit: "robots", overage: 35 },
    { label: "Console seats", used: 12, included: 20, unit: "seats", overage: 15 },
  ],
  period: { start: "2026-11-01", end: "2026-11-30" },
  usage: [
    { label: "Robot-hours", used: 1842, included: 2400, unit: "h" },
    { label: "Video and map storage", used: 3.2, included: 5, unit: "TB" },
    { label: "Mission data uploaded", used: 412, unit: "GB" },
  ],
  payment: { brand: "Visa", last4: "4242", expires: "08/2028" },
  invoices: [
    { id: "i5", number: "INV-2026-0147", date: "2026-11-01", dueDate: "2026-12-01", amount: 1595, status: "due", pdfHref: "#invoices/INV-2026-0147.pdf" },
    { id: "i4", number: "INV-2026-0131", date: "2026-10-01", dueDate: "2026-11-01", amount: 1490, status: "overdue", pdfHref: "#invoices/INV-2026-0131.pdf" },
    { id: "i3", number: "INV-2026-0118", date: "2026-09-01", dueDate: "2026-10-01", amount: 1490, status: "paid", pdfHref: "#invoices/INV-2026-0118.pdf" },
    { id: "i2", number: "INV-2026-0102", date: "2026-08-01", dueDate: "2026-09-01", amount: 1385, status: "paid", pdfHref: "#invoices/INV-2026-0102.pdf" },
  ],
}

/** The same account billed in New Taiwan dollars. */
export const sampleBillingTwd: BillingAccount = {
  ...sampleBilling,
  plan: { ...sampleBilling.plan, price: 45000 },
  allowances: sampleBilling.allowances.map((a) => ({ ...a, overage: (a.overage ?? 0) * 30 })),
  invoices: sampleBilling.invoices.map((i) => ({ ...i, amount: Math.round(i.amount * 30.2) })),
}

/** Money in the account's currency, by Intl: "US$1,490.00", "NT$45,000.00". */
export const formatMoney = (amount: number, currency: string, locale = "en-GB") => new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)

// Dates are calendar days, not instants: formatted in UTC so "1 Dec" is 1 Dec for every reader, server and browser alike.
const formatDate = (iso: string, locale: string) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
// Two whole dates, not Intl's formatRange: its spacing differs between Node and browsers, which breaks hydration.
const formatRange = (start: string, end: string, locale: string) => `${formatDate(start, locale)} – ${formatDate(end, locale)}`

/**
 * The words, icon and colour of an invoice's status. Paid is a calm, lasting state: grey with a check. Due is plain text
 * with a clock. Overdue needs someone: danger text with an alert icon, never a filled red.
 */
export const invoiceStatus = {
  paid: { label: "Paid", icon: CircleCheck, className: "text-muted-foreground" },
  due: { label: "Due", icon: Clock, className: "text-foreground" },
  overdue: { label: "Overdue", icon: CircleAlert, className: "font-medium text-danger" },
} as const

/** The status as it reads in the table: "Paid", "Due 1 Dec 2026", "Overdue since 1 Nov 2026". */
export function invoiceStatusText(invoice: Invoice, locale = "en-GB") {
  const due = invoice.dueDate && formatDate(invoice.dueDate, locale)
  if (invoice.status === "paid" || !due) return invoiceStatus[invoice.status].label
  return invoice.status === "due" ? `Due ${due}` : `Overdue since ${due}`
}

function StatusText({ invoice, locale }: { invoice: Invoice; locale: string }) {
  const s = invoiceStatus[invoice.status]
  return (
    <span data-status={invoice.status} className={cn("flex items-center gap-2 text-sm", s.className)}>
      <s.icon aria-hidden="true" className="size-4 shrink-0" />
      {invoiceStatusText(invoice, locale)}
    </span>
  )
}

function Subsection({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  const id = React.useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={id} className="font-bold">
          {title}
        </h3>
        {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

type SettingsBillingProps = {
  /** Defaults to the sample. */
  account?: BillingAccount
  /** ISO 4217 code every amount is in, e.g. "USD", "TWD". */
  currency?: string
  /** Formats money and dates (Intl). */
  locale?: string
  /** "loading" until the first answer; "error" when it failed. */
  status?: "ready" | "loading" | "error"
  onRetry?: () => void
  /** Go to your plan picker. */
  onChangePlan?: () => void
  /** Called after the confirmation; tell your billing provider. */
  onCancelPlan?: () => void
  /** Called when a cancelled plan is kept after all. */
  onKeepPlan?: () => void
  /** Open your payment provider's hosted page; this block never takes card details. */
  onUpdatePayment?: () => void
  linkAs?: React.ElementType
}

/**
 * Plan and billing for a fleet: the plan and when it renews, robots and seats used against what it includes, this
 * period's usage, the card on file (brand and last four only) and the invoices, each with its PDF. Meters stay grey
 * until a limit is near. Overdue is the only thing in colour. Cancelling asks first and says what stops.
 *
 * No checkout and no card form: changing the card or the plan hands over to your payment provider's own pages
 * (`onUpdatePayment`, `onChangePlan`). Card numbers never pass through the console.
 */
export function SettingsBilling({
  account = sampleBilling,
  currency = "USD",
  locale = "en-GB",
  status = "ready",
  onRetry,
  onChangePlan,
  onCancelPlan,
  onKeepPlan,
  onUpdatePayment,
  linkAs: Link = "a",
}: SettingsBillingProps) {
  const [cancelled, setCancelled] = React.useState(false)
  const money = (n: number) => formatMoney(n, currency, locale)
  const { plan, allowances, period, usage, payment, invoices } = account
  const overdue = invoices.filter((i) => i.status === "overdue")

  const header = (
    <div className="flex flex-col gap-1">
      <h2 id="billing-title" className="text-lg font-bold">
        Plan and billing
      </h2>
      <p className="text-sm text-muted-foreground">What your organisation pays for, what it has used this period, and its invoices.</p>
    </div>
  )

  if (status === "loading")
    return (
      <section aria-labelledby="billing-title" aria-busy="true" className="flex flex-col gap-4">
        {header}
        <LoadingLine>Loading plan and invoices</LoadingLine>
        <Card>
          <Bone className="h-6 w-40" />
          <Bone className="h-4 w-56" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Bone className="h-10" />
            <Bone className="h-10" />
          </div>
        </Card>
        <Card>
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-4" />
          ))}
        </Card>
      </section>
    )

  if (status === "error")
    return (
      <section aria-labelledby="billing-title" className="flex flex-col gap-4">
        {header}
        <Card>
          <EmptyState
            icon={CircleAlert}
            title="Billing did not load"
            description="Your robots and plan are not affected. Try again, or come back in a few minutes."
            action={
              onRetry && (
                <Button variant="secondary" onClick={onRetry}>
                  <RotateCw aria-hidden="true" />
                  Try again
                </Button>
              )
            }
          />
        </Card>
      </section>
    )

  return (
    <section aria-labelledby="billing-title" className="flex flex-col gap-4">
      {header}

      {overdue.length > 0 && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>
            {overdue.length === 1 ? `Invoice ${overdue[0]!.number} is overdue` : `${overdue.length} invoices are overdue`}
          </AlertTitle>
          <AlertDescription>Robots keep working on site. Settle it to keep reports and video syncing to the cloud; the PDF has the payment details.</AlertDescription>
        </Alert>
      )}

      <Card className="gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Current plan</span>
            <span className="text-2xl font-bold">{plan.name}</span>
            <span className="text-sm tabular-nums">
              {money(plan.price)} a {plan.interval}
            </span>
            <span role="status" className="text-sm text-muted-foreground">
              {cancelled ? `Cancelled. Ends on ${formatDate(plan.renewsOn, locale)}` : `Renews on ${formatDate(plan.renewsOn, locale)}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cancelled ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setCancelled(false)
                  onKeepPlan?.()
                }}
              >
                Keep {plan.name}
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={onChangePlan}>
                  Change plan
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    {/* Neutral at rest; red is for the confirmation, where the plan is actually cancelled. */}
                    <Button variant="outline">Cancel plan</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel {plan.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your plan stays active until {formatDate(plan.renewsOn, locale)}. After that, robots keep running on site, but missions, reports and video
                        stop syncing to the cloud, and {allowances.find((a) => a.unit === "seats")?.used ?? "all"} people lose access to the console.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep plan</AlertDialogCancel>
                      <AlertDialogAction
                        destructive
                        onClick={() => {
                          setCancelled(true)
                          onCancelPlan?.()
                        }}
                      >
                        Cancel plan
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        <Subsection title="Included in your plan">
          <div className="grid gap-4 sm:grid-cols-2">
            {allowances.map((a) => (
              <div key={a.label} className="flex flex-col gap-2">
                {/* Grey until 90 % is used: only a limit that is near needs anyone's attention. */}
                <Meter label={a.label} value={a.used} max={a.included} low={Math.ceil(a.included * 0.9)} higherIsWorse unit={`of ${a.included}`} />
                {a.overage !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    Each one past {a.included} adds {money(a.overage)} a {plan.interval}.
                  </span>
                )}
              </div>
            ))}
          </div>
        </Subsection>
      </Card>

      <Card>
        <Subsection title="Usage this period" aside={formatRange(period.start, period.end, locale)}>
          <div className="grid gap-4 sm:grid-cols-2">
            {usage.map((u) =>
              u.included !== undefined ? (
                <Meter
                  key={u.label}
                  label={u.label}
                  value={u.used}
                  max={u.included}
                  low={u.included * 0.9}
                  higherIsWorse
                  unit={`of ${u.included} ${u.unit}`}
                />
              ) : (
                <div key={u.label} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{u.label}</span>
                  <span className="font-medium tabular-nums">
                    {u.used.toLocaleString(locale)} {u.unit}
                  </span>
                </div>
              ),
            )}
          </div>
        </Subsection>
      </Card>

      <Card>
        <Subsection title="Payment method">
          {payment ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 items-start gap-2">
                <CreditCard aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">
                    {payment.brand} ending in <span className="tabular-nums">{payment.last4}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">Expires {payment.expires}</span>
                </span>
              </span>
              <Button variant="secondary" size="sm" onClick={onUpdatePayment}>
                Update card
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">No card on file. Invoices are sent to your billing email.</span>
              <Button variant="secondary" size="sm" onClick={onUpdatePayment}>
                Add card
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Cards are added and changed on your payment provider&apos;s page. Card numbers never pass through the console.</p>
        </Subsection>
      </Card>

      <Subsection title="Invoices">
        {invoices.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description={`Your first invoice is issued on ${formatDate(period.end, locale)}, at the end of this period.`}
            />
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-sm:px-3">Date</TableHead>
                <TableHead className="hidden md:table-cell">Invoice</TableHead>
                <TableHead className="text-right max-sm:px-3">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="max-sm:pr-3 max-sm:pl-0">
                  <span className="sr-only">Download</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="py-2 align-top max-sm:px-3 max-sm:whitespace-normal sm:align-middle">
                    <span className="tabular-nums">{formatDate(i.date, locale)}</span>
                    {/* On a phone the status sits under the date, and the number under that. */}
                    <span className="mt-1 block sm:hidden">
                      <StatusText invoice={i} locale={locale} />
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground md:hidden">{i.number}</span>
                  </TableCell>
                  <TableCell className="hidden font-mono text-sm md:table-cell">{i.number}</TableCell>
                  <TableCell className="py-2 text-right max-sm:px-3 align-top font-medium tabular-nums sm:align-middle">{money(i.amount)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusText invoice={i} locale={locale} />
                  </TableCell>
                  <TableCell className="w-px py-2 text-right max-sm:pr-3 max-sm:pl-0 align-top sm:align-middle">
                    <Button variant="ghost" size="sm" asChild className="max-sm:size-(--h-md) max-sm:px-0">
                      <Link href={i.pdfHref} download aria-label={`Download invoice ${i.number} (PDF)`}>
                        <Download aria-hidden="true" />
                        <span className="max-sm:hidden">PDF</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Subsection>
    </section>
  )
}
