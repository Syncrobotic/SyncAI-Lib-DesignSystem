"use client"

import { AppShell, sampleNav, sampleSearch } from "@/registry/syncrobotic/blocks/app-shell"
import { LogoMark } from "./logo"

/** The bare app shell for the blocks page, in its inset layout: sidebar, top bar, content and footer, an empty page in the middle. */
export function AppShellDemo() {
  return (
    <AppShell
      layout="inset"
      product="Fleet console"
      logo={<LogoMark title="" className="size-7" />}
      nav={sampleNav}
      current="#overview"
      title="Overview"
      environment="local"
      user={{ name: "Mei Lin", initials: "ML", email: "mei.lin@syncrobotic.ai" }}
      search={sampleSearch}
      footer={
        <>
          <span>© 2026 SYNCROBOTIC</span>
          <span className="font-mono tabular-nums">Fleet console v2.4.0</span>
        </>
      }
    >
      <div className="flex h-64 items-center justify-center rounded-md text-sm text-muted-foreground ring-1 ring-border ring-dashed">Your page</div>
    </AppShell>
  )
}
