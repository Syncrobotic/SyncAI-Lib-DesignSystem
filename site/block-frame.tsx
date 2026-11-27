"use client"

import * as React from "react"
import { Code, Eye, Monitor, Smartphone, Tablet } from "lucide-react"
import { cn } from "@/lib/utils"
import * as m from "motion/react-m"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"
import { t } from "./motion"
import { TabPanel } from "./tab-panel"
import { loadCode } from "./lazy-code"

const widths = { desktop: 1280, tablet: 768, mobile: 390 } as const
type Viewport = keyof typeof widths

type FrameProps = {
  name: string
  height: number
  initial: "desktop" | "mobile"
  code: React.ReactNode
  /** The listings' addresses, fetched as the pointer or focus reaches the Code tab, so it opens filled. */
  prefetch?: string[]
  /** content: the frame is as tall as the block at the chosen width, so nothing is cut off or left empty. screen: a fixed screen height, for app shells. */
  fit?: "content" | "screen"
}

/** How a card goes live: the width its preview has, and what the reader asked of the still card, if they used it. */
type Start = { avail: number; tab?: "preview" | "code"; vp?: Viewport }

// The boxes the still card and the live one share, so the two are the same size and the swap moves nothing.
const cardClass = "overflow-hidden rounded-md border border-border bg-card"
const barClass = "flex min-h-(--h-row) flex-wrap items-center justify-between gap-2 border-b border-border px-4"
const stageClass = "specimen p-0 sm:p-4"
const frameClass = "mx-auto overflow-hidden sm:rounded-sm sm:ring-1 sm:ring-border"
const captionClass = "hidden pt-2 text-center font-mono text-xs text-muted-foreground sm:block"
// Below a 640 px preview the card shows the phone view (LiveFrame picks it from the measured width; the still card from
// the frame-narrow container variant in app/globals.css, the same width).
const narrow = 640

/**
 * A block in one card: Preview / Code tabs. The preview is an iframe at the real device width (1280, 768 or 390) scaled
 * to fit, so breakpoints behave as on that device; a phone view on a phone takes the width there is.
 * The card goes live within a screen of the viewport (site/when-near.tsx): hydrating a chart's twenty Patterns cards at
 * once costs seconds on a phone. Until then it is a still card of the same size, drawn by CSS alone, so nothing moves
 * when it swaps. Its controls are real (in the tab order, named): using one brings the card live with that choice made
 * and the focus kept.
 */
export function BlockFrame(props: FrameProps) {
  const root = React.useRef<HTMLDivElement>(null)
  const stage = React.useRef<HTMLDivElement>(null)
  const [start, setStart] = React.useState<Start | null>(null)
  // The still control that has the focus, so its live twin takes it over.
  const focused = React.useRef<string | undefined>(undefined)
  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        React.startTransition(() => setStart((s) => s ?? { avail: inner(stage.current) }))
      },
      { rootMargin: "100% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  if (start) return <LiveFrame {...props} start={start} focusRef={focused} />
  return (
    <div
      ref={root}
      onFocus={(e) => {
        focused.current = e.target instanceof HTMLElement ? e.target.dataset.control : undefined
        React.startTransition(() => setStart((s) => s ?? { avail: inner(stage.current) }))
      }}
      onBlur={(e) => {
        if (e.relatedTarget) focused.current = undefined
      }}
    >
      <StillFrame
        {...props}
        stage={stage}
        use={(ask, control) => {
          focused.current = control
          setStart((s) => s ?? { avail: inner(stage.current), ...ask })
        }}
      />
    </div>
  )
}

/** The stage's width inside its padding (sm:p-4): the box the live card measures. */
function inner(el: HTMLElement | null) {
  if (!el) return 0
  const s = getComputedStyle(el)
  return el.getBoundingClientRect().width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
}

/**
 * The card before it is live: the same bar, tabs and device widths, as plain buttons, and an empty frame of the live
 * frame's size. Tabs read as tabs (Preview selected), the widths as toggles, so a screen reader says what the card holds.
 */
