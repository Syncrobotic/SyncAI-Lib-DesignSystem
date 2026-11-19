"use client"

import * as React from "react"
import { Code, Eye, Monitor, Smartphone, Tablet } from "lucide-react"
import { cn } from "@/lib/utils"
import * as m from "motion/react-m"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"
import { t } from "./motion"
import { TabPanel } from "./tab-panel"

const widths = { desktop: 1280, tablet: 768, mobile: 390 } as const
type Viewport = keyof typeof widths

/**
 * A block in one card: Preview / Code tabs. The preview is an iframe rendered at the real device width
 * (1280, 768 or 390) and scaled down to fit, so breakpoints behave as they would on that device.
 */
export function BlockFrame({
  name,
  height,
  initial,
  code,
  fit = "content",
}: {
  name: string
  height: number
  initial: "desktop" | "mobile"
  code: React.ReactNode
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

  const width = widths[vp]
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
            <TabsTrigger value="code">
              <Code aria-hidden="true" /> Code
            </TabsTrigger>
          </TabsList>
          {tab === "preview" && (
            <div className="flex items-center gap-3 py-2">
              <div role="group" aria-label="Device width" className="inline-flex gap-1 rounded-sm bg-muted p-1">
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
              <a href={`/preview/${name}`} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                Open ↗
              </a>
            </div>
          )}
        </div>
        <TabsContent value="preview" className="specimen p-4">
          <div ref={box} className="w-full">
            {/* Changing the device width resizes the frame with the sheet duration; the iframe re-lays out at the new width. */}
            <m.div
              className="mx-auto overflow-hidden rounded-sm ring-1 ring-border"
              initial={false}
              animate={{ width: width * scale, height: frameH * scale }}
              transition={t.sheet}
            >
              <iframe
                ref={frame}
                src={`/preview/${name}`}
                title={`${name} preview at ${width} pixels`}
                onLoad={(e) => {
                  e.currentTarget.contentDocument?.documentElement.classList.toggle("dark", document.documentElement.classList.contains("dark"))
                  measure(e.currentTarget)
                }}
                className="origin-top-left bg-background"
                style={{ width, height: frameH, transform: `scale(${scale})` }}
              />
            </m.div>
          </div>
          <p className="pt-2 text-center font-mono text-xs text-muted-foreground">
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
