import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"

// Every story, dark and light, against WCAG 2.2 A/AA. Scans the whole page so portalled overlays count too.
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as {
  entries: Record<string, { id: string; type: string }>
}
const stories = Object.values(index.entries).filter((e) => e.type === "story")

for (const theme of ["dark", "light"]) {
  for (const s of stories) {
    test(`a11y · ${s.id} · ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(`/iframe.html?id=${s.id}&viewMode=story&globals=theme:${theme}`)
      await page.waitForLoadState("networkidle")
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([])
    })
  }
}
