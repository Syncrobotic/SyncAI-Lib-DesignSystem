import * as React from "react"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Inline, Unbroken } from "./prose"
import { DocJsonLd, type Crumb } from "./json-ld"

export { TokenTable } from "./token-table"

// Building blocks for the design-language pages: specimens, do/don't pairs and token tables.

export function DocHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
        <Inline text={lead} />
      </p>
    </header>
  )
}

export function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4 pt-section-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">{title}</h2>
        {lead && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            <Inline text={lead} />
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

/** A framed exhibit on a faint grid, the house style for showing tokens at work. */
export function Specimen({ children, className, caption }: { children: React.ReactNode; className?: string; caption?: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className={cn("specimen rounded-md border border-border p-6", className)}>{children}</div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground">
          <Inline text={caption} />
        </figcaption>
      )}
    </figure>
  )
}

type Case = { visual: React.ReactNode; text: string; /** The measurements, under the visual, when the difference is in numbers. */ caption?: string }

export function DoDont({ good, bad }: { good: Case; bad: Case }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { ...good, ok: true },
        { ...bad, ok: false },
      ].map((c) => (
        <figure key={String(c.ok)} className="flex flex-col overflow-hidden rounded-md border border-border">
          <div className="specimen flex min-h-40 flex-col items-center justify-center gap-3 p-6">
            {c.visual}
            {c.caption && <span className="font-mono text-xs text-muted-foreground">{c.caption}</span>}
          </div>
          <figcaption className={cn("flex flex-1 gap-2 border-t-2 bg-card p-4 text-sm", c.ok ? "border-foreground" : "border-danger")}>
            {c.ok ? <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-foreground" /> : <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />}
            <span>
              <span className={cn("font-bold", c.ok ? "text-foreground" : "text-danger")}>{c.ok ? "Do. " : "Don't. "}</span>
              <Inline text={c.text} />
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

/**
 * A table of tokens or rules. Wide screens: a table whose first column (the name) stays on one line and every other
 * column wraps, so nothing is cut off. Phones: one card per row, each value under its column's name, so no column
 * hides off screen behind a sideways scroll.
 */
// A token or class never splits at its hyphens (h-(-- / h-md)): text goes through Unbroken, which wraps only at a space or "/".
export function Code({ children }: { children: React.ReactNode }) {
  const parts = React.Children.toArray(children)
  const text = parts.every((c) => typeof c === "string" || typeof c === "number") ? parts.join("") : null
  return <code className="font-mono text-xs">{text !== null ? <Unbroken text={text} /> : children}</code>
}

/** A swatch painted with the literal value, so light and dark can sit side by side. */
export function Swatch({ value, className }: { value: string; className?: string }) {
  return <span className={cn("inline-block size-6 shrink-0 rounded-xs border border-edge align-middle", className)} style={{ background: value }} />
}

export function Pager({
  prev,
  next,
  trail,
  description,
}: {
  prev?: { href: string; title: string }
  next?: { href: string; title: string }
  /** The page's place in the docs, for search engines (DocJsonLd). */
  trail?: Crumb[]
  description?: string
}) {
  return (
    <>
    {trail && <DocJsonLd trail={trail} description={description} />}
    <nav aria-label="Pagination" className="mt-section-sm grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
      {prev ? (
        <Link href={prev.href} className="press flex flex-col gap-1 rounded-md border border-border p-4 hover:border-muted-foreground">
          <span className="text-xs text-muted-foreground">Previous</span>
          <span className="font-medium">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} className="press flex flex-col items-end gap-1 rounded-md border border-border p-4 text-right hover:border-muted-foreground">
          <span className="text-xs text-muted-foreground">Next</span>
          <span className="font-medium">{next.title}</span>
        </Link>
      )}
    </nav>
    </>
  )
}
