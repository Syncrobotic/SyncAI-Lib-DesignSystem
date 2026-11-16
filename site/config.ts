// Site identity and indexing. One switch decides whether search engines may index the site:
// SITE_PUBLIC=true (also turns off the password in proxy.ts). Until then everything is noindex.

const host = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)

export const site = {
  name: "SYNCROBOTIC Design System",
  shortName: "SYNCROBOTIC DS",
  description:
    "Design language and React UI kit for robot control apps: emergency stop, slide to release, dock, dynamic island and design tokens, shipped as a shadcn/ui registry for Tailwind CSS v4.",
  url: host ?? "http://localhost:3000",
  /** Shown in install instructions; a placeholder until the site has a production URL. */
  registryUrl: host ?? "https://<your-deployment>",
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
    "dark mode",
    "SYNCROBOTIC",
  ],
  public: process.env.SITE_PUBLIC === "true",
}
