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
  // A story with a declared end state that depends on real time (a video frame) gets three openings: the browser now
  // and then drops the only frame it was sent. A story that is really broken fails all three.
  const attempts = settled[id] ? 3 : 1
  for (let attempt = 1; ; attempt++) {
    try {
      return await openOnce(page, id, theme)
    } catch (error) {
      if (attempt >= attempts) throw error
    }
  }
}

async function openOnce(page: Page, id: string, theme: (typeof themes)[number]) {
  // Some UI appears on a timer (the button spinner after 300 ms, presence safety after 400 ms). Control the clock and
  // run it past them, so a screenshot never depends on how fast the machine was when it was taken.
  // A few stories draw against the clock itself (a chart whose time axis scrolls with it): start the clock at one fixed
  // instant and stop it there, so neither the day the picture is taken nor the time the page takes to load can move it.
  // The second below still runs.
  if (frozen.has(id)) {
    await page.clock.install({ time: FROZEN_AT })
    await page.clock.pauseAt(new Date(FROZEN_AT.getTime() + 1000))
  } else await page.clock.install()
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  await page.waitForSelector("#storybook-root > *")
  await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, theme === "dark")
  // fonts.ready resolves before a face has even started loading; ask for the kit's faces explicitly.
  await page.evaluate(() => Promise.all(["400 16px Geist", "500 16px Geist", "700 16px Geist", "400 16px 'Geist Mono'"].map((f) => document.fonts.load(f))))
  await page.evaluate(() => document.fonts.ready)
  await page.clock.runFor(1000)
  // A few stories reach their end state after something that runs on real time, not on the page clock (a video frame
  // arriving), so a fixed second is a race. Advance the clock until that state is there.
  const done = settled[id]
  if (done) {
    for (let i = 0; i < 40 && !(await page.locator(done).count()); i++) {
      await page.waitForTimeout(50)
      await page.clock.runFor(250)
    }
    // Never screenshot a state halfway: a story that does not settle is a broken story, not a different picture.
    if (!(await page.locator(done).count())) throw new Error(`${id} did not reach ${done}`)
  }
}

/** Stories that draw against the clock and are shot with it paused at FROZEN_AT (see openOnce). */
const FROZEN_AT = new Date("2026-11-21T14:00:00Z")
const frozen = new Set(["charts-streaming-chart--streaming-chart-default", "charts-streaming-chart--streaming-chart-stale"])

/** Story id → the selector that says it has settled, for stories whose end state does not come from the clock alone. */
const settled: Record<string, string> = {
  // Stalled is timed from the first frame's arrival, and frames arrive on real time.
  "display-camera-feed--camera-feed-stalled": '[data-state="stalled"]',
}
