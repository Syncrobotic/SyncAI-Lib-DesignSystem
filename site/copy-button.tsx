"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

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
      className="inline-flex size-(--h-sm) items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {done ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
    </button>
  )
}
