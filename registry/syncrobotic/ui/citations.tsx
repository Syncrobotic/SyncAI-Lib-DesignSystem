// @syncrobotic/citations v0.50.0 · update: npx shadcn add @syncrobotic/citations --overwrite
"use client"

import * as React from "react"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { prefersReducedMotion } from "@/registry/syncrobotic/hooks/use-reduced-motion"
import { Button } from "@/registry/syncrobotic/ui/button"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

/*
  The sources a model's answer cites, as a retrieval-augmented answer writes them: numbered markers in the text ([1])
  and the numbered list of what they point at (title, where it is, a snippet).

  Linked both ways, as grounded-text links its words to the marks on a picture: hover or keyboard focus on a marker
  highlights its source, and on a source highlights every marker that cites it; the highlight is the kit's inverted
  number and the hover fill, never a colour. Activating a marker (a click, Enter) moves focus to its source and shows
  "Back to citation N" there; that button, or Esc, brings focus back to the marker it came from.

  A marker is a link to its entry (#id), so it still goes there without JavaScript, named "Source 1: <title>" for
  screen readers (the visible "1" starts its name). A number with no source is the text "[N]".

  `Citations` holds the sources and the linking; put the answer and `CitationSources` inside it. In Markdown, pass
  `cite={citationMarker}`: [1], [^1] and [1, 2] in the model's text become markers.
*/

export type CitationSource = {
  title: string
  /** Opened in a new tab when it is http(s); any other URL is shown, not linked. */
  url?: string
  /** Where it is, in place of the URL's domain and path: a file name and page, a manual's section. */
  location?: string
  /** The passage the answer used, a sentence or two. */
  snippet?: string
}

export type CitationsLabels = {
  /** A marker's name: "Source 1: Docking manual". */
  marker: (n: number, title: string) => string
  /** The list's title. */
  sources: string
  /** The button in a source reached from a marker, back to that marker. */
  back: (n: number) => string
  /** After a source's title that opens in a new tab, for screen readers. */
  newTab: string
}

export const defaultCitationsLabels: CitationsLabels = {
  marker: (n, title) => `Source ${n}: ${title}`,
  sources: "Sources",
  back: (n) => `Back to citation ${n}`,
  newTab: "(opens in a new tab)",
}

/** Where a source is, in a short line: its `location`, or its URL's host (without www.) and path. */
export function citationLocation(source: CitationSource): string | undefined {
  if (source.location) return source.location
  if (!source.url) return undefined
  try {
    const url = new URL(source.url)
    if (url.protocol !== "http:" && url.protocol !== "https:") return source.url
    let path = url.pathname === "/" ? "" : url.pathname
    try {
      path = decodeURI(path)
    } catch {}
    return url.host.replace(/^www\./, "") + path
  } catch {
    return source.url
  }
}

const httpUrl = (url: string | undefined) => {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null
  } catch {
    return null
  }
}

type Context = {
  sources: readonly CitationSource[]
  id: string
  labels: CitationsLabels
  active: number | null
  arrived: number | null
  point: (n: number | null) => void
  focus: (n: number | null) => void
  go: (n: number, marker: HTMLElement) => boolean
  back: () => void
  leave: (n: number) => void
}

const CitationsContext = React.createContext<Context | null>(null)

/** Keyboard focus only: a click that focuses a marker is a jump, not a hover. */
const keyboardFocus = (el: Element) => {
  try {
    return el.matches(":focus-visible")
  } catch {
    return true
  }
}

/**
 * The sources of one answer and the linking between its markers and its list. Put the text (Markdown with
 * `cite={citationMarker}`, or CitationMarker anywhere) and CitationSources inside.
 */
