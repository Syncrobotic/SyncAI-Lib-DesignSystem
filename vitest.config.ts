import path from "node:path"
import { transformAsync } from "@babel/core"
import reactCompiler from "babel-plugin-react-compiler"
import type { Plugin } from "vite"
import { defineConfig } from "vitest/config"

// The React Compiler, as products build with it (Next.js reactCompiler: true), for tests that check a component still
// updates once compiled. A test file named *.compiler.test.tsx is compiled, as a product's own components would be, and
// so is a module it imports with ?react-compiler. With ?react-compiler&without-directive the module's "use no memo" is
// dropped first, so a test can show what the directive prevents. Every other test runs on the source as written.
function reactCompilerForTests(): Plugin {
  return {
    name: "react-compiler-for-tests",
    enforce: "pre",
    async transform(code, id) {
      const [file = id, query = ""] = id.split("?")
      const params = new URLSearchParams(query)
      if (!file.endsWith(".compiler.test.tsx") && !params.has("react-compiler")) return
      const source = params.has("without-directive") ? code.replace(/^"use no memo"\n/m, "") : code
      const out = await transformAsync(source, {
        filename: file,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        // Parse only: TypeScript and JSX are left to Vite's own transform, which runs after this one.
        parserOpts: { plugins: ["jsx", "typescript"] },
        plugins: [[reactCompiler, { target: "19" }]],
      })
      return out?.code ? { code: out.code, map: out.map } : undefined
    },
  }
}

// Behaviour tests for interaction logic. Visual and accessibility checks run in Playwright (tests/*.spec.ts).
export default defineConfig({
  plugins: [reactCompilerForTests()],
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
    // Date and intervals too: a component that reads Date.now() beside a setTimeout sees one clock, not two that drift.
    fakeTimers: { toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "requestAnimationFrame", "cancelAnimationFrame", "performance"] },
  },
})
