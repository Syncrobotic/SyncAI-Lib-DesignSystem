import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { groups, items } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { site } from "@/site/config"
import { Appear, AppearItem, Reveal } from "@/site/appear"
import { fast, FoundationGrid } from "@/site/foundation-previews"
import { HeroDemo } from "@/site/hero-demo"
import { blockGroups, blockTypes, placement } from "@/site/block-types"
import pkg from "../../package.json"
import { color, px, themeValue } from "@/site/theme-tokens"

export const metadata: Metadata = {
  title: { absolute: `${site.name} — one design language for every SYNCROBOTIC product` },
  alternates: { canonical: "/" },
}

const org = { "@type": "Organization", "@id": `${site.url}/#org`, name: "SYNCROBOTIC", logo: `${site.url}${site.logo}`, url: site.url }
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    org,
    { "@type": "WebSite", "@id": `${site.url}/#site`, name: site.name, url: site.url, description: site.description, publisher: { "@id": org["@id"] } },
    {
      "@type": "SoftwareSourceCode",
      name: site.name,
      description: site.description,
      codeRepository: site.repo,
      programmingLanguage: ["TypeScript", "CSS"],
      runtimePlatform: "React",
      keywords: site.keywords.join(", "),
      author: { "@id": org["@id"] },
    },
  ],
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
      <Badge>Docked</Badge>
      <Badge tone="danger">2 events</Badge>
      <Badge tone="outline">v2.4</Badge>
    </div>
  ),
  Feedback: (
    <div className="flex w-56 items-center gap-2 rounded-md bg-danger-subtle px-3 py-2 text-sm">
      <span className="font-bold text-danger">Critical</span>
      <span className="truncate">Collision risk · Hall B</span>
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
  Charts: (
    <div className="flex h-16 items-end gap-2">
      {[40, 64, 52, 80, 56, 72].map((h, i) => (
        <span key={i} className={cn("w-4 rounded-t-xs", i === 3 ? "bg-foreground" : "bg-muted-foreground/40")} style={{ height: `${h}%` }} />
      ))}
    </div>
  ),
  "Robot shell": (
    <span className="flex h-(--h-md) w-48 items-center justify-center rounded-md bg-stop text-sm font-bold text-white">Emergency stop · 7F3A</span>
  ),
}

/** A section opens with its title and one line; the title carries the weight, no label above it. */
function SectionHead({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal className="flex flex-col gap-2">
      <AppearItem>
        <h2 className="text-3xl font-bold">{title}</h2>
      </AppearItem>
      <AppearItem>
        <p className="max-w-2xl text-muted-foreground">{children}</p>
      </AppearItem>
    </Reveal>
  )
}

const componentCount = items.filter((i) => i.group !== "Hooks").length
const blockCount = Object.keys(placement).length

// The three rules the hero demonstrates, in the words the foundations use.
const rules = [
  {
    title: "Solid red means stop.",
    body: "The emergency stop is the only solid red on any screen. Everything else that is wrong is a tint, a shape and a word.",
  },
  { title: "Colour means something is wrong.", body: "A calm fleet is grey. Blue means work in progress, amber needs attention, red needs someone now." },
  {
    title: "Made for one thumb, outdoors.",
    body: "Dark by default, 44 px touch targets, status as a shape and a word so it reads in sunlight and without colour.",
  },
]

