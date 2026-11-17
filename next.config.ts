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
  // Stories import fn() from @storybook/test. The site only needs a no-op, not the test runtime.
  turbopack: {
    resolveAlias: { "@storybook/test": "./site/shims/storybook-test.ts" },
  },
}

export default config
