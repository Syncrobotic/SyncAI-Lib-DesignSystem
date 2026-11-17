import { expect, test } from "@playwright/test"
import { openStory, stories, themes } from "./story"

for (const theme of themes) {
  for (const s of stories) {
    test(`${s.id} · ${theme}`, async ({ page }) => {
      await openStory(page, s.id, theme)
      await expect(page).toHaveScreenshot(`${s.id}-${theme}.png`, { fullPage: true })
    })
  }
}
