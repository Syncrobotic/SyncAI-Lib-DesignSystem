// @syncrobotic/breadcrumb v0.8.0 · update: npx shadcn add @syncrobotic/breadcrumb --overwrite
import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** Where this page sits: each level a link, the current page last and not a link. Separators are drawn, not read. */
export function Breadcrumb({ className, children, ...props }: React.ComponentProps<"nav">) {
  const items = React.Children.toArray(children)
  return (
    <nav aria-label="Breadcrumb" data-slot="breadcrumb" className={cn("min-w-0", className)} {...props}>
      <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        {items.map((child, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1">
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
        "truncate underline-offset-4 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground hover:underline",
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
