import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { openStory, stories, themes } from "./story"

// Every story, dark and light, against WCAG 2.2 A/AA. Scans the whole page so portalled overlays count too.
for (const theme of themes) {
  for (const s of stories) {
    test(`a11y · ${s.id} · ${theme}`, async ({ page }) => {
      await openStory(page, s.id, theme)
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([])
    })
  }
}
