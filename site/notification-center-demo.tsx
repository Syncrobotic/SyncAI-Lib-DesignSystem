"use client"

import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { NotificationCenter, sampleNow } from "@/registry/syncrobotic/blocks/notification-center"

/**
 * The notification center for the blocks page: the bell in the app shell's top bar, open on load. The sample's own clock
 * and time zone, so the days and times read the same on the server, in the browser and in screenshots.
 */
export function NotificationCenterDemo() {
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#overview"
      title="Overview"
      user={sampleUser}
      actions={<NotificationCenter defaultOpen focusOnOpen={false} now={sampleNow} timeZone="Asia/Taipei" settingsHref="#settings/notifications" />}
    >
      <div className="flex h-64 items-center justify-center rounded-md text-sm text-muted-foreground ring-1 ring-border ring-dashed">Your page</div>
    </AppShell>
  )
}
