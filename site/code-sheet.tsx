"use client"

import * as React from "react"
import { Code, ExternalLink, X } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"
import { loadCode } from "./lazy-code"

type File = { name: string; code: React.ReactNode }

/**
 * The site's side panel: the kit's Sheet from the right, full width on a phone and up to 768 px beside the page, with a
 * sticky header naming what it shows and a close button. The Code sheet and the icon details both open in it, so the two
 * look and behave the same.
 */
export function SidePanelContent({
  title,
  description,
  actions,
  children,
  ...props
}: Omit<React.ComponentProps<typeof SheetContent>, "title" | "side"> & { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <SheetContent side="right" className="max-w-none gap-0 p-0 sm:max-w-3xl" {...props}>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-popover py-2 pr-2 pl-6">
        <div className="min-w-0 flex-1">
          {/* A sheet title is xl, bold, like every sheet's; mono, since what it names is code (a component, a file, an icon). */}
          <SheetTitle className="truncate font-mono text-xl font-bold">{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>
        </div>
        {actions}
        <SheetClose asChild>
          <Button variant="ghost" size="icon" aria-label="Close">
            <X aria-hidden="true" />
          </Button>
        </SheetClose>
      </div>
      {children}
    </SheetContent>
  )
}

/**
 * Code opens in a panel from the right, so the preview it belongs to stays in view beside it.
 * Install on top, then the code (one tab per file). Phones get the panel at full width.
 * The code is highlighted at build time into static files (site/code-data.ts) and fetched as the pointer or focus reaches
 * the button (`prefetch`), so it is not in the page and opening it rarely waits.
 */
export function CodeSheet({
  label = "Code",
  title,
  meta,
  install,
  files,
  href,
  prefetch = [],
  variant = "ghost",
}: {
  label?: string
  title: string
  meta?: string
  install: React.ReactNode
  files: File[]
  href?: string
  /** The listings' addresses (site/lazy-code.tsx), loaded on hover and focus of the button. */
  prefetch?: string[]
  variant?: "ghost" | "outline"
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={variant} size="sm" onPointerEnter={() => prefetch.forEach(loadCode)} onFocus={() => prefetch.forEach(loadCode)}>
          <Code aria-hidden="true" className="size-4" /> {label}
        </Button>
      </SheetTrigger>
      <SidePanelContent
        title={title}
        description={`Install command and source code for ${title}.`}
        actions={
          <>
            {meta && <span className="font-mono text-xs text-muted-foreground tabular-nums">{meta}</span>}
            {href && (
              <Button asChild variant="ghost" size="sm">
                <a href={href} target="_blank" rel="noreferrer">
                  GitHub <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-6 p-6">
          <section aria-label="Install" className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Install</h3>
            {install}
          </section>
          <section aria-label="Code" className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Code</h3>
            {files.length === 1 ? (
              files[0].code
            ) : (
              <Tabs defaultValue={files[0].name} className="gap-3">
                <TabsList aria-label="Files">
                  {files.map((f) => (
                    <TabsTrigger key={f.name} value={f.name} className="font-mono">
                      {f.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {files.map((f) => (
                  <TabsContent key={f.name} value={f.name}>
                    {f.code}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </section>
        </div>
      </SidePanelContent>
    </Sheet>
  )
}
