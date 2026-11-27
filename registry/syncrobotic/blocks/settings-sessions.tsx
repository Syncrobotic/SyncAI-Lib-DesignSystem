// @syncrobotic/settings-sessions v0.53.0 · update: npx shadcn add @syncrobotic/settings-sessions --overwrite
"use client"

import * as React from "react"
import { LogOut, Monitor, Smartphone, Tablet } from "lucide-react"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import type { ListPage } from "@/registry/syncrobotic/lib/list-query"
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
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/registry/syncrobotic/ui/item"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

export type BrowserSession = {
  id: string
  /** The browser and its operating system, e.g. "Chrome on macOS". A session is a browser, so it is named as one. */
  browser: string
  /** Only for the icon: the kind of screen the browser runs on. */
  form: "desktop" | "phone" | "tablet"
  /** From the IP address, so it is approximate: a city at most. */
  location: string
  /** ISO 8601. */
  lastActiveAt: string
  /** The browser this page is open in. */
  current?: boolean
}

/** A browser remembered at the 2FA step. `since` and `until` are ISO 8601. */
export type TrustedBrowser = { id: string; browser: string; since: string; until: string; current?: boolean }

export type SettingsSessionsLabels = {
  sessionsTitle: string
  sessionsBody: string
  sessions: string
  thisBrowser: string
  near: (place: string) => string
  /** "Active now", "Active 2 hours ago": `when` is Intl's relative time. */
  active: (when: string) => string
  signOut: string
  signOutName: (browser: string, place: string) => string
  signedOut: (browser: string) => string
  signOutOthers: string
  /** "1 browser", "3 browsers". */
  browsers: (n: number) => string
  othersTitle: (browsers: string) => string
  othersBody: string
  keepOthers: string
  signOutCount: (browsers: string) => string
  signedOutOthers: (browsers: string) => string
  noOthers: string
  trustedTitle: string
  trustedBody: string
  trusted: string
  remembered: (date: string) => string
  until: (date: string) => string
  forget: string
  forgetName: (browser: string) => string
  forgotten: (browser: string) => string
  noTrusted: string
  noTrustedBody: string
  failed: string
  errors: Record<string, string>
  data?: Partial<DataStateLabels>
}

export const defaultSettingsSessionsLabels: SettingsSessionsLabels = {
  sessionsTitle: "Where you are signed in",
  sessionsBody: "Each browser stays signed in for 14 days after it was last used. Places are approximate, from the internet address.",
  sessions: "Signed-in browsers",
  thisBrowser: "This browser",
  near: (place) => `Near ${place}`,
  active: (when) => `Active ${when}`,
  signOut: "Sign out",
  signOutName: (browser, place) => `Sign out ${browser}, ${place}`,
  signedOut: (browser) => `Signed out ${browser}.`,
  signOutOthers: "Sign out all other browsers",
  browsers: (n) => (n === 1 ? "1 browser" : `${n} browsers`),
  othersTitle: (b) => `Sign out of ${b}?`,
  othersBody: "Whoever uses them is signed out at once and has to sign in again, with a 2FA code. Work they started keeps running. This browser stays signed in.",
  keepOthers: "Keep them signed in",
  signOutCount: (b) => `Sign out ${b}`,
  signedOutOthers: (b) => `Signed out ${b}. This browser is still signed in.`,
  noOthers: "No other browsers are signed in",
  trustedTitle: "Browsers that skip the 2FA code",
  trustedBody: "When you tick “Remember this browser” at sign-in, that browser is not asked for a code for 30 days. Forget one you no longer use.",
  trusted: "Remembered browsers",
  remembered: (date) => `Remembered on ${date}`,
  until: (date) => `until ${date}`,
  forget: "Forget",
  forgetName: (browser) => `Forget ${browser}`,
  forgotten: (browser) => `${browser} will ask for a code at its next sign-in.`,
  noTrusted: "No remembered browsers",
  noTrustedBody: "Every sign-in asks for a code from your authenticator app.",
  failed: "That did not work. Nothing was signed out; try again.",
  errors: {},
  data: { loading: "Loading browsers…", error: "This list did not load", errorBody: "We could not reach the server. Nothing was signed out." },
}

const icons = { desktop: Monitor, phone: Smartphone, tablet: Tablet }

const relative = (iso: string, now: number, locale?: string) => {
  const s = (Date.parse(iso) - now) / 1000
  const a = Math.abs(s)
  const rtf = new Intl.RelativeTimeFormat(locale ?? "en", { numeric: "auto" })
  if (a < 60) return rtf.format(0, "second")
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute")
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour")
  return rtf.format(Math.round(s / 86400), "day")
}

