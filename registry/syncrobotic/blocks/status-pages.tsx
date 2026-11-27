// @syncrobotic/status-pages v0.55.0 · update: npx shadcn add @syncrobotic/status-pages --overwrite
"use client"

import * as React from "react"
import { CloudOff, Lock, RotateCw, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { IconTile } from "@/registry/syncrobotic/ui/icon-tile"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"

/**
 * A way out of the page. `{ label, href }` is a link (through `linkAs`) that works before scripts load ("Go to overview");
 * `{ label, onClick }` is a button that acts in place (Try again); a plain string is a button calling `onPrimary` / `onSecondary`.
 */
export type StatusPageAction = string | { label: string; href: string; onClick?: () => void } | { label: string; onClick?: () => void; href?: undefined }

type PageProps = {
  /** The main way out. Default: the page's own words (`labels.primary`) on a button that calls `onPrimary`. */
  primary?: StatusPageAction
  /** The other way out. Default: the page's own words on a button that calls `onSecondary`; `null` leaves it out. */
  secondary?: StatusPageAction | null
  onPrimary?: () => void
  onSecondary?: () => void
  /** Swap in your router's link for actions with `href` (e.g. next/link). Default "a". */
  linkAs?: React.ElementType
  /** Fill the screen (a route of its own, the default) or the space it is given (inside an app shell's content). */
  fill?: "screen" | "parent"
  /**
   * The heading's level. Default h1 for a screen of its own, h2 inside a frame; pass "h1" inside a shell that has no page
   * title of its own (top-bar-shell), so the page still has one.
   */
  as?: "h1" | "h2"
  className?: string
}

const actionOf = (a: StatusPageAction, onClick?: () => void) => (typeof a === "string" ? { label: a, onClick } : a)

/**
 * Not found, no access, error, offline and loading pages that say what happened, why and the next step, never a dead
 * end. One layout, centred in any frame: `fill="screen"` is the page's <main>; `fill="parent"` is a <section> inside
 * the frame's own <main>.
 */
export function StatusPage({
  icon: Icon,
  code,
  title,
  body,
  primary,
  secondary,
  onPrimary,
  onSecondary,
  linkAs: Link = "a",
  fill = "screen",
  as,
  className,
}: Omit<PageProps, "primary"> & { icon: React.ElementType; code?: string; title: string; body: React.ReactNode; primary: StatusPageAction }) {
  const Root = fill === "screen" ? "main" : "section"
  // A route of its own has the page's h1; inside an app shell's content the shell's title is the h1, so this is an h2.
  const Heading = as ?? (fill === "screen" ? "h1" : "h2")
  const button = (a: StatusPageAction, variant: "primary" | "secondary", onClick?: () => void) => {
    const { label, href, onClick: act } = actionOf(a, onClick)
    return href ? (
      <Button asChild variant={variant}>
        <Link href={href} onClick={act}>
          {label}
        </Link>
      </Button>
    ) : (
      <Button variant={variant} onClick={act}>
        {label}
      </Button>
    )
  }
  return (
    <Root className={cn("flex items-center justify-center bg-background p-6", fill === "screen" ? "min-h-[var(--app-shell-height,100dvh)]" : "h-full min-h-96", className)}>
      <div className="flex max-w-md animate-appear flex-col items-center gap-4 text-center">
        <IconTile variant="muted" size="lg">
          <Icon aria-hidden="true" />
        </IconTile>
        <div className="flex flex-col items-center gap-2">
          {code && <p className="font-mono text-sm text-muted-foreground tabular-nums">{code}</p>}
          <Heading className="text-3xl font-bold tracking-tight text-balance">{title}</Heading>
          <div className="text-sm text-pretty text-muted-foreground">{body}</div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {button(primary, "primary", onPrimary)}
          {secondary && button(secondary, "secondary", onSecondary)}
        </div>
      </div>
    </Root>
  )
}

export type NotFoundPageLabels = { code: string; title: string; body: string; primary: string; secondary: string }
export const defaultNotFoundPageLabels: NotFoundPageLabels = {
  code: "404",
  title: "This page does not exist",
  body: "The link may be old, or the robot or dataset it pointed to was removed.",
  primary: "Go to overview",
  secondary: "Search",
}

/** Its words, to translate them (notFoundPageLabels in labels-zh-tw). */
type Labelled<L> = { labels?: Partial<L> }

export function NotFoundPage({ labels, primary, secondary, ...props }: PageProps & Labelled<NotFoundPageLabels>) {
  const l = { ...defaultNotFoundPageLabels, ...labels }
  return (
    <StatusPage
      icon={SearchX}
      code={l.code}
      title={l.title}
      body={l.body}
      primary={primary ?? l.primary}
      secondary={secondary === undefined ? l.secondary : secondary}
      {...props}
    />
  )
}

export type NoAccessPageLabels = {
  code: string
  title: string
  /** The explanation, from the permission the page needs and who can grant it. */
  body: (permission: string, admin: string) => string
  /** The explanation when no permission is named. */
  bodyPlain: (admin: string) => string
  /** Who can grant it, when `admin` is not given. */
  admin: string
  primary: string
  secondary: string
}
export const defaultNoAccessPageLabels: NoAccessPageLabels = {
  code: "403",
  title: "You do not have access",
  body: (permission, admin) => `This page needs the ${permission} permission. ${admin} can grant it.`,
  bodyPlain: (admin) => `Your permissions do not include this page. ${admin} can change them.`,
  admin: "Your site admin",
  primary: "Request access",
  secondary: "Go back",
}

/** 403 inside the viewer's own tenant: what they cannot open, the permission it needs, who grants it. Never a role's name. */
export function NoAccessPage({
  permission,
  admin,
  labels,
  primary,
  secondary,
  ...props
}: PageProps &
  Labelled<NoAccessPageLabels> & {
    /** The permission string the page needs ("audit-logs:read"). */
    permission?: string
    admin?: string
  }) {
  const l = { ...defaultNoAccessPageLabels, ...labels }
  return (
    <StatusPage
      icon={Lock}
      code={l.code}
      title={l.title}
      body={permission ? l.body(permission, admin ?? l.admin) : l.bodyPlain(admin ?? l.admin)}
      primary={primary ?? l.primary}
      secondary={secondary === undefined ? l.secondary : secondary}
      {...props}
    />
  )
}

export type ErrorPageLabels = {
  code: string
  title: string
  /** Said before the reference, which follows it in monospace. */
  body: string
  /** Said when there is no reference. */
  bodyPlain: string
  /** The body per error code (the envelope's `error.code`), instead of `body`. */
  errors: Record<string, string>
  primary: string
  secondary: string
}
export const defaultErrorPageLabels: ErrorPageLabels = {
  code: "500",
  title: "Something went wrong on our side",
  body: "Your work is saved. Try again; if it keeps happening, send support this reference:",
  bodyPlain: "Your work is saved. Try again; if it keeps happening, contact support.",
  errors: {},
  primary: "Try again",
  secondary: "Copy reference",
}

/** 500: the error's code picks its words; `reference` (a request id) is what support needs, with Copy reference. */
export function ErrorPage({
  reference,
  error,
  labels,
  primary,
  secondary,
  ...props
}: PageProps & Labelled<ErrorPageLabels> & { reference?: string; error?: { code: string; message?: string } | null }) {
  const l = { ...defaultErrorPageLabels, ...labels, errors: { ...defaultErrorPageLabels.errors, ...labels?.errors } }
  const known = error ? l.errors[error.code] : undefined
  return (
    <StatusPage
      icon={RotateCw}
      code={l.code}
      title={l.title}
      body={
        reference ? (
          <>
            {known ?? l.body} <span className="font-mono text-foreground">{reference}</span>
          </>
        ) : (
          (known ?? l.bodyPlain)
        )
      }
      primary={primary ?? l.primary}
      secondary={secondary === undefined ? (reference ? l.secondary : null) : secondary}
      {...props}
    />
  )
}

export type OfflinePageLabels = { code: string; title: string; body: string; primary: string }
export const defaultOfflinePageLabels: OfflinePageLabels = {
  code: "Offline",
  title: "No connection to the fleet server",
  body: "Robots keep running their missions, and the emergency stop still works over Bluetooth from the control app. This page reconnects on its own.",
  primary: "Retry now",
}

export function OfflinePage({ labels, primary, ...props }: PageProps & Labelled<OfflinePageLabels>) {
  const l = { ...defaultOfflinePageLabels, ...labels }
  return <StatusPage icon={CloudOff} code={l.code} title={l.title} body={l.body} primary={primary ?? l.primary} {...props} />
}

export type LoadingPageLabels = { what: string; robotsOnline: string; patrolHours: string; events: string; avgBattery: string }
export const defaultLoadingPageLabels: LoadingPageLabels = {
  what: "Loading the fleet",
  robotsOnline: "Robots online",
  patrolHours: "Patrol hours",
  events: "Events",
  avgBattery: "Avg. battery",
}

/** Loading a page: say what we are waiting for, show the frame, and let only the unknown values breathe. */
export function LoadingPage({
  what,
  fill = "screen",
  labels,
  className,
}: { what?: string; fill?: "screen" | "parent"; className?: string } & Labelled<LoadingPageLabels>) {
  const l = { ...defaultLoadingPageLabels, ...labels }
  const Root = fill === "screen" ? "main" : "section"
  return (
    <Root aria-busy="true" className={cn("flex flex-col gap-4 bg-background p-6", fill === "screen" ? "min-h-[var(--app-shell-height,100dvh)]" : "h-full", className)}>
      <LoadingLine>{what ?? l.what}</LoadingLine>
      {/* Two by two on phones, as the stats it stands in for are. */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[l.robotsOnline, l.patrolHours, l.events, l.avgBattery].map((label, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Bone className="h-(--h-sm) w-20" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
        {Array.from({ length: 5 }, (_, i) => (
          <Bone key={i} className="h-6 w-full" />
        ))}
      </div>
    </Root>
  )
}
