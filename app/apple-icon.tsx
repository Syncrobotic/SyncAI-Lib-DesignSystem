import { ImageResponse } from "next/og"
import { MarkImage } from "@/site/brand-image"
import { color } from "@/site/theme-tokens"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: color("card").light }}>
        {/* iOS masks this square to its own rounded tile, so the tile is full bleed and the mark keeps a margin. */}
        <MarkImage size={132} />
      </div>
    ),
    size,
  )
}
