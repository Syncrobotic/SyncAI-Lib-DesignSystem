import type { StorybookConfig } from "@storybook/react-vite"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  viteFinal: async (cfg) => {
    cfg.plugins = [...(cfg.plugins ?? []), tailwindcss()]
    // postcss.config.mjs belongs to Next.js; an inline config stops Vite from loading it and running Tailwind twice.
    cfg.css = { ...cfg.css, postcss: { plugins: [] } }
    cfg.resolve = cfg.resolve ?? {}
    cfg.resolve.alias = {
      ...(cfg.resolve.alias as Record<string, string>),
      "@/lib": path.resolve(__dirname, "../lib"),
      "@/registry": path.resolve(__dirname, "../registry"),
    }
    // "use client" is for Next.js; Vite ignores it. Keep the build output quiet.
    cfg.build = cfg.build ?? {}
    cfg.build.rollupOptions = {
      ...cfg.build.rollupOptions,
      onwarn(w, warn) {
        if (w.code === "MODULE_LEVEL_DIRECTIVE" || w.code === "SOURCEMAP_ERROR") return
        warn(w)
      },
    }
    return cfg
  },
}
export default config
