// @syncrobotic/breadcrumb v0.53.0 · update: npx shadcn add @syncrobotic/breadcrumb --overwrite
import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type BreadcrumbLabels = {
  /** The landmark's name for screen readers. */
  nav: string
}

export const defaultBreadcrumbLabels: BreadcrumbLabels = { nav: "Breadcrumb" }

/**
 * Where this page sits: links to the levels above, the current page last. The current page is not a link. Separators
 * are drawn, not read.
 */
export function Breadcrumb({
  className,
  children,
  labels,
  ...props
}: React.ComponentProps<"nav"> & {
  /** The words it says, to translate them. An `aria-label` wins over `labels.nav`. */
  labels?: Partial<BreadcrumbLabels>
}) {
  const items = React.Children.toArray(children)
  const l = { ...defaultBreadcrumbLabels, ...labels }
  return (
    <nav aria-label={l.nav} data-slot="breadcrumb" className={cn("min-w-0", className)} {...props}>
      <ol className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        {items.map((child, i) => (
          // Nothing shrinks while the row has room. Short of room the middle levels give way first (never under 3ch of the name),
          // then the first level, down to a third of the row or its own width, whichever is less. The current page takes the rest.
          <li
            key={i}
            className={cn(
              "flex min-w-0 items-center gap-2",
              i === 0 && items.length > 1 && "w-1/3 min-w-auto shrink-100 basis-[content]",
              i > 0 && i < items.length - 1 && "min-w-auto shrink-1000 [&>[data-slot=breadcrumb-link]]:min-w-[3ch] [&>[data-slot=breadcrumb-page]]:min-w-[3ch]",
            )}
          >
            {i > 0 && <ChevronRight aria-hidden="true" className="size-4 shrink-0" />}
            {child}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** A level above this page. Pass `asChild`-style routing by rendering your own link inside, or use href. */
export function BreadcrumbLink({ className, children, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      data-slot="breadcrumb-link"
      className={cn(
        // As tall as a compact control (36 px with a mouse, 44 px on touch), so the crumb is a target, not a line of text.
        "inline-block truncate align-middle leading-(--h-sm) underline-offset-4 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground hover:underline",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  )
}

/** This page: in foreground colour, announced as the current page. */
export function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="breadcrumb-page" aria-current="page" className={cn("truncate text-foreground", className)} {...props} />
}
