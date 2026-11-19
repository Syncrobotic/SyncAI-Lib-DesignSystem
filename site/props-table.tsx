import { propsOf } from "./props-data"
import { H2 } from "./prose"

/**
 * API reference: for each exported part, the props this kit adds (name, type, default, what it does), and what the rest
 * come from (an HTML element or a Radix part), so hundreds of DOM attributes are named once instead of listed. A list,
 * not a wide table, so it reads on a phone without sideways scrolling.
 */
export function PropsTable({ name }: { name: string }) {
  const parts = propsOf(name).filter((p) => p.props.length > 0 || p.inherits.length > 0)
  if (!parts.length) return null
  const many = parts.length > 1
  return (
    <>
      <H2 id="api">API reference</H2>
      <p className="pb-4 text-sm text-muted-foreground">Generated from the types. Every part also takes className.</p>
      <div className="flex flex-col gap-8">
        {parts.map((part) => (
          <section key={part.name} aria-labelledby={`api-${part.name}`} className="flex flex-col gap-3">
            <h3 id={`api-${part.name}`} className={many ? "font-mono text-base font-bold" : "sr-only"}>
              {part.name}
            </h3>
            {part.inherits.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {part.props.length ? "Also takes" : "Takes"} every prop of{" "}
                {part.inherits.map((i, n) => (
                  <span key={i}>
                    {n > 0 && (n === part.inherits.length - 1 ? " and " : ", ")}
                    <code className="rounded-xs bg-muted px-1 font-mono text-xs text-foreground">{i}</code>
                  </span>
                ))}
                .
              </p>
            )}
            {part.props.length > 0 && (
              <dl className="flex flex-col rounded-md bg-card ring-1 ring-border">
                {part.props.map((p) => (
                  <div key={p.name} className="grid gap-x-6 gap-y-1 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                    <dt className="flex flex-wrap items-baseline gap-x-2 font-mono text-sm font-medium">
                      {p.name}
                      {p.required && <span className="font-sans text-xs font-normal text-muted-foreground">required</span>}
                    </dt>
                    <dd className="flex min-w-0 flex-col gap-1 text-sm">
                      <code className="font-mono text-xs wrap-anywhere text-muted-foreground">
                        {p.type}
                        {p.default !== undefined && <span className="text-foreground"> = {p.default}</span>}
                      </code>
                      {p.description && <span>{p.description}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