/** A detail line whose parts wrap between each other, never inside one ("Active 2 / hours ago"). */
function Parts({ items }: { items: string[] }) {
  return (
    <span className="text-xs text-muted-foreground">
      {items.map((item, i) => (
        <React.Fragment key={item}>
          {i > 0 && " · "}
          <span className="whitespace-nowrap">{item}</span>
        </React.Fragment>
      ))}
    </span>
  )
}

// A row of a list on a card: the card's 16 px inside, a hairline between rows; it wraps its button under a long name.
const row = "flex-wrap rounded-none border-b border-border px-4 last:border-b-0"

export type SettingsSessionsContentProps = {
  /** The signed-in browsers, this one included, with the server's total. */
  sessions: ListPage<BrowserSession>
  /** Browsers remembered at the 2FA step; leave it out to drop that section. */
  trusted?: ListPage<TrustedBrowser>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  /** Sensitive: wrap each in your step-up (`useStepUp().run`); a cancelled check changes nothing here. */
  onSignOut: (session: BrowserSession) => Promise<void>
  onSignOutOthers?: () => Promise<void>
  onForget?: (browser: TrustedBrowser) => Promise<void>
  /** Relative times are measured from here; default the browser's clock. */
  now?: Date
  locale?: string
  timeZone?: string
  labels?: Partial<SettingsSessionsLabels>
}