export default function HomePage() {
  const firstOf = (g: string) => items.find((i) => i.group === g)?.name
  return (
    <main id="content" className="pb-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-section-sm px-4 py-section-sm lg:py-section">
          <Appear stagger={0.04} className="flex flex-col gap-6">
            <AppearItem>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">Interfaces for the people who run robots.</h1>
            </AppearItem>
            <AppearItem>
              <p className="max-w-2xl text-lg text-muted-foreground">
                The SYNCROBOTIC design language, written down once: tokens, {componentCount} React components and {blockCount} blocks for fleet consoles and the
                apps operators hold outdoors.
              </p>
            </AppearItem>
            <AppearItem className="flex flex-wrap gap-3">
              <Link
                href="/docs/foundations"
                className="press inline-flex h-(--h-lg) items-center gap-2 rounded-sm bg-primary px-6 font-medium text-primary-foreground"
              >
                Read the foundations <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link
                href="/docs/components/button"
                className="press inline-flex h-(--h-lg) items-center rounded-sm bg-secondary px-6 font-medium hover:bg-accent"
              >
                Browse components
              </Link>
            </AppearItem>
          </Appear>
          {/* The exhibit beside the three rules it demonstrates: a working stop, not a screenshot. */}
          <Appear stagger={0.06} className="grid items-start gap-8 lg:grid-cols-[auto_1fr]">
            <AppearItem>
              <HeroDemo />
            </AppearItem>
            <AppearItem>
              <dl className="flex flex-col border-t border-border">
                {rules.map((r) => (
                  <div key={r.title} className="grid gap-2 border-b border-border py-6 sm:grid-cols-[14rem_1fr] sm:gap-8">
                    <dt className="font-bold">{r.title}</dt>
                    <dd className="max-w-prose text-muted-foreground">{r.body}</dd>
                  </div>
                ))}
              </dl>
            </AppearItem>
          </Appear>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-section-sm lg:pt-section">
        <SectionHead title="The decisions behind every screen">
          Read these before you design or build. Every value is parsed from the theme file, so the docs never drift from what ships.
        </SectionHead>
        <FoundationGrid />
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-section-sm lg:pt-section">
        <SectionHead title="The language, already applied">
          {items.filter((i) => i.group !== "Hooks").length} components built on the tokens: general UI for any product, plus the robot shell for control apps.
        </SectionHead>
        {/* Same arrival and the same hover as the Foundations grid: lift the exhibit, show the arrow. */}
        <Reveal className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups
            .filter((g) => g !== "Hooks")
            .map((g) => {
              const list = items.filter((i) => i.group === g)
              // Eight groups: four rows of two; on three columns the robot shell (what sets this kit apart) takes two cells
              // so the last row is full, exhibit and text side by side.
              const wide = g === "Robot shell"
              return (
                <AppearItem key={g} className={cn("flex", wide && "lg:col-span-2")}>
                  <Link
                    href={`/docs/components/${firstOf(g)}`}
                    className={cn(
                      `press group flex w-full flex-col overflow-hidden rounded-md border border-border transition-colors hover:border-muted-foreground ${fast}`,
                      wide && "lg:flex-row",
                    )}
                  >
                    <div aria-hidden inert className={cn("specimen flex h-36 items-center justify-center p-6", wide && "lg:h-auto lg:w-1/2")}>
                      <div className={`transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 ${fast}`}>{samples[g]}</div>
                    </div>
                    <div
                      className={cn(
                        "flex flex-1 flex-col gap-1 border-t border-border bg-card p-4",
                        wide && "lg:justify-center lg:border-t-0 lg:border-l lg:p-6",
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-bold">{g}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{list.length}</span>
                          <ArrowUpRight
                            aria-hidden
                            className={`size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,translate] group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:group-hover:translate-x-0 ${fast}`}
                          />
                        </span>
                      </span>
                      <span className="text-sm text-muted-foreground">{list.map((i) => i.title).join(", ")}</span>
                    </div>
                  </Link>
                </AppearItem>
              )
            })}
        </Reveal>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-section-sm lg:pt-section">
        <SectionHead title="Whole screens, ready to install">
          {blockCount} blocks built from those components, with real copy and real states. Install one and it lands as source you own.
        </SectionHead>
        <Reveal className="flex flex-col border-t border-border">
          {blockGroups.map((g) => {
            const types = blockTypes.filter((t) => t.group === g)
            const count = Object.values(placement).filter((p) => types.some((t) => t.slug === p.type)).length
            return (
              <AppearItem key={g}>
                <Link
                  href={`/blocks#group-${g}`}
                  className={`group grid gap-2 border-b border-border py-6 sm:grid-cols-[14rem_1fr_auto] sm:items-baseline sm:gap-8 ${fast}`}
                >
                  <span className="text-xl font-bold group-hover:underline">{g}</span>
                  <span className="text-muted-foreground">{types.map((t) => t.title).join(", ")}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">{count} blocks</span>
                </Link>
              </AppearItem>
            )
          })}
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-section-sm lg:pt-section">
        <Reveal>
          <AppearItem className="grid items-center gap-8 border-t border-border pt-8 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-bold">Use it in a project</h2>
              <p className="text-muted-foreground">
                Install the theme and components into any React or Next.js app with the shadcn CLI. The theme replaces shadcn&apos;s defaults; components land
                as source you can read and adapt.
              </p>
              <Link
                href="/docs/installation"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"
              >
                Installation guide <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <CodeBlock
              code={"npx shadcn add @syncrobotic/syncrobotic-theme\nnpx shadcn add @syncrobotic/button @syncrobotic/card"}
              lang="bash"
              title="Terminal"
            />
          </AppearItem>
        </Reveal>
        <p className="pt-6 text-center font-mono text-xs text-muted-foreground">
          Version {pkg.version} · body text {px(themeValue("text-base"))} px
        </p>
      </section>
    </main>
  )
}
