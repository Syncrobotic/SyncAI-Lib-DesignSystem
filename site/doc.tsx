import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Inline } from "./prose"

// Building blocks for the design-language pages: specimens, do/don't pairs and token tables.

export function DocHeader({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-10">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{eyebrow}</p>
      <h1 className="text-[2.5rem] leading-[2.75rem] font-bold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-lg text-muted-foreground">{lead}</p>
    </header>
  )
}

export function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4 pt-12">
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

export function DoDont({ good, bad }: { good: { visual: React.ReactNode; text: string }; bad: { visual: React.ReactNode; text: string } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { ...good, ok: true },
        { ...bad, ok: false },
      ].map((c) => (
        <figure key={String(c.ok)} className="flex flex-col overflow-hidden rounded-md border border-border">
          <div className="specimen flex min-h-40 items-center justify-center p-6">{c.visual}</div>
          <figcaption className={cn("flex flex-1 gap-2 border-t-2 bg-card p-4 text-sm", c.ok ? "border-success" : "border-danger")}>
            {c.ok ? <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> : <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />}
            <span>
              <span className={cn("font-bold", c.ok ? "text-success" : "text-danger")}>{c.ok ? "Do. " : "Don't. "}</span>
              <Inline text={c.text} />
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export function TokenTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div tabIndex={0} role="group" aria-label="Token table" className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="h-10 px-4 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className="h-12 px-4 align-middle whitespace-nowrap">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const Code = ({ children }: { children: React.ReactNode }) => <code className="font-mono text-xs">{children}</code>

/** A swatch painted with the literal value, so light and dark can sit side by side. */
export function Swatch({ value, className }: { value: string; className?: string }) {
  return <span className={cn("inline-block size-6 shrink-0 rounded-xs border border-edge align-middle", className)} style={{ background: value }} />
}

export function Pager({ prev, next }: { prev?: { href: string; title: string }; next?: { href: string; title: string } }) {
  return (
    <nav aria-label="Pagination" className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
      {prev ? (
        <a href={prev.href} className="flex flex-col gap-1 rounded-md border border-border p-4 hover:border-muted-foreground">
          <span className="text-xs text-muted-foreground">Previous</span>
          <span className="font-medium">{prev.title}</span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a href={next.href} className="flex flex-col items-end gap-1 rounded-md border border-border p-4 text-right hover:border-muted-foreground">
          <span className="text-xs text-muted-foreground">Next</span>
          <span className="font-medium">{next.title}</span>
        </a>
      )}
    </nav>
  )
}
