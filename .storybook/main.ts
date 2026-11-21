import type { StorybookConfig } from "@storybook/react-vite"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  // Storybook 9 moved the essentials (controls, actions, viewport, backgrounds, toolbars) into core, so only the a11y
  // addon is listed. Docs is not added back: no story uses autodocs or MDX, and its index entries would change the ids.
  addons: ["@storybook/addon-a11y"],
  // The media player's sample clip, poster and captions (generated; see stories/media-player.stories.tsx).
  staticDirs: [{ from: "../public/media", to: "/media" }],
  framework: { name: "@storybook/react-vite", options: {} },
  viteFinal: async (cfg) => {
    cfg.plugins = [...(cfg.plugins ?? []), tailwindcss()]
    // postcss.config.mjs belongs to Next.js; an inline config stops Vite from loading it and running Tailwind twice.
    cfg.css = { ...cfg.css, postcss: { plugins: [] } }
    cfg.resolve = cfg.resolve ?? {}
    cfg.resolve.alias = {
      ...(cfg.resolve.alias as Record<string, string>),
      // Storybook 10 loads this file as native ESM, where __dirname does not exist; Node 22 has import.meta.dirname.
      "@/lib": path.resolve(import.meta.dirname, "../lib"),
      "@/registry": path.resolve(import.meta.dirname, "../registry"),
    }
    // "use client" is for Next.js; Vite ignores it. Keep the build output quiet.
    cfg.build = cfg.build ?? {}
    // Vite 8 bundles with Rolldown; rollupOptions is a deprecated alias of rolldownOptions, which takes the same onwarn.
    cfg.build.rolldownOptions = {
      ...cfg.build.rolldownOptions,
      onwarn(w, warn) {
        if (w.code === "MODULE_LEVEL_DIRECTIVE" || w.code === "SOURCEMAP_ERROR") return
        warn(w)
      },
    }
    return cfg
  },
}
export default config
