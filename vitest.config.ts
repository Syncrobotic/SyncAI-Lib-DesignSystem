import path from "node:path"
import { defineConfig } from "vitest/config"

// Behaviour tests for interaction logic. Visual and accessibility checks run in Playwright (tests/*.spec.ts).
export default defineConfig({
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "lib"),
      "@/registry": path.resolve(__dirname, "registry"),
      "@/site": path.resolve(__dirname, "site"),
      "@/app": path.resolve(__dirname, "app"),
    },
  },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    fakeTimers: { toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] },
  },
})
