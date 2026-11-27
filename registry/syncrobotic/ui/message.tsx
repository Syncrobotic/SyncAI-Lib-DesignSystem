// @syncrobotic/message v0.53.0 · update: npx shadcn add @syncrobotic/message --overwrite
"use client"

import * as React from "react"
import { CircleAlert, CircleStop } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { Button } from "@/registry/syncrobotic/ui/button"
import { formatDuration } from "@/registry/syncrobotic/ui/streaming-text"

/*
  One turn of a conversation: who spoke (a role word, never a bubble colour), when, the body, and a footer with facts and
  actions. A person's turns may take a quiet surface and `align="end"`, but keep the role word. An <article> named
  "Assistant, 14:02", so the article list reads as the conversation's outline; aria-busy while streaming, and a failed or
  stopped turn says so once in a polite live region.
*/

// The words, then Try again: 12 px between them; the glyph keeps its 8 px inside the words (icon-gap-ok).
const statusRow = "flex min-h-(--h-sm) flex-wrap items-center gap-x-3 gap-y-1" // icon-gap-ok: the gap is between the words and the button

export const messageRoles = ["user", "assistant", "tool", "system"] as const
export type MessageRole = (typeof messageRoles)[number]

/** "streaming" while the turn is still arriving; "error" and "stopped" for a turn that ended badly; undefined once settled. */
export type MessageStatus = "streaming" | "error" | "stopped"

export type MessageLabels = {
  /** The word for each role, shown in the header and first in the accessible name. */
  roles: Record<MessageRole, string>
  /** The article's accessible name: "Assistant, 14:02", "Tool, robots.list, 14:02". */
  label: (parts: { role: string; name?: string; time?: string }) => string
  /** The word after the error glyph, in the danger colour; `error` follows it. */
  failed: string
  /** The word after the stop glyph. */
  stopped: string
  /** The retry button. */
  retry: string
}

export const defaultMessageLabels: MessageLabels = {
  roles: { user: "You", assistant: "Assistant", tool: "Tool", system: "System" },
  label: ({ role, name, time }) => [role, name, time].filter(Boolean).join(", "),
  failed: "Failed",
  stopped: "Stopped",
  retry: "Try again",
}

type MessageProps = Omit<React.ComponentProps<"article">, "role" | "children"> & {
  /** Who spoke: the role word leads the header and the accessible name. Named `role` after the chat APIs' field. */
  role: MessageRole
  /** Who exactly, after the role word: a person's name, the assistant's or the model's name, the tool called. */
  name?: string
  /** When, as shown ("14:02"). Format it once, in the browser or with a time zone, so the server and the page agree. */
  time?: string
  /** The same moment for machines (an ISO 8601 string), on the <time> element. */
  dateTime?: string
  /** A picture before the role word: an `Avatar` at size "sm". Hidden from screen readers: the role word names the turn. */
  avatar?: React.ReactNode
  /** See MessageStatus. Leave it undefined when the body (StreamingText) already shows the final state. */
  status?: MessageStatus
  /** With status "error": what went wrong, in words, after "Failed". */
  error?: string
  /** With status "error": shows Try again. */
  onRetry?: () => void
  /** "end" moves the turn to the end of a wide container (`@container` 42 rem and up); below that every turn starts at the start. */
  align?: "start" | "end"
  /** A quiet surface under the body. On by default for the user's turns. */
  surface?: boolean
  /** The same speaker's next turn: the header is kept for screen readers only. */
  continued?: boolean
  /** Facts about the turn, under the body: `MessageMeta`, or your own. */
  footer?: React.ReactNode
  /** The turn's actions (`MessageActions`), under the body, before the footer's facts. */
  actions?: React.ReactNode
  /** The body: StreamingText, Trace, attachments, your markdown renderer. */
  children?: React.ReactNode
  labels?: Partial<MessageLabels>
}

/**
 * One turn of a conversation with a model or agent: a role word, name and time (never a bubble colour), any body, then
 * its actions and a quiet line of facts; streaming is aria-busy. Status is a shape and a word: Failed with Try again,
 * or Stopped.
 */
