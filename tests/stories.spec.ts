import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { openStory, stories, themes } from "./story"

// Storybook's a11y addon runs axe in the same frame when a story renders; if that run is still going, axe refuses a second
// one ("Axe is already running"). That is a collision between two runs, not a finding, so wait and try again.
async function analyze(page: Page) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        // Radix NavigationMenu's focus proxy: an aria-hidden, tabbable span after an open trigger whose only job is to pass
        // focus straight into the panel. It never keeps focus, so aria-hidden-focus is a static false positive here.
        .exclude('[data-slot="navigation-menu-trigger"] + span[aria-hidden="true"][tabindex="0"]')
        .analyze()
    } catch (e) {
      if (attempt >= 4 || !String(e).includes("Axe is already running")) throw e
      await page.waitForTimeout(500)
    }
  }
}

// Every story, dark and light, opened once: the screenshot against its baseline in tests/__screenshots__/ (visual
// regression), then axe against WCAG 2.2 A/AA over the whole page so portalled overlays count too.
// STORY_CHECKS=visual skips axe, for the workflow that only writes baselines.
const axe = process.env.STORY_CHECKS !== "visual"
for (const theme of themes) {
  for (const s of stories) {
    test(`${s.id} · ${theme}`, async ({ page }) => {
      await openStory(page, s.id, theme)
      await expect(page).toHaveScreenshot(`${s.id}-${theme}.png`, { fullPage: true })
      if (!axe) return
      const { violations } = await analyze(page)
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([])
    })
  }
}
