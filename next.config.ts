import type { NextConfig } from "next"

const config: NextConfig = {
  // Every page has a markdown twin for AI agents at its URL plus .md (see site/ai.ts).
  async rewrites() {
    return [
      { source: "/docs/components/:name.md", destination: "/md/components/:name" },
      { source: "/blocks/:name.md", destination: "/md/blocks/:name" },
      { source: "/docs/foundations/:slug.md", destination: "/md/foundations/:slug" },
    ]
  },
  // /mcp reads item sources, stories and the agent skill at request time; ship them with that function.
  outputFileTracingIncludes: { "/mcp": ["./registry/**/*", "./stories/**/*"] },
  async redirects() {
    return [
      // The docs' front page moved from /docs/foundations to /docs (the foundation pages stay under /docs/foundations/).
      { source: "/docs/foundations", destination: "/docs", permanent: true },
      // The icons moved from the foundations to an area of their own.
      { source: "/docs/icons", destination: "/icons", permanent: true },
      // 0.40: the sparkline, status tracker, radial and heatmap patterns drew without the Chart component, so they left the
      // Chart page for one Application type of their own. Their old type pages lead there; each block's own URL
      // (/blocks/<name>) already follows it to its new place.
      ...["sparkline", "status-tracker", "radial-chart", "heatmap"].map((slug) => ({
        source: `/blocks/${slug}`,
        destination: "/blocks/data-visualisation",
        permanent: true,
      })),
      // 0.40: the number library was renamed from format-count to format-number (it formats every number, not only counts).
      { source: "/docs/components/format-count", destination: "/docs/components/format-number", permanent: true },
      { source: "/docs/components/format-count.md", destination: "/docs/components/format-number.md", permanent: true },
      { source: "/r/format-count.json", destination: "/r/format-number.json", permanent: true },
    ]
  },
  // Security headers on every response. The docs show blocks in iframes of their own pages, so framing is allowed from
  // this origin only. No script-src: the theme script runs inline before paint, and a nonce would make every page dynamic.
  // Fullscreen (media player, camera feed) and the clipboard (copy buttons) stay allowed.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ]
  },
  // Stories import fn() from storybook/test (Storybook 9 folded @storybook/test into core). The site only needs a no-op,
  // not the test runtime.
  turbopack: {
    resolveAlias: { "storybook/test": "./site/shims/storybook-test.ts" },
  },
}

export default config
