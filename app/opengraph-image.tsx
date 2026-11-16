import { ImageResponse } from "next/og"
import { site } from "@/site/config"

export const alt = site.name
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Social preview card. Colours are the dark theme's background, foreground, muted and stop tokens.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#09090b", color: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, fontWeight: 700, letterSpacing: 2 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#dc2626" }} />
          SYNCROBOTIC
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>Design System</div>
          <div style={{ fontSize: 34, color: "#a1a1aa", maxWidth: 900, lineHeight: 1.35 }}>
            Design language and React UI kit for robot control apps. A shadcn/ui registry for Tailwind CSS v4.
          </div>
        </div>
      </div>
    ),
    size,
  )
}
