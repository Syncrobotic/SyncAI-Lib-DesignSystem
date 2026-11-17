import * as React from "react"
import { CodeSheet } from "./code-sheet"

/** One example: the live preview, with a footer naming it and a Code button that opens its JSX beside it. */
export function ExampleCard({
  id,
  title,
  preview,
  code,
  install,
}: {
  id: string
  title: string
  preview: React.ReactNode
  code: React.ReactNode
  install: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 overflow-hidden rounded-md border border-border bg-card">
      <div className="specimen flex min-h-48 items-center justify-center p-8">
        <div className="w-full max-w-sm">{preview}</div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border py-1 pr-1 pl-4">
        <h3 id={`${id}-title`} className="truncate text-sm text-muted-foreground">
          {title}
        </h3>
        <CodeSheet title={`${title}.tsx`} install={install} files={[{ name: `${title}.tsx`, code }]} />
      </div>
    </section>
  )
}
