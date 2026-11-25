import * as React from "react"
import { CodeSheet } from "./code-sheet"

/** One example: the live preview, with a footer naming it and a Code button that opens its JSX beside it. */
export function ExampleCard({
  id,
  title,
  preview,
  code,
  install,
  prefetch,
  level = 3,
}: {
  /** The title's heading level: 2 for the example at the top of a page, before its first h2; 3 under a section. */
  level?: 2 | 3
  id: string
  title: string
  preview: React.ReactNode
  code: React.ReactNode
  install: React.ReactNode
  /** The code's address, loaded on hover and focus of the Code button (site/lazy-code.tsx). */
  prefetch?: string
}) {
  // "Button variants" -> button-variants.tsx: a file name you could save it as.
  const file = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.tsx`
  const Heading = level === 2 ? "h2" : "h3"
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 overflow-hidden rounded-md border border-border bg-card">
      <div className="specimen flex min-h-32 items-center justify-center p-4 sm:min-h-48 sm:p-8">
        {/* The Stage inside centres the example and sizes it to its content (site/examples.tsx). */}
        <div className="w-full">{preview}</div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border py-1 pr-1 pl-4">
        <Heading id={`${id}-title`} className="truncate text-sm text-muted-foreground">
          {title}
        </Heading>
        <CodeSheet title={file} install={install} files={[{ name: file, code }]} prefetch={prefetch ? [prefetch] : undefined} />
      </div>
    </section>
  )
}
