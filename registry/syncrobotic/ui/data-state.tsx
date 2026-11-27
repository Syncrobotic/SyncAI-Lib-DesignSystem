// @syncrobotic/data-state v0.55.0 · update: npx shadcn add @syncrobotic/data-state --overwrite
"use client"

import * as React from "react"
import { CircleAlert, Lock, RotateCw, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"

export type DataStateKind = "loading" | "empty" | "error" | "forbidden" | "stale" | "ready"

/** The error as the API sends it (`error` in the envelope): a stable code, and a message for logs that is never parsed. */
export type DataStateError = { code: string; message?: string }

export type DataStateLabels = {
  /** What is loading, beside the spinner. */
  loading: string
  /** The empty title when `empty` gives none. */
  empty: string
  /** The error's title. */
  error: string
  /** The error's description when its code has none in `errors`. */
  errorBody: string
  /** A description per error code, e.g. `{ RATE_LIMITED: "Too many requests. Wait a minute, then try again." }`. */
  errors: Record<string, string>
  /** The code under the description, for support. */
  code: (code: string) => string
  forbidden: string
  forbiddenBody: string
  /** The notice above stale content; `updatedAt` is the time as you wrote it, when you pass one. */
  stale: (updatedAt?: string) => string
  retry: string
}

export const defaultDataStateLabels: DataStateLabels = {
  loading: "Loading…",
  empty: "Nothing here yet",
  error: "This did not load",
  errorBody: "Something went wrong on our side or on the way. Try again; nothing was changed.",
  errors: {
    NETWORK_ERROR: "We could not reach the server. Check the connection, then try again.",
    RATE_LIMITED: "Too many requests in a short time. Wait a minute, then try again.",
    SERVICE_UNAVAILABLE: "The service is down for maintenance or overloaded. Try again in a few minutes.",
  },
  code: (code) => `Code: ${code}`,
  forbidden: "You do not have access to this",
  forbiddenBody: "Your permissions do not include it. An admin of this project can change them.",
  stale: (updatedAt) => (updatedAt ? `Showing data from ${updatedAt}. It may be out of date.` : "This may be out of date: the last update did not arrive."),
  retry: "Try again",
}

type Message = { icon?: React.ElementType; title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }

/**
 * One contract for what a data region shows while it loads, when it is empty, failed, forbidden, out of date or ready.
 * Copy for an error comes from its code through `labels`; the message is never shown or parsed. Stale keeps the content
 * with a notice above it.
 */
export function DataState({
  state,
  error,
  onRetry,
  retrying = false,
  updatedAt,
  empty,
  forbidden,
  skeleton,
  size = "panel",
  labels,
  className,
  children,
}: {
  state: DataStateKind
  /** For `error`: the code picks the copy. */
  error?: DataStateError | null
  /** Shows Try again on `error` and `stale`. */
  onRetry?: () => void
  /** While the retry runs: the button keeps its place and shows it is busy. */
  retrying?: boolean
  /** When the shown data was fetched, already formatted (a clock time, "2 min ago"), for the stale notice. */
  updatedAt?: string
  /** The empty state's icon, words and the one action that fills it ("Add device"). */
  empty?: Message
  /** The forbidden state's words, e.g. which permission is missing and who grants it. */
  forbidden?: Message
  /** The shape of the content while loading; default three lines of bones. */
  skeleton?: React.ReactNode
  /** `panel` (default) in a card or a section; `inline` in a table, a list or a small panel. */
  size?: "panel" | "inline"
  labels?: Partial<DataStateLabels>
  className?: string
  /** The content, shown when ready and when stale. */
  children?: React.ReactNode
}) {
  const l = { ...defaultDataStateLabels, ...labels, errors: { ...defaultDataStateLabels.errors, ...labels?.errors } }
  const retry = onRetry && (
    <Button variant="secondary" size={size === "inline" ? "sm" : "md"} loading={retrying} onClick={onRetry}>
      <RotateCw aria-hidden="true" />
      {l.retry}
    </Button>
  )
  // One live region for every state, present from the first render, so a change of state is read out once.
  const said =
    state === "loading"
      ? ""
      : state === "error"
        ? l.error
        : state === "empty"
          ? typeof empty?.title === "string"
            ? empty.title
            : l.empty
          : state === "forbidden"
            ? typeof forbidden?.title === "string"
              ? forbidden.title
              : l.forbidden
            : state === "stale"
              ? l.stale(updatedAt)
              : ""

  let body: React.ReactNode
  if (state === "loading")
    body = (
      <div className={cn("flex flex-col", size === "panel" ? "gap-4 p-4" : "gap-3 p-3")}>
        <LoadingLine>{l.loading}</LoadingLine>
        {skeleton ?? (
          <div aria-hidden="true" className="flex flex-col gap-3">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-4 w-2/3" />
          </div>
        )}
      </div>
    )
  else if (state === "error")
    body = (
      <EmptyState
        size={size}
        icon={CircleAlert}
        title={l.error}
        description={
          <>
            {(error && l.errors[error.code]) || l.errorBody}
            {error?.code && <span className="mt-1 block font-mono text-xs">{l.code(error.code)}</span>}
          </>
        }
        action={retry}
      />
    )
  else if (state === "empty")
    body = <EmptyState size={size} icon={empty?.icon} title={empty?.title ?? l.empty} description={empty?.description} action={empty?.action} />
  else if (state === "forbidden")
    body = (
      <EmptyState
        size={size}
        icon={forbidden?.icon ?? Lock}
        title={forbidden?.title ?? l.forbidden}
        description={forbidden?.description ?? l.forbiddenBody}
        action={forbidden?.action}
      />
    )
  else if (state === "stale")
    body = (
      <>
        <div data-slot="data-state-stale" className="flex flex-wrap items-center gap-2 rounded-md bg-warning-subtle px-3 py-2 text-sm">
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warning" />
          <span className="min-w-0 flex-1 text-pretty">{l.stale(updatedAt)}</span>
          {onRetry && (
            <Button variant="ghost" size="sm" loading={retrying} onClick={onRetry}>
              <RotateCw aria-hidden="true" />
              {l.retry}
            </Button>
          )}
        </div>
        {children}
      </>
    )
  else body = children

  return (
    <div data-slot="data-state" data-state={state} aria-busy={state === "loading" || retrying || undefined} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <p role="status" className="sr-only">
        {said}
      </p>
      {body}
    </div>
  )
}

/**
 * Which state a region is in, from what a fetch knows. An error with data in hand is stale (keep showing it); forbidden
 * wins over everything. Wire it to any data layer: `{ loading: isPending, error, hasData: !!data, empty: total === 0 }`.
 */
export function dataStateOf({
  loading = false,
  error,
  hasData = false,
  empty = false,
  stale = false,
  forbidden = false,
}: {
  loading?: boolean
  error?: unknown
  hasData?: boolean
  /** The server's total is 0. Never `items.length` of a page. */
  empty?: boolean
  /** The data is older than it should be (a refetch that has not landed, a missed heartbeat). */
  stale?: boolean
  /** The viewer lacks the permission to read it. A record in another tenant is a not-found page instead. */
  forbidden?: boolean
}): DataStateKind {
  if (forbidden) return "forbidden"
  if (error) return hasData ? "stale" : "error"
  if (loading && !hasData) return "loading"
  if (empty) return "empty"
  return stale ? "stale" : "ready"
}
