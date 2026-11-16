import type { NextConfig } from "next"

const config: NextConfig = {
  // Stories import fn() from @storybook/test. The site only needs a no-op, not the test runtime.
  turbopack: {
    resolveAlias: { "@storybook/test": "./site/shims/storybook-test.ts" },
  },
}

export default config
