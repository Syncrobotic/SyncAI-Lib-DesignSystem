"use client"

import * as React from "react"
import type { LucideNode } from "./lucide-node"
import { IconGallery, type GalleryIcon } from "./icon-gallery"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"

/** Draws one icon from Lucide's node list, with Lucide's own defaults. */
function Drawing({ nodes }: { nodes: LucideNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {nodes.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  )
}

/** The full Lucide list, fetched only on this tab (about 1,500 drawings), with the kit's set marked. */
export function LucideGallery({ meanings }: { meanings: Record<string, string> }) {
  const [icons, setIcons] = React.useState<GalleryIcon[] | null>(null)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => {
    let live = true
    fetch("/lucide-icons.json")
      .then((r) => r.json() as Promise<[string, LucideNode][]>)
      .then((list) => {
        if (!live) return
        setIcons(list.map(([name, nodes]) => ({ name, glyph: <Drawing nodes={nodes} />, means: meanings[name], from: "lucide-react" as const })))
      })
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [meanings])
  if (failed) return <p className="text-sm text-muted-foreground">The icon list did not load. Reload the page to try again.</p>
  if (!icons)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" delay={0} label="" /> Loading the Lucide icons
      </p>
    )
  return <IconGallery groups={[{ title: "Lucide", icons }]} total={icons.length} placeholder="Search by name" markKit />
}
