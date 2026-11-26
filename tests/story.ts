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
    // A full-page screenshot makes the viewport as tall as the page while it is taken. Where what is on screen decides
    // what streams (the camera wall plays only the tiles in view), that change reconnected the tiles and turned a
    // stalled one Live in the picture. Be that tall before settling, so the screenshot changes nothing.
    const size = page.viewportSize()
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    if (size && height > size.height) await page.setViewportSize({ width: size.width, height })
    for (let i = 0; i < 40 && !(await page.locator(done).count()); i++) {
      await page.waitForTimeout(50)
      await page.clock.runFor(250)
    }
    // Never screenshot a state halfway: a story that does not settle is a broken story, not a different picture.
    if (!(await page.locator(done).count())) throw new Error(`${id} did not reach ${done}`)
    // A frame queued before the feed stalled can still arrive on real time and bring it back to Live for a moment (the
    // 0.31 and 0.32 baselines caught it so). Let any such frame land, then run the clock past the stale limit again and
    // check once more, so the picture is taken of the settled state.
    await page.waitForTimeout(500)
    await page.clock.runFor(2000)
    for (let i = 0; i < 40 && !(await page.locator(done).count()); i++) {
      await page.waitForTimeout(50)
      await page.clock.runFor(250)
    }
    if (!(await page.locator(done).count())) throw new Error(`${id} left ${done} and did not come back`)
  }
}

/** Stories that draw against the clock and are shot with it paused at FROZEN_AT (see openOnce). */
const FROZEN_AT = new Date("2026-11-21T14:00:00Z")
// Every streaming chart: its live edge comes from the clock, and under reduced motion it holds on whole seconds, so a
// clock started at whatever millisecond the run began moved the line by up to a second (from-ros and small-multiples
// came out different on every run).
const frozen = { has: (id: string) => id.startsWith("charts-streaming-chart--") }

/** Story id → the selector that says it has settled, for stories whose end state does not come from the clock alone. */
const settled: Record<string, string> = {
  // Stalled is timed from the first frame's arrival, and frames arrive on real time.
  "display-camera-feed--camera-feed-stalled": '[data-state="stalled"]',
  // The same for one tile of the wall; the other tiles are Live once their first frame has arrived.
  "display-camera-wall--camera-wall-stalled": '[data-slot="camera-wall-tile"][data-state="stalled"]',
  // Tiles load as images, on real time; the map says when every tile in view has loaded.
  "charts-geo-map--geo-map-tiles": '[data-tiles="ready"]',
}