function StillFrame({
  name,
  height,
  initial,
  prefetch = [],
  stage,
  use,
}: FrameProps & { stage: React.RefObject<HTMLDivElement | null>; use: (ask: Omit<Start, "avail">, control: string) => void }) {
  const trigger = "-mb-px inline-flex h-(--h-md) items-center gap-2 border-b-2 text-sm whitespace-nowrap [&_svg]:size-4"
  const box = {
    "--frame-w": `${widths[initial]}px`,
    "--frame-phone": `${widths.mobile}px`,
    "--frame-ar": `${widths[initial]} / ${height}`,
    "--frame-h": `${height}px`,
  } as React.CSSProperties
  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-0">
        <div className={barClass}>
          {/* TabsList and TabsTrigger as they render with Preview active, before the underline is measured. */}
          <div role="tablist" aria-label="View" aria-orientation="horizontal" className="group/tabs relative flex shrink-0 gap-4 overflow-visible">
            <button
              type="button"
              role="tab"
              aria-selected="true"
              data-state="active"
              data-control="preview"
              onClick={() => use({}, "preview")}
              className={cn(trigger, "border-foreground font-medium text-foreground")}
            >
              <Eye aria-hidden="true" /> Preview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              data-state="inactive"
              data-control="code"
              tabIndex={-1}
              onClick={() => use({ tab: "code" }, "code")}
              onPointerEnter={() => prefetch.forEach(loadCode)}
              className={cn(trigger, "border-transparent text-muted-foreground hover:text-foreground")}
            >
              <Code aria-hidden="true" /> Code
            </button>
          </div>
          <Tools name={name} vp={initial} onPick={(v) => use({ vp: v }, `vp-${v}`)} />
        </div>
        <div role="tabpanel" aria-label="Preview" className={cn("@container rounded-xs", stageClass)} ref={stage}>
          <div className="w-full">
            <div
              style={box}
              className={cn(
                frameClass,
                "w-full bg-background",
                initial === "desktop"
                  ? "aspect-(--frame-ar) max-w-(--frame-w) frame-narrow:aspect-auto frame-narrow:h-(--frame-h) frame-narrow:max-w-(--frame-phone)"
                  : "h-(--frame-h) max-w-(--frame-w)",
              )}
            />
          </div>
          <p className={captionClass}>
            <span className="frame-narrow:hidden">{widths[initial]}px</span>
            <span className="hidden frame-narrow:inline">{widths.mobile}px</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/** The device widths and the Open link, at the bar's end while the preview is shown. */
function Tools({ name, vp, onPick, live = false }: { name: string; vp: Viewport; onPick: (v: Viewport) => void; live?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* On a phone only the phone view can be read (a desktop layout would be shown at a quarter), so the
          choice of width is not offered there; Open shows the block on its own page. */}
      <div role="group" aria-label="Device width" className="hidden gap-1 rounded-sm bg-muted p-1 sm:inline-flex">
        {(
          [
            ["desktop", Monitor],
            ["tablet", Tablet],
            ["mobile", Smartphone],
          ] as const
        ).map(([v, Icon]) => (
          <button
            key={v}
            type="button"
            data-control={`vp-${v}`}
            aria-label={`${v} view, ${widths[v]} pixels`}
            aria-pressed={vp === v}
            onClick={() => onPick(v)}
            className={cn(
              "press relative flex size-(--h-sm) items-center justify-center rounded-xs transition-colors duration-(--motion-fast) ease-(--ease-standard)",
              vp === v ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {vp === v &&
              (live ? (
                <m.span layoutId={`${name}-viewport-marker`} aria-hidden className="absolute inset-0 rounded-xs bg-primary" />
              ) : (
                <span aria-hidden className="absolute inset-0 rounded-xs bg-primary" />
              ))}
            <Icon aria-hidden className="relative size-4" />
          </button>
        ))}
      </div>
      <a
        href={`/preview/${name}`}
        target="_blank"
        rel="noreferrer"
        data-control="open"
        className="inline-flex min-h-(--h-sm) items-center px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        Open ↗
      </a>
    </div>
  )
}

/** The live card: tabs, the device widths and the iframe. */
function LiveFrame({
  name,
  height,
  initial,
  code,
  prefetch = [],
  fit = "content",
  start,
  focusRef,
}: FrameProps & { start: Start; focusRef: React.RefObject<string | undefined> }) {
  const [contentH, setContentH] = React.useState<number | null>(null)
  const observer = React.useRef<ResizeObserver | null>(null)
  React.useEffect(() => () => observer.current?.disconnect(), [])

  // Same-origin frame: watch the block's root and follow its height (it changes with the device width).
  const measure = (f: HTMLIFrameElement) => {
    observer.current?.disconnect()
    const win = f.contentWindow as (Window & typeof globalThis) | null
    const root = f.contentDocument?.getElementById("block-root")
    if (fit !== "content" || !win || !root) return
    observer.current = new win.ResizeObserver(() => setContentH(Math.ceil(root.getBoundingClientRect().height)))
    observer.current.observe(root)
  }
  // It starts at the width the still card measured, so the frame is drawn at its size at once, not animated down to it.
  const [vp, setVp] = React.useState<Viewport>(start.vp ?? (start.avail > 0 && start.avail < narrow ? "mobile" : initial))
  const [tab, setTab] = React.useState<string>(start.tab ?? "preview")
  // The preview the card went live with does not play the tab's arrival again; a tab the reader picks does.
  const [switched, setSwitched] = React.useState(false)
  const [avail, setAvail] = React.useState(start.avail)
  const box = React.useRef<HTMLDivElement>(null)
  const frame = React.useRef<HTMLIFrameElement>(null)
  const card = React.useRef<HTMLDivElement>(null)

  // The still card's focused control was replaced by this one: its twin takes the focus, unless the focus has moved on.
  React.useLayoutEffect(() => {
    const control = focusRef.current
    if (!control || (document.activeElement && document.activeElement !== document.body)) return
    card.current?.querySelector<HTMLElement>(`[data-control="${control}"]`)?.focus({ preventScroll: true })
  }, [focusRef])

  // On a phone a desktop-width preview would shrink to a quarter and be unreadable: start at the phone width there,
  // unless the reader picked a width themselves.
  const picked = React.useRef(!!start.vp)
  const pick = (v: Viewport) => {
    picked.current = true
    setVp(v)
  }
  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setAvail(e.contentRect.width)
      if (!picked.current && e.contentRect.width < narrow) setVp("mobile")
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [tab])

  // Keep the frame's dark/light in step with the page.
  React.useEffect(() => {
    const sync = () => frame.current?.contentDocument?.documentElement.classList.toggle("dark", document.documentElement.classList.contains("dark"))
    const obs = new MutationObserver(sync)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  // The frame may finish loading before React attaches onLoad (it starts with the server HTML), so check once mounted too.
  React.useEffect(() => {
    const f = frame.current
    if (f?.contentDocument?.readyState === "complete") {
      f.contentDocument.documentElement.classList.toggle("dark", document.documentElement.classList.contains("dark"))
      measure(f)
    }
    // measure only reads refs and props that do not change for a mounted frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // On a phone the phone view is drawn at the width there is, at 100 %: a 390 px layout scaled to fit would set its
  // text near 8 px. Wider views still scale down (a desktop layout cannot reflow into a phone).
  const width = vp === "mobile" && avail > 0 && avail < widths.mobile ? Math.floor(avail) : widths[vp]
  const frameH = fit === "content" && contentH ? contentH : height
  const scale = avail > 0 ? Math.min(1, avail / width) : 1

  return (
    <div ref={card} className={cardClass}>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setSwitched(true)
          setTab(v)
        }}
        className="gap-0"
      >
        {/* One height whichever tab is open, so switching to Code does not shift the frame. */}
        <div className={barClass}>
          <TabsList aria-label="View" className="shrink-0 overflow-visible border-b-0">
            <TabsTrigger value="preview" data-control="preview">
              <Eye aria-hidden="true" /> Preview
            </TabsTrigger>
            <TabsTrigger value="code" data-control="code" onPointerEnter={() => prefetch.forEach(loadCode)} onFocus={() => prefetch.forEach(loadCode)}>
              <Code aria-hidden="true" /> Code
            </TabsTrigger>
          </TabsList>
          {tab === "preview" && <Tools name={name} vp={vp} onPick={pick} live />}
        </div>
        {/* On a phone the block fills the card: no stage padding and no second frame inside the card's own border. */}
        <TabsContent value="preview" className={cn(stageClass, !switched && "data-[state=active]:animate-none")}>
          <div ref={box} className="w-full">
            {/* Changing the device width resizes the frame with the sheet duration; the iframe re-lays out at the new width. */}
            <m.div className={frameClass} initial={false} animate={{ width: width * scale, height: frameH * scale }} transition={t.sheet}>
              <iframe
                ref={frame}
                src={`/preview/${name}`}
                title={`${name} preview at ${width} pixels`}
                // A frame runs the whole site's scripts on the page's main thread; a chart's page has a dozen. Only the ones near
                // the screen load.
                loading="lazy"
                onLoad={(e) => {
                  e.currentTarget.contentDocument?.documentElement.classList.toggle("dark", document.documentElement.classList.contains("dark"))
                  measure(e.currentTarget)
                }}
                className="origin-top-left bg-background"
                style={{ width, height: frameH, transform: `scale(${scale})` }}
              />
            </m.div>
          </div>
          <p className={captionClass}>
            {width}px{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ""}
          </p>
        </TabsContent>
        <TabsContent value="code">
          <TabPanel className="[&>div]:rounded-none [&>div]:border-0">{code}</TabPanel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
