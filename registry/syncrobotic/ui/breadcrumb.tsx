// @syncrobotic/breadcrumb v0.23.0 · update: npx shadcn add @syncrobotic/breadcrumb --overwrite
import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type BreadcrumbLabels = {
  /** The landmark's name for screen readers. */
  nav: string
}

export const defaultBreadcrumbLabels: BreadcrumbLabels = { nav: "Breadcrumb" }

/** Where this page sits: each level a link, the current page last and not a link. Separators are drawn, not read. */
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
          // Short of room, the middle levels give way first: they shrink a hundred times faster than the last, and keep a
          // few letters and their ellipsis (the name never goes under 3ch). The floor is on the name, not the item, so a
          // short name (two characters) is never padded out to it. The first level, usually one short word, keeps its width
          // up to a third of the row; the current page takes what is left.
          <li
            key={i}
            className={cn(
              "flex min-w-0 items-center gap-2",
              i === 0 && items.length > 1 && "max-w-1/3 shrink-0",
              i > 0 && i < items.length - 1 && "min-w-auto shrink-100 [&>[data-slot=breadcrumb-link]]:min-w-[3ch] [&>[data-slot=breadcrumb-page]]:min-w-[3ch]",
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
export function BreadcrumbLink({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      data-slot="breadcrumb-link"
      className={cn(
        // As tall as a compact control (36 px with a mouse, 44 px on touch), so the crumb is a target, not a line of text.
        "inline-block truncate align-middle leading-(--h-sm) underline-offset-4 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground hover:underline",
        className,
      )}
      {...props}
    />
  )
}

/** This page: in foreground colour, announced as the current page. */
export function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="breadcrumb-page" aria-current="page" className={cn("truncate text-foreground", className)} {...props} />
}
