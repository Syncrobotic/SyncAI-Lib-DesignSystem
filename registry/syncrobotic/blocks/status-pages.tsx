// @syncrobotic/status-pages v0.7.0 · update: npx shadcn add @syncrobotic/status-pages --overwrite
"use client"

import * as React from "react"
import { CloudOff, Lock, RotateCcw, SearchX } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"

type PageProps = { onPrimary?: () => void; onSecondary?: () => void }

/** One layout for every page that is not the content: what happened, why, and the next step. Never a dead end. */
function StatusPage({
  icon: Icon,
  code,
  title,
  body,
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: PageProps & { icon: React.ElementType; code?: string; title: string; body: React.ReactNode; primary: string; secondary?: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="flex max-w-md animate-appear flex-col items-start gap-4">
        <span className="flex size-12 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-6" />
        </span>
        {code && <p className="font-mono text-sm text-muted-foreground">{code}</p>}
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="text-muted-foreground">{body}</div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={onPrimary}>{primary}</Button>
          {secondary && (
            <Button variant="ghost" onClick={onSecondary}>
              {secondary}
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}

export function NotFoundPage(props: PageProps) {
  return (
    <StatusPage
      icon={SearchX}
      code="404"
      title="This page does not exist"
      body="The link may be old, or the robot or dataset it pointed to was removed."
      primary="Go to overview"
      secondary="Search"
      {...props}
    />
  )
}

export function NoAccessPage(props: PageProps & { role?: string; admin?: string }) {
  return (
    <StatusPage
      icon={Lock}
      code="403"
      title="You do not have access"
      body={
        <>
          Your role ({props.role ?? "Viewer"}) cannot open this page. {props.admin ?? "Your site admin"} can change it.
        </>
      }
      primary="Request access"
      secondary="Go back"
      {...props}
    />
  )
}

export function ErrorPage({ reference = "a7f3-22c1", ...props }: PageProps & { reference?: string }) {
  return (
    <StatusPage
      icon={RotateCcw}
      title="Something went wrong on our side"
      body={
        <>
          Your work is saved. Try again; if it keeps happening, send this reference to support: <span className="font-mono text-foreground">{reference}</span>
        </>
      }
      primary="Try again"
      secondary="Copy reference"
      {...props}
    />
  )
}

export function OfflinePage(props: PageProps) {
  return (
    <StatusPage
      icon={CloudOff}
      title="No connection to the fleet server"
      body="Robots keep running their missions and the emergency stop still works over Bluetooth from the control app. This page reconnects on its own."
      primary="Retry now"
      {...props}
    />
  )
}

/** Loading a page: say what we are waiting for, show the frame, and let only the unknown values breathe. */
export function LoadingPage({ what = "Loading the fleet" }: { what?: string }) {
  return (
    <main aria-busy="true" className="flex min-h-dvh flex-col gap-6 bg-background p-6">
      <LoadingLine>{what}</LoadingLine>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Robots online", "Patrol hours", "Events", "Avg. battery"].map((label) => (
          <div key={label} className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Bone onCard className="h-9 w-20" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
        {Array.from({ length: 5 }, (_, i) => (
          <Bone key={i} onCard className="h-6 w-full" />
        ))}
      </div>
    </main>
  )
}
