import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"

const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as {
  entries: Record<string, { id: string; type: string }>
}
const stories = Object.values(index.entries).filter((e) => e.type === "story")

for (const theme of ["dark", "light"]) {
  for (const s of stories) {
    test(`${s.id} · ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(`/iframe.html?id=${s.id}&viewMode=story&globals=theme:${theme}`)
      await page.waitForLoadState("networkidle")
      await expect(page).toHaveScreenshot(`${s.id}-${theme}.png`, { fullPage: true })
    })
  }
}
