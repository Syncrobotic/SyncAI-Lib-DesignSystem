"use client"

import * as React from "react"
import { Download, Pencil, SkipForward } from "lucide-react"
import { ActionRailShell } from "@/registry/syncrobotic/blocks/action-rail-shell"
import { ImageGrid, type ImageGridItem } from "@/registry/syncrobotic/ui/image-grid"
import { placeholderPhoto } from "@/stories/placeholder-photos"

const frames: ImageGridItem[] = Array.from({ length: 12 }, (_, i) => {
  const name = `batch-12-${String(i + 1).padStart(3, "0")}.jpg`
  return { id: name, name, src: placeholderPhoto(i + 3, name.replace(".jpg", "")), alt: `Warehouse aisle, new frame ${i + 1}` }
})

/** The action-rail shell for the blocks page: a batch of new frames, and the one next step, reviewing their labels. */
export function ActionRailShellDemo() {
  const [backs, setBacks] = React.useState(0)
  return (
    <ActionRailShell
      title="Batch 12"
      onBack={() => setBacks((n) => n + 1)}
      step={{ title: "Review 12 new labels", description: "Check the boxes the model drew on the new frames, then send the batch to training." }}
      primary={{ label: "Start review" }}
      secondary={[
        { label: "Edit the label set", icon: Pencil },
        { label: "Skip to training", icon: SkipForward },
        { label: "Export labels", icon: Download },
      ]}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">12 new frames</h2>
          <p className="text-sm text-muted-foreground">
            Uploaded from camera 2 in Hall B. Press ← or Esc to go back up a level{backs > 0 ? ` (pressed ${backs}×)` : ""}.
          </p>
        </div>
        <ImageGrid label="New frames in batch 12" items={frames} />
      </div>
    </ActionRailShell>
  )
}
