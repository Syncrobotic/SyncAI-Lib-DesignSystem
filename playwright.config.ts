import { defineConfig } from "@playwright/test"

// Screenshot every story at phone width, in dark and light. Baselines live in tests/__screenshots__.
export default defineConfig({
  testDir: "tests",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: { baseURL: "http://127.0.0.1:6007", viewport: { width: 422, height: 900 } },
  webServer: { command: "npx http-server storybook-static -p 6007 -s", url: "http://127.0.0.1:6007", reuseExistingServer: true },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 } },
})