/** Signed-in and remembered browsers from your data; signing out is a callback, counts come from `total`. */
export function SettingsSessionsContent({
  sessions,
  trusted,
  state = "ready",
  error,
  onRetry,
  onSignOut,
  onSignOutOthers,
  onForget,
  now,
  locale,
  timeZone,
  labels,
}: SettingsSessionsContentProps) {
  const l = { ...defaultSettingsSessionsLabels, ...labels }
  const [said, setSaid] = React.useState("")
  const [failure, setFailure] = React.useState<string | null>(null)
  const [clock] = React.useState(() => Date.now())
  const at = now?.getTime() ?? clock
  const date = new Intl.DateTimeFormat(locale ?? "en-GB", { timeZone, day: "numeric", month: "short" })
  const dateYear = new Intl.DateTimeFormat(locale ?? "en-GB", { timeZone, day: "numeric", month: "short", year: "numeric" })
  // The others are every session but this one, counted from the server's total.
  const others = Math.max(0, sessions.total - (sessions.items.some((s) => s.current) ? 1 : 0))
  const ready = state === "ready" || state === "stale"

  const run = async (fn: () => Promise<void>, done: string) => {
    setFailure(null)
    try {
      await fn()
      setSaid(done)
    } catch (e) {
      if (!isStepUpCancelled(e)) setFailure(l.errors[errorCodeOf(e) ?? ""] ?? l.failed)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Read out only: the row that leaves the list is the visible answer. */}
      <p role="status" className="sr-only">
        {said}
      </p>
      {failure && (
        <p role="alert" className="text-sm text-danger">
          {failure}
        </p>
      )}

      <section aria-labelledby="sessions-title" className="flex flex-col gap-4">
        <SectionHeader
          id="sessions-title"
          title={l.sessionsTitle}
          description={l.sessionsBody}
          actions={
            ready &&
            onSignOutOthers &&
            others > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <LogOut aria-hidden="true" />
                    {l.signOutOthers}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{l.othersTitle(l.browsers(others))}</AlertDialogTitle>
                    <AlertDialogDescription>{l.othersBody}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <ul className="flex flex-col gap-1 rounded-sm bg-muted p-3 text-sm">
                    {sessions.items
                      .filter((s) => !s.current)
                      .map((s) => (
                        <li key={s.id}>
                          {s.browser} · {s.location}
                        </li>
                      ))}
                  </ul>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{l.keepOthers}</AlertDialogCancel>
                    <AlertDialogAction destructive onClick={() => void run(onSignOutOthers, l.signedOutOthers(l.browsers(others)))}>
                      {l.signOutCount(l.browsers(others))}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
        />
        <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
          <Card className="gap-0 p-0">
            <ItemGroup aria-label={l.sessions} className="gap-0">
              {sessions.items.map((s) => {
                const Icon = icons[s.form]
                return (
                  <Item key={s.id} role="listitem" className={row}>
                    <ItemMedia variant="plain">
                      <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent className="gap-0">
                      <ItemTitle className="flex-wrap">
                        <span>{s.browser}</span>
                        {s.current && <Badge>{l.thisBrowser}</Badge>}
                      </ItemTitle>
                      <Parts items={[l.near(s.location), l.active(relative(s.lastActiveAt, at, locale))]} />
                    </ItemContent>
                    {!s.current && (
                      <ItemActions>
                        <Button variant="outline" size="sm" aria-label={l.signOutName(s.browser, s.location)} onClick={() => void run(() => onSignOut(s), l.signedOut(s.browser))}>
                          {l.signOut}
                        </Button>
                      </ItemActions>
                    )}
                  </Item>
                )
              })}
            </ItemGroup>
            {others === 0 && <EmptyState size="inline" className="border-t border-border" title={l.noOthers} />}
          </Card>
        </DataState>
      </section>

      {trusted && (
        <section aria-labelledby="trusted-title" className="flex flex-col gap-4">
          <SectionHeader id="trusted-title" title={l.trustedTitle} description={l.trustedBody} />
          <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
            {trusted.total === 0 ? (
              <Card className="p-0">
                <EmptyState title={l.noTrusted} description={l.noTrustedBody} />
              </Card>
            ) : (
              <Card className="gap-0 p-0">
                <ItemGroup aria-label={l.trusted} className="gap-0">
                  {trusted.items.map((t) => (
                    <Item key={t.id} role="listitem" className={row}>
                      <ItemContent className="gap-0">
                        <ItemTitle className="flex-wrap">
                          <span>{t.browser}</span>
                          {t.current && <Badge>{l.thisBrowser}</Badge>}
                        </ItemTitle>
                        <Parts items={[l.remembered(date.format(new Date(t.since))), l.until(dateYear.format(new Date(t.until)))]} />
                      </ItemContent>
                      {onForget && (
                        <ItemActions>
                          <Button variant="outline" size="sm" aria-label={l.forgetName(t.browser)} onClick={() => void run(() => onForget(t), l.forgotten(t.browser))}>
                            {l.forget}
                          </Button>
                        </ItemActions>
                      )}
                    </Item>
                  ))}
                </ItemGroup>
              </Card>
            )}
          </DataState>
        </section>
      )}
    </div>
  )
}

/** The clock the sample is written against. */
const sampleNow = new Date("2026-11-20T15:30:00+08:00")

export const sampleSessions: BrowserSession[] = [
  { id: "s1", browser: "Chrome on macOS", form: "desktop", location: "Taipei, Taiwan", lastActiveAt: "2026-11-20T15:30:00+08:00", current: true },
  { id: "s2", browser: "Safari on iPhone", form: "phone", location: "Taoyuan, Taiwan", lastActiveAt: "2026-11-20T13:30:00+08:00" },
  { id: "s3", browser: "Edge on Windows", form: "desktop", location: "Taoyuan, Taiwan", lastActiveAt: "2026-11-19T11:00:00+08:00" },
  { id: "s4", browser: "Chrome on Android tablet", form: "tablet", location: "Hsinchu, Taiwan", lastActiveAt: "2026-11-11T10:00:00+08:00" },
]

export const sampleTrusted: TrustedBrowser[] = [
  { id: "t1", browser: "Chrome on macOS", since: "2026-11-03T09:00:00+08:00", until: "2026-12-03T09:00:00+08:00", current: true },
  { id: "t2", browser: "Safari on iPhone", since: "2026-11-12T09:00:00+08:00", until: "2026-12-12T09:00:00+08:00" },
]

/**
 * Where you are signed in, as browsers: sign one out, or all the others after a confirmation; browsers that skip
 * the 2FA code for 30 days. A session is a browser, not a device: each shows browser and system, an approximate place,
 * when it was last active, and "This browser" on the one you are using. Each trusted browser can be forgotten. This is
 * SettingsSessionsContent on sample data.
 */
export function SettingsSessions({
  product = "Fleet console",
  sessions: initial = sampleSessions,
  trusted: initialTrusted = sampleTrusted,
  state = "ready",
  onRetry,
}: {
  /** Named in the sign-out confirmation: "Anyone using {product} in them…". */
  product?: string
  sessions?: BrowserSession[]
  /** Browsers remembered at the 2FA step ("Remember this browser for 30 days"). Pass [] to leave the section empty. */
  trusted?: TrustedBrowser[]
  /** "loading" while the lists are fetched, "error" when they could not be; the headings stay either way. */
  state?: "ready" | "loading" | "error"
  onRetry?: () => void
}) {
  const [sessions, setSessions] = React.useState(initial)
  const [trusted, setTrusted] = React.useState(initialTrusted)
  return (
    <SettingsSessionsContent
      sessions={{ items: sessions, total: sessions.length }}
      trusted={{ items: trusted, total: trusted.length }}
      state={state}
      onRetry={onRetry}
      now={sampleNow}
      timeZone="Asia/Taipei"
      labels={{
        othersBody: `Anyone using ${product} in them is signed out at once and has to sign in again, with a 2FA code. Missions they started keep running. This browser stays signed in.`,
      }}
      onSignOut={async (s) => setSessions((all) => all.filter((x) => x.id !== s.id))}
      onSignOutOthers={async () => setSessions((all) => all.filter((x) => x.current))}
      onForget={async (t) => setTrusted((all) => all.filter((x) => x.id !== t.id))}
    />
  )
}
