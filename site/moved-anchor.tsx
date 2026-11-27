"use client"

import * as React from "react"
import { blockHref, placement } from "@/site/block-types"

/**
 * An old link to a block on a type page it has left (/blocks/settings#settings-api-keys) follows it to its new place.
 * The anchor never reaches the server, so next.config.ts cannot redirect it.
 */
export function MovedAnchor({ here }: { here: string[] }) {
  React.useEffect(() => {
    const name = decodeURIComponent(location.hash.slice(1))
    if (name in placement && !here.includes(name)) location.replace(blockHref(name))
  }, [here])
  return null
}
