import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { StatusGlyph } from "@/registry/syncrobotic/blocks/status-glyph"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { groups, items } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { site } from "@/site/config"
import { FoundationGrid } from "@/site/foundation-previews"
import { color, px, themeValue } from "@/site/theme-tokens"

export const metadata: Metadata = {
  title: { absolute: `${site.name} — one design language for every SYNCROBOTIC product` },
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

/** The hero: the language itself, as a mosaic of real tokens. */
function TokenMosaic() {
  const tile = "rounded-md border border-border bg-card p-4"
  return (
    <div className="grid w-full max-w-xl grid-cols-6 grid-rows-[repeat(6,3.5rem)] gap-2">
      <div className={`${tile} col-span-4 row-span-2 flex flex-col justify-between`}>
        <span className="font-mono text-xs text-muted-foreground">Color · semantic</span>
        <div className="flex h-8 gap-1">
          {["bg-foreground", "bg-muted-foreground", "bg-info", "bg-success", "bg-warning", "bg-danger", "bg-stop"].map((c) => (
            <span key={c} className={`${c} flex-1 rounded-xs`} />
          ))}
        </div>
      </div>
      <div className={`${tile} col-span-2 row-span-2 flex flex-col justify-between`}>
        <span className="font-mono text-xs text-muted-foreground">Type</span>
        <span className="text-[3rem] leading-none font-bold">Aa</span>
      </div>
      <div className={`${tile} col-span-2 row-span-2 flex items-center justify-center`}>
        <div className="rounded-xl bg-float p-2 ring-1 ring-edge">
          <div className="flex h-14 w-20 items-center justify-center rounded-md bg-muted font-mono text-[10px] text-muted-foreground">24=16+8</div>
        </div>
      </div>
      <div className={`${tile} col-span-4 row-span-2 flex flex-col justify-between`}>
        <span className="font-mono text-xs text-muted-foreground">Spacing · 4 px base</span>
        <div className="flex items-end gap-2">
          {[1, 2, 3, 4, 6, 8].map((s) => (
            <span key={s} className="flex flex-col items-center gap-1">
              <span className="w-4 rounded-[2px] bg-info" style={{ height: s * 4 }} />
              <span className="font-mono text-[10px] text-muted-foreground">{s * 4}</span>
            </span>
          ))}
        </div>
      </div>
      <div className={`${tile} col-span-3 row-span-2 flex flex-col justify-between`}>
        <span className="font-mono text-xs text-muted-foreground">Status · shape + colour</span>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">
            <StatusGlyph tone="info" /> Patrolling
          </Badge>
          <Badge tone="warning">
            <StatusGlyph tone="warning" /> Low battery
          </Badge>
        </div>
      </div>
      <div className={`${tile} col-span-3 row-span-2 flex flex-col justify-between`}>
        <span className="font-mono text-xs text-muted-foreground">Solid red · stop only</span>
        <span className="flex h-(--h-md) items-center justify-center rounded-sm bg-stop text-sm font-bold text-white">Emergency stop</span>
      </div>
    </div>
  )
}

const samples: Record<string, React.ReactNode> = {
  Actions: (
    <div className="flex gap-2">
      <Button size="sm">Primary</Button>
      <Button size="sm" variant="secondary">
        Secondary
      </Button>
    </div>
  ),
  Inputs: (
    <div className="flex items-center gap-3">
      <span className="flex h-(--h-sm) w-32 items-center rounded-sm bg-card px-3 text-sm text-muted-foreground ring-1 ring-input">Robot name</span>
      <Switch defaultChecked aria-label="Example switch" />
    </div>
  ),
  Display: (
    <div className="flex gap-2">
      <Badge tone="success">Docked</Badge>
      <Badge tone="danger">2 events</Badge>
      <Badge tone="outline">v2.4</Badge>
    </div>
  ),
  Navigation: (
    <div className="flex gap-4 border-b border-border text-sm">
      <span className="border-b-2 border-foreground pb-2 font-medium">Overview</span>
      <span className="pb-2 text-muted-foreground">Sensors</span>
      <span className="pb-2 text-muted-foreground">Logs</span>
    </div>
  ),
  Overlays: (
    <div className="w-44 rounded-md bg-popover p-1 text-sm shadow-overlay ring-1 ring-border">
      <div className="rounded-xs bg-accent px-3 py-2">Rename</div>
      <div className="px-3 py-2 text-danger">Delete route</div>
    </div>
  ),
  "Robot shell": <span className="flex h-(--h-md) w-48 items-center justify-center rounded-md bg-stop text-sm font-bold text-white">Emergency stop · 7F3A</span>,
}

export default function HomePage() {
  const firstOf = (g: string) => items.find((i) => i.group === g)?.name
  return (
    <main id="content" className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">SYNCROBOTIC Design System</p>
            <h1 className="max-w-xl text-[2.75rem] leading-[3rem] font-bold tracking-tight sm:text-[3.5rem] sm:leading-[3.75rem]">
              One design language for every product we build.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              How we define colour, type, spacing, radius, depth and motion, written down once and shipped as tokens and React components every team can use.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/docs/foundations" className="inline-flex h-(--h-lg) items-center gap-2 rounded-sm bg-primary px-6 font-medium text-primary-foreground">
                Explore the foundations <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="/docs/components/button" className="inline-flex h-(--h-lg) items-center rounded-sm bg-secondary px-6 font-medium">
                Browse components
              </Link>
            </div>
          </div>
          <TokenMosaic />
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-20">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Foundations</p>
          <h2 className="text-3xl font-bold">The decisions behind every screen</h2>
          <p className="max-w-2xl text-muted-foreground">Read these before you design or build. Every value is parsed from the theme file, so the docs never drift from what ships.</p>
        </div>
        <FoundationGrid />
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-20">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Components</p>
          <h2 className="text-3xl font-bold">The language, already applied</h2>
          <p className="max-w-2xl text-muted-foreground">
            {items.filter((i) => i.group !== "Hooks").length} components built on the tokens: general UI for any product, plus the robot shell for control apps.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups
            .filter((g) => g !== "Hooks")
            .map((g) => {
              const list = items.filter((i) => i.group === g)
              return (
                <Link key={g} href={`/docs/components/${firstOf(g)}`} className="group flex flex-col overflow-hidden rounded-md border border-border hover:border-muted-foreground">
                  <div aria-hidden inert className="specimen flex h-36 items-center justify-center p-6">
                    {samples[g]}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 border-t border-border bg-card p-5">
                    <span className="flex items-center justify-between">
                      <span className="font-bold">{g}</span>
                      <span className="font-mono text-xs text-muted-foreground">{list.length}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">{list.map((i) => i.title).join(", ")}</span>
                  </div>
                </Link>
              )
            })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="grid items-center gap-8 rounded-xl border border-border bg-card p-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Use it in a project</h2>
            <p className="text-muted-foreground">
              Install the theme and components into any React or Next.js app with the shadcn CLI. The theme replaces shadcn&apos;s defaults; components land as source you can read and adapt.
            </p>
            <Link href="/docs/installation" className="inline-flex items-center gap-2 text-sm font-medium text-info hover:underline">
              Installation guide <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <CodeBlock code={"npx shadcn add @syncrobotic/syncrobotic-theme\nnpx shadcn add @syncrobotic/button @syncrobotic/card"} lang="bash" title="Terminal" />
        </div>
        <p className="pt-6 text-center font-mono text-xs text-muted-foreground">
          Theme v0.9 · body text {px(themeValue("text-base"))} px · background {color("background").dark}
        </p>
      </section>
    </main>
  )
}
