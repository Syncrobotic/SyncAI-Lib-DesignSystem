"use client"

import * as React from "react"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { Check, Copy } from "lucide-react"
import { patterns } from "./motion"

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = React.useState(false)
  return (
    <button
      type="button"
      aria-label={done ? "Copied" : "Copy"}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      }}
      className="press inline-flex size-(--h-sm) items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {/* Copy becomes a check: the swap pattern. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span key={done ? "done" : "copy"} initial="hidden" animate="shown" exit="hidden" variants={patterns.swap} className="flex">
          {done ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </m.span>
      </AnimatePresence>
    </button>
  )
}
