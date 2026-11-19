import * as React from "react"
import { CodeSheet } from "./code-sheet"

/** One example: the live preview, with a footer naming it and a Code button that opens its JSX beside it. */
export function ExampleCard({
  id,
  title,
  preview,
  code,
  install,
  wide,
}: {
  id: string
  title: string
  preview: React.ReactNode
  code: React.ReactNode
  install: React.ReactNode
  /** Charts and other wide content use the card's width instead of a 384 px column. */
  wide?: boolean
}) {
  // "Button variants" -> button-variants.tsx: a file name you could save it as.
  const file = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.tsx`
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 overflow-hidden rounded-md border border-border bg-card">
      <div className="specimen flex min-h-48 items-center justify-center p-8">
        <div className={wide ? "w-full" : "w-full max-w-sm"}>{preview}</div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border py-1 pr-1 pl-4">
        <h3 id={`${id}-title`} className="truncate text-sm text-muted-foreground">
          {title}
        </h3>
        <CodeSheet title={file} install={install} files={[{ name: file, code }]} />
      </div>
    </section>
  )
}
