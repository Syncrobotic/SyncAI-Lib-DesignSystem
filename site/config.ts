// Site identity and indexing. One switch decides whether search engines may index the site:
// SITE_PUBLIC=true. Until then everything is noindex. The site itself needs no sign-in (see README).

// Fallback is the production deployment, so local builds and previews point at the canonical site.
const host =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://syncai-lib-designsystem.vercel.app")

export const site = {
  name: "SYNCROBOTIC Design System",
  shortName: "SYNCROBOTIC DS",
  /** One sentence, used for meta description, Open Graph, the manifest and JSON-LD. */
  description:
    "The SYNCROBOTIC design language: colour, type, spacing, radius and motion tokens, React components, and blocks for application screens, charts and robot operations, shipped as a shadcn/ui registry for Tailwind CSS v4.",
  /** Short line under the name on social cards. */
  tagline: "One design language for every SYNCROBOTIC product. Tokens, React components, charts and ready-made screens for Tailwind CSS v4.",
  logo: "/brand/syncrobotic-mark.svg",
  url: host,
  /** Shown in install instructions. */
  registryUrl: host,
  repo: "https://github.com/Syncrobotic/SyncAI-Lib-DesignSystem",
  keywords: [
    "design system",
    "UI kit",
    "shadcn",
    "shadcn registry",
    "shadcn/ui",
    "Tailwind CSS",
    "Tailwind CSS v4",
    "React",
    "Next.js",
    "robotics",
    "robot control app",
    "quadruped robot",
    "emergency stop",
    "design tokens",
    "blocks",
    "dashboard",
    "charts",
    "fleet management",
    "AI agents",
    "MCP",
    "llms.txt",
    "dark mode",
    "SYNCROBOTIC",
  ],
  public: process.env.SITE_PUBLIC === "true",
}

/**
 * Page metadata with the shared Open Graph and Twitter fields.
 * Next.js replaces a parent's openGraph object instead of merging it, so every page goes through here.
 */
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }) {
  const images = [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.name }]
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website" as const, locale: "en_US", siteName: site.name, title, description, url: path, images },
    twitter: { card: "summary_large_image" as const, title, description, images: ["/twitter-image"] },
  }
}
