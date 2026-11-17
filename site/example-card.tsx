"use client"

import * as React from "react"
import { Code, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"
import { TabPanel } from "./tab-panel"

/** One example: title, then Preview / Code tabs inside a single card. Built with our own Tabs. */
export function ExampleCard({ id, title, preview, code }: { id: string; title: string; preview: React.ReactNode; code: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 overflow-hidden rounded-md border border-border bg-card">
      <Tabs defaultValue="preview" className="gap-0">
        <div className="flex items-center justify-between gap-4 border-b border-border pl-4">
          <h3 id={`${id}-title`} className="truncate text-sm font-medium">
            {title}
          </h3>
          <TabsList aria-label={`${title}: view`} className="border-b-0 pr-4">
            <TabsTrigger value="preview">
              <Eye aria-hidden="true" /> Preview
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code aria-hidden="true" /> Code
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="specimen flex min-h-48 items-center justify-center p-8">
          <TabPanel className="w-full max-w-sm">{preview}</TabPanel>
        </TabsContent>
        <TabsContent value="code">
          <TabPanel className="[&>div]:rounded-none [&>div]:border-0">{code}</TabPanel>
        </TabsContent>
      </Tabs>
    </section>
  )
}