export function Message({
  role,
  name,
  time,
  dateTime,
  avatar,
  status,
  error,
  onRetry,
  align = "start",
  surface = role === "user",
  continued = false,
  footer,
  actions,
  children,
  labels,
  className,
  ...props
}: MessageProps) {
  const l = { ...defaultMessageLabels, ...labels, roles: { ...defaultMessageLabels.roles, ...labels?.roles } }
  const roleWord = l.roles[role]
  const end = align === "end"
  return (
    <article
      data-slot="message"
      data-role={role}
      data-status={status}
      aria-label={l.label({ role: roleWord, name, time })}
      aria-busy={status === "streaming" || undefined}
      className={cn(
        "group/message flex w-full min-w-0 flex-col gap-2",
        // On a wide container a person's turn moves to the end, at most 36 rem wide; it keeps its header and role word.
        end && "@2xl:w-auto @2xl:max-w-xl @2xl:self-end",
        className,
      )}
      {...props}
    >
      <header
        data-slot="message-header"
        className={cn("flex min-h-6 min-w-0 flex-wrap items-center gap-x-2 text-sm", end && "@2xl:justify-end", continued && "sr-only")}
      >
        {avatar && (
          <span aria-hidden="true" className="flex shrink-0">
            {avatar}
          </span>
        )}
        <span data-slot="message-role" className="font-medium text-foreground">
          {roleWord}
        </span>
        {name && <span className="min-w-0 truncate text-muted-foreground">{name}</span>}
        {time && (
          <time dateTime={dateTime} className="text-xs text-muted-foreground tabular-nums">
            {time}
          </time>
        )}
      </header>

      {children !== undefined && children !== null && children !== false && (
        <div
          data-slot="message-body"
          className={cn("flex min-w-0 flex-col gap-3 text-base break-words text-foreground", surface && "rounded-md bg-muted px-4 py-3")}
        >
          {children}
        </div>
      )}

      {/* Always present, so a turn that fails or is stopped while on screen is said once; history mounts quiet. */}
      <div data-slot="message-status" role="status" className={cn(!(status === "error" || status === "stopped") && "sr-only")}>
        {status === "error" ? (
          <div className={statusRow}>
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
              <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-danger" />
              <span className="min-w-0">
                <span className="font-medium text-danger">{l.failed}</span>
                {error && <span> · {error}</span>}
              </span>
            </span>
            {onRetry && (
              <Button data-slot="message-retry" size="sm" variant="outline" onClick={onRetry}>
                {l.retry}
              </Button>
            )}
          </div>
        ) : status === "stopped" ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleStop aria-hidden="true" className="size-4 shrink-0" />
            {l.stopped}
          </span>
        ) : null}
      </div>

      {(actions || footer) && (
        <div data-slot="message-footer" className={cn("flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1", end && "@2xl:justify-end")}>
          {actions}
          {footer}
        </div>
      )}
    </article>
  )
}

export type MessageMetaLabels = {
  /** How long the answer took: "2.4 s". */
  duration: (ms: number, locale: string | undefined) => string
  /** How many tokens it used: "1,204 tokens". */
  tokens: (n: number, locale: string | undefined) => string
}

export const defaultMessageMetaLabels: MessageMetaLabels = {
  duration: formatDuration,
  tokens: (n, locale) => `${formatCount(n, { locale })} ${n === 1 ? "token" : "tokens"}`,
}

/**
 * The facts about a turn, in one quiet line for its footer: "Large · 2.4 s · 1,204 tokens". Each is left out when
 * unknown; `children` adds more at the end.
 */
export function MessageMeta({
  model,
  durationMs,
  tokens,
  locale,
  labels,
  children,
  className,
}: {
  /** The model that answered, as people know it. */
  model?: string
  /** How long the answer took, in ms. */
  durationMs?: number
  /** Tokens used (prompt and answer, or as your API counts them). */
  tokens?: number
  /** Formats the numbers. Left out, English, so the server and the browser write the same. */
  locale?: string
  labels?: Partial<MessageMetaLabels>
  children?: React.ReactNode
  className?: string
}) {
  const l = { ...defaultMessageMetaLabels, ...labels }
  const parts: React.ReactNode[] = [
    model,
    durationMs !== undefined && Number.isFinite(durationMs) ? l.duration(durationMs, locale) : undefined,
    tokens !== undefined && Number.isFinite(tokens) ? l.tokens(tokens, locale) : undefined,
    children,
  ].filter((p) => p !== undefined && p !== null && p !== false && p !== "")
  if (parts.length === 0) return null
  return (
    <p data-slot="message-meta" className={cn("min-w-0 text-xs text-muted-foreground tabular-nums", className)}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {/* Real spaces around a hidden dot: read as "gpt-4 2.4 s", never run together. */}
          {i > 0 && (
            <>
              {" "}
              <span aria-hidden="true">·</span>{" "}
            </>
          )}
          {p}
        </React.Fragment>
      ))}
    </p>
  )
}
