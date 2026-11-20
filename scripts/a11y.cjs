// What each component is to assistive technology, measured in a browser rather than guessed from the source: the ARIA
// roles its examples expose, how many Tab stops one example has, and whether it announces changes. The Accessibility tab
// of every component page is built from it (site/a11y.ts).
//
//   npm run build && npx next start -p 3100 &
//   SITE=http://localhost:3100 node scripts/a11y.cjs        writes site/a11y.json
//
// A static file, like site/props.json: regenerate it when a component's markup changes. `lint:a11y` (scripts/a11y-check.mjs)
// fails when a component has no entry.
const { chromium } = require("playwright")
const { writeFileSync, readFileSync } = require("node:fs")

const SITE = process.env.SITE || "http://localhost:3100"
const exe = process.env.PW_CHROMIUM_PATH
const reg = JSON.parse(readFileSync("registry.json", "utf8"))
// The data-slot names each component's own files declare: what "the component" is on a page.
const slotsOf = Object.fromEntries(
  reg.items.map((i) => [i.name, [...new Set((i.files ?? []).flatMap((f) => [...readFileSync(f.path, "utf8").matchAll(/data-slot="([\w-]+)"/g)].map((m) => m[1])))]]),
)
const names = reg.items.filter((i) => i.type !== "registry:block" && i.type !== "registry:lib" && i.type !== "registry:style" && i.type !== "registry:theme").map((i) => i.name)

// Roles worth naming. Structure every page has (generic, paragraph, text) says nothing about the component.
const MEANINGFUL = new Set(
  "alert alertdialog application article button cell checkbox columnheader combobox dialog figure form grid gridcell group heading img link list listbox listitem log menu menubar menuitem menuitemcheckbox menuitemradio meter navigation option progressbar radio radiogroup region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status switch tab table tablist tabpanel textbox timer toolbar tooltip tree treegrid treeitem".split(" "),
)

;(async () => {
  const browser = await chromium.launch(exe ? { executablePath: exe } : {})
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage()
  const out = {}
  for (const name of names) {
    const res = await page.goto(`${SITE}/docs/components/${name}`, { waitUntil: "networkidle" })
    if (!res || !res.ok()) continue
    // Examples further down render as they scroll in.
    for (let y = 0; y < 20000; y += 600) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(40)
    }
    await page.waitForTimeout(300)
    const specimens = page.locator("section[id^=example-] .specimen")
    const n = await specimens.count()
    if (!n) continue
    const roles = new Set()
    let tabStops = 0
    let live = false
    for (let k = 0; k < n; k++) {
      const spec = specimens.nth(k)
      // The component itself, not the example around it: the outermost elements with one of its own data-slot names, marked
      // so the accessibility snapshot can be taken of each; the whole specimen when it has none.
      const count = await spec.evaluate((el, slots) => {
        const mine = (e) => slots.includes(e.dataset.slot)
        const all = [...el.querySelectorAll("[data-slot]")].filter(mine)
        const outer = all.filter((e) => !all.some((o) => o !== e && o.contains(e)))
        outer.forEach((e, i) => e.setAttribute("data-a11y-target", String(i)))
        return outer.length
      }, slotsOf[name])
      // An example that does not show this component's own parts (a story of context) says nothing about it.
      if (!count && slotsOf[name].length) continue
      const targets = count ? await spec.locator("[data-a11y-target]").all() : [spec]
      let stops = 0
      for (const t of targets) {
        const snap = await t.ariaSnapshot().catch(() => "")
        for (const m of snap.matchAll(/^\s*- (\w+)/gm)) if (MEANINGFUL.has(m[1])) roles.add(m[1])
        const facts = await t.evaluate((el) => {
          const visible = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length) && getComputedStyle(e).visibility !== "hidden"
          const sel = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]'
          const tabbable = [el, ...el.querySelectorAll(sel)].filter(
            (e) =>
              e.matches(sel) && !e.disabled && e.tabIndex >= 0 && !e.closest("[inert]") && visible(e) &&
              // A radio group is one stop: unchecked radios are skipped when one is checked.
              !(e.type === "radio" && !e.checked && el.querySelector(`input[type=radio][name="${e.name}"]:checked`)),
          )
          const liveSel = '[aria-live]:not([aria-live="off"]), [role=status], [role=alert], [role=log], output'
          return { tabStops: tabbable.length, live: el.matches(liveSel) || !!el.querySelector(liveSel) }
        })
        stops += facts.tabStops
        live ||= facts.live
      }
      tabStops = Math.max(tabStops, stops)
    }
    out[name] = { roles: [...roles].sort(), tabStops, live }
    process.stdout.write(".")
  }
  await browser.close()
  writeFileSync("site/a11y.json", JSON.stringify(out, null, 2) + "\n")
  console.log(`\nWrote site/a11y.json (${Object.keys(out).length} components)`)
})()
