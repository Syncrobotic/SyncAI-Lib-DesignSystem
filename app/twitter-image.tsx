import { ogCard, ogSize } from "@/site/og-card"
import { site } from "@/site/config"

export const alt = site.name
export const size = ogSize
export const contentType = "image/png"

// The site's social card, for every page without one of its own.
export default function TwitterImage() {
  return ogCard({ title: "Design System", line: site.tagline })
}
