import { ImageResponse } from "next/og"
import { color } from "@/site/theme-tokens"
import { brandFonts, MarkImage } from "@/site/brand-image"
import { site } from "@/site/config"

export const ogSize = { width: 1200, height: 630 }

/**
 * A social card in the dark theme: the reversed mark and the site's name on top, then what the page is (a kind such as
 * "React component", its title and one line). The site's own card has no kind and the tagline for its line.
 */
export async function ogCard({ kind, title, line }: { kind?: string; title: string; line: string }) {
  const muted = color("muted-foreground").dark
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: color("background").dark, color: color("foreground").dark, fontFamily: "Geist" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>
          <MarkImage size={64} reversed />
          {kind ? site.name : "SYNCROBOTIC"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {kind && <div style={{ fontSize: 30, color: muted }}>{kind}</div>}
          <div style={{ fontSize: title.length > 24 ? 72 : 88, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 32, color: muted, maxWidth: 1000, lineHeight: 1.35, lineClamp: 3, display: "block" }}>{line}</div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: await brandFonts() },
  )
}
