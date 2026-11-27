"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { promptFor } from "./ai-prompt"
import { BlockFrame } from "./block-frame"
import { LazyCode } from "./lazy-code"
import { textLink } from "./prose"
import { useNear } from "./when-near"

/** What a block's section shows, worked out on the server (site/block-section.tsx). */
export type BlockSectionData = {
  name: string
  title: string
  description: string
  /** What the Markdown button copies. */
  markdown: string
  /** The block's place in the docs (its page and anchor), and the site's address: the Prompt button's text names both. */
  href: string
  origin: string
  /** What it is built from, each with its page, or none (a plain chip). */
  uses: { name: string; href: string | null }[]
  height: number
  fit?: "content" | "screen"
  viewport: "desktop" | "mobile"
  /** The Code tab's listings, fetched when it opens (site/code-data.ts). */
  listings: { src: string; title: string; lang: "tsx" | "ts" | "css"; lines: number }[]
}

const chip = "inline-flex min-h-(--h-sm) items-center rounded-xs bg-muted px-2 font-mono text-xs"

/**
 * One block as the docs show it: title and tools, the description, the install command, what it is built from, then the
 * preview with its code. `near`: all but the title and description is drawn once within a screen of the viewport
 * (site/when-near.tsx); until then a box of about its height stands in. A chart's twenty Patterns blocks drawn in the
 * page would add 450 KB of HTML.
 */
export function BlockSectionView({ block: b, heading: H = "h3", install, near: lazy = false }: { block: BlockSectionData; heading?: "h3" | "h4"; install: React.ReactNode; near?: boolean }) {
  const ref = React.useRef<HTMLElement>(null)
  const isNear = useNear(ref, lazy)
  const shown = !lazy || isNear
  return (
    <section ref={ref} id={b.name} aria-labelledby={`${b.name}-title`} className="flex scroll-mt-20 flex-col gap-3">
      {/* Title and tools first; the description sits under them, so its length never moves the tools. */}
      <div className="flex flex-col gap-1">
        {/* On a phone the tools always take their own row under the title, two equal columns, whatever the title's
            length; from 640 px they sit at the row's end. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <H id={`${b.name}-title`} className="min-w-0 text-lg font-bold">
            {b.title}
          </H>
          {shown ? (
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
              <CopyButton value={b.markdown} variant="outline" label={`Copy ${b.title} as Markdown`}>
                Markdown
              </CopyButton>
              <CopyButton value={promptFor(b.origin, b.title, b.href, b.name)} variant="outline" label={`Copy a prompt for ${b.title}`}>
                Prompt
              </CopyButton>
            </div>
          ) : (
            // The two buttons' row, so the title sits where it will.
            <div aria-hidden="true" className="h-(--h-sm) shrink-0" />
          )}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">{b.description}</p>
      </div>
      {shown ? (
        <>
          {install}
          {b.uses.length > 0 && (
            // On a phone the label takes its own line and the chips wrap under it, so no chip lands under the label as if it
            // were one; from 640 px the label leads the row.
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-start">
              <span className="shrink-0 sm:flex sm:min-h-(--h-sm) sm:items-center">Built from</span>
              <div data-wrap="free" className="flex flex-wrap gap-2">
                {/* A dependency is a component (its page) or another block (its place on its page). */}
                {b.uses.map((u) =>
                  u.href ? (
                    <Link key={u.name} href={u.href} className={`${chip} ${textLink}`}>
                      {u.name}
                    </Link>
                  ) : (
                    <span key={u.name} className={chip}>
                      {u.name}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
          <BlockFrame
            name={b.name}
            height={b.height}
            fit={b.fit}
            initial={b.viewport}
            // The Code tab is fetched when it opens (site/code-data.ts): the page carries where it is, not the listing.
            code={b.listings.map((l) => (
              <LazyCode key={l.src} {...l} />
            ))}
            prefetch={b.listings.map((l) => l.src)}
          />
        </>
      ) : (
        <Standin block={b} />
      )}
    </section>
  )
}

/**
 * The install listing, the "Built from" row and the preview card, as empty boxes of their size: the install listing one line
 * (two on a phone, where the command wraps), the row its label and one line of chips, the card's bar as tall as its tools
 * and its frame sized by CSS as the still card's is (site/block-frame.tsx). It is below the screen while it shows, so a
 * few pixels off (chips on a second line, a phone view taller than the block's desktop height) move nothing in view.
 */
function Standin({ block: b }: { block: BlockSectionData }) {
  const w = b.viewport === "desktop" ? 1280 : 390
  const box = { "--frame-w": `${w}px`, "--frame-phone": "390px", "--frame-ar": `${w} / ${b.height}`, "--frame-h": `${b.height}px` } as React.CSSProperties
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="h-32 rounded-md border border-border bg-card sm:h-25" />
      {b.uses.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="h-5 sm:hidden" />
          <div className="h-(--h-sm)" />
        </div>
      )}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        {/* The bar: at least a row, and as tall as the device widths' group (or the Open link on a phone) with its padding. */}
        <div className="min-h-(--h-row) border-b border-border py-2">
          <div className="h-(--h-sm) sm:box-content sm:p-1" />
        </div>
        <div className="@container specimen p-0 sm:p-4">
          <div
            style={box}
            className={cn(
              "mx-auto w-full bg-background sm:rounded-sm sm:ring-1 sm:ring-border",
              b.viewport === "desktop"
                ? "aspect-(--frame-ar) max-w-(--frame-w) frame-narrow:aspect-auto frame-narrow:h-(--frame-h) frame-narrow:max-w-(--frame-phone)"
                : "h-(--frame-h) max-w-(--frame-w)",
            )}
          />
          {/* The caption under the frame. */}
          <div className="hidden h-6 sm:block" />
        </div>
      </div>
    </div>
  )
}