export function Citations({
  sources,
  labels: labelsProp,
  onActiveChange,
  children,
}: {
  /** The sources in the order the text numbers them: [1] is the first. */
  sources: readonly CitationSource[]
  labels?: Partial<CitationsLabels>
  /** The source highlighted from a marker or an entry under the pointer or keyboard (1-based), or null. */
  onActiveChange?: (n: number | null) => void
  children: React.ReactNode
}) {
  const id = React.useId()
  const [pointer, setPointer] = React.useState<number | null>(null)
  const [focused, setFocused] = React.useState<number | null>(null)
  const [arrived, setArrived] = React.useState<number | null>(null)
  const returnTo = React.useRef<HTMLElement | null>(null)
  const active = pointer ?? focused

  const report = React.useEffectEvent((n: number | null) => {
    onActiveChange?.(n)
  })
  React.useEffect(() => {
    report(active)
  }, [active])

  const labels = React.useMemo(() => ({ ...defaultCitationsLabels, ...labelsProp }), [labelsProp])
  const value = React.useMemo<Context>(
    () => ({
      sources,
      id,
      labels,
      active,
      arrived,
      point: setPointer,
      focus: setFocused,
      go: (n, marker) => {
        const entry = document.getElementById(`${id}-source-${n}`)
        if (!entry) return false
        returnTo.current = marker
        setArrived(n)
        entry.focus({ preventScroll: true })
        entry.scrollIntoView?.({ block: "nearest", behavior: prefersReducedMotion(true) ? "auto" : "smooth" })
        return true
      },
      back: () => {
        const marker = returnTo.current
        returnTo.current = null
        setArrived(null)
        if (marker?.isConnected) marker.focus()
      },
      leave: (n) => setArrived((a) => (a === n ? null : a)),
    }),
    [sources, id, labels, active, arrived],
  )
  return <CitationsContext.Provider value={value}>{children}</CitationsContext.Provider>
}

/**
 * A citation in the text: the source's number, a link to its entry in CitationSources, named "Source N: <title>".
 * Outside Citations, or for a number with no source, it is the text "[N]".
 */
export function CitationMarker({ n, className }: { /** The source's number, 1-based. */ n: number; className?: string }) {
  const ctx = React.useContext(CitationsContext)
  const source = ctx?.sources[n - 1]
  if (!ctx || !source) return <>[{n}]</>
  const lit = ctx.active === n
  return (
    <a
      href={`#${ctx.id}-source-${n}`}
      data-slot="citation-marker"
      data-active={lit || undefined}
      aria-label={ctx.labels.marker(n, source.title)}
      onClick={(e) => {
        if (ctx.go(n, e.currentTarget)) e.preventDefault()
      }}
      onPointerEnter={(e) => e.pointerType !== "touch" && ctx.point(n)}
      onPointerLeave={(e) => e.pointerType !== "touch" && ctx.point(null)}
      onFocus={(e) => keyboardFocus(e.currentTarget) && ctx.focus(n)}
      onBlur={() => ctx.focus(null)}
      // A small number on the quiet fill, a step up from the text; lit, it inverts, as the kit marks what is selected.
      // Inline in a sentence it keeps the line's leading (WCAG 2.5.8 exempts it); on touch its padding reaches into the
      // gap between lines, without moving them, so a tap still lands.
      className={cn(
        "mx-0.5 rounded-2xs bg-muted px-1 align-baseline text-xs font-medium text-muted-foreground tabular-nums no-underline box-decoration-clone",
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring any-pointer-coarse:py-1",
        lit && "bg-foreground text-background hover:bg-foreground hover:text-background",
        className,
      )}
    >
      {n}
    </a>
  )
}

/** Renders a citation token for Markdown's `cite`: `<Markdown cite={citationMarker} />` inside Citations. */
export const citationMarker = (n: number) => <CitationMarker n={n} />

/**
 * The numbered list of sources: each a number, its title (a link that opens in a new tab when it has an http(s) URL),
 * where it is and its snippet. A marker's jump lands on its entry, which offers the way back.
 */
