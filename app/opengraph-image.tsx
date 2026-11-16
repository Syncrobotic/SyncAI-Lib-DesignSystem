import { ImageResponse } from "next/og"
import { brandFonts, MarkImage } from "@/site/brand-image"
import { site } from "@/site/config"

export const alt = site.name
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Social card: dark theme background and foreground, the reversed mark, the site name and tagline.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#09090b", color: "#fafafa", fontFamily: "Geist" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 40, fontWeight: 700, letterSpacing: 2 }}>
          <MarkImage size={72} reversed />
          SYNCROBOTIC
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>Design System</div>
          <div style={{ fontSize: 34, color: "#a1a1aa", maxWidth: 940, lineHeight: 1.35 }}>{site.tagline}</div>
        </div>
      </div>
    ),
    { ...size, fonts: await brandFonts() },
  )
}
