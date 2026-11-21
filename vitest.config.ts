import path from "node:path"
import { defineConfig } from "vitest/config"

// Behaviour tests for interaction logic. Visual and accessibility checks run in Playwright (tests/*.spec.ts).
export default defineConfig({
  resolve: {
    // import.meta.dirname, not __dirname: Vite 8 warns that __dirname will not exist once it loads configs as native ESM.
    alias: {
      "@/lib": path.resolve(import.meta.dirname, "lib"),
      "@/registry": path.resolve(import.meta.dirname, "registry"),
      "@/site": path.resolve(import.meta.dirname, "site"),
    },
  },
  // Vite 8 transforms with Oxc instead of esbuild (the esbuild option is deprecated), so the JSX runtime is set here.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    fakeTimers: { toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] },
  },
})
