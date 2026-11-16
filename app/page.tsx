import type { Metadata } from "next"
import Link from "next/link"
import { groups, items } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { site } from "@/site/config"
import { Stage } from "@/site/examples"

export const metadata: Metadata = {
  title: { absolute: `${site.name} — React UI kit for robot control apps` },
  alternates: { canonical: "/" },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: site.name,
  description: site.description,
  codeRepository: site.repo,
  programmingLanguage: ["TypeScript", "CSS"],
  runtimePlatform: "React",
  keywords: site.keywords.join(", "),
  author: { "@type": "Organization", name: "SYNCROBOTIC" },
}

const pillars = [
  { title: "Safety first", body: "Solid red belongs to the emergency stop alone. One touch stops; holding stops every dog; release takes a deliberate slide." },
  { title: "Readable outdoors", body: "Dark by default, 44 px minimum targets, status as shape plus colour so it reads in sunlight and without colour vision." },
  { title: "Yours to change", body: "A shadcn/ui registry: components land in your project as source code, styled with Tailwind CSS v4 tokens." },
]

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="grid items-center gap-12 py-16 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-medium text-info">Design language · UI kit · shadcn registry</p>
          <h1 className="max-w-2xl text-3xl font-bold sm:text-[2.75rem] sm:leading-[3.25rem]">
            The interface for operating robots, built for the moment it matters.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{site.description}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/docs/installation" className="inline-flex h-(--h-lg) items-center rounded-sm bg-primary px-6 font-medium text-primary-foreground">
              Get started
            </Link>
            <Link href="/docs/components/button" className="inline-flex h-(--h-lg) items-center rounded-sm bg-secondary px-6 font-medium">
              Browse components
            </Link>
          </div>
          <div className="max-w-xl">
            <CodeBlock code="npx shadcn add @syncrobotic/stop-button" lang="bash" title="Install a component" />
          </div>
        </div>

        <div aria-label="Live preview: dynamic island and dock" className="relative mx-auto flex h-[640px] w-[360px] flex-col justify-between overflow-hidden rounded-[2.5rem] border border-border bg-map p-3 shadow-overlay">
          <Stage file="island" name="Default" className="w-full" />
          <Stage file="dock" name="ThreeTiersWithPageAction" className="w-full" />
        </div>
      </section>

      <section className="grid gap-4 border-t border-border py-12 md:grid-cols-3">
        {pillars.map((p) => (
          <div key={p.title} className="flex flex-col gap-2">
            <h2 className="font-bold">{p.title}</h2>
            <p className="text-sm text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6 border-t border-border py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold">Components</h2>
          <Link href="/docs/foundations" className="text-sm text-muted-foreground hover:text-foreground">
            Foundations and tokens →
          </Link>
        </div>
        {groups
          .filter((g) => g !== "Hooks")
          .map((g) => (
            <div key={g} className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">{g}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items
                  .filter((c) => c.group === g)
                  .map((c) => (
                    <Link key={c.name} href={`/docs/components/${c.name}`} className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 hover:border-muted-foreground">
                      <span className="font-medium">{c.title}</span>
                      <span className="text-sm text-muted-foreground">{c.description}</span>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
      </section>
    </main>
  )
}
