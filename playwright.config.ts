import { defineConfig } from "@playwright/test"

// Story-level checks against the built Storybook: visual regression and accessibility, dark and light.
// Unit tests (tests/unit) run in Vitest, not here.
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.ts",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:6007",
    viewport: { width: 422, height: 900 },
    // Only for machines whose browser does not match this Playwright version.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: { command: "npx http-server storybook-static -p 6007 -s", url: "http://127.0.0.1:6007", reuseExistingServer: true },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 } },
})
