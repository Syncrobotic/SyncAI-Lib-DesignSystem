// Small typographic building blocks shared by the docs pages.

/** Renders `backticked` words as inline code. */
/** A line of copy with the two inline marks the docs use: `code` and **bold**. Nothing else is parsed. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith("`") ? (
          <code key={i} className="rounded-xs bg-muted px-1 font-mono text-sm">
            {part.slice(1, -1)}
          </code>
        ) : part.startsWith("**") ? (
          <strong key={i} className="font-medium text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function PageTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="flex flex-col gap-2 pb-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      {lead && <p className="max-w-2xl text-lg text-muted-foreground">{lead}</p>}
    </div>
  )
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 pt-8 pb-3 text-xl font-bold">
      {children}
    </h2>
  )
}

export function Rules({ rules }: { rules: string[] }) {
  return (
    <ul className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-sm">
      {rules.map((r) => (
        <li key={r} className="flex gap-3">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          <span>
            <Inline text={r} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** The list bullet used across the docs. */
export function Dot() {
  return <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
}
