import type { Metadata } from "next"
import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { items } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { site } from "@/site/config"
import { Appear, AppearItem, Reveal } from "@/site/appear"
import { fast } from "@/site/foundation-previews"
import { foundations } from "@/site/foundations"
import { iconCount } from "@/site/icons"
import { HeroDemo } from "@/site/hero-demo"
import { LiveSpecimen } from "@/site/home-live"
import { getBlockType, placement } from "@/site/block-types"
import { PageTransition } from "@/site/page-transition"
import { SiteFooter } from "@/site/site-footer"
import { textLink } from "@/site/prose"

export const metadata: Metadata = {
  // Under 580 px in a results page (about 55 characters): the longer form was cut off.
  title: { absolute: `${site.name}: robotics UI kit for React` },
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
      alternateName: "Robotics UI kit for React",
      description: site.description,
      codeRepository: site.repo,
      programmingLanguage: ["TypeScript", "CSS"],
      runtimePlatform: "React",
      keywords: site.keywords.join(", "),
      author: { "@id": org["@id"] },
    },
  ],
}

const componentCount = items.filter((i) => i.group !== "Hooks & libraries").length
// Blocks are compositions; one component's ready-made variants (charts, timelines…) count as its patterns instead.
const isPattern = (name: string) => !!getBlockType(placement[name].type)?.home
const blockCount = Object.keys(placement).filter((n) => !isPattern(n)).length
const patternCount = Object.keys(placement).filter(isPattern).length

// The three rules the hero demonstrates, in the words the foundations use.
const rules = [
  {
    title: "Solid red means stop.",
    body: "The emergency stop is the only solid red on any screen. Everything else that is wrong is a tint, a shape and a word.",
  },
  {
    title: "Colour is for what needs someone.",
    body: "A calm fleet is grey, busy or idle. Amber needs attention, red needs someone now; blue only marks a process you are waiting on.",
  },
  {
    title: "Made for one thumb, outdoors.",
    body: "44 px touch targets, and every status as a shape and a word, so it reads in glare and without colour vision.",
  },
]

// The live specimens under "See it run" (site/home-live.tsx), each in a box of fixed height so its placeholder is the same.
const live = [
  {
    demo: "fleet",
    title: "What one robot sees",
    wide: true,
    size: "h-148 sm:h-156 lg:h-80",
    caption:
      "Four robots report every two seconds. A calm fleet stays grey; the one running low turns amber and says why in the list, and the view is its front lidar in 3D as it drives back to its dock through the racks.",
    links: [
      ["Point cloud", "/docs/components/point-cloud"],
      ["Meter", "/docs/components/meter"],
    ],
  },
  {
    demo: "telemetry",
    title: "Telemetry",
    wide: false,
    size: "h-80",
    caption: "Drive motor current, a reading every two seconds. When the left wheel works past its limit on the ramp, the legend says so in words.",
    links: [["Streaming chart", "/docs/components/streaming-chart"]],
  },
  {
    demo: "alarms",
    title: "Alarms",
    wide: false,
    size: "h-80",
    caption: "A critical alarm arrives, is acknowledged, clears and leaves. Rows are never tinted: priority is a shape and a word.",
    links: [["Alarm", "/docs/components/alarm"]],
  },
] as const

