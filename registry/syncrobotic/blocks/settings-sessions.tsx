// @syncrobotic/settings-sessions v0.47.0 · update: npx shadcn add @syncrobotic/settings-sessions --overwrite
"use client"

import * as React from "react"
import { CloudOff, LogOut, Monitor, RotateCw, Smartphone, Tablet } from "lucide-react"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"
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
  lastActive: string
  /** The browser this page is open in. */
  current?: boolean
}

export type TrustedBrowser = { id: string; browser: string; since: string; until: string; current?: boolean }

export const sampleSessions: BrowserSession[] = [
  { id: "s1", browser: "Chrome on macOS", form: "desktop", location: "Taipei, Taiwan", lastActive: "Active now", current: true },
  { id: "s2", browser: "Safari on iPhone", form: "phone", location: "Taoyuan, Taiwan", lastActive: "Active 2 hours ago" },
  { id: "s3", browser: "Edge on Windows", form: "desktop", location: "Taoyuan, Taiwan", lastActive: "Active yesterday" },
  { id: "s4", browser: "Chrome on Android tablet", form: "tablet", location: "Hsinchu, Taiwan", lastActive: "Active 9 days ago" },
]

export const sampleTrusted: TrustedBrowser[] = [
  { id: "t1", browser: "Chrome on macOS", since: "3 Nov", until: "3 Dec 2026", current: true },
  { id: "t2", browser: "Safari on iPhone", since: "12 Nov", until: "12 Dec 2026" },
]

const icons = { desktop: Monitor, phone: Smartphone, tablet: Tablet }
const browsers = (n: number) => (n === 1 ? "1 browser" : `${n} browsers`)

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

function Heading({ id, title, children, action }: { id: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <SectionHeader id={id} title={title} description={children} actions={action} />
}

/**
 * Where you are signed in, as browsers (a session is a browser, not a device): browser and system, an approximate
 * place, when it was last active, and "This browser" on the one you are using. Sign one out at once; signing out all the
 * others asks first and says who is affected. Below, the browsers that skip the 2FA code for 30 days, each one forgettable.
 */
export function SettingsSessions({
  product = "Fleet console",
  sessions: initial = sampleSessions,
  trusted: initialTrusted = sampleTrusted,
  state = "ready",
  onRetry,
}: {
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
  const [said, setSaid] = React.useState("")
  const others = sessions.filter((s) => !s.current)

  const signOut = (s: BrowserSession) => {
    setSessions((all) => all.filter((x) => x.id !== s.id))
    setSaid(`Signed out ${s.browser}.`)
  }
  const signOutOthers = () => {
    setSessions((all) => all.filter((x) => x.current))
    setSaid(`Signed out ${browsers(others.length)}. This browser is still signed in.`)
  }

  const body = (list: React.ReactNode) =>
    state === "loading" ? (
      <Card className="gap-4 p-4">
        <LoadingLine>Loading browsers…</LoadingLine>
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center gap-3">
            <Bone className="size-5" />
            <span className="flex flex-1 flex-col gap-2">
              <Bone className="h-4 w-1/2" />
              <Bone className="h-3 w-3/4" />
            </span>
          </span>
        ))}
      </Card>
    ) : state === "error" ? (
      <Card className="p-0">
        <EmptyState
          icon={CloudOff}
          title="This list did not load"
          description="We could not reach the server. Nothing was signed out."
          action={
            <Button variant="secondary" onClick={onRetry}>
              <RotateCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      </Card>
    ) : (
      list
    )

  return (
    <div className="flex flex-col gap-8">
      {/* Read out only: the row that leaves the list is the visible answer. */}
      <p role="status" className="sr-only">
        {said}
      </p>

      <section aria-labelledby="sessions-title" className="flex flex-col gap-4">
        <Heading
          id="sessions-title"
          title="Where you are signed in"
          action={
            state === "ready" &&
            others.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <LogOut aria-hidden="true" />
                    Sign out all other browsers
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out of {browsers(others.length)}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anyone using {product} in them is signed out at once and has to sign in again, with a 2FA code. Missions they started keep
                      running. This browser stays signed in.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <ul className="flex flex-col gap-1 rounded-sm bg-muted p-3 text-sm">
                    {others.map((s) => (
                      <li key={s.id}>
                        {s.browser} · {s.location}
                      </li>
                    ))}
                  </ul>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep them signed in</AlertDialogCancel>
                    <AlertDialogAction destructive onClick={signOutOthers}>
                      Sign out {browsers(others.length)}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          }
        >
          Each browser stays signed in for 14 days after it was last used. Places are approximate, from the internet address.
        </Heading>
        {body(
          <Card className="gap-0 p-0">
            <ItemGroup aria-label="Signed-in browsers" className="gap-0">
              {sessions.map((s) => {
                const Icon = icons[s.form]
                return (
                  <Item key={s.id} role="listitem" className={row}>
                    <ItemMedia variant="plain">
                      <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent className="gap-0">
                      <ItemTitle className="flex-wrap">
                        <span>{s.browser}</span>
                        {s.current && <Badge>This browser</Badge>}
                      </ItemTitle>
                      <Parts items={[`Near ${s.location}`, s.lastActive]} />
                    </ItemContent>
                    {!s.current && (
                      <ItemActions>
                        <Button variant="outline" size="sm" aria-label={`Sign out ${s.browser}, ${s.location}`} onClick={() => signOut(s)}>
                          Sign out
                        </Button>
                      </ItemActions>
                    )}
                  </Item>
                )
              })}
            </ItemGroup>
            {others.length === 0 && <EmptyState size="inline" className="border-t border-border" title="No other browsers are signed in" />}
          </Card>,
        )}
      </section>

      <section aria-labelledby="trusted-title" className="flex flex-col gap-4">
        <Heading id="trusted-title" title="Browsers that skip the 2FA code">
          When you tick “Remember this browser” at sign-in, that browser is not asked for a code for 30 days. Forget one you no longer use.
        </Heading>
        {body(
          trusted.length === 0 ? (
            <Card className="p-0">
              <EmptyState title="No remembered browsers" description="Every sign-in asks for a code from your authenticator app." />
            </Card>
          ) : (
            <Card className="gap-0 p-0">
              <ItemGroup aria-label="Remembered browsers" className="gap-0">
                {trusted.map((t) => (
                  <Item key={t.id} role="listitem" className={row}>
                    <ItemContent className="gap-0">
                      <ItemTitle className="flex-wrap">
                        <span>{t.browser}</span>
                        {t.current && <Badge>This browser</Badge>}
                      </ItemTitle>
                      <Parts items={[`Remembered on ${t.since}`, `until ${t.until}`]} />
                    </ItemContent>
                    <ItemActions>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Forget ${t.browser}`}
                        onClick={() => {
                          setTrusted((all) => all.filter((x) => x.id !== t.id))
                          setSaid(`${t.browser} will ask for a code at its next sign-in.`)
                        }}
                      >
                        Forget
                      </Button>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </Card>
          ),
        )}
      </section>
    </div>
  )
}
