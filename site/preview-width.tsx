"use client"

import * as React from "react"

/**
 * `/preview/x?w=1280` lays the block out at that width on any screen: a phone shows the desktop layout and lets you
 * pinch to zoom, instead of reflowing it to the phone. Done by rewriting the viewport tag, which phone browsers follow.
 */
export function PreviewWidth() {
  React.useEffect(() => {
    const w = Number(new URLSearchParams(location.search).get("w"))
    if (!w || w < 320 || w > 2560) return
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    if (!meta) return
    const was = meta.content
    meta.content = `width=${w}`
    return () => {
      meta.content = was
    }
  }, [])
  return null
}