export function CitationSources({
  title,
  as = "h3",
  className,
}: {
  /** The list's title; `labels.sources` ("Sources") by default, null for none (name it yourself then). */
  title?: React.ReactNode | null
  /** The title's heading level, so the page's outline skips none. */
  as?: "h2" | "h3" | "h4"
  className?: string
}) {
  const ctx = React.useContext(CitationsContext)
  const headingId = React.useId()
  if (!ctx || !ctx.sources.length) return null
  const heading = title === undefined ? ctx.labels.sources : title
  return (
    <section data-slot="citation-sources" aria-labelledby={heading ? headingId : undefined} aria-label={heading ? undefined : ctx.labels.sources} className={cn("flex min-w-0 flex-col gap-2", className)}>
      {heading && <SectionHeader variant="surface" as={as} id={headingId} title={heading} />}
      <ol className="flex flex-col gap-1">
        {ctx.sources.map((source, i) => (
          <SourceEntry key={i} n={i + 1} source={source} ctx={ctx} />
        ))}
      </ol>
    </section>
  )
}

function SourceEntry({ n, source, ctx }: { n: number; source: CitationSource; ctx: Context }) {
  const href = httpUrl(source.url)
  const where = citationLocation(source)
  const lit = ctx.active === n
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a jump target (tabIndex -1) for its citation; Esc here returns to the citation, hover mirrors focus
    <li
      id={`${ctx.id}-source-${n}`}
      tabIndex={-1}
      data-slot="citation-source"
      data-active={lit || undefined}
      onPointerEnter={(e) => e.pointerType !== "touch" && ctx.point(n)}
      onPointerLeave={(e) => e.pointerType !== "touch" && ctx.point(null)}
      onFocus={(e) => (e.target === e.currentTarget || keyboardFocus(e.target)) && ctx.focus(n)}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        ctx.focus(null)
        ctx.leave(n)
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || ctx.arrived !== n) return
        // Esc that went back stops here, so it does not also close a dialog around the answer.
        e.stopPropagation()
        e.preventDefault()
        ctx.back()
      }}
      className={cn(
        "flex scroll-my-4 gap-3 rounded-sm p-2 text-sm",
        // The entry takes focus only from a marker's jump; from the keyboard it shows the kit's ring.
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        lit && "bg-accent",
      )}
    >
      <span
        className={cn(
          // Centred on the title's first line (14 px text on a 20 px line, the number's 16 px line 2 px down).
          "mt-0.5 h-fit shrink-0 rounded-2xs px-1 text-xs font-medium tabular-nums transition-colors duration-(--motion-fast) ease-(--ease-standard)",
          lit ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
        )}
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            data-slot="citation-source-link"
            className="self-start rounded-2xs font-medium text-foreground underline decoration-muted-foreground underline-offset-4 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <TitleWithIcon title={source.title} />
            <span className="sr-only"> {ctx.labels.newTab}</span>
          </a>
        ) : (
          <span className="font-medium text-foreground">{source.title}</span>
        )}
        {where && <span className="truncate text-xs text-muted-foreground">{where}</span>}
        {source.snippet && <p className="line-clamp-3 text-muted-foreground">{source.snippet}</p>}
        {ctx.arrived === n && (
          <Button variant="ghost" size="sm" className="-ml-3 self-start" onClick={ctx.back}>
            {ctx.labels.back(n)}
          </Button>
        )}
      </div>
    </li>
  )
}

/** A title with the external-link icon kept on the line of its last word, so a narrow column never leaves the icon alone. */
function TitleWithIcon({ title }: { title: string }) {
  const cut = title.trimEnd().lastIndexOf(" ") + 1
  return (
    <>
      {title.slice(0, cut)}
      <span className="whitespace-nowrap">
        {title.slice(cut).trimEnd()}
        <ExternalLink aria-hidden="true" className="ms-2 inline size-4 align-text-bottom text-muted-foreground" />
      </span>
    </>
  )
}
