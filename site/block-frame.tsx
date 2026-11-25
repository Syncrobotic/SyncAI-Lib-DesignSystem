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

/**
 * A block in one card: Preview / Code tabs. The preview is an iframe rendered at the real device width
 * (1280, 768 or 390) and scaled down to fit, so breakpoints behave as they would on that device. A phone view on a
 * phone takes the width there is instead, so its text is read at full size.
 */
export function BlockFrame({
  name,
  height,
  initial,
  code,
  prefetch = [],
  fit = "content",
}: {
  name: string
  height: number
  initial: "desktop" | "mobile"
  code: React.ReactNode
  /** The listings' addresses, fetched as the pointer or focus reaches the Code tab, so it opens filled. */
  prefetch?: string[]
  /** content: the frame is as tall as the block at the chosen width, so nothing is cut off or left empty. screen: a fixed screen height, for app shells. */
  fit?: "content" | "screen"
}) {
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
  const [vp, setVp] = React.useState<Viewport>(initial)
  const [tab, setTab] = React.useState("preview")
  const [avail, setAvail] = React.useState(0)
  const box = React.useRef<HTMLDivElement>(null)
  const frame = React.useRef<HTMLIFrameElement>(null)

  // On a phone a desktop-width preview would shrink to a quarter and be unreadable: start at the phone width there,
  // unless the reader picked a width themselves.
  const picked = React.useRef(false)
  const pick = (v: Viewport) => {
    picked.current = true
    setVp(v)
  }
  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setAvail(e.contentRect.width)
      if (!picked.current && e.contentRect.width < 640) setVp("mobile")
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
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <Tabs value={tab} onValueChange={setTab} className="gap-0">
        {/* One height whichever tab is open, so switching to Code does not shift the frame. */}
        <div className="flex min-h-(--h-row) flex-wrap items-center justify-between gap-2 border-b border-border px-4">
          <TabsList aria-label="View" className="shrink-0 overflow-visible border-b-0">
            <TabsTrigger value="preview">
              <Eye aria-hidden="true" /> Preview
            </TabsTrigger>
            <TabsTrigger value="code" onPointerEnter={() => prefetch.forEach(loadCode)} onFocus={() => prefetch.forEach(loadCode)}>
              <Code aria-hidden="true" /> Code
            </TabsTrigger>
          </TabsList>
          {tab === "preview" && (
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
                    aria-label={`${v} view, ${widths[v]} pixels`}
                    aria-pressed={vp === v}
                    onClick={() => pick(v)}
                    className={cn(
                      "press relative flex size-(--h-sm) items-center justify-center rounded-xs transition-colors duration-(--motion-fast) ease-(--ease-standard)",
                      vp === v ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {vp === v && <m.span layoutId={`${name}-viewport-marker`} aria-hidden className="absolute inset-0 rounded-xs bg-primary" />}
                    <Icon aria-hidden className="relative size-4" />
                  </button>
                ))}
              </div>
              <a href={`/preview/${name}`} target="_blank" rel="noreferrer" className="inline-flex min-h-(--h-sm) items-center px-2 text-sm text-muted-foreground hover:text-foreground">
                Open ↗
              </a>
            </div>
          )}
        </div>
        {/* On a phone the block fills the card: no stage padding and no second frame inside the card's own border. */}
        <TabsContent value="preview" className="specimen p-0 sm:p-4">
          <div ref={box} className="w-full">
            {/* Changing the device width resizes the frame with the sheet duration; the iframe re-lays out at the new width. */}
            <m.div
              className="mx-auto overflow-hidden sm:rounded-sm sm:ring-1 sm:ring-border"
              initial={false}
              animate={{ width: width * scale, height: frameH * scale }}
              transition={t.sheet}
            >
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
          <p className="hidden pt-2 text-center font-mono text-xs text-muted-foreground sm:block">
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
