import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { CloudOff, Lock, RotateCw, Wrench } from "lucide-react"
import { Banner } from "@/registry/syncrobotic/ui/banner"
import { Button } from "@/registry/syncrobotic/ui/button"

const meta: Meta = { title: "Feedback/Banner" }
export default meta
type S = StoryObj

function Maintenance() {
  // Remembering the dismissal is the app's job: here in state, in a real app in storage, keyed to this maintenance window.
  const [open, setOpen] = React.useState(true)
  return (
    <div className="flex flex-col gap-4">
      <Banner icon={Wrench} title="Maintenance on Sunday, 02:00–04:00 UTC." open={open} onDismiss={() => setOpen(false)} dismissLabel="Dismiss maintenance notice">
        Robots keep patrolling. The dashboard and the API are unavailable for up to 2 hours.
      </Banner>
      {!open && (
        <Button variant="outline" className="self-start" onClick={() => setOpen(true)}>
          Show the notice again
        </Button>
      )}
    </div>
  )
}

function TrialEnding() {
  const [open, setOpen] = React.useState(true)
  return (
    <Banner
      tone="warning"
      title="Your trial ends in 3 days."
      action={
        <Button variant="outline" asChild>
          <a href="#billing">Choose a plan</a>
        </Button>
      }
      open={open}
      onDismiss={() => setOpen(false)}
      dismissLabel="Dismiss trial notice"
    >
      After that the 14 robots keep running, but you can no longer change missions.
    </Banner>
  )
}

/** A notice about the app, not about one record: scheduled maintenance. It can be dismissed; the app remembers that. */
export const BannerDefault: S = { render: () => <Maintenance /> }

/** Tones follow Alert's. Neutral for calm conditions, info only while a process runs, warning before something is lost, danger when the app cannot work. */
export const BannerTones: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Banner icon={Lock} title="Read-only mode.">
        You can view robots and missions. Changes are paused while the database is upgraded, until about 16:00.
      </Banner>
      <Banner tone="info" title="Back online.">
        Uploading 1,204 events recorded while offline; the event log fills in as they arrive.
      </Banner>
      <TrialEnding />
      <Banner
        tone="danger"
        icon={CloudOff}
        title="No connection to the server."
        action={
          <Button variant="outline">
            <RotateCw aria-hidden="true" /> Retry now
          </Button>
        }
      >
        Robots keep their last mission. What you see here may be out of date; retrying every 10 s.
      </Banner>
    </div>
  ),
}

/**
 * Above the app shell. The shell is as tall as the screen unless --app-shell-height says otherwise: put the banner and the
 * shell in a column as tall as the screen and give the shell what is left (`[--app-shell-height:100%]` on a flex-1 box).
 * The banner can wrap to more lines on a phone, and the shell still ends at the bottom of the screen, with no page scroll.
 */
export const BannerAboveAppShell: S = {
  render: () => (
    <div className="flex h-96 flex-col overflow-hidden rounded-md ring-1 ring-border">
      <Banner icon={Lock} title="Read-only mode.">
        Changes are paused while the database is upgraded, until about 16:00.
      </Banner>
      <div className="min-h-0 flex-1 [--app-shell-height:100%]">
        {/* Your AppShell goes here; it fills h-[var(--app-shell-height,100dvh)]. */}
        <div className="flex h-[var(--app-shell-height,100dvh)] gap-2 bg-background p-2">
          <div className="hidden w-48 shrink-0 rounded-md bg-card p-4 text-sm text-muted-foreground ring-1 ring-border sm:block">Navigation</div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-md bg-card p-4 text-sm ring-1 ring-border">
            <p className="font-medium">Overview</p>
            <p className="text-muted-foreground">The shell ends at the bottom of the frame, under the banner, whatever the banner's height.</p>
          </div>
        </div>
      </div>
    </div>
  ),
}
