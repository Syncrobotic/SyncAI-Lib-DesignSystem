// @syncrobotic/thumbnail v0.58.0 · update: npx shadcn add @syncrobotic/thumbnail --overwrite
"use client"

import * as React from "react"
import { EyeOff, ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

export type ThumbnailLabels = {
  /** Read before the alt of a picture that could not load: "Could not load: Forklift in aisle 3". */
  broken: string
  /** The name of a restricted thumbnail when no `reason` is given. */
  restricted: string
}

export const defaultThumbnailLabels: ThumbnailLabels = {
  broken: "Could not load",
  restricted: "Restricted picture",
}

// The control scale, so a thumbnail lines up with the controls and rows around it: 36 (44 on touch), 44, 48 px.
const sizes = { sm: "size-(--h-sm)", md: "size-(--h-md)", lg: "size-(--h-lg)" } as const

type ThumbnailProps = {
  /** The picture. Left out (with no `restricted`), the neutral fallback shows. */
  src?: string
  /** What the picture shows, e.g. "Forklift in aisle 3". "" when the row's own words already say it. */
  alt?: string
  /** sm: --h-sm (36 px, 44 on touch) for a table row; md: --h-md (44); lg: --h-lg (48) for a list or a card's row. */
  size?: keyof typeof sizes
  /** The viewer may not see it (faces, number plates, a restricted tier): a neutral placeholder, and nothing is fetched. */
  restricted?: boolean
  /** Why it is hidden, e.g. "Restricted · faces": the placeholder's accessible name and its tooltip. */
  reason?: string
  /** The words it says, to translate them. */
  labels?: Partial<ThumbnailLabels>
  className?: string
}

/**
 * One small square picture for a row, list or card at sm, md or lg: lazy and object-cover, with ImageGrid's fallback
 * when it fails and a restricted placeholder that fetches nothing. Never focusable: make the row the target.
 */
export function Thumbnail({ src, alt = "", size = "sm", restricted = false, reason, labels: labelsProp, className }: ThumbnailProps) {
  const labels = { ...defaultThumbnailLabels, ...labelsProp }
  // The source that failed, not a flag: a new src gets its own try.
  const [failed, setFailed] = React.useState<string | null>(null)
  const box = cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xs bg-muted align-middle text-muted-foreground", sizes[size], className)

  if (restricted) {
    const name = reason ?? labels.restricted
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* RestrictedPreview's placeholder at thumbnail size: the muted tile, a dashed edge and the eye-off mark. */}
          <span role="img" aria-label={name} data-slot="thumbnail" data-restricted="" className={cn(box, "border border-dashed border-border")}>
            <EyeOff aria-hidden="true" className="size-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    )
  }

  if (!src || failed === src) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt ? `${labels.broken}: ${alt}` : undefined}
        aria-hidden={alt ? undefined : "true"}
        data-slot="thumbnail"
        data-broken=""
        className={box}
      >
        <ImageOff aria-hidden="true" className="size-4" />
      </span>
    )
  }

  return (
    <span data-slot="thumbnail" className={box}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(src)}
        // A picture that failed before React attached onError (server-rendered) is caught here, as in ImageGrid.
        ref={(img) => {
          if (img?.complete && img.naturalWidth === 0 && img.currentSrc) setFailed(src)
        }}
        className="size-full object-cover"
      />
    </span>
  )
}
