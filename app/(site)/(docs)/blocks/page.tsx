import type { Metadata } from "next"
import { pageMeta } from "@/site/config"
import Link from "next/link"
import { blocks, products } from "@/site/blocks"

const description = "Ready-made screens and sections built from SYNCROBOTIC components and tokens: app shells for internal tools, dashboard, control app and marketing blocks you install as source."

export const metadata: Metadata = pageMeta({ title: "Blocks", description, path: "/blocks" })


export default function BlocksPage() {
  return (
    <article>
      <header className="flex flex-col gap-3 border-b border-border pb-8">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Blocks</p>
        <h1 className="text-3xl font-bold tracking-tight">Sections you can drop into a page</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Components composed the way we use them: real copy, real states, responsive. Install one and it lands as source you can edit.
        </p>
      </header>

      {products.map((p) => {
        const list = blocks.filter((b) => b.product === p)
        if (list.length === 0) return null
        return (
          <section key={p} className="flex flex-col gap-4 pt-section-sm">
            <h2 className="text-xl font-bold">{p}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {list.map((b) => {
                const frameW = b.viewport === "mobile" ? 390 : 1280
                const scale = b.viewport === "mobile" ? 0.6 : 0.42
                return (
                  <Link key={b.name} href={`/blocks/${b.name}`} className="press group flex flex-col overflow-hidden rounded-md border border-border hover:border-muted-foreground">
                    <div className="specimen relative h-72 overflow-hidden">
                      <iframe
                        src={`/preview/${b.name}`}
                        title={`${b.title} thumbnail`}
                        tabIndex={-1}
                        aria-hidden
                        inert
                        loading="lazy"
                        className="pointer-events-none absolute top-4 left-1/2 origin-top bg-background"
                        style={{ width: frameW, height: b.height, transform: `translateX(-50%) scale(${scale})` }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 border-t border-border bg-card p-4">
                      <span className="font-bold group-hover:underline">{b.title}</span>
                      <span className="text-sm text-muted-foreground">{b.description}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </article>
  )
}
