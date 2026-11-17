"use client"

import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { LogoMark } from "./logo"

/** The bare app shell for the blocks page: frame only, an empty page in the middle. */
export function AppShellDemo() {
  return (
    <AppShell product="Fleet console" logo={<LogoMark title="" className="size-7" />} nav={sampleNav} current="#overview" title="Overview" environment="local" user={{ name: "Mei Lin", initials: "ML" }} onSearch={() => {}}>
      <div className="flex h-64 items-center justify-center rounded-md text-sm text-muted-foreground ring-1 ring-border ring-dashed">Your page</div>
    </AppShell>
  )
}
