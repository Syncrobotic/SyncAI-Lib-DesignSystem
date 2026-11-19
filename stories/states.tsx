import * as React from "react"

/**
 * Several states of one control in one example, each under its name: for the docs, so a page shows the states side by
 * side (two columns where they fit) instead of one tall card around each. Every state is still its own story too.
 */
export function States({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div className="@container w-3xl max-w-full">
      <div className="grid gap-6 @xl:grid-cols-2">
        {items.map(([name, node]) => (
          <figure key={name} className="flex min-w-0 flex-col gap-2">
            <figcaption className="text-xs text-muted-foreground">{name}</figcaption>
            {node}
          </figure>
        ))}
      </div>
    </div>
  )
}
