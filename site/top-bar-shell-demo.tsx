"use client"

import { sampleSearch } from "@/registry/syncrobotic/blocks/app-shell"
import { TopBarShell } from "@/registry/syncrobotic/blocks/top-bar-shell"
import { LogoMark } from "./logo"

/** The top-bar shell for the blocks page: links, search and user in the bar, sample sections to scroll under it. */
export function TopBarShellDemo() {
  return (
    <TopBarShell
      product="Fleet portal"
      logo={<LogoMark title="" className="size-7" />}
      links={[
        { label: "Overview", href: "#overview" },
        { label: "Sites", href: "#sites" },
        { label: "Reports", href: "#reports" },
      ]}
      current="#overview"
      search={sampleSearch}
      user={{ name: "Mei Lin", initials: "ML", email: "mei.lin@syncrobotic.ai" }}
      footer={
        <>
          <span>© 2026 SYNCROBOTIC</span>
          <span className="font-mono tabular-nums">Fleet portal v1.8.0</span>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {["Your page", "Another section", "And another"].map((t) => (
          <div key={t} className="flex h-64 items-center justify-center rounded-md text-sm text-muted-foreground ring-1 ring-border ring-dashed">
            {t}
          </div>
        ))}
      </div>
    </TopBarShell>
  )
}
