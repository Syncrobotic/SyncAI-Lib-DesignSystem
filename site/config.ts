// Site identity and indexing, with no environment variables to set. Vercel provides both values below on its own:
// VERCEL_PROJECT_PRODUCTION_URL is the production domain (the custom domain once one is attached), and VERCEL_ENV says
// which deployment this is. Only production is indexed; previews (dev, stage, pull requests) stay out of search results.

// Local builds and previews point their canonical URLs at production.
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://design-system.syncrobotic.me"

export const site = {
  name: "SYNCROBOTIC Design System",
  shortName: "SYNCROBOTIC DS",
  /** One sentence, used for meta description, Open Graph, the manifest and JSON-LD. */
  description:
    "A robotics UI kit for React: emergency stop, teleoperation, robot map, camera feed, LiDAR point cloud, URDF robot model and alarms, with design tokens, a high-contrast mode, colour-blind-safe charts and ready-made screens, shipped as a shadcn/ui registry for Tailwind CSS v4.",
  /** Short line under the name on social cards. */
  tagline: "A robotics UI kit for React. One design language for every SYNCROBOTIC product: tokens, components, charts and ready-made screens for Tailwind CSS v4.",
  logo: "/brand/syncrobotic-mark.svg",
  url: host,
  /** Shown in install instructions. */
  registryUrl: host,
  repo: "https://github.com/Syncrobotic/SyncAI-Lib-DesignSystem",
  keywords: [
    "robotics UI kit",
    "robot UI",
    "robot dashboard",
    "robot control app",
    "ROS",
    "ROS 2",
    "teleoperation",
    "LiDAR point cloud",
    "URDF viewer",
    "occupancy grid",
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
    "quadruped robot",
    "emergency stop",
    "design tokens",
    "blocks",
    "dashboard",
    "charts",
    "fleet management",
    "high contrast theme",
    "WCAG AAA",
    "data visualisation",
    "colour-blind-safe charts",
    "AI agents",
    "MCP",
    "llms.txt",
    "dark mode",
    "SYNCROBOTIC",
  ],
  /** Search engines may index this deployment: production only. */
  public: process.env.VERCEL_ENV === "production",
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
