"use client"

import * as React from "react"
import { Monitor, Smartphone, Tablet } from "lucide-react"
import { cn } from "@/lib/utils"

const widths = { desktop: "100%", tablet: "768px", mobile: "390px" } as const
type Viewport = keyof typeof widths

/** Live block in an iframe, with a viewport switch so responsive behaviour is visible. */
export function BlockFrame({ name, height, initial }: { name: string; height: number; initial: "desktop" | "mobile" }) {
  const [vp, setVp] = React.useState<Viewport>(initial)
  const ref = React.useRef<HTMLIFrameElement>(null)

  // Keep the frame's dark/light in step with the page.
  React.useEffect(() => {
    const sync = () => {
      const dark = document.documentElement.classList.contains("dark")
      ref.current?.contentDocument?.documentElement.classList.toggle("dark", dark)
    }
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div role="group" aria-label="Viewport" className="inline-flex gap-1 rounded-sm bg-muted p-1">
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
              aria-label={`${v} view`}
              aria-pressed={vp === v}
              onClick={() => setVp(v)}
              className={cn("flex size-8 items-center justify-center rounded-xs text-muted-foreground", vp === v && "bg-primary text-primary-foreground")}
            >
              <Icon aria-hidden className="size-4" />
            </button>
          ))}
        </div>
        <a href={`/preview/${name}`} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
          Open in new tab ↗
        </a>
      </div>
      <div className="specimen flex justify-center overflow-hidden rounded-md border border-border p-2">
        <iframe
          ref={ref}
          src={`/preview/${name}`}
          title={`${name} preview`}
          onLoad={(e) => e.currentTarget.contentDocument?.documentElement.classList.toggle("dark", document.documentElement.classList.contains("dark"))}
          className="rounded-sm bg-background ring-1 ring-border transition-[width] duration-(--motion-base) ease-(--ease-standard)"
          style={{ width: widths[vp], maxWidth: "100%", height }}
        />
      </div>
    </div>
  )
}
