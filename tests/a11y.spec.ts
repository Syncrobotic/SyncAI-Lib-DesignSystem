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

// Every story, dark and light, against WCAG 2.2 A/AA. Scans the whole page so portalled overlays count too.
for (const theme of themes) {
  for (const s of stories) {
    test(`a11y · ${s.id} · ${theme}`, async ({ page }) => {
      await openStory(page, s.id, theme)
      const { violations } = await analyze(page)
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([])
    })
  }
}
