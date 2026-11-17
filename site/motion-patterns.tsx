"use client"

import * as React from "react"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { Bell, Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { duration, patterns, t } from "./motion"

const ms = (s: number) => `${Math.round(s * 1000)} ms`

function Card({ title, token, children, action }: { title: string; token: string; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className="specimen flex h-40 items-center justify-center p-4">{children}</div>
      <div className="flex items-center justify-between gap-3 border-t border-border p-4">
        <span className="flex flex-col">
          <span className="text-sm font-medium">{title}</span>
          <span className="font-mono text-xs text-muted-foreground">{token}</span>
        </span>
        {action}
      </div>
    </div>
  )
}

const button = "press h-(--h-sm) shrink-0 rounded-sm bg-secondary px-3 text-sm font-medium hover:bg-accent"

/** The five movements of the language, live. Every one marks a change of state and uses a theme duration. */
export function MotionPatterns() {
  const [notice, setNotice] = React.useState(true)
  const [sheet, setSheet] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const [view, setView] = React.useState("Map")
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card
        title="Appear"
        token={`patterns.appear · ${ms(duration.base)} · rise 8 px`}
        action={
          <button type="button" className={button} aria-pressed={notice} onClick={() => setNotice((v) => !v)}>
            {notice ? "Dismiss" : "Notify"}
          </button>
        }
      >
        <AnimatePresence initial={false}>
          {notice && (
            <m.div key="n" initial="hidden" animate="shown" exit="hidden" variants={patterns.appear} className="flex items-center gap-2 rounded-lg bg-float px-4 py-3 text-sm shadow-float ring-1 ring-edge">
              <Bell aria-hidden className="size-4 text-muted-foreground" /> Patrol route saved
            </m.div>
          )}
        </AnimatePresence>
      </Card>

      <Card
        title="Sheet"
        token={`patterns.sheet · ${ms(duration.sheet)}`}
        action={
          <button type="button" className={button} aria-expanded={sheet} onClick={() => setSheet((v) => !v)}>
            {sheet ? "Close" : "Open"}
          </button>
        }
      >
        <div className="w-56 overflow-hidden rounded-md bg-background ring-1 ring-border">
          <div className="px-4 py-2 text-sm font-medium">Sensors</div>
          <AnimatePresence initial={false}>
            {sheet && (
              <m.div key="s" initial="hidden" animate="shown" exit="hidden" variants={patterns.sheet} className="overflow-hidden">
                <div className="flex flex-col gap-1 border-t border-border px-4 py-2 text-xs text-muted-foreground">
                  <span>Lidar · normal</span>
                  <span>Camera · normal</span>
                  <span>IMU · normal</span>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <Card title="Press" token={`.press · ${ms(duration.fast)} · scale 0.97`} action={<span className="text-xs text-muted-foreground">Hold the button</span>}>
        <button type="button" className="press h-(--h-md) rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground">
          Start patrol
        </button>
      </Card>

      <Card
        title="Swap"
        token={`patterns.swap · ${ms(duration.fast)}`}
        action={
          <button type="button" className={button} onClick={() => setCopied((v) => !v)}>
            {copied ? "Reset" : "Copy"}
          </button>
        }
      >
        <span className="flex size-(--h-md) items-center justify-center rounded-sm bg-background ring-1 ring-border">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span key={copied ? "c" : "n"} initial="hidden" animate="shown" exit="hidden" variants={patterns.swap} className="flex">
              {copied ? <Check aria-label="Copied" className="size-5 text-success" /> : <Copy aria-label="Copy" className="size-5" />}
            </m.span>
          </AnimatePresence>
        </span>
      </Card>

      <div className="sm:col-span-2">
        <Card
          title="Move"
          token={`layoutId · ${ms(duration.base)} · the selection travels to its new place`}
          action={<span className="text-xs text-muted-foreground">Pick a view</span>}
        >
          <div role="group" aria-label="View" className="inline-flex gap-1 rounded-sm bg-muted p-1">
            {["Map", "List", "Camera"].map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn("press relative h-(--h-sm) rounded-xs px-4 text-sm", view === v ? "font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {view === v && <m.span layoutId="pattern-move-marker" transition={t.base} aria-hidden className="absolute inset-0 rounded-xs bg-primary" />}
                <span className="relative">{v}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
