"use client"

import * as React from "react"

/** Click to replay: each bar travels with its token's duration and the standard easing. */
export function MotionDemo({ durations }: { durations: { key: string; ms: string; use: string }[] }) {
  const [on, setOn] = React.useState(false)
  return (
    <div className="flex flex-col gap-4">
      {durations.map((d) => (
        <div key={d.key} className="grid items-center gap-3 sm:grid-cols-[10rem_1fr]">
          <span className="flex flex-col">
            <span className="font-mono text-sm">
              --{d.key} · {d.ms}
            </span>
            <span className="text-xs text-muted-foreground">{d.use}</span>
          </span>
          <div className="relative h-10 rounded-sm bg-muted">
            <span
              className="absolute top-1 left-1 size-8 rounded-xs bg-primary"
              style={{
                transform: on ? "translateX(calc(min(32rem, 60vw) - 2.5rem))" : "translateX(0)",
                transition: `transform var(--${d.key}) var(--ease-standard)`,
              }}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setOn((v) => !v)}
        className="self-start rounded-sm bg-secondary px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        Play
      </button>
    </div>
  )
}
