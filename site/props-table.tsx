import { propsOf } from "./props-data"
import { H2, Unbroken } from "./prose"

const code = "rounded-xs bg-muted px-1 font-mono text-xs text-foreground"

/** A description's `backticked` names as inline code, the way the source's JSDoc means them. */
function Described({ text }: { text: string }) {
  return (
    <span>
      {text.split(/(`[^`]+`)/).map((s, i) =>
        s.startsWith("`") && s.endsWith("`") && s.length > 2 ? (
          <code key={i} className={code}>
            <Unbroken text={s.slice(1, -1)} />
          </code>
        ) : (
          s
        ),
      )}
    </span>
  )
}

/**
 * API reference: for each exported part, the props this kit adds (name, type, default, what it does), and what the rest
 * come from (an HTML element or a Radix part), so hundreds of DOM attributes are named once instead of listed. A list,
 * not a wide table, so it reads on a phone without sideways scrolling.
 */
export function PropsTable({ name }: { name: string }) {
  const all = propsOf(name).filter((p) => p.props.length > 0 || p.inherits.length > 0)
  if (!all.length) return null
  const many = all.length > 1
  // Parts that add nothing of their own (they only pass an element's props through) are not given a block each: they are
  // listed together at the end, one line per element they take after ("CardHeader, CardTitle and CardFooter take every
  // prop of <div>"). A component whose only part is like that keeps its sentence.
  const own = many ? all.filter((p) => p.props.length > 0) : all
  const passThrough = many ? all.filter((p) => p.props.length === 0) : []
  const byInherits = new Map<string, string[]>()
  for (const p of passThrough) {
    const key = p.inherits.join("|")
    byInherits.set(key, [...(byInherits.get(key) ?? []), p.name])
  }
  const parts = own
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
                    <code className={code}>{i}</code>
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
                        <TypeWithDefault type={p.type} value={p.default} />
                      </code>
                      {p.description && <Described text={p.description} />}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
        {byInherits.size > 0 && (
          <section aria-labelledby="api-pass-through" className="flex flex-col gap-3">
            <h3 id="api-pass-through" className="font-mono text-base font-bold">
              {own.length ? "Other parts" : "Parts"}
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {[...byInherits].map(([key, names]) => {
                const inherits = key.split("|")
                return (
                  <li key={key} className="text-pretty">
                    {names.map((n, i) => (
                      <span key={n}>
                        {i > 0 && (i === names.length - 1 ? " and " : ", ")}
                        <code id={`api-${n}`} className={code}>
                          {n}
                        </code>
                      </span>
                    ))}{" "}
                    {names.length > 1 ? "take" : "takes"} every prop of{" "}
                    {inherits.map((x, n) => (
                      <span key={x}>
                        {n > 0 && (n === inherits.length - 1 ? " and " : ", ")}
                        <code className={code}>{x}</code>
                      </span>
                    ))}
                    .
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}

/** A type and its default; the default stays on one line with the type's last member, never alone on the next line. */
function TypeWithDefault({ type, value }: { type: string; value?: string }) {
  if (value === undefined) return <>{type}</>
  const cut = type.lastIndexOf(" | ")
  const head = cut < 0 ? "" : type.slice(0, cut + 3)
  const tail = cut < 0 ? type : type.slice(cut + 3)
  return (
    <>
      {head}
      <span className="whitespace-nowrap">
        {tail}
        <span className="text-foreground"> = {value}</span>
      </span>
    </>
  )
}
