// @syncrobotic/status-pages v0.17.3 · update: npx shadcn add @syncrobotic/status-pages --overwrite
"use client"

import * as React from "react"
import { CloudOff, Lock, RotateCw, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"

type PageProps = {
  onPrimary?: () => void
  onSecondary?: () => void
  /** Fill the screen (a route of its own, the default) or the space it is given (inside an app shell's content). */
  fill?: "screen" | "parent"
  className?: string
}

/**
 * One layout for every page that is not the content: what happened, why, and the next step. Never a dead end.
 * Centred on both axes, like the empty state, so it balances in any frame: a full screen, or an app shell's content panel.
 * Icon tile, then the code, title and explanation as one block, then the actions: 16 px apart, 24 px before the actions.
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
  fill = "screen",
  className,
}: PageProps & { icon: React.ElementType; code?: string; title: string; body: React.ReactNode; primary: string; secondary?: string }) {
  const Root = fill === "screen" ? "main" : "section"
  // A route of its own has the page's h1; inside an app shell's content the shell's title is the h1, so this is an h2.
  const Heading = fill === "screen" ? "h1" : "h2"
  return (
    <Root className={cn("flex items-center justify-center bg-background p-6", fill === "screen" ? "min-h-[var(--app-shell-height,100dvh)]" : "h-full min-h-96", className)}>
      <div className="flex max-w-md animate-appear flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col items-center gap-2">
          {code && <p className="font-mono text-sm text-muted-foreground tabular-nums">{code}</p>}
          <Heading className="text-2xl font-bold text-balance">{title}</Heading>
          <div className="text-sm text-pretty text-muted-foreground">{body}</div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button onClick={onPrimary}>{primary}</Button>
          {secondary && (
            <Button variant="secondary" onClick={onSecondary}>
              {secondary}
            </Button>
          )}
        </div>
      </div>
    </Root>
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

export function NoAccessPage({ role = "Viewer", admin = "Your site admin", ...props }: PageProps & { role?: string; admin?: string }) {
  return (
    <StatusPage
      icon={Lock}
      code="403"
      title="You do not have access"
      body={
        <>
          Your role ({role}) cannot open this page. {admin} can change it.
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
      icon={RotateCw}
      code="500"
      title="Something went wrong on our side"
      body={
        <>
          Your work is saved. Try again; if it keeps happening, send support this reference: <span className="font-mono text-foreground">{reference}</span>
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
      code="Offline"
      title="No connection to the fleet server"
      body="Robots keep running their missions, and the emergency stop still works over Bluetooth from the control app. This page reconnects on its own."
      primary="Retry now"
      {...props}
    />
  )
}

/** Loading a page: say what we are waiting for, show the frame, and let only the unknown values breathe. */
export function LoadingPage({ what = "Loading the fleet", fill = "screen", className }: { what?: string; fill?: "screen" | "parent"; className?: string }) {
  const Root = fill === "screen" ? "main" : "section"
  return (
    <Root aria-busy="true" className={cn("flex flex-col gap-4 bg-background p-6", fill === "screen" ? "min-h-[var(--app-shell-height,100dvh)]" : "h-full", className)}>
      <LoadingLine>{what}</LoadingLine>
      {/* Two by two on phones, as the stats it stands in for are. */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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
    </Root>
  )
}
