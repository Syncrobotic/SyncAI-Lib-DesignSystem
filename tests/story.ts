import type { Page } from "@playwright/test"
import { readFileSync } from "node:fs"

const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as {
  entries: Record<string, { id: string; type: string }>
}
export const stories = Object.values(index.entries).filter((e) => e.type === "story")
export const themes = ["dark", "light"] as const

/**
 * Opens a story and waits until it is really drawn: the story mounted, the theme class applied, the fonts loaded and
 * every timed state settled.
 * Waiting for these instead of "networkidle" saves its fixed 500 ms per test, which over 500 tests was minutes.
 */
export async function openStory(page: Page, id: string, theme: (typeof themes)[number]) {
  // Some UI appears on a timer (the button spinner after 300 ms, presence safety after 400 ms). Control the clock and
  // run it past them, so a screenshot never depends on how fast the machine was when it was taken.
  await page.clock.install()
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  await page.waitForSelector("#storybook-root > *")
  await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, theme === "dark")
  await page.evaluate(() => document.fonts.ready)
  await page.clock.runFor(1000)
}