export default function HomePage() {
  // The three ways in, one row each: what it is, what is in it, how many.
  const ways = [
    {
      href: "/docs/foundations/principles",
      title: "Foundations",
      count: `${foundations.length} pages`,
      body: "The rules and tokens behind every screen: principles, colour, type, spacing, radius, elevation, motion, iconography, accessibility, alarms and data visualisation.",
    },
    {
      href: "/docs/components",
      title: "Components",
      count: `${componentCount} components`,
      body: `General UI on Radix, charts on Recharts with ${patternCount} ready-made patterns, and the robot shell: emergency stop, slide to release, dock and island.`,
    },
    {
      href: "/blocks",
      title: "Blocks",
      count: `${blockCount} blocks`,
      body: "Sections and whole screens with real copy and real states: application screens, and robot operations from fleet maps to incidents.",
    },
    {
      href: "/icons",
      title: "Icons",
      count: `${iconCount} icons`,
      body: "Each with the one thing it means, robot icons drawn to match, and every Lucide icon to search.",
    },
  ]
  return (
    <>
    {/* Outside PageTransition, a client component: React does not run a <script> rendered on the client and says so in
        the console. Here it is server HTML only. "<" is escaped, as in DocJsonLd, so no string in it can close the script. */}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <PageTransition>
    <main id="content" className="pb-section">

      {/* First screen: what it is and how to start on the left, the working stop it is about on the right. */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-section-sm px-4 py-section-sm lg:grid-cols-[1fr_auto] lg:py-section">
          <Appear stagger={0.04} className="flex flex-col gap-6">
            <AppearItem>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">Interfaces for the people who run robots.</h1>
            </AppearItem>
            <AppearItem>
              <p className="max-w-xl text-lg text-pretty text-muted-foreground">
                A robotics UI kit for React, written down once: tokens, {componentCount} components and {blockCount} blocks for fleet consoles and the
                apps operators hold outdoors.
              </p>
            </AppearItem>
            <AppearItem className="flex flex-wrap gap-3">
              <Link
                href="/docs/installation"
                className="press inline-flex h-(--h-lg) items-center gap-2 rounded-sm bg-primary px-6 font-medium text-primary-foreground"
              >
                Get started <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="/docs" className="press inline-flex h-(--h-lg) items-center rounded-sm bg-secondary px-6 font-medium hover:bg-accent">
                Read the foundations
              </Link>
            </AppearItem>
          </Appear>
          <Appear stagger={0.06}>
            <AppearItem>
              <HeroDemo />
            </AppearItem>
          </Appear>
        </div>
      </section>

      {/* How to start, straight after what it is: most visitors are here to install it. */}
      <section className="mx-auto max-w-6xl px-4 pt-section-sm">
        <Reveal showcase>
          <AppearItem className="grid items-center gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold">Install</h2>
              <p className="text-muted-foreground">
                In any React or Next.js app with Tailwind CSS v4, add the registry to <code className="font-mono text-sm">components.json</code>, then install the
                theme and what you need. Components land as source you own.
              </p>
              <Link
                href="/docs/installation"
                className="inline-flex min-h-(--h-sm) items-center gap-2 text-sm font-medium text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"
              >
                Installation guide <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <CodeBlock
              code={"npx shadcn add @syncrobotic/syncrobotic-theme\nnpx shadcn add @syncrobotic/console-overview"}
              lang="bash"
              title="Terminal"
            />
          </AppearItem>
        </Reveal>
      </section>

      {/* The three rules the stop above demonstrates. */}
      <section className="mx-auto max-w-6xl px-4 pt-section-sm">
        <h2 className="sr-only">Three rules</h2>
        <Reveal showcase className="grid border-t border-border sm:grid-cols-3 sm:gap-8">
          {rules.map((r) => (
            <AppearItem key={r.title} className="flex flex-col gap-2 border-b border-border py-6 sm:border-b-0">
              <h3 className="font-bold">{r.title}</h3>
              <p className="text-muted-foreground">{r.body}</p>
            </AppearItem>
          ))}
        </Reveal>
      </section>

      {/* The rules at work: the registry's components fed a simulated site, as a product would install and use them. */}
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-section-sm">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-2xl font-bold">See it run</h2>
          <p className="text-muted-foreground">
            The same components you install, fed a simulated site. Readings arrive every few seconds, as they do over a radio link, and nothing moves
            unless the data changed.
          </p>
        </div>
        <Reveal showcase className="grid gap-8 lg:grid-cols-2">
          {live.map((d) => (
            <AppearItem key={d.demo} className={d.wide ? "lg:col-span-2" : undefined}>
              <figure className="flex flex-col gap-4">
                <h3 className="font-bold">{d.title}</h3>
                <LiveSpecimen demo={d.demo} size={d.size} />
                <figcaption className="max-w-2xl text-sm text-pretty text-muted-foreground">
                  {d.caption}{" "}
                  {d.links.map(([name, href], i) => (
                    <React.Fragment key={href}>
                      {i > 0 && " · "}
                      <Link href={href} className={`font-medium ${textLink}`}>
                        {name}
                      </Link>
                    </React.Fragment>
                  ))}
                </figcaption>
              </figure>
            </AppearItem>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-section-sm">
        <h2 className="text-2xl font-bold">What is inside</h2>
        <Reveal showcase className="flex flex-col border-t border-border">
          {ways.map((w) => (
            <AppearItem key={w.href}>
              <Link
                href={w.href}
                className={`group grid gap-2 border-b border-border py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[12rem_1fr_auto] sm:items-baseline sm:gap-8 ${fast}`}
              >
                <span className="text-xl font-bold group-hover:underline">{w.title}</span>
                <span className="text-muted-foreground">{w.body}</span>
                <span className="flex items-center gap-2 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                  {w.count}
                  <ArrowRight
                    aria-hidden
                    className={`size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0 ${fast}`}
                  />
                </span>
              </Link>
            </AppearItem>
          ))}
        </Reveal>
      </section>
    </main>
    <SiteFooter />
    </PageTransition>
    </>
  )
}
