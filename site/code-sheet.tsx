"use client"

import * as React from "react"
import { Code, ExternalLink, X } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"

type File = { name: string; code: React.ReactNode }

/**
 * Code opens in a panel from the right, so the preview it belongs to stays in view beside it.
 * Install on top, then the code (one tab per file). Phones get the panel at full width.
 * The code is highlighted on the server and handed in as nodes, so opening it waits for nothing.
 */
export function CodeSheet({
  label = "Code",
  title,
  meta,
  install,
  files,
  href,
  variant = "ghost",
}: {
  label?: string
  title: string
  meta?: string
  install: React.ReactNode
  files: File[]
  href?: string
  variant?: "ghost" | "outline"
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={variant} size="sm">
          <Code aria-hidden="true" className="size-4" /> {label}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="max-w-none gap-0 p-0 sm:max-w-3xl">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-popover py-2 pr-2 pl-6">
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate font-mono text-sm font-medium">{title}</SheetTitle>
            <SheetDescription className="sr-only">Install command and source code for {title}.</SheetDescription>
          </div>
          {meta && <span className="font-mono text-xs text-muted-foreground tabular-nums">{meta}</span>}
          {href && (
            <Button asChild variant="ghost" size="sm">
              <a href={href} target="_blank" rel="noreferrer">
                GitHub <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            </Button>
          )}
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X aria-hidden="true" />
            </Button>
          </SheetClose>
        </div>
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
      </SheetContent>
    </Sheet>
  )
}
