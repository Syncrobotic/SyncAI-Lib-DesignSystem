# Changelog

Components install as source, so a project keeps the version it installed. Re-run `npx shadcn add @syncrobotic/<item> --overwrite` to take a newer one, and read the entries below first.

## Unreleased

Design-rule conformance: the kit's components, docs and catalog follow the rules 0.39 wrote down. Every number goes one way, Badge teaches labels instead of states, a page header takes one status, and the catalog's groups are smaller and say what they hold.

### Added
- **`page-header` 0.40.0:** `status`, the state of what the page shows as one InlineStatus beside the title (at most one), and `badges` for fixed attributes after it (Production as an outline, Beta). A robot page's example shows both. MetaPill's `tone` is deprecated: a state in a boxed pill reads as one more fact; it still draws until 1.0.
- **`status-eyebrow` 0.40.0:** InlineStatus takes `className` (its size in a 12 px meta line) and carries `data-slot="inline-status"`. The item is titled "Inline status and eyebrow" and its page, rules and overview lead with InlineStatus, the one way to write a state that changes, so it is found by its name.
- **`format-count` 0.40.0:** the kit's one number path. `formatNumber(n, { locale, ...options })` for any number that is not a count (Intl.NumberFormat options: decimals, grouping, currency), `numberFormat(locale, options)` for the cached formatter and `resolveLocale(locale)`, beside `formatCount`. Both are English without a locale and for a tag Intl cannot read ("en_US"), so the server and the browser write the same digits.
- **`lint:numbers`** (`scripts/check-numbers.mjs`, in CI's check job): no `.toLocaleString(` (it follows the runtime's language when given no locale) and no second `new Intl.NumberFormat(` in the registry.

- **Docs:** pages for `format-count`, `clock-time`, `feedback`, `use-now` and `use-reduced-motion` under Hooks & libraries, with their rules and when to use them, so they are in the sidebar, the search, `/llms.txt` and the MCP server's catalog.
- **`npm run readme`:** README.md's counts and its two catalog tables are written from the site's data (`site/readme.ts`); `tests/unit/readme.test.ts` fails when they drift.

### Changed
- **Docs: the component groups** follow what a screen is made of. New groups Lists & tables (table, responsive-table, data-grid, list, item, description-list, tree, sortable, log-viewer), Status & values (status-glyph, InlineStatus and StatusEyebrow, badge, tier-badge, meter, metric-card) and Search & filters (search-field, filters, filter-form, chip-group, facets). File upload moves to Media & files beside attachment and file type; the robot shell (dock, island, tray) joins Robotics after the stop and slide to release, and the Robot shell group, three items, is gone. Inputs holds 20 (was 27), Data display 11 (was 24). Component URLs do not change.
- **README:** 122 components (it said 95 and 87), and its group table is the site's.
- **Numbers, everywhere:** the five private copies of `resolveLocale` (geo-map, diagnostics, attitude, joint-state, streaming-chart) and their formatter caches are format-count's. Counts without a locale are grouped (`facets` 48,210, not 48210; `bar-list` and `meter` 412,345 through formatNumber; `chart`'s `chartNumber` 12,480 with its true minus). `pagination`, `load-more`, `chip-group`, `filters`, `share-bar`, `log-viewer`, `camera-wall`, `waypoint-editor`, `streaming-text`, `teleop-pad` and `point-cloud` wrote numbers in the runtime's language when given no locale; they now write English, as the server does. `labels-zh-tw` writes its numbers through format-count (zh-TW without a locale) and depends on it. All 0.40.0.
- **`data-catalog`, `stats-filtered`, `settings-billing` 0.40.0:** their numbers through format-count (lint:numbers).
- **`badge` 0.40.0** (docs and examples): a badge is a fixed attribute or category (Beta, v2.4.1, Production as a neutral outline, T1), never a state. The examples show those, a title with one InlineStatus then its badges and a CountBadge, badges with icons that are categories (Internal only, Simulation), and a Do / Don't (a state in a tinted badge). Its description and overview say the same; the tinted tones stay for compatibility.
- **`tier-badge` 0.40.0:** `tiers` is typed `neutral | outline` (it never used warning or danger); its comment no longer says the restricted tiers carry colour.
- **`dock` 0.40.0:** DockActions' two buttons are medium (500), as every button, and the secondary's words are foreground: the raised block, not a heavier weight, marks the primary; bold stays the stop's.
- **`agent-skill` 0.40.0:** the number rule names `formatNumber` for any number that is not a count and bans `toLocaleString()`; a header's one status is PageHeader's `status`; checklist line 16: a state is an InlineStatus, never a tinted badge or a toned MetaPill.
- **Docs:** Color's Do / Don't writes a state as an InlineStatus instead of a tinted badge; the high-contrast demo shows badges as labels and a CountBadge; the Card and Tabs examples draw their counts as CountBadge, not a Badge holding a number; Avatar's rule says "status mark" (AvatarBadge), not "status badge".

## 0.39.0 · 2026-11-25

A section heading at typography's two levels, a table that becomes a grouped list on phones, the data catalog's facet column as a component, a rule for writing numbers with the helper that follows it, when a label is a Badge, an InlineStatus or plain text, and the Next.js recipe for an error in the root layout.

### Added
- **`format-count` 0.39.0 (beta):** `formatCount(n, { compact, locale })`, through Intl.NumberFormat in `locale` (English when none is given, so the server and the browser agree). Full with grouping by default (135,287); `compact` abbreviates in the locale's own words (135K and 1.2M in English, 14萬 and 123萬 in zh-TW). Issue #386
- **`section-header` 0.39.0 (beta):** the heading of a section at typography's two levels, so section titles stop drifting between 14, 16 and 18 px: `page` (20 px bold, an h2) for a section of the page outside the cards, `surface` (14 px medium, never bold, an h3) inside a card, a sheet or a panel. `count` after the title in muted text, in full with grouping (`formatCount`, `locale`); `description`, one line under it; `actions` at the right, under the title when it needs the width; `as` sets the heading level without changing the look; `id` for a section's `aria-labelledby`. A data card keeps CardDataHeader; a page keeps PageHeader. Issue #385
- **`responsive-table` 0.39.0 (beta):** the same rows as a Table where there is room and as a grouped list (ListGroup, ListRow) on a phone, from one list of columns, so a page no longer writes its phone list by hand. Each column says where it goes on a phone (`phone`: the first is the row's title, `trailing` the state at its end, `meta` the line under the title, or `hidden`; `phoneCell` for a shorter form). Its own width decides, at 36rem (576 px), so a narrow column on a wide screen gets the list too. Only one layout is in the page once it is measured (table semantics, or a list of list items named by `label`); in the server's HTML a container query shows the right one, so a phone never sees a table flash. `onRowClick` (the title cell's button, the whole phone row with a chevron), `rowActions` (TableActionsCell, or after the phone row's button), `empty`, `layout` to fix it, `labels`. Issue #383
- **`labels-zh-tw` 0.39.0:** `responsiveTableLabels` (動作). Issue #383
- **`facets` 0.39.0 (new, beta):** the facet column beside a catalog or a table, taken out of `data-catalog` so a product no longer rebuilds it (#382). `Facets` is the column from 1024 px: it pins under the shell's bar (`--shell-top`) and scrolls on its own, its height measured from whatever scrolls (the page, or app-shell's `<main>`). Each facet is a FieldSet of checkbox rows (ChoiceField) with a count on each option (`locale` groups them); `max` (or a facet's own) folds a long facet with "Show all N", picked options stay in view, and unfolding moves focus to the first option it shows. `FacetsDrawer` is the same list on phones: a Filters button with the number of picks (CountBadge) opening a bottom sheet with Clear all and Done; picks apply at once. `FacetList` is the groups alone. Every word is in `labels`; **`labels-zh-tw` 0.39.0** adds `facetsLabels` (篩選, 顯示全部 N 個).

### Changed
- **Docs:** Table and List point to `responsive-table` for rows that phones see too. Issue #383
- **`agent-skill` 0.39.0:** the checklist names ResponsiveTable for rows that phones see too, never a hidden Table beside a hand-written phone list. Issue #383
- **`agent-skill` 0.39.0:** section titles are SectionHeader at its two levels (page 20 px bold, surface 14 px medium), and it takes `as` like the other headings. Issue #385
- **`agent-skill` 0.39.0:** the number formatting rule in the design language and the checklist: a count is written in full with grouping in tables, headers, detail pages and figures, and abbreviated only where space is the constraint (a tab's count, chart ticks, a compact chip), with the full number one step away, both through `formatCount`, never a hand-made "k". Issue #386
- **Docs:** Typography's Numbers section says when to abbreviate, with a table of both forms in English and zh-TW and a Do / Don't; Data visualisation's axis rule lets ticks abbreviate counts. Issue #386
- **`agent-skill` 0.39.0** and the Badge page: a state that changes (a robot's status, a job's state) is an `InlineStatus`, its shape and word with no box; a fixed attribute or category (a tier, a data use, an environment, a version, Beta) is a neutral `Badge`; a count is a `CountBadge`; in a table column whose header already names the attribute, the values are plain text. A page header shows at most one status, then its badges (#384).
- **Dependencies:** libphonenumber-js 1.13.17 and tailwind-merge 3.7.1 (#339).
- **`data-catalog` 0.39.0:** its filters are `Facets` and `FacetsDrawer`: the column is sticky with its own scroll, and below 1024 px the drawer is a bottom sheet with Clear all and Done instead of a left sheet. It installs `facets` in place of `checkbox`, `choice-field` and `sheet`.
- **`agent-skill` 0.39.0:** the checklist names Facets for a facet column, with FacetsDrawer on phones.
- **Docs:** the status pages (Empty and error states) have an "In Next.js" section: `app/global-error.tsx` built on `StatusPage` (#387). `error.tsx` sits inside the layout of its segment, so an error in the root layout reaches only `global-error.tsx`, which replaces the layout and so renders its own `<html>` and `<body>` with the font, `globals.css` and the theme script (in an `app/theme-script.ts` the layout shares), shows the error's digest as the reference, and offers `retry()` and a plain link home. It puts the theme back after it mounts: React gives its `<html>` only its own attributes, which drops the dark class. The files are type-checked modules in `site/snippets/`, and the recipe was built and run in a Next.js 16.4 app (an error thrown on the server and one in the browser, light and dark). The Next.js guide links to it, and the status-pages markdown twin says it.

## 0.38.0 · 2026-11-25

Every docs page is now under 400 KB of HTML, with no exceptions: the eight pages the budget let stay over it are lighter, most of them looking exactly as they did. The home page shows a robot's 3D lidar view, its sections arrive on a reload too, and the top bar's two ends balance.

### Added
- **`top-bar-shell` 0.38.0:** `insets` (`{ start, end }`): how far the logo and the last button's mark stand in from the bar's padding, from 768 px up. Both default to how far that last mark sits inside its 44 px button, so the floating panel's two ends are equally far from its edges, and at the top both marks sit on the content's edges. Before, the logo sat 12 px tighter to its edge than the icons at the other end. The docs header does the same.

### Changed
- **Docs:** token tables (on the foundation pages, Tokens, Localisation and Upgrading) are rendered once: one table that CSS turns into a card per row on a phone, where there were a table and a phone list side by side, and their rows carry no classes. On a phone a row's column names are drawn by CSS and screen readers hear the table's headers. Colour is 310 KB of HTML, from 431 KB.
- **Docs:** Upgrading's Current versions table is a client component drawn from four strings per item, so the page's React payload no longer carries its 200-odd rows as elements a second time beside the HTML, and the rows' looks are set once on the table: 296 KB, from 896 KB.
- **Docs:** Localisation's catalog of every component's labels (62 tables, 718 keys) is fetched once the page shows, from `/localisation-labels.json` (built from the props file, as the Lucide list is), and drawn as before; "Loading the labels" holds its place for the moment it takes: 302 KB, from 1,978 KB.
- **Docs:** the Components index's cards are drawn by a client component from each component's name, title and description, and styled from one CSS rule instead of classes on every card: 321 KB, from 561 KB. `lint:html-size` keeps no ceiling for these four pages.
- **Docs:** code listings carry their colours as eight classes instead of a style on every word, and a word in the code's own colour has no span at all: the same pixels in under half the bytes, on every page that shows code. Connect to ROS drops from 423 KB to 309 KB of HTML and leaves the size ceilings.
- **Docs:** the Next.js guide drops from 516 KB to 373 KB of HTML and leaves the size ceilings: the lighter listings above, and its two lists of a hundred component links styled once from the list instead of on every link.
- **Docs:** the icon gallery's tiles take four classes written once in the site's CSS instead of some forty utilities each, the same tiles in every state: /icons drops from 507 KB to 376 KB of HTML and leaves the size ceilings, and /icons/lucide is lighter too.
- **Docs:** a component's Patterns draw each block's copy buttons, install line, "Built from" row and preview card as the block nears the screen, as the examples already do; until then its title and description stand above empty boxes of the same size. The chart page, with 22 patterns, drops from 740 KB to 391 KB of HTML and leaves the size ceilings. The Prompt button's text is written in the browser, and /blocks pages send their blocks as data, not markup twice: the same page in fewer bytes.
- **Docs:** `lint:html-size` keeps no ceilings: every prerendered page is held to 400 KB.
- **Docs:** the home page's fleet shows what one robot sees: the robot running low, 9C44, as a 3D lidar scan (`point-cloud`) of the site's walls, racks and the other robots, from where it is as it drives home, beside the fleet list. It was a schematic floor plan; no new dependency or outside service. The alarm panel fills its box, so it ends level with the telemetry panel beside it.
- **Docs:** on a reload the home page's sections already on screen play their entrance, as the hero does; before, a reload (which keeps the scroll position) left them still. They are hidden before the first paint only when scripts run, and show anyway after 2 s.

## 0.37.0 · 2026-11-25

Saved views for the filter bar, catalog rows that unfold their label layers, event windows in the media player, and every item version findable at a kit tag. A lowered teleop speed limit now applies at once.

### Added
- **`filters` 0.37.0:** `FilterViews`, saved views above a Filters bar (#300). One chip per view (ChipGroup, a radio group to screen readers); the view whose rules equal the current rules is chosen, whatever their order and the order of their values. Change a rule and the chip lets go, "Modified" shows (and is announced once) with Reset, which puts that view's rules back and moves focus to its chip. With `onSave`, Save view asks for a name in a popover and calls `onSave(name, rules)`; storing the views is the app's job. `rulesEqual` compares two rule lists the same way, ids ignored. Every word is in `labels` (`FilterViewsLabels`); **`labels-zh-tw` 0.37.0** adds `filterViewsLabels`. The filters page has a Saved views example with the rules in the URL. `filters` now installs `chip-group` and `field`.
- **`data-catalog` 0.37.0:** a source dataset unfolds its label layers (#351). `Dataset.layers` (`LabelLayer`) adds a ghost toggle under the name, "3 label layers", with `aria-expanded` and `aria-controls` naming the rows it shows; Enter and Space toggle it and focus stays on it. Each layer is a row indented under its source behind a guide line, with its own link and mono ref line (`labels/coco@v2`); on phones it keeps the name and the items, like the dataset rows. The layers appear and fade out, and search finds a source by a layer's name or ref. The sample's night parking dataset has three layers.
- **`media-player` 0.37.0:** a marker with `end` is a window (`{ time: 18, end: 31, label: "Person in path" }`), drawn as a bracket from start to end in the lane above the track, never a fill on it, so it is not read as the played or buffered part. A press goes to its start; hover and focus show its range ("0:18–0:31, Person in path"), and the list and the timeline name it the same way. In the list the times are one column, so every name starts at the same place. Issue #346
- **`media-player` 0.37.0:** `markerList`: `list` (default, as before), `collapsed` (a "3 events" disclosure, the kit's Collapsible, that unfolds the list, so every clip in a grid is the picture and one row) or `none` (no list, when the page lists the events itself; the marks on the timeline then take the keyboard and are named). New docs examples: Ranges and Grid. Issue #346
- **`labels-zh-tw` 0.37.0:** `mediaPlayerLabels.markerCount`, `range` and `marker`. Issue #346
- **Registry:** `registry/kit-tags.json`, served at `/r/kit-tags.json`, maps the 104 older item versions that no kit release was called (`slider` 0.21.1, `graph` 0.21.2 ...) to the first kit tag that shipped each, so every installed file can be found and compared at a tag (#328). `lint:versions` fails on a released version that is neither a kit release nor in the map. The Upgrading page says how to find a file's tag.

### Changed
- **`media-player` 0.37.0:** a mark on the timeline shows its name in a drawn label over the picture on hover and focus, instead of the browser's tooltip. Marks are placed from `duration` until the file's metadata reports its own length, which then wins (tested). Installs `collapsible`. Issue #346
- **`teleop-pad` 0.37.0:** lowering `maxSpeed` while the stick is held still applies on the next send. Before, the pad kept sending the speed shaped at the last move until the stick moved again.
- **`log-viewer` 0.37.0:** the toolbar sits 4 px from the frame, so its controls' corners follow the frame's (outer radius = inner + padding).
- **Docs:** block previews start at their content's measured height instead of a guess (480 px for every chart), so the frame no longer jumps when it goes live.
- **CI:** a pull request into dev runs the stories it can change twice, the second time against the first one's pictures, so a story caught mid-animation fails at dev, not stage. The stage run no longer writes a missing baseline. `check:radius` (concentric corners) and `check:wrap` (actions wrapping on a 375 px phone) run on the built site for pull requests into dev and stage.

## 0.36.0 · 2026-11-25

Performance and stability, from an engineering audit, and the docs home in motion: live data never freezes silently, one shared copy of the runtime helpers, a hydration test, tighter registry dependencies; docs pages that load code only when opened, /blocks as pictures and block cards that go live near the screen; an alarm bar and a selected card no rounded corner cuts; and a docs home that shows the kit running.

### Changed
- **`alarm` 0.36.0:** the priority bar is a pill with round ends in its own 24 px gutter (10 px either side, as tall as the content), never a strip against the card's edge, which the round corner cut into a blade; cleared, it is dashed inside the same pill. Content starts 24 px in and ends 16 px from the edge. Beside Acknowledge the state is no longer repeated in words (screen readers still hear it); cleared, acknowledged, shelved and read-only alarms still say it.
- **`waypoint-editor` 0.36.0:** a selected waypoint takes a 2 px ink ring all round, as a graph node, instead of a start border that the card's corners bent into a crescent.
- **`agent-skill` 0.36.0:** an indicator inside a rounded surface is an inset pill in its own gutter, a selected card a 2 px ring, and a status word is not repeated beside the button that says it.
- **Stale by default (`point-cloud`, `robot-model`, `attitude` 0.36.0):** every live-telemetry component now goes stale when nothing new arrives, at a limit chosen for its data. New defaults: PointCloud 3 s (clouds throttled to 1 or 2 Hz over rosbridge), RobotModel 1 s (the same joint states as JointState; a model shown without `joints` never goes stale), AttitudeIndicator 1 s (an IMU at 50 Hz or more), Gauge 3 s (two missed readings of a 1 Hz topic). Unchanged: CameraFeed and CameraWall 2 s, StreamingChart 2 s, JointState 1 s, Diagnostics 5 s. **Upgrading:** a view fed fixed data (a saved map, a URDF on show, a recording) passes `staleAfterMs={null}`; a still robot that keeps publishing stays live when you pass its message stamp (`updatedAt`, `receivedAt`).
- **`staleAfterMs={null}` turns stale off everywhere** (`camera-feed`, `camera-wall`, `streaming-chart`, `joint-state`, `diagnostics`, `point-cloud`, `robot-model`, `attitude` 0.36.0). `Infinity` still works where it did. The rule is in the design language and the checklist (`agent-skill` 0.36.0).
- **No hydration mismatch from the clock (`alarm`, `log-viewer`, `diagnostics` 0.36.0):** they read the time through the new `use-now`, null until the page has hydrated. `alarm` read `Date.now()` in its first render, so a list rendered on the server counted a flood the browser did not (or the reverse): a hydration error, and folded rows that jumped. `tests/unit/hydration.test.tsx` renders each live component on a server in UTC and hydrates it in New York 40 minutes later.
- **`point-cloud`, `robot-model` 0.36.0:** release their WebGL context once unmounted (browsers keep about 16, and one waiting for garbage collection still counts); not while Strict Mode re-runs the effect on the same canvas.
- **`ros` 0.36.0:** a fragmented message of more than 10 000 parts is refused instead of allocated, and one whose next part has not come for 10 s is dropped instead of kept for the life of the connection.
- **`segmented-control`, `tabs` 0.36.0:** the frame that places the thumb or the underline is cancelled if they unmount first.
- **Registry:** `fleet-table`, `list-detail` and `map-workspace` no longer install `progress`, `data-catalog`, `settings-page` and `users-roles` no longer install `label`, `dataset-detail` no longer installs `button` (none of them imported it). Every npm dependency names its major (`cmdk@^1`, `lucide-react@^1`, `radix-ui@^1`, …). `lint:registry` fails a registryDependency no file of the item imports, and a dependency without a version range.
- **Docs:** code a reader has to open to see is no longer in the page. A block's Code tab, an example's Code sheet and a component's Source sheet fetch their listing when they open, from static JSON prerendered at build time (`/code/src/…`, `/code/story/…`, site/code-data.ts and site/lazy-code.tsx), and start fetching on hover or focus of the tab or button; until it arrives the frame shows its title and the listing's own number of lines, so nothing moves. The chart page's HTML went from 2,197 KB to 771 KB (its React payload from 1,730 KB to 304 KB), point-cloud's from 1,119 KB to 256 KB, and every Properties and Accessibility tab lost its component's source (robot-map's from 1,540 KB to 281 KB); 124 pages were over 400 KB, now 8.
- **Docs:** the cards on /blocks are pictures, light and dark at 400 and 800 px like /docs/components, instead of a live iframe of the whole site per card (17 on the page). `npm run build && npm run thumbs -- --blocks` takes them from each block's preview, framed as the cards framed the live preview (site/blocks.tsx, `blockCards`); `lint:thumbs` checks them; the visual-baseline workflow retakes them. Lighthouse mobile on /blocks: Performance 63 → 86, Total Blocking Time 3.7 s → 0.16 s. A block's own place (its type page, or its component's Patterns) keeps the live preview with its device widths.
- **Docs:** a block's live card (a component's Patterns, a block type's page) goes live as it comes within a screen of the viewport, like the examples; until then it is a still card of the same size, drawn by CSS alone, with its tabs, device widths and Open link as real controls, so they are in the tab order and say what they are, and using one brings the card live with that choice made and the focus kept (site/block-frame.tsx). Lighthouse mobile, median of 3, two interleaved runs: the chart page (22 cards) Total Blocking Time 2.1 / 3.1 s → 0.66 / 1.2 s, Time to Interactive 7.6 / 8.4 s → 6.6 / 6.8 s; /blocks/fleet-operations (6 cards) 0.86 / 0.80 s → 0.37 / 0.22 s; Cumulative Layout Shift stays 0.
- **CI:** `npm run lint:html-size` after the build fails when a prerendered page is over 400 KB of HTML; eight pages that are large for what they show are held to their own ceilings (scripts/check-html-size.mjs).

### Added
- **Docs home:** a "See it run" band under the three rules: a fleet on RobotMap with a list of Meters, a StreamingChart of motor current and an AlarmList, fed a seeded simulation every 2–3 s. Each loads only near the screen into a box of its own size (no layout shift), stops off screen and in a hidden tab, and holds a still frame under reduced motion and in automated browsers. Sections enter with a 24 px rise over `--motion-sheet`, 60 ms apart, the home page's one exception to the motion rule (Motion foundation, "The docs home"; **`agent-skill` 0.35.0** says so too). Fixed: a section scrolled past before it arrived, or under a full-page capture, stayed blank on every page that reveals on scroll.
- **Shared runtime helpers (0.36.0, beta), installed with the items that use them:** `input-modality` (keys or pointer last, one pair of document listeners for the page instead of one per menu: `command`, `context-menu`, `dropdown-menu`, `graph`, `select`, `tree`), `use-now`, `clock-time` (`formatClockTime`, with an optional `timeZone`: `streaming-chart`, `joint-state`, `attitude`, `camera-feed`, `point-cloud`, `robot-model`), `use-reduced-motion` (`attitude`, `streaming-chart`, `geo-map`, `robot-map`, `point-cloud`, `media-player`, `scrollspy`, `grounded-text`), `theme-change` (`point-cloud`, `streaming-chart`, `robot-model`) and `math` (`clamp`, `pad`: `number-field`, `geo-map`, `robot-map`, `robot-model`, `point-cloud`, `log-viewer`). Every component's API and behaviour is unchanged; each is 0.36.0.
- **Tests:** React Compiler tests for `teleop-pad`, `use-long-press`, `use-slide-release` and `robot-map`, and direct tests of the two hold hooks behind the emergency stop.

## 0.35.0 · 2026-11-25

One part per repeated look, from a design audit against the kit's own rules: a level past its threshold shows its shape and word, links are underlined, chrome over a canvas, empty states, the ⋯ menu, the Chart / Table switch and icon tiles each have one part, and hover is one step darker than the current page.

### Added
- **`viewport-overlay` 0.35.0 (beta):** the place and the surface for what is drawn over a map, a point cloud, a 3D view or a camera. `ViewportOverlay` puts it 16 px from the frame's edges (`position` top-left, top, top-right, bottom-left, bottom, bottom-right, center), pieces 8 px apart, and lets the pointer through to the canvas; `ViewportPanel` is one piece, the kit's Float (`bg-float shadow-float ring-1 ring-edge backdrop-blur-xl`, opaque in high contrast) or `variant="scrim"` for words over a picture, rounded-sm like the buttons. Audit #4
- **`segmented-control` 0.35.0, `labels-zh-tw` 0.35.0:** `ChartViewSwitch`, the Chart / Table switch for a chart card's header at `--h-sm` (36 px with a mouse, 44 on touch: a header holds no field), or any two views with `views` (Map / List); words through `labels` (`chartViewSwitchLabels`). In segmented-control, not chart, so a block drawn without recharts can use it. Audit #5
- **`agent-skill` 0.35.0:** the design language says what `--muted` is and that hover is a different fill, and how chrome sits over a viewport; the checklist names ViewportOverlay, ChartViewSwitch and a level past its threshold as glyph and word. Audits #1, #4, #5, #8

### Changed
- **`syncrobotic-theme` 0.35.0:** status words keep 4.5:1 on the darker hover and selected fill (`--accent`) too: light `--success` #166748 and `--warning` #7c5200, dark `--danger` and `--destructive` #f87583 (red was 3.9:1 on a selected row in dark). A test checks every status colour on the page, cards, `--muted` and `--accent` in all four themes.
- **`segmented-control`, `tabs` 0.35.0:** the thumb and the underline travel only when the selection moves; a segment or tab that changes width (a web font arriving, a count) places them at once, so they are never caught halfway (the visual checks had caught a thumb covering half of "All 4").
- **`syncrobotic-theme` 0.35.0:** `--accent` (hover) is one step darker than `--muted` (the current page in navigation, and the quiet fill of table headers, segment tracks, tiles and disabled fields), so hovering another page never looks like the current one: #d4d4d8 in light (was #e6e6ea, the same as muted), #34343b in dark (was #25252b), #3f3f46 in high-contrast dark; high-contrast light's `--muted` is #e6e6ea (was #dcdce1). `--disabled` darkens a step (#74747c light, #80808a dark, #8e8e96 high-contrast dark) to stay 3:1 on the hover fill. Hover fills are visibly darker everywhere (menus, ghost buttons, table rows, a selected row). The colour foundation lists `--accent`. Audit #8
- **`meter` 0.35.0:** past `low` or `critical` a level shows the status glyph (triangle, square) before the value and the word (Low, High, Critical) beside it, in the status colour; the number stays text (it was the bar and the number in amber, the word only in `aria-valuetext`). `inline` shows the glyph and reads the word. **`robot-status-card`, `sparkline-robot-list` 0.35.0:** a low battery the same way. Audit #1
- **`geo-map`, `robot-map`, `point-cloud`, `camera-feed`, `robot-model`, `camera-wall` 0.35.0:** what they draw over the view is ViewportOverlay and ViewportPanel: one inset (16 px; point-cloud and camera-feed were 12), one radius (rounded-sm), Float instead of a card with a shadow or the page's background. **`graph` 0.35.0:** its frame is a Surface (`bg-card`), not the page's background. Audit #4
- **12 chart blocks** (`area-chart-battery`, `area-chart-cumulative`, `area-chart-fleet-states`, `bar-chart-missions`, `bar-chart-ranked`, `bar-chart-stacked`, `bar-chart-variance`, `heatmap-week-hours`, `histogram-battery`, `line-chart-compare`, `line-chart-limit`, `line-chart-telemetry`) **0.35.0:** the Chart / Table switch is ChartViewSwitch at `--h-sm` (was 44 px); line-chart-telemetry's range switch beside it too. **`streaming-chart` 0.35.0** uses it, no visible change. Audit #5
- **`media-player` 0.35.0:** on a coarse pointer a marker's target is `--h-md` (44 px, 48 in gloves); it looks the same. Audit #12
- **`copy-button` 0.35.0:** a text button's word starts 8 px after its icon whatever it says; the room kept for the longest word falls after it (the docs' Prompt button had 20 px between icon and word). Audit #14
- **Docs:** links are underlined everywhere (How to upgrade, the related-component chips under Built from, the brand downloads), the underline grey until hover darkens it (`textLink` in site/prose); a component page's version and Beta are MetaPill links. Audit #2
- **`empty-state` 0.35.0:** one part for every empty place, in the size of its host: `size="panel"` (the default, as before), `size="inline"` for a table, a list or a small panel (a bare icon and 14 px words), and `variant="overlay"` for a canvas or a picture (no padding of its own, at most 24 rem wide; the viewport's overlay layer places it). The panel's icon sits on IconTile. It takes div props (`role`, `data-*`).
- **`dropdown-menu` 0.35.0, `labels-zh-tw` 0.35.0:** `DropdownMenuMoreTrigger`, the ⋯ that opens more actions: a ghost icon button everywhere, named "More actions for {name}" in a row and "More actions" in a toolbar (a menu of view settings keeps "View options", same button); `size="icon-sm"` in a row; `labels` (`dropdownMenuMoreTriggerLabels`).
- **`table` 0.35.0:** `TableActionsCell`, the row's last cell for its ⋯ menu or icon buttons: as narrow as its content, 8 px from the row's end on phones.
- **`agent-skill` 0.35.0:** the design language and the checklist name one part per repeated look (EmptyState at its host's size, IconTile, a square Avatar for a robot's ID, DropdownMenuMoreTrigger in TableActionsCell), medium titles inside a surface, skeleton bones at their control's height, and a single-choice toggle group only for a tool or a mode.
- **Empty states are EmptyState:** `log-viewer`, `camera-wall`, `bar-list`, `waypoint-editor`, `graph`, `data-grid` (a string `emptyText`; the row grows with it instead of a fixed 128 px) and `users-audit-log` inline; `geo-map` and `robot-map` (overlay in the map's corner card, inline in their lists); `point-cloud` and `robot-model` (overlay, for empty, no WebGL and errors). All 0.35.0.
- **Row and toolbar ⋯ are DropdownMenuMoreTrigger:** `fleet-table` and `users-roles` in TableActionsCell, named "More actions for {name}" (were "Actions for" and "More for", with two cell paddings); `streaming-chart`'s narrow View options is ghost like every ⋯ (was outline); `log-viewer` and `action-rail-shell`'s top bar use the part (same look). All 0.35.0.
- **Icon tiles are IconTile:** `status-pages`, `auth-invite` and `wizard-commission` (12 px corner at 40 px, was 16), `navigation-menu`'s card (8 px at 32, was 12), `item`'s media (same look). All 0.35.0.
- **A robot's ID is a square Avatar:** `robot-status-card` (xl), `app-shell-mobile-tabs` (lg), `island` (md), the ID in mono. `avatar` 0.35.0: square avatars take the icon tile's corner at the same size, 12 px at 40 and 48 (was 8).
- **Titles inside a surface are medium:** `alarm` (AlarmList), `dataset-detail`, `list-detail`, `action-rail-shell` (ActionRailColumnHeader) were bold. All 0.35.0.
- **Skeleton bones at token heights:** `settings-billing` (`--h-md`, was 40 px) and `status-pages` (`--h-sm`, was 36 px). Both 0.35.0.
- **Toggle group docs:** a single-choice toggle group is a tool or a mode; a view, a sort order or a time window is a Segmented control. The examples (and the card's picture) show map tools and layers instead of a time range; the sort-direction example is gone.

## 0.34.0 · 2026-11-25

The full-screen model workspace: the action rail with a history column, a control panel and a top bar that folds instead of wrapping, grounded text that drives a picture in another panel, and a streaming chart that comes back from its table at full size.

### Added
- **`action-rail-shell` 0.34.0:** a full-screen workspace, for a model playground and any screen with past items on one side and the controls for the next step on the other. `leading` is a column left of `main` from 1280 px (18 rem; below that it is not shown, so put a top-bar button in `actions` that opens a Sheet with the same list); `panel` is a column right of `main` from 1024 px (22.5 rem) with the rail's step, primary and small actions pinned at its foot, and on phones it follows `main` while the rail stays the bar at the bottom. Either one makes the shell fill the screen from 1024 px with no page column: each column scrolls on its own under a `--h-row` head row with a hairline, 8 px apart like the app shell, and `ActionRailColumnHeader` gives `main` the same row so the hairlines line up. The columns are `aside` landmarks named by their titles; the rail inside the panel is a region named by the step; one `main`. Issues #343, #312
- **`action-rail-shell` 0.34.0:** `headerItems` for the top bar: in priority order, and those that do not fit fold into a ⋯ menu (More), last first, instead of wrapping or running off the bar at 768–1280 px; an item is a 44 px button (or icon button) or your own node (a badge, a status), and a menu item or a line in the menu. `actions` never fold. The block still imports only Button and DropdownMenu, no sidebar, command or search code. Issues #312, #343
- **`action-rail-shell` 0.34.0, `labels-zh-tw` 0.34.0:** `labels` (`actionRailShellLabels`: back, next step, more actions, More); `backLabel`, `stepLabel` and `moreLabel` still work and win. Issues #343, #312
- **`agent-skill` 0.34.0:** the design language describes the workspace and the top bar that folds instead of wrapping; the checklist says a full-screen workspace is `action-rail-shell` with `leading` and `panel`, not a hand-built shell. Issues #343, #312
- **`grounded-text` 0.34.0:** `GroundedTextBody`, the text alone, drives an annotated-image the screen already shows in another panel, so the page has one picture: it reports the span under the pointer or keyboard (`onActiveChange`) and the pin, lights the spans of the mark the picture reports (`activeMark`), and `groundedImageProps` gives the picture its highlight, selection and descriptions. GroundedText is built on it, API unchanged. Pinning a span scrolls its marks into view in the picture's panel (`picture`), never on hover, without scrolling the span away, instantly under reduced motion. The text is beside the picture from 42 rem of the component's own width (was 48 rem): a 720 px canvas has it beside. Issue #338
- **`labels-zh-tw` 0.34.0:** `groundedTextBodyLabels`, the same words as `groundedTextLabels`. Issue #338
- **`agent-skill` 0.34.0:** the checklist names GroundedTextBody for grounded text beside a picture the screen already shows. Issue #338

### Fixed
- **`streaming-chart` 0.34.0:** back from the table view the chart sizes its new canvas again; it was left at the browser's 300 × 150 and drawn stretched and blurred, cut to its top left corner.

## 0.33.0 · 2026-11-25

Data and pictures in rows and cards: a ranked list of counts, a small picture for tables and lists, the media card pattern, and an image grid that draws your own tile face and hands focus back after your own view.

### Added
- **`bar-list` 0.33.0 (beta):** a short ranked list of counts ("items per class", "files per format") with no chart library: a `<ul>` named by `label`, each row its label (truncating) and its value in words (tabular, `locale` and `format`), a bar under it in `--chart-1` scaled to the largest value, so it needs no table view. One series, no status or per-row colours. Rows with `href` are links through `linkAs`, 36 px tall (44 on touch); `max` shows that many, then "N more"; every word through `labels` (`barListLabels` in `labels-zh-tw` 0.33.0). No surface of its own: it fits in a card, a table cell or a sheet. Issue #308
- **`thumbnail` 0.33.0 (beta):** one small square picture for tables, lists and cards: `size` sm (`--h-sm`), md (`--h-md`) or lg (`--h-lg`), rounded-xs, object-cover, lazy, and ImageGrid's neutral image-off fallback in the same box when it fails. `restricted` with `reason` renders RestrictedPreview's neutral placeholder at that size, named by the reason and showing it as a tooltip, and fetches nothing. Words through `labels` (`thumbnailLabels` in `labels-zh-tw` 0.33.0). Issue #298
- **`card` docs:** the media card pattern on the card page (CardMediaGallery): CardMedia with one cover or a mosaic of up to four Thumbnails, the title as the card's one link (metric-card's stretched link), one or two facts and a tier badge, in a responsive grid; a restricted collection shows the placeholder and fetches nothing. A pattern, not a new item. Issue #309
- **`image-grid` 0.33.0:** `renderTile(item, { onError })` draws a tile's picture area your way, such as an AnnotatedImage with the boxes on it; the grid keeps the button and its name (the item's `alt`), the aspect box, picking, and the hidden and failed states (`onError`, e.g. from AnnotatedImage's `onLoadError`, shows the failed one). Issue #320
- **`image-grid` 0.33.0:** focus return for your own view moves into the grid: with `onOpen`, it remembers the tile (or the corner button while picking) that opened the picture, and `restoreFocus()` on its `ref` (`ImageGridHandle`) puts focus back there, or on the tile now in its place if the picture was removed. Call it in your dialog's `onCloseAutoFocus` after `preventDefault()`; keeping `document.activeElement` yourself still works. Issue #320
- **`agent-skill` 0.33.0:** the checklist names BarList for a short ranked list of counts, Thumbnail for a small picture in a row (restricted with a reason), and ImageGrid's `restoreFocus()` for a dialog opened from `onOpen`. Issues #308, #298, #320

## 0.32.0 · 2026-11-24

A calmer log viewer, the sidebar's collapse on the sidebar itself, accessibility fixes from product teams (focus never under a sticky bar, Escape to native dialogs, status pages in a frame), a data-slot on every control the kit draws, and small options: a shared share-bar legend, metric-card tone, MetaPill links, card media, graph badges, inline code and a collapsible.

### Changed
- **`log-viewer` 0.32.0:** the toolbar is one control height, the search field's `--h-md`: the level and source menus are default-size buttons and the view options an icon button (they were 36 px beside a 44 px field).
- **`log-viewer` 0.32.0:** an opened line's detail is a band of its row, not a ringed card under the message: a hairline, then the fields with names under the time column and values under the level column, and one quiet Copy line on the band. The footer's Copy shows only for a selection of two or more lines ("Copy 3 lines"). Jump to latest is docked in the footer beside Paused, so it never covers a line or its detail.
- **`data-grid` 0.32.0:** `DataGridColumnVisibility` is `--h-md`, the height of the search field beside it in a toolbar (was `--h-sm`).
- **`sidebar` 0.32.0:** `SidebarTrigger` takes `show`: `"always"` (default, as before), `"expanded"`, `"collapsed"`, or `"mobile"` (only on phones, the menu button that opens the sheet).
- **`sidebar` 0.32.0:** new `SidebarRail`: a small round button half over the sidebar's edge, level with the line under the top bar, ‹ to collapse and › to expand, with the shortcut in its tooltip. A Tab stop named Collapse or Expand sidebar with `aria-expanded`; a 44 px target on touch; absent on phones. The Sidebar's inner frame clips the column now, not the aside, so the button can reach over the edge.
- **`app-shell` 0.32.0:** the sidebar collapses at its edge (SidebarRail), and the top bar starts with the title; on phones its first button is the menu that opens the sheet. ⌘B / Ctrl+B and the `sidebar_state` cookie as before. Update `sidebar` with it. Every block in the app shell takes it.
- **`agent-skill` 0.32.0:** the design language says a toolbar is one height (every control `--h-md` beside a field; `--h-sm` only in a row without one) and where the app shell's collapse controls sit. The Spacing foundation says the same.
### Added
- **`status-pages` 0.32.0:** for a status page inside a product's frame. `as` sets the heading level (`"h1"` or `"h2"`; by default h1 on a screen of its own, h2 in a frame), so a 404 inside `top-bar-shell`, which has no page title, still has an h1; `fill="parent"` stays a `<section>`, never a second `<main>`. `primary` and `secondary` take `{ label, href }`, a link through `linkAs` (default `"a"`) that opens in a new tab and works before scripts load, or `{ label, onClick }`; a string works as before, and `secondary={null}` leaves it out. Every word goes through `labels` (`notFoundPageLabels`, `noAccessPageLabels`, `errorPageLabels`, `offlinePageLabels` and `loadingPageLabels` in `labels-zh-tw` 0.32.0). Issues #323, #345
- **`agent-skill` 0.32.0:** the checklist says a status page inside `top-bar-shell` takes `as="h1"` and links out with `{ label, href }`. Issue #323
- **`graph` 0.32.0, `top-bar-shell` 0.32.0:** data-slot on their interactive parts, so a product's check for hand-made controls no longer needs exceptions for them: `graph-node` on each node's link or button, `graph-list-link` in GraphList; `top-bar-link`, `top-bar-brand` and `top-bar-menu` in the top bar (the account button takes `dropdown-menu-trigger`). Issue #317
- **`dropdown-menu` 0.32.0, `theme-toggle` 0.32.0:** `DropdownMenuTrigger` sets `data-slot="dropdown-menu-trigger"`, as shadcn does (with `asChild`, a kit child such as Button keeps its own), and the theme toggle's menu button is `theme-toggle`. The other Radix triggers and closes the kit exported bare get theirs too: `tooltip-trigger`, `dialog-trigger`, `dialog-close`, `alert-dialog-trigger`, `sheet-trigger`, `sheet-close`, `popover-trigger`, `hover-card-trigger`, `context-menu-trigger` (`tooltip`, `dialog`, `alert-dialog`, `sheet`, `popover`, `hover-card`, `context-menu` 0.32.0). Issue #329
- **`image-grid` 0.32.0:** each tile button is `image-grid-item`, a restricted tile's reveal button `image-grid-reveal` and the view-larger button `image-grid-zoom`. `restricted-preview` 0.32.0 takes `data-slot` for its reveal button (default `restricted-preview`, as before). Issue #333
- **`table` 0.32.0:** `TableHead`'s sort button is `data-slot="table-head-sort"`. Issue #340
- **Every button, link and field a kit component draws has a data-slot** (`<component>-<part>`), and `tests/unit/data-slot-coverage.test.ts` fails when one is added without (a static scan of `ui/` and `blocks/`, with an explicit allowlist; a bare Radix trigger export fails it too). New slots in `alarm`, `attachment`, `autocomplete`, `banner`, `calendar`, `chip-group`, `data-grid`, `date-selector`, `file-upload`, `filters`, `geo-map`, `media-player`, `metric-card`, `number-field`, `phone-input`, `robot-map`, `scrollspy`, `share-bar`, `sortable`, `stepper`, `time-picker`, `action-rail-shell`, `agent-runs`, `card-site`, `data-catalog`, `event-log`, `fleet-table`, `incident-queue`, `list-detail`, `notification-center`, `settings-webhooks` and `wizard-import` (each 0.32.0; the names are in each item's changelog). Nothing else changes. Issues #317, #329, #333, #340

### Fixed
- **`app-shell` 0.32.0:** ShellSearch's words (the dialog's name, the scope button, the empty result) go through `search.labels`, with `shellSearchLabels` in labels-zh-tw. Issue #331
- **`labels-zh-tw` 0.32.0:** `paginationLabels.range` groups its numbers by the locale ("第 1,201–1,220 筆，共 12,400 筆"), as the English default does. Issue #324
- **`action-rail-shell` 0.32.0:** the primary keeps its element, and keyboard focus, when its label changes (Run → Stop and back); the small actions too. Actions are keyed by place, or by a new optional `id` on `RailAction`, never by label. Issue #334
- **`toast` 0.32.0:** Escape inside an open native `<dialog>` closes the dialog again (it gets a `cancel` it can refuse) and leaves the toast; an open toast had taken the key for itself. Escape with focus in a toast, or outside any dialog, still dismisses it. Issue #311
- **`tabs` 0.32.0:** a `ref` passed to `TabsList` gets the row and the travelling underline shows; the ref had replaced the one the underline measures, so the active tab fell back to its own border. The docs say a row of links to other pages is navigation (ChipGroup with `href`, or NavigationMenu), not tabs. Issue #336
- **`streaming-chart` 0.32.0:** with reduced motion the live edge holds on whole seconds of the data's clock, so the axis keeps round labels between its once-a-second steps and the same second always draws the same picture (the visual checks had caught the line a few pixels apart from run to run).
- **`accordion` 0.32.0:** an item open in the server render (`defaultValue`, Next.js App Router) shows open on first paint instead of playing its open animation on every page load; the expand animation waits until Radix has measured the content. Items the user opens and closes keep their motion, and reduced motion is unchanged. Issue #322
- **`governance-todo` 0.32.0:** `GovernanceTodoContent` fills its container instead of stopping at 56 rem (`max-w-4xl`), so inside `top-bar-shell` it spans the content width like every other page. Issue #337
- **`top-bar-shell` 0.32.0:** focus is never hidden under the sticky bar (WCAG 2.4.11): the shell sets the page's `scroll-padding-top` to the bar plus 8 px (`--h-row` + 16, from tokens), and adds the tab row's `--h-md` while a sticky `TabsList` is pinned under it, so Shift+Tab back up a table or a filter row scrolls each control clear of the bar. The page's own value comes back when the shell unmounts. Issue #344
- **`agent-skill` 0.32.0:** the design language says top-bar-shell keeps focus clear of its bar with the page's scroll padding. Issue #344
- **`share-bar` 0.32.0:** `ShareLegend`, one legend for a list of bars (one bar per task, per class): the same segments in the same order as the bars, values optional, so the colours match by construction. Each bar keeps its own accessible name. Issue #319
- **`annotated-image` 0.32.0:** `onLoadError` tells the app when the picture from `src` fails, once, as the kit's failed state shows, so a gallery can count failures or offer a retry without passing its own `<img>`. The picture and its overlays now load lazily (`loading="lazy"`); nothing else changes. A mark derived from another keeps its source's kind and says so in `description`. Issue #321
- **`metric-card` 0.32.0:** `tone` (`"warning"` or `"danger"`) for a number that is itself a warning (items waiting for review, a quota near its limit): the caption takes the status glyph and the tone's colour, as a MetaPill does, and says why. The value stays foreground and the card is never tinted; calm by default. Now depends on `status-glyph`. Issue #326
- **`page-header` 0.32.0:** `MetaPill` takes `href` (and `linkAs`, default `"a"`) for a fact that leads somewhere ("2 compliance items open" to the compliance tab): a link inside the list item, underlined like every link (foreground words, or the tone's colour), with the focus ring and a target of `--h-sm` (36 px, 44 on touch) while the pill stays `--h-tag` tall. Without `href`, nothing changes. Issue #327
- **`graph` 0.32.0:** `badge` on a node, for a category that is not a state (an access tier, "Deprecated", a version channel): a neutral outline tag after the name inside the box, read after the name in the node's accessible name, and shown after the name in GraphList. Plain text, no colour per tag. Columns stay unnamed: they come from the layout, not from kinds. Issue #318
- **`image-grid` 0.32.0:** `onOpen(item, index)`, when given, replaces the lightbox with the app's own view, such as a Sheet with the picture's labels and file details: a tile (and the corner button while picking) calls it, even with `lightbox={false}`. The keys, the hidden and broken tiles and picking are unchanged; the app's dialog returns focus to the tile (keep `document.activeElement` in `onOpen`, focus it in `onCloseAutoFocus`). Without it, nothing changes. Issue #320
- **`card` 0.32.0:** `CardMedia` for a cover picture: first in the card, edge to edge through the padding with the card's own top corners (`rounded-[inherit]`, so they stay concentric), or `inset` inside the padding at the image radius (12, as ImageGrid's tiles). `aspect` (`"video"` by default, `"4/3"`, `"square"`, `"auto"`) keeps its shape before the picture loads; an `<img>` or `<video>` in it fills it. A stretched link on the card still covers it. For a small picture in a row, ItemMedia `variant="image"` already does this. Issue #342
- **`code` 0.32.0 (beta):** inline code for a path, a key, a version tag or a command inside a sentence (`<Code>max_items</Code>`): mono on a muted tile (`rounded-2xs bg-muted px-1`), at the size of the text around it, so body text, a table cell and a caption keep their line height; a long token breaks anywhere instead of pushing a phone sideways. No copy prop: put a CopyButton beside it. Issue #297
- **`agent-skill` 0.32.0:** the checklist names Code for a path or key inside a sentence. Issue #297
- **`collapsible` 0.32.0 (beta):** one region behind one trigger ("More filters", "How to use this", the rest of a long note), on Radix Collapsible and styled like accordion: the same chevron (turned up while open), focus ring and expand and collapse motion at `--motion-base`, instant under reduced motion. The trigger is a button that needs no heading. The animation waits until Radix has measured the region, so content open in the server's HTML shows at once instead of growing on first paint. Issue #299
- **`agent-skill` 0.32.0:** the checklist names Collapsible for one region behind one trigger, never a raw `<details>`. Issue #299

## 0.31.0 · 2026-11-22

Two components for model answers (streaming text, text linked to marks on a picture), a tier badge, and 13 fixes and options asked for by product teams: heading levels, sticky tabs under the shell, multi-select chips, formatted meters, chart inks and more.

### Added
- **`chip-group` 0.31.0:** `type="multiple"` for any of several values in one facet: `value` and `onValueChange` take a list, the chips are pressed buttons, and chosen links say "selected" instead of aria-current (new label `selected`, in `labels-zh-tw` too); `max` keeps every chosen chip in view. Issue #304.
- **`chip-group` 0.31.0:** `props` on a chip are spread on its button or link (`data-*`, `title`, `aria-describedby`), and `current` sets the chosen link's aria-current (`"page"`, the default, `"true"` or `"location"`), so a row of filter links no longer marks a second current page. Issue #305.
- **`meter` 0.31.0:** `locale` and `format` (Intl.NumberFormatOptions) write the value and the range's end in the text and in aria-valuetext ("412,345 of 1,000,000 items", or "412K of 1M" with `{ notation: "compact" }`); without them numbers are written as given, as before. `showThresholds` draws a 1 px grey tick at `low` and `critical`, so a quota shows how close it is before it turns warning. `labels` translates "of" and the low, high and critical words (`meterLabels` in `labels-zh-tw`). Issue #306.
- **`share-bar` 0.31.0:** `href` on a segment makes its legend entry a link to that part (the list filtered to it), through `linkAs` (default `"a"`), named with its share in the locale ("Source A 4,200, 42 %"); the bar stays one picture, so each part has one target. Without `href`, nothing changes. Issue #296.
- **`syncrobotic-theme` 0.31.0:** `--chart-1-foreground` to `--chart-5-foreground` (`text-chart-N-foreground`), the ink for words and numbers on a chart colour, 4.5:1 or more on it in light, dark and both high-contrast modes (tested in `chart-foreground.test.ts`); `--color-scrim`, so `bg-scrim` is a utility; and `--letterbox` (`bg-letterbox`), the bars around a picture that does not fill its frame: the dark page colour, black in high contrast. The DTCG files and the Colour foundation list them. `media-player` 0.31.0 uses `bg-scrim` and `bg-letterbox` (update the theme with it) and looks the same. Issue #302.
- **`top-bar-shell` 0.31.0:** `home` sets where the logo links (default: the first link, as before), and `<main>` has an id for a skip link (`mainId`, default "main"). The phone drawer closes when a link in it is followed, so on a client router (Next.js, React Router) it no longer stays open over the new page; a modified click (new tab) leaves it open. Issue #292
- **`tabs` 0.31.0:** `<TabsList sticky>` keeps the tab row in view over long sections: it pins under the shell's top bar (`top: var(--shell-top, 0)`), on the shell's surface, with its hairline, below the bar. Picking a tab while it is stuck scrolls back to the start of the tabs. Issue #294
- **`top-bar-shell`, `app-shell`, `app-shell-mobile-tabs` 0.31.0:** each shell's root sets `--shell-top` (its bar's bottom edge in the scrolling area) and `--shell-surface` (the colour behind the page), so a sticky tab row, or a product's own filter bar, pins under the bar. The phone shell's bar now sits above pinned rows (z-20). Issue #294
- **`agent-skill` 0.31.0:** the design language documents `--shell-top` and `--shell-surface` and how to pin a row under the bar. Issue #294
- **`governance-todo` 0.31.0:** `readOnly` hides the row actions and keeps the layout, for people who only read the list (the work is done elsewhere). `onDone(id)` hands completion to the app: the action calls it, and the row leaves when `todos` no longer has it. Issue #295
- **`tier-badge` 0.31.0 (beta):** a dataset's licence tier as a tag, moved out of `data-catalog` so it installs on its own: the code and its words ("T1 · Non-commercial"), or the code alone in a Tier column (`compact`, still read out in words); `labels` for the words. `data-catalog` re-exports `TierBadge`, `tiers` and `Tier`. Issue #291
- **`data-catalog`, `dataset-detail`, `governance-todo` 0.31.0:** each exports its content without the sample shell (`DataCatalogContent`, `DatasetDetailContent`, `GovernanceTodoContent`, same props), to drop into a product's own frame such as `top-bar-shell`. `DataCatalog`, `DatasetDetail` and `GovernanceTodo` render as before. Issue #291
- **`labels-zh-tw` 0.31.0:** `tierBadgeLabels`. Issue #291
- **`agent-skill` 0.31.0:** the skill points to the data blocks' content exports for use inside a product's own frame. Issue #291
- **`streaming-text` 0.31.0 (beta):** a model's answer as it streams in token by token (server-sent events from a VLM or LLM). Pass the text so far and a `phase`: queued (with `queuePosition` and Cancel), streaming (Generating, or Thinking while only the reasoning part streams, with Stop), then done ("Done in 2.4 s · first token 0.3 s", from timestamps or the server's durations, formatted by `locale`), stopped or error (the partial text kept and said to be incomplete; Failed in the danger colour with its message and Try again). Plain text with paragraphs, no markdown. Calm while it waits: a grey Spinner after 300 ms and a word, no blinking caret; the status row sits above the text and keeps its height, so Stop never moves while the answer grows. A `reasoning` part sits apart behind a Reasoning button, closed. Screen readers hear each phase once and the answer in whole sentences, at most every 5 s. Issue #288.
- **`labels-zh-tw` 0.31.0:** `streamingTextLabels`.
- **`agent-skill` 0.31.0:** the checklist names StreamingText for a model's streamed answer.
- Icon set: `CircleStop`, stopped by someone before it finished (never the emergency stop).
- **`grounded-text` 0.31.0 (beta):** text whose words point at places on a picture, as a vision-language model answers: a caption whose object names match boxes, reasoning where "8 zebras" is linked to 8 points. Hover or focus a span and its marks are highlighted in the selected ink while the rest fade; hover or focus a mark and its spans are. A click, tap, Enter or Space pins one; again or Esc lets it go. Spans are underlined Tab stops described by where their marks are ("8 points on the image"); marks are described by their words. Beside the picture from 48 rem, under it on a phone. `fromGrounding` reads a model's offsets and points or boxes (pixels, 0–1, percent or 0–1000). Issue #287.
- **`annotated-image` 0.31.0:** `highlighted` draws a set of annotations in the selected ink and fades the rest; `onActiveChange` reports the annotation under the mouse or keyboard; an annotation's `description` is read after its name.
- **`ros` 0.31.0:** `detection2DArrayToAnnotations` turns a `vision_msgs/Detection2DArray` into annotated-image boxes.
- **`labels-zh-tw` 0.31.0:** `groundedTextLabels`.
- **`card` 0.31.0:** `CardTitle` takes `as` (`"h2" | "h3" | "h4"`, h3 by default) and `CardDataHeader` takes `titleAs`, so a card right under the page's h1, or deep in a section, keeps the heading outline in order. The size does not change. Issue #303.
- **`accordion` 0.31.0:** `AccordionTrigger` takes `as` (`"h2" | "h3" | "h4"`, h3 by default), the level of the heading it sits in. The look does not change. Issue #303.

### Fixed
- **`kbd` 0.31.0:** a key inside a tooltip shows in dark: its cap and edge are the tooltip's text colour, faint (`primary-foreground` at 15 % and 20 %), instead of white on the near-white dark tooltip (1.0:1 before). Issue #301.
- **`slider` 0.31.0, `switch` 0.31.0:** the thumb is the new `--thumb` token instead of a raw white; it looks the same. Issue #301.
- **`syncrobotic-theme` 0.31.0:** new `--thumb` (`bg-thumb`), white in every mode, so a theme or contrast mode can change the knob of a slider or switch. Issue #301.
- **`breadcrumb` 0.31.0:** the first level no longer truncates with room to spare when the breadcrumb is as wide as its content (a column with `items-start`, an inline block, an absolutely placed header, a grid cell, the app shell's top bar). It starts from its own width and, only when the row is short of room, gives way to a third of the row or its name, whichever is less. In a stretched row (page-header) nothing changes, except that a long first level is no longer cut while there is room. Issue #307.
- **`top-bar-shell` 0.31.0:** new `labels` (`nav`, `openNav`, `accountMenu`; English defaults "Main", "Open navigation", "account menu") for the navigation landmark, the phone menu button and the account button, which screen readers heard in English whatever the product's language. Issue #293.
- **`pagination` 0.31.0:** `labels.nav` names the landmark (default "Pagination"); `DataGridPagination` passes it through. Issue #293.
- **`labels-zh-tw` 0.31.0:** `topBarShellLabels`, and `nav` (分頁) in `paginationLabels`. Issue #293.
- **`geo-map` 0.31.0:** each robot's name label has a `key` (react/jsx-key). Issue #301.
- **`agent-skill` 0.31.0, Radius foundation:** `rounded-[inherit]` is allowed on a child that fills its parent edge to edge (scroll viewport, avatar picture, a stretched link), so a product lint can allow it by rule. Issue #301.

## 0.30.0 · 2026-11-22

A menu for the theme toggle, tabs in the phone drawer, two accessibility fixes from a product team (dark predicted annotations, Escape in a native dialog) and a much lighter docs site.

### Added
- **`theme-toggle` 0.30.0:** `variant="menu"`, one icon button that shows the choice and opens Light, Match system and Dark as a menu (the docs site's header uses it).

### Fixed
- **`tooltip` 0.30.0:** Escape inside a native `<dialog>` closes the dialog again (it sends the dialog a `cancel` it can refuse); the tooltip had taken the key for itself. Issue #286.
- **`syncrobotic-theme` 0.30.0:** in the dark theme a predicted annotation is drawn in the high-contrast indigo (#b5b4ff), so it keeps 3:1 against the photo around it (2.3:1 before on mid-dark pictures). Issue #285.
- **Docs site, phones:** the navigation drawer's areas are tabs: choosing one shows its pages under them without leaving the page, and the home page's drawer has the same tabs (Docs first).
- **Docs site:** pages show their server HTML at once instead of fading in after the scripts, and each page loads only its own examples (initial JavaScript about 290 KB gzipped, from 580 to 900 KB); examples past the first, and block previews, draw once they near the screen.

## 0.29.0 · 2026-11-22

Four new components for robot consoles: waypoint editor, camera wall, outdoor GPS map and attitude indicator, plus a top loader for slow page changes on the docs site.

### Added
- **`page-header` 0.29.0:** `as="h2"` for a header under another h1 (a sheet, a tab, an example); h1 stays the default.
- **`waypoint-editor` 0.29.0 (beta):** plan a robot's route as an ordered list of waypoints, edited in a list and on `robot-map` together. Each waypoint has a name, a place in metres on the plan (or latitude and longitude: `at.kind`), an optional heading, an action on arrival (wait N s, dock, take a photo, custom) and a dwell time. Reorder by the handle (drag, touch or Space and the arrows), add by clicking the map or Add waypoint, delete with Undo in a toast, duplicate; a row and its point select each other. Problems (outside the map, inside a no-entry zone, too close to the one before, a missing name) show on the row and the point, and Save says why it is disabled. Distance and estimated time from `speed`, unsaved changes with Save and Cancel (Cancel has Undo too), `readOnly` for viewers; narrower than 768 px the list comes first and the map is a tab. `validateWaypoints`, `routeDistance` and `routeDuration` are exported.
- **`robot-map` 0.29.0:** for a list beside the map: `selectedWaypoint` / `onWaypointSelect` share the waypoint selection (a click selects one in view mode too), `onWaypointEdit` says which waypoint was added, moved or removed, and `waypointMarks` draws a waypoint's heading tick and a problem's warning shape. In an edit mode the plan fits below the mode banner, which used to cover points along the plan's top edge.
- **`ros` 0.29.0:** `waypointsToPath` and `waypointsToNavigateThroughPoses` send waypoint-editor's route as a `nav_msgs/Path` or the goal of Nav2's NavigateThroughPoses (PoseStamped in the map frame; a waypoint without a heading faces the next), and `pathToWaypoints` / `navigateThroughPosesToWaypoints` bring one back (Kilted's `nav_msgs/Goals` too).
- **`labels-zh-tw` 0.29.0:** `waypointEditorLabels`.

### Fixed
- **`camera-wall` 0.29.0:** a tile is named by its own words as they are on screen (name and robot, state, alarm), so voice control works on what it shows; the picture's overlays no longer repeat the state to screen readers.
- **Docs site:** search results get a description that fits (whole sentences up to 160 characters, a short one says where it is from); every component and block type has its own social card; docs, component and block pages carry breadcrumbs and an article as structured data.
- **`route-progress` 0.29.0:** when the page is in, the bar grows from where it got to and fades, instead of jumping to the full width; under reduced motion it is the whole width at once, not a fixed 60 % that read as real progress; it sits below the safe area on a full-screen page.
- Docs: the site shows the top loader when the next page takes longer than 300 ms to arrive.
- Docs: rows that scroll sideways on a phone (icon categories, page tabs, the drawer's area tabs) no longer show a scrollbar pressed against them; their edges fade where more is hidden.
- Docs: on a phone, long groups on the components index (Inputs: 26 cards) stayed blank; a section now arrives once any part of it scrolls into view.
- **`camera-wall` 0.29.0 (beta):** many robot cameras at once, each a camera-feed. An auto grid (1, 2×2, 3×3, 4×4 by count and container width) with a page control; click or Enter shows one camera large with a strip of the rest, Esc goes back, and the large feed has its own full screen; on a phone a list of tiles, and a focused camera takes the whole width. Tiles off screen or behind the focused one pause, only the focused camera asks the product's source function for high quality (`getSource(camera, { quality })`), and at most `maxLive` stream at once; the rest keep their last frame (or `poster`) under "Paused to save bandwidth", and `onLiveChange` says which play so the product can close the rest. Each tile says its camera, robot and state as camera-feed does (Live, Stalled · last frame 14:02:31, Camera offline) and marks its robot's alarm by shape and word, never a tinted tile. Sorted attention first (alarms, offline, stalled) or by name, filtered to what needs attention; arrow keys between tiles as one Tab stop; cameras that stall, go offline or come back announced politely, batched at most every 5 s. On [Robotics UI kit](https://design-system.syncrobotic.me/docs/robotics) under What the robot sees.
- **`camera-feed` 0.29.0:** `bare` (just the picture, for a feed inside something that names it and takes the keyboard), `onStateChange`, and `CameraFeedStateLine` / `cameraFeedStateWord`, so a wall's tiles say the state the same way.
- **`ros` 0.29.0:** `webVideoServerSrc(server, topic, { quality })`, the web_video_server URL a `<video>` plays for a `sensor_msgs/Image` topic, sized by camera-wall's quality hint.
- **`labels-zh-tw` 0.29.0:** `cameraWallLabels`.
- **`geo-map` 0.29.0 (beta):** an outdoor map in latitude and longitude for robots that work outside (security patrol, agriculture, delivery), beside `robot-map`'s indoor floor plan and in its look. No map library: Web Mercator and slippy-map raster tiles drawn in SVG from your own tile server (`tileUrl` with {z}/{x}/{y}, or a function) with its `attribution`, or, with no tiles or when none load, a coordinate grid in degrees that needs no network, for robots that are offline or air-gapped. OpenStreetMap's public tile servers forbid heavy use: bring your own. Robots are their status shape with a heading tick, an accuracy circle and their GPS fix in words (RTK fixed, GPS fix · ±3 m, No fix); geofences are outlines (keep-outs hatched, never red); a route with numbered waypoints, blue only while it is driven, and each robot's trail. Pan by drag and arrow keys, zoom by wheel, pinch, + / - and buttons, 0 fits the robots, a scale bar in m and km. Goal mode places a goal by pointer or keys and sends it on confirm; a goal in a keep-out or outside the work area cannot be sent, and Send is disabled with the reason beside it. `GeoMapList` writes the robots with their coordinates as text; fix changes are announced, gathered and throttled. On [Robotics UI kit](https://design-system.syncrobotic.me/docs/robotics) under Driving and missions.
- **`ros` 0.29.0:** `navSatFixToGeo` (a `sensor_msgs/NavSatFix` to geo-map's `lat`, `lon`, `fix` and `accuracy`), `geoPointToGeo` (`geographic_msgs/GeoPoint`, GeoPose, GeoPoseStamped), `geoGoalToGeoPoseStamped` and `geoGoalToNavSatFix` (a geo-map goal back to ROS), `enuYawToHeading` and `headingToEnuYaw`.
- **`labels-zh-tw` 0.29.0:** `geoMapLabels` and `geoMapListLabels`.
- **`attitude` 0.29.0 (beta):** two instruments for a robot's state now, in the kit's chart language (graphite and one accent, no gradients) and always written out in numbers and words. `AttitudeIndicator` draws roll and pitch as an artificial horizon and the heading on a compass ring, with "Roll 12° left", "Pitch 3° nose down" and "Heading 271° W" beside it; roll and pitch `limits` (a tip-over warning at 25°, a critical angle) are marked with the kit's triangle and square and turn the value, the mark and the robot's symbol warning or danger only once crossed, with a word. `Gauge` draws one value with a known range on a 270° dial in three sizes, with Meter's `low`, `critical` and `higherIsWorse` and Meter's words ("High", "Low", "Critical"; `aria-valuetext` "73.8 °C, high"). Both take props, or `push` on the ref and `subscribe` at 20 to 50 Hz: the drawing follows every frame without a React render and the numbers render at most four times a second. Stale after `staleAfterMs`, no sweep animation, the drawing steps with the numbers under reduced motion, and a crossed limit is announced politely, at most every 5 s. On [Robotics UI kit](https://design-system.syncrobotic.me/docs/robotics) under The robot's state.
- **`ros` 0.29.0:** `imuToAttitude` (sensor_msgs/Imu to roll, pitch and a compass heading in degrees, REP 103 and 145), `quaternionToEuler` and `odometryToSpeed` (nav_msgs/Odometry's twist to m/s).
- **`meter` 0.29.0:** exports `meterTone` and `meterSaid`, which `attitude`'s Gauge reuses; Meter itself is unchanged.
- **`labels-zh-tw` 0.29.0:** `attitudeIndicatorLabels` and `gaugeLabels`.

## 0.28.0 · 2026-11-22

Four new components for robot consoles (streaming chart, log viewer, diagnostics, sidebar) and the fixes from a page-by-page audit of every component, block and docs page. Read **Changed** before upgrading: a few defaults and words change.

### Added
- **`streaming-chart` 0.28.0 (beta):** a live line chart for robot telemetry at 20 to 50 Hz (motor currents, speed, temperature, battery voltage). Readings go in through a stable `push(values, time)` on the ref or a `subscribe(push)` function (`ros.subscribe` fits as is), into ring buffers the chart owns, and are drawn on a canvas on requestAnimationFrame, never through a React render. A scrolling window (30 s, 2 min, 10 min), Pause that keeps buffering, ← / → through the buffer and Jump to live, limit lines and a band, a crosshair, a legend with each series' line style and value now, a table view, and screen-reader values that are polite and throttled. Draws nothing off screen or in a hidden tab, steps once a second under reduced motion, and follows the readings' own clock.
- **`labels-zh-tw` 0.28.0:** `streamingChartLabels`, `diagnosticsLabels`, `sidebarProviderLabels`, `logViewerLabels`, and `details` in `treeLabels`.
- **`diagnostics` 0.28.0 (beta):** a robot's hardware and software health as ROS `diagnostic_msgs/DiagnosticArray` reports it, the way rqt_robot_monitor shows it but in the kit's language: the worst level and the counts first, then a tree by the names' "/" paths with the worst level rolled up to each group; each status a glyph and a word (colour only on those, rows never tinted) that opens to its hardware ID and values; Stale when a status has not arrived for `staleAfterMs`, with "updated 12 s ago"; a Problems filter and search by name or hardware ID; a polite, throttled announcement when a status turns ERROR. On [Robotics UI kit](https://design-system.syncrobotic.me/docs/robotics) under The robot's state.
- **`ros` 0.28.0:** `diagnosticArrayToStatuses` (diagnostics `statuses`, the level byte read however the bridge wrote it) and `mergeDiagnostics` (each name's latest status, as /diagnostics arrives a few at a time), and `rosLogToLogLine` (a /rosout message as a log-viewer line, ROS 1 or 2).
- **`tree` 0.28.0:** a node can carry `content`, a panel shown under it while it is open (list mode), with a disclosure button even without children; label `details` names it.
- **`search-field` 0.28.0:** `onValueChange` (with an optional `value`) filters what is on the screen instead of navigating.
- **`sidebar` 0.28.0 (beta):** the main navigation of a console as a component of its own, so products stop copying it out of the app shell. It follows shadcn/ui's Sidebar: `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup` and `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` (asChild, isActive, size, tooltip), `SidebarMenuSub`, `SidebarFooter`, `SidebarTrigger`, `SidebarInset` and `useSidebar`, plus `SidebarMenuBadge` (a CountBadge, a dot on the rail) and `SidebarMenuTag` (a quiet "Beta"). A 240 px column collapses to a 72 px rail of icons with tooltips (or off canvas) and is a sheet from the edge on phones; ⌘B / Ctrl+B toggles it and the `sidebar_state` cookie keeps the choice. The current page has the kit's muted fill and weight; rows are 44 px, sub-pages 36 (44 on touch), focus rings sit inside the rows, and only the width moves, with the motion tokens.

- **`log-viewer` 0.28.0 (beta):** robot and system logs (ROS /rosout, journald, a service's own lines) in a virtual list that stays smooth with 100,000 lines. It follows the newest line until someone scrolls up, then offers "12 new · Jump to latest"; keeps the last `maxLines` in a ring buffer (`createLogBuffer`, which batches a fast stream so 1,000 lines a second render ten times a second); filters by level and source; searches with the matches marked and ↑ ↓; wraps long lines; shows clock time or time ago; opens a line for its whole message and fields; copies a line or a selection. Levels are a shape and a word, coloured only on the glyph and the word. A grid with `aria-rowcount` for screen readers, one Tab stop with the arrow keys inside, and new errors announced at most every 5 s (`announce`).

### Changed
- **Defaults and words a product sees after re-installing:** `questionnaire`'s submit button says "Send answers" (was "Submit"); failures read "Could not …" and the retry action is "Try again" across toast, banner, alarm and empty-state; `data-grid` pins columns only once the grid is 448 px wide (on a phone every column scrolls); status colour sits on the glyph and the status word only, never on a whole line, in blocks and examples.
- **`app-shell` 0.28.0** is built on `sidebar` and about 140 lines shorter. The sidebar's toggle is in the top bar on every screen (it was a pin button in the sidebar, and a menu button on phones), ⌘B / Ctrl+B toggles it and the choice is kept. It still starts open from 1280 px and as a rail below; the rail names its icons in tooltips instead of opening over the content on hover or tap. Phones get the sheet below 768 px (was 640). Nav items take `tag` and `items` (pages under a section, shown while it is current), and `sidebarLabels` translates the sidebar's words. `SidebarUserMenu` reads the rail from the sidebar and no longer takes `collapsed` or `onOpenChange`.

### Fixed
- **`event-log` 0.28.0:** the whole 56 px row opens an event (the message's button stretches over it, and the row draws its focus ring), with a chevron at its end; it was a 20 px line of text.
- **`console-overview`, `list-detail` and `sheet-robot-detail` 0.28.0:** a critical emergency-stop alarm is never on screen without a stop. The overview keeps the site's stop (all robots) at the bottom of the page while it scrolls; list-detail puts the picked robot's stop at the foot of its detail (slide to release for a stopped one, "No connection" for an offline one); the robot sheet brings the robot's own, since its scrim covers the app's. `fleet-table` and `robot-status-card` (sections, not screens) say in their description that the screen around them carries it.
- **`console-overview`, `event-log`, `fleet-table`, `map-workspace` and `stats-cards` 0.28.0:** robot 9C44's low battery tells one story: 14 %, under the 15 % warning, everywhere (it was 18 % in places, which is not low).
- **`mission-schedule` 0.28.0:** every mission says its state in a word on the timeline too, and the key names states instead of colours ("Amber"); missions are wide enough for their names, the one the now-line crosses is running, and a mission that cannot run is a warning Alert.
- **`card-mission` 0.28.0:** why a mission is blocked is a warning Alert instead of a whole sentence in warning text. **`status-tracker-runs`, `settings-webhooks`, `card-site` and `maintenance-due` 0.28.0:** only the status shape and word are in colour ("Failed", "Failing", "Overdue", "Due soon"); the rest of the line stays grey or ink.
- **`settings-billing` 0.28.0:** an overdue invoice is a warning, not danger (the robots keep working), in the note and in the table, and the note is never role=alert.
- **`settings-page` 0.28.0:** the section links are a Scrollspy, so the section being read is marked; a failed save puts focus on the first field to fix.
- **`settings-webhooks` 0.28.0:** Delete endpoint is a destructive button on the page too.
- **`marketing-hero` 0.28.0:** below 640 px the two calls to action stack at full width instead of each wrapping alone onto a line.
- **`wizard-import` 0.28.0:** steps two and three say nothing about the file ("4 columns found") before there is one, and a disabled Next says "Choose a CSV file first".
- **`robot-status-card`, `stats-cards` and `sparkline-metric-tiles` 0.28.0:** percentages read "72 %", and changes carry their unit ("+0.4 pp", "−6 s", "−2 pp").
- **`app-shell` 0.28.0:** `sampleNav` lists every page the templates show, so `incident-queue`, `incident-detail`, `maintenance-due`, `maintenance-work-order`, `rollout-overview`, `rollout-plan`, `users-audit-log`, `users-invitations` and `users-roles` (0.28.0) each mark their own page in the sidebar instead of a neighbour's.
- **`agent-trace` 0.28.0:** titled "Route planner run", with the run's id as a fact beside the steps. **`line-chart-compare` 0.28.0:** the y axis ticks at 0, 10, 20 and 30.
- **`date-selector` 0.28.0:** DateRangePicker shows one month below 640 px, so on a phone the popover, its second arrow and its presets stay on screen (two months were 656 px wide). New `today` prop, so presets built from the app's today ("Today", "Last 7 days") agree with the day the calendar marks.
- **`filters` 0.28.0:** on a phone a long rule's value truncates and its remove button stays reachable; the bar can shrink inside a toolbar row.
- **`sortable` 0.28.0:** picking an item up no longer also announces "moved to position 2" when nothing has moved. A focused handle at the edge of a scrolling list is scrolled in with its focus ring visible. New `SortablePosition` writes an item's place and follows a drag as it goes.
- **`copy-button` 0.28.0:** a text button keeps its width when "Copy install command" changes to "Copied", and is named "Copied" once instead of "Copied Copied".
- **`toggle` 0.28.0:** disabled and on no longer looks like an enabled toggle: a grey fill, like a disabled checked switch.
- **`phone-input` 0.28.0:** inside a Field the number box is named by the Field's label, as documented; it was always "Phone number".
- **`questionnaire` 0.28.0:** the last button says "Send answers" by default instead of "Submit".
- **`theme-toggle` 0.28.0:** `value` is optional, as the docs say (leave it out until the stored choice is known). `segmented-control` 0.28.0 documents `value`, `defaultValue` and `onValueChange` as its own props.
- Docs: the Accessibility tabs of Theme toggle, Chip group and Search field list their keys. Props tables keep a prop's own `| null` (Number field's `value`, Graph's `selectedId`…). Examples: the sortable camera grid and the full-width buttons have a width of their own instead of collapsing; Filters examples fit a phone; Delete in Button with icon is destructive and the icon buttons wrap as a pair; autocomplete, phone, date, time and one-time-code examples have visible labels; the saved-alerts form uses a checkbox (a switch acts at once) and Top speed is a Number field in m/s; "40 %" is spaced like the kit's other percentages; error messages end with a full stop; file-type tiles say their format and file refusals have an icon; toggle sizes are named by size; the long sortable list cuts a row so it reads as scrollable.
- **`sheet` 0.28.0:** SheetFooter pins to the sheet's bottom edge; it covered the last field and its focus ring by 8 px even when everything fit.
- **`toast` 0.28.0:** dismissing a toast with the pointer no longer leaves the stack spread and its timers paused until a click elsewhere: focus a click brings is ignored and the region's is handed back. On a phone the stack is full width with even 16 px gutters, and the in-place examples no longer clip at 390 px.
- **`navigation-menu` 0.28.0:** with `viewport={false}` a panel floats over the page at every width (on phones it pushed the page down) and hangs from the menu's left edge; a menu that starts open switches panels at once instead of closing and reopening, and a new panel's links are no longer faded in from nothing. The column and tag examples fit a phone.
- **`tree` 0.28.0:** an open branch with nothing in it shows the `empty` text instead of opening to nothing.
- **`banner` 0.28.0:** closing it with focus on its close button moves focus to what follows it on the page; the example's "Show the notice again" button returns focus to the banner.
- **`load-more` 0.28.0:** when the last press removes the button, focus moves to the count instead of the top of the page.
- **`command` 0.28.0:** `CommandEmpty` takes a function of the query so the no-match line says what was typed (used in the examples, the docs search and `app-shell`); `CommandSeparator` hides while a query filters the list.
- **`stepper` 0.28.0:** on a narrow stepper a failed step's title and reason show under the row, not only a red cross.
- **`route-progress` 0.28.0:** when the page is in, the bar fills the width and fades instead of vanishing mid-way.
- **`scrollspy` 0.28.0:** on a page or panel with nothing to scroll, the first section is current at load instead of the last.
- **`pagination` 0.28.0:** `locale` formats the numbers with a thousands separator ("1,201–1,220 of 1,240").
- Scrollspy examples hide the rail below `sm` (use pills on phones). Error copy in the feedback, banner and toast examples says "Could not" and "Try again", as the components' own defaults do (alarm, empty state).
- **`meter` 0.28.0:** a higher-is-worse level (temperature, storage) past `low` is read as "high", not "low"; a unit with a leading space no longer doubles it ("48 °C"); new `showMax` writes the total ("412 of 512 GB"). The storage example warns at 90 % instead of always reading critical.
- **`trace` 0.28.0:** a custom `icon` replaces only the done check; a running step keeps its spinner and a warning or failure its mark. The expandable example opens the failed step, not the done one.
- **`data-grid` 0.28.0:** columns resize without dragging: each edge is a focusable separator (← → 16 px, Shift 64 px, Home, Enter resets) with a 24 px hit area (44 px on touch), and the column menu has Wider, Narrower and Reset width. Pinned columns show their edge and the scroll fade starts after them; pinning holds from 448 px wide, so a phone never fills with pinned columns. A selected row is marked by the ink bar on its first cell (pinned cells keep the selected fill), and a row that cannot be selected is a grey box that says why (`selectColumn({ reason })`). The column header's JSDoc says a click opens the menu.
- **`description-list` 0.28.0:** `variant="bare"`, so the data grid's expanded row no longer nests a card.
- **`metric-card` 0.28.0:** values in a MetricGrid row line up even when one label wraps or one card has no change.
- **`avatar` 0.28.0:** square avatars in a group sit side by side, so their initials are no longer cut.
- **`marker` and `timeline` 0.28.0:** MarkerRow and TimelineItem take `status`, and the examples no longer use the deprecated `tone="info"` / `"success"`; Marker's lines show even where its parent shrinks to fit.
- **`icon-tile` 0.28.0:** `raised` has no overlay shadow (surfaces carry none).
- **`kbd` 0.28.0:** `useModKey()` for ⌘ or Ctrl; the examples follow the platform, and "Hold" in a shortcut list is a word, not a key.
- **`status-glyph` 0.28.0:** docs say it is hidden from screen readers and offline is grey; "busy" is its one word for active; its Accessibility tab no longer lists the example table's Tab stop, and shows warning text contrast.
- **`sheet-robot-detail` 0.28.0:** its timeline uses `status`.
- Examples: a battery warns below 15 % (badge, table, description list, timeline, marker now show 12 %); the metric-card row has no battery level (a level is a Meter); the use-long-press fill shows on the hover colour; the use-ros console says Reconnecting, attempt N with a steady Retry now through the backoff, and shows the map's robot offline at its last known place, without its old scan, while the link is down; the data grid's toolbar uses SearchField, full width on a phone; the graph examples start on the list on a phone and the top-to-bottom one is no longer clipped; numbers and spelling follow the docs ("1,284 km", "+8 %", "Licence").
- Docs: the ros page lists its API (functions with their first line, types) with the source in the Source sheet, instead of 1,150 lines inline. Accessibility tabs add warning text, track and bar-on-track contrast rows; Properties tabs say which props are deprecated. Code listings draw keywords in the brand indigo instead of red. Usage rules write identifiers as code.
- **`slide-to-release` and `use-slide-release` 0.28.0 (safety):** a keyboard hold is cancelled when focus leaves the track or the page is hidden. Holding Enter and pressing Tab used to release the robot 2 s later anyway. The thumb now travels while the key is held (aria-valuenow with it), a screen reader is told to hold Enter or Space (`keyboardHint`), and `releasing` shows the released state without a slide. The fill, the tag and the locked thumb are opaque.
- **`stop-button` 0.28.0 and `syncrobotic-theme` 0.28.0:** the stop-all hold fill is opaque deep red, so the label keeps its contrast over it (3.8:1 before); high contrast defines `--stop` and `--stop-deep`, so the stop's label reaches 7:1. The label no longer jumps when “Keep holding” takes over, Bluetooth only says so in words, and the tag shows on a stop delivered over Bluetooth.
- **`media-player` 0.28.0:** opens at `startAt` on a server-rendered page (the picture stayed at 0:00 under 0:40); the Clip unavailable reason sits on its own surface and reads (3.2:1 before); timeline markers are 24 × 24 targets.
- **`scroll-area` 0.28.0:** a horizontal scroll area takes its container's width, so it scrolls instead of growing to fit its row.
- **`island` 0.28.0:** without a `battery` reading it says the level is unknown instead of showing 72 %; a robot without a picture gets a square avatar with initials; the bell is a 44 px target.
- **`image-grid` 0.28.0:** pick one is a radio group (one Tab stop, the arrow keys move and pick, a round mark).
- **`robot-map` 0.28.0:** the error has its glyph and says “Load again”, as the point cloud and robot model do. **`robot-model` 0.28.0:** Stale is said once, in the header. **`attachment` 0.28.0:** a long name keeps its extension in view. **`teleop-pad` 0.28.0:** disabled, it no longer reads out the drive keys.
- **`streaming-chart` 0.28.0:** narrower than 36 rem, the window and Chart / Table switches fold into a View options menu (⋯) beside Pause, so the toolbar stays one row. **`dropdown-menu` 0.28.0:** `DropdownMenuRadioGroup` and `DropdownMenuRadioItem`.
- **`diagnostics` 0.28.0:** a plain number with an optional unit is grouped in `locale` (“1,204,553 ticks”); versions, IDs and words are shown as sent.
- **Docs:** the Accessibility tab draws only keys as keycaps (“Hold [Enter] / [Space] 2 s”), lists white on the stop's reds for the stop, slide to release and the dock, and no longer claims the Slider pattern for slide to release. Chart examples all have a table view, stacks use the accent, 3 and 4, and the threshold chart keeps its 70 tick. Joint state examples stay live, the island's low battery is 12 %, captions keep acronyms (“No WebGL”), slide to release and the dock show Releasing and Not released and come back after a release.
- Docs site, phone navigation: the drawer's header (the brand, Close and the Docs / Components / Blocks / Icons tabs) stays put and only the list under it scrolls, so the drawer no longer opens scrolled past its own Close button; focus starts on Close, and a hairline under the header shows once the list has scrolled.
- Docs site, Accessibility tab: roles a component really renders are no longer dropped. A radix-ui primitive imported under its own name (`import { ToggleGroup } from "radix-ui"`), an npm widget (react-day-picker's grid, input-otp's textbox, the resizable separator) and a wrapper's control (ChoiceField's checkbox, radio or switch) now count, so Segmented control, Theme toggle, Chip group, Choice field, Calendar, Input OTP, Filter form, Input group and Alert list their roles instead of "No role of its own"; a segmented control's pattern is Radio group, not Toolbar.
- Docs site, keyboard tables: one notation (↑ ↓ ← →, Esc, PageUp / PageDown, Home / End), keys drawn as keys and words such as "Hold" or "away" as text, a chord (`Shift`+`Tab`) as one group. The catalog writes keys in backticks.
- Docs site, examples: titles drop the component's name ("Data grid striped" is "Striped") and keep acronyms ("No WebGL", "CI", "From ROS", "URL synced"), with a caption where the name cannot say it ("Traditional Chinese (zh-TW)").
- Docs site: the Overview / Properties / Accessibility tabs show their whole focus ring; `/` no longer opens the site search on a page whose example is a search field (⌘K / Ctrl+K still does); search ranks what a thing is above what it is used for ("battery" finds the Meter before Number field and Switch).
- Docs site: /docs/upgrading no longer scrolls sideways on a phone; a token in a table never splits at its hyphens; touch targets of 44 px for the footer's version, the drawer's brand and the localisation page's component links; on a touch screen the icon set shows each icon's name (a mouse still sees it on hover); the icon details' size cards no longer look selectable, and the panel's title is a sheet title (xl).
- Docs site, copy: the home demo's "Stopped by you" uses the stopped glyph; the ROS example's "Connected" the calm one; the alarm lifecycle demo uses the kit's buttons and says why a step is unavailable; high-contrast edges are graded against 3:1 (Pass or Fail, no "AA large"), and the high-contrast lead names the emergency stop's label as held to 4.5:1; the colour table gives `--disabled` as `text-disabled` and says where `--stop-deep` is used; the brand page and the Radius foundation agree on the favicon (the disc on a 22 % tile); the theme button shows the choice (Sun, Moon, or Monitor for match the system); the agent prompt is plain text; page names match between the sidebar and the footer; the home page's structured data no longer logs a console error.
- Docs site, /docs/components: every picture is at one scale, a tall one fades out instead of cutting through a field, and descriptions are no longer cut mid-word.

## 0.27.0 · 2026-11-21

Connect the robotics components to a real robot over rosbridge, and a ready-made Traditional Chinese (Taiwan) label pack.

### Added
- **`ros` and `use-ros` 0.27.0 (beta):** a rosbridge v2 connection over a plain WebSocket, with no ROS library. `RosProvider`, `useRosStatus`, `useRosTopic`, `useRosPublisher` and `useRosService`, plus converters from each message to the component that shows it: `occupancyGridToGrid` and `laserScanToScan` (robot-map), `pointCloud2ToPoints` (point-cloud), `jointStateToJoints` (joint-state, robot-model), `poseToRobotMapPose`, `goalToPoseStamped` and `teleopToTwist` (teleop-pad). A publisher of `Twist` sends a zero command when it stops. New page [Connect to ROS](https://design-system.syncrobotic.me/docs/ros) with the rosbridge setup for ROS 2 and ROS 1, a live example against a simulated bridge, and the safety notes for driving over a browser: rosbridge has no watchdog, so the robot must time out its own commands.
- **`labels-zh-tw` 0.27.0 (beta):** the kit's words in Traditional Chinese as written in Taiwan, one object per component that takes `labels` (`dataGridLabels`, `stopButtonLabels`, `robotMapLabels`…), and `locale`. It imports no component, so it installs on its own; the kit's tests hold every object to the component's labels type, so a new key cannot ship untranslated. See [Localisation](https://design-system.syncrobotic.me/docs/localisation).

### Fixed
- **`time-picker` 0.23.3:** a malformed value ("9", "25:99") reads as no time instead of showing NaN; a malformed `min`, `max` or `step` falls back to its default.
- **`text-diff` 0.16.2:** text of spacing alone round-trips through `tokenize` exactly and is never shown as a word added or removed.
- **`robot-model` 0.24.2:** mimic joints follow their driving joint unclamped and whatever the order of the record; planar and floating joints take `[x, y, θ]` and `[x, y, z, roll, pitch, yaw]` and are written with the new `poseValue` label (mm and degrees per component).
- **`alarm` 0.27.0:** buttons beside Acknowledge (a custom action, Shelve) are ghost, so Acknowledge is the only outlined button in an unacknowledged row; Unshelve, alone in its row, keeps its outline.
- **`toast` 0.27.0:** toasts stack as in sonner: the newest in front, two more peeking behind, the rest waiting; hovering, focusing or touching spreads them into a list and pauses their timers. A 4th toast no longer makes the others jump or closes the oldest, and a second `<Toaster />` no longer draws every toast twice (which let a hovered toast close anyway).
- **`banner` 0.27.0:** opens and closes its height as it fades, so the page under it slides instead of jumping when it is dismissed or shown again.
- **`tree` and `trace` 0.27.0:** an empty folder (or a span with nothing under it) opens and closes in place; it opened as tall as its parent before snapping shut, because Radix leaves its height variable unset at 0.
- Docs: component pages are short again; the long Table 9 upgrade section on the data-grid page is gone. Banner and tree examples keep their width when they collapse, so they no longer jump sideways.
- Storybook: the story frame no longer overflows a 390 px phone.
- CI type-checks its own scripts (`tsconfig.scripts.json`, strict `checkJs`).

## 0.26.0 · 2026-11-21

`data-grid` moves to TanStack Table 9. The grid looks and behaves the same; the table you build for it changes, once.

### Changed
- **`data-grid` 0.26.0 needs `@tanstack/react-table` 9.** You still own the table: build it with `useTable({ features, … })`, where `features` starts from the exported `dataGridFeatures` (every feature and sort function the grid's parts call) plus the row models you use. Column types take the features (`DataGridColumnDef<Row, typeof features>`), pinning is `start`/`end`, and `table.getState()` is gone.
- **React Compiler:** `data-grid.tsx` starts with `"use no memo"`. Table 9 keeps one row, column and header object for the table's life and answers state through methods, which compiled code would cache. Keep the directive in your copy. Call `useTable` without a selector, and in your own cells read state through `<Subscribe source={row.table.atoms.…}>`. A test now compiles the grid with the React Compiler and checks that sorting, selection, expanding and resizing update; without the directive it fails.
- Dependabot no longer holds `@tanstack/react-table` majors; `react-resizable-panels` 4 stays held.

## 0.25.0 · 2026-11-21

Dependencies move to current majors where products gain from it or lose nothing; two are held on purpose.

### Changed
- **`calendar` and `date-selector` 0.25.0 need `react-day-picker` 10** (`npm i react-day-picker@^10`, then re-install both). DatePicker and DateRangePicker take the same props and render the same calendar. Calendar passes its props to DayPicker, so props v10 removed stop type-checking: `fromMonth`/`fromYear`/`toMonth`/`toYear` become `startMonth`/`endMonth`; `fromDate`/`toDate` become `startMonth`/`endMonth` with `hidden={{ before }}`/`{{ after }}`; `initialFocus` becomes `autoFocus`; v8-style classNames keys and the `onDayPointer*`/`onDayTouch*` handlers are gone; non-Gregorian calendars come from `@daypicker/*`. Locales can be imported per language (`react-day-picker/locale/zh-TW`); the combined import still works.
- **`form` 0.25.0 names `@hookform/resolvers@^7`** (it named no range before, so recent installs already had 7). Its zod resolver is unchanged and works with zod 3.25+ and zod 4.
- **The repo develops against `lucide-react` 1.x**, as products installing items already do (items name lucide with no range). Kit code keeps its icon names, which lucide 1.x still exports, so no item changed and no minimum lucide version is needed. lucide 1.x redrew some icons (CreditCard, Rocket, Plug, Warehouse and others) and hides icons with no label from screen readers by default (`aria-hidden`).

### Fixed
- **`data-grid` 0.23.3:** a column's resize handle is named after the column ("Resize Robot"); screen readers heard the header function's source code. New behaviour tests for paging, sorting, visibility, selection, expanding, pinning, resizing, totals, loading and empty.

### Held
- **`@tanstack/react-table` 9 and `react-resizable-panels` 4 are not adopted yet.** Table 9 makes every product rewrite its table setup for no visible gain; Panels 4 halves the keyboard resize step and resets saved layouts. Both migrations are done and kept for when a product needs them or the old majors stop getting fixes; Dependabot ignores their majors until then.

## 0.24.2 · 2026-11-21

### Fixed
- **Autofilled fields keep the theme.** A field the browser filled in (a saved search, an address) turned light blue in Chrome, also in dark mode, and inside a search field or input group the blue box sat inside the field's edge. The theme now delays the browser's fill for good and keeps the text in the theme's colour, so a filled field looks like any other. Re-install `syncrobotic-theme`.
- **The page tells the browser its colour scheme:** `color-scheme: light`, and `dark` inside `.dark`. Native parts (scrollbars, date and time pickers, autofill) now follow the theme instead of staying light on a dark page.
- Docs: the Code block examples are highlighted the way a product does it, with shiki's output as `children` (they showed plain text, so the component looked uncoloured).

## 0.24.1 · 2026-11-21

Fixes from an independent review of 0.23.1 and 0.24.0, new behaviour tests, and a sweep of every docs page; the dev tooling moves to current majors.

### Fixed
- **`robot-map` 0.24.1:** a grid that arrives after the first render is fitted (a view the person moved is left alone); a cancelled drag (second finger, pointer cancel, Esc) puts a waypoint or zone corner back and says so; the selected or carried waypoint is followed by value, so Delete never removes another one when the app changes the list; a fast-updating costmap always shows its latest finished image; the costmap draws over a floorplan; the keyboard crosshair and a carried point announce their position once the keys rest; snapping at the plan edge, the crosshair before the first key, and a goal set twice by pointer and Enter.
- **`joint-state` 0.24.1:** numbers format in English unless `locale` is given, so the server and the browser agree (an invalid tag falls back instead of throwing); an update is detected by value, so a parent that rebuilds the array still goes stale (pass `updatedAt` so a still arm is not called stale); `staleAfterMs={Infinity}` never goes stale; an infinite limit is no limit.
- **`point-cloud` 0.24.1:** an inline `colorRange` no longer re-uploads the cloud on every parent render; no black frame on resize; the accessible name stays stable (the count and extent are in a description updated at most every 5 s); Windows forced colours keep the cloud visible; a lost pointer capture ends the drag; live scans reuse one buffer.
- **`robot-model` 0.24.1:** staleness follows joint values or `updatedAt`, not object identity, and is announced once; a lost WebGL context that does not come back within 5 s shows an error with Load again instead of an endless "Restoring"; an empty URDF is an error; meshes arriving after a change are freed; mesh paths with a query string load; theme changes on an ancestor repaint.
- **`segmented-control` 0.17.3:** pressing the selected segment no longer clears the choice.
- **`file-upload` 0.10.1:** with `multiple` off, extra files are refused as `count` instead of dropped silently; `aria-label` and other attributes reach the drop zone.
- **`timeline` 0.17.4:** a warning or danger event says so to screen readers.
- Docs: no sideways scroll on phones from long property defaults or identifiers; no 2 px scrollbars on data-grid examples and a code block.

### Changed (repository)
- Storybook 8.6 → 10.6, Vitest 3 → 5, Vite 6 → 8 (story ids unchanged); `@vitejs/plugin-react`, unused, removed.
- Behaviour tests for `timeline`, `file-upload`, `scrollspy` and `segmented-control`.
- Dependabot: weekly grouped minor and patch updates and monthly GitHub Actions updates, as pull requests into `dev`.

## 0.24.0 · 2026-11-21

Robot components for what an operator sees and does: a LiDAR point cloud, a 3D robot model, joint states, and a robot map that takes ROS grids and scans and can be edited. Every item now compiles under `noUncheckedIndexedAccess`.

### Added
- **`point-cloud`** (beta): a LiDAR or depth cloud (a decoded `sensor_msgs/PointCloud2`, REP 103 axes) in raw WebGL2, with no 3D library. Coloured by height or intensity on the accent's single hue with its scale in words, never a rainbow; a recessive ground grid, the robot at the origin, an axes gizmo in words. Orbit, pan and zoom by pointer, touch and keyboard (the wheel only once focused), Reset view and Fit at 44 px. Loading, empty, error, stale (`staleAfterMs`, `receivedAt`) and no-WebGL states; context loss handled; draws only on demand.
- **`robot-model`** (beta): a robot's pose in 3D from its URDF (`urdf` or `urdfUrl`, `package://` through `packages`) and live joint values (`joints`, or `jointStateToRecord` from a `sensor_msgs/JointState`). Neutral greys from the theme, joints that need someone highlighted in warning or danger with a callout in words. The kit's only three.js item: `three` and `urdf-loader` install with it alone; load it lazily (on the docs site only its own page downloads three.js). Without WebGL it lists every joint in words.
- **`joint-state`** (beta): an arm's joints for monitoring: position in degrees or millimetres on a thin track between its limits, velocity and effort; near a limit (5 % by default), at it or past it said in words with an icon; stale after `staleAfterMs` by the browser's clock. Stacks by its own width.
- **`robot-map` 0.24.0: ROS layers and editing.**
  - `grid` draws a `nav_msgs/OccupancyGrid` as the floor (free the map surface, occupied a muted grey at its probability, unknown the no-data hatch); with no `width`/`height` the grid is the plan. `costmap` lays the accent's ramp over it with a legend.
  - `scans` draws `sensor_msgs/LaserScan`s from each robot's pose, one path per scan.
  - `mode` (`goal`, `waypoints`, `zone`): place and point a goal, add, move and delete numbered waypoints, draw zones corner by corner (`editableZones` drags existing corners); controlled, with optional `snap`. The primary pointer edits; right or middle drag and two fingers pan. A keyboard crosshair with Enter, Esc and Delete does the same, a banner says what a click does, and each edit is announced.
  - Helpers `gridToPlan`, `rosToPlan`, `rasteriseGrid`, `scanToPoints`.
- **Docs: Robotics UI kit** (Getting started): the robot components by what an operator does, and the ROS message each one takes.
- Docs sidebar: a quiet Beta after each beta item.

### Fixed
- **Every item compiles with `noUncheckedIndexedAccess`**, checked in CI (`tsconfig.registry.json`). Behaviour unchanged, except three crashes on an empty list: `AppShellMobileTabs` with no tabs, `AppShell` search with no scopes, a paged `Questionnaire` with no questions. Re-install the items whose version moved in this release (each one's changelog line says why).
- `robot-map`: zone names keep clear of the mode banner and legend, as robot names do.

### Changed
- Site title, description and keywords say what the kit is (a robotics UI kit for React), for search.

## 0.23.1 · 2026-11-21

Engineering: every item now passes the React Compiler's rules and compiles with `noUnusedLocals` and `noImplicitReturns`. No API changed.

### Fixed
- **Safe under the React Compiler.** A product that builds with `reactCompiler: true` compiles the kit's source with its own; components that read or wrote refs while rendering, set state synchronously in an effect, or called `Date.now()` during render were skipped or could misbehave. Fixed with React's own patterns, behaviour unchanged except that a reset on a new prop now lands in the same render instead of one commit later (no stale frame):
  - state kept from the previous render instead of a ref: `field`, `choice-field` (a fixed error fades out), `island`, `image-grid` (the lightbox's last picture), `data-grid` (the selection count while it leaves);
  - a reset when a prop changes, during render: `autocomplete`, `time-picker`, `media-player`, `route-progress`, `notification-center`, `camera-feed`, `use-presence`;
  - `useSyncExternalStore` for browser-only facts: `app-shell` (Mac or not), `list-detail` (the first robot selected on wide screens);
  - latest values in a layout effect or `useEffectEvent`: `teleop-pad`, `robot-map`, `camera-feed`; `use-debounce` keeps its timer in a closure; `use-long-press` declares its loop where it is used; `input-group`, `tree` (type-ahead times by the key event), `graph`, `filters`, `attachment`.
  - `data-grid`'s virtualiser (TanStack Virtual) is a library the compiler cannot optimise; it is left uncompiled on purpose, with the reason in the source.
- **Compiles with `noUnusedLocals` and `noImplicitReturns`:** no unused React import in `agent-trace`, `card-mission`, `card-site`, `heatmap-zones`, `radial-chart-capacity`, `robot-status-card`, `sheet-robot-detail`, `sparkline-robot-list`, `sparkline-table`, `stats-cards`, `stats-meters`, `status-tracker-rollout`, `status-tracker-runs`, `form`, `status-glyph`, `load-more`, `meter`, `share-bar`, `theme-toggle`; `settings-webhooks` returns explicitly.

Re-install the items above (`npx shadcn add @syncrobotic/<item> --overwrite`); the version in each file's header says whether you have it.

### Changed (repository)
- **ESLint** (TypeScript recommended, React hooks with the compiler rules) runs in CI as `npm run lint`.
- **TypeScript:** `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`; no `baseUrl` (deprecated in TypeScript 6).
- **Docs site security headers:** `frame-ancestors 'self'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (fullscreen and the clipboard stay allowed).
- **visual-baseline** starts `ci` on the commit it pushes, so a release no longer waits on a check that never runs.
- Node 22 pinned (`.nvmrc`, `engines`).
- `/brand`: the product-photos placeholder is gone; no photos are planned.

## 0.23.0 · 2026-11-20

What robot products need that no other kit has (a live camera, a dead-man drive pad, a site map), and every component's words translatable.

### Added
- **`camera-feed`** (beta): a robot's live camera over a native `<video>` the app feeds (a WebRTC `stream`, set as `srcObject`, or a `src` the browser plays), no streaming library; the app owns the connection. It always says whether the picture is live, by a shape and a word in the header beside the camera and the robot: Live (a still dot, never red, never pulsing) with `latencyMs`; Connecting (the only blue: a spinner, over a skeleton that holds `aspectRatio`); Stalled · last frame 14:02:31 over the dimmed last picture after `staleAfterMs` (2 s) without a new frame, watched with `requestVideoFrameCallback`, else `timeupdate`; Paused; Camera offline with `offlineReason` and Reconnect (`onRetry`); No camera. Pause view freezes this screen only (the robot keeps streaming); snapshot draws the frame on screen to a PNG for `onSnapshot`; mute only with `audio`; full screen. Space and F only while focus is inside. `children` are drawn over the picture (a crosshair, detection boxes). Labels exported as `CameraFeedLabels` / `defaultCameraFeedLabels`, with `formatTime` for the site's clock.
- Icon set: `VideoOff`, for no live picture (the camera is offline, or there is none).
- **`teleop-pad`** (beta): manual driving of a mobile robot from a phone or a console, as a dead-man stick. The robot moves only while the stick is held: release, a cancelled pointer, lost focus, a hidden page or `timeoutMs` without pointer events send a zero command at once and call `onStop` with the reason. While held, `{ linear, angular }` (−1…1, ROS REP 103 axes) goes out at a fixed `rateHz` (10) so the robot can run its own watchdog. Pressing never moves the robot (the stick starts where the finger lands); dead zone 10 %, `maxSpeed` drawn as a scale; arrow keys or W A S D while held, Space to stop; a status line with icon and words (Hold to drive, Driving · 0.4 m/s, Stopped, Disabled: reason); 56 px knob, larger in glove density; haptic ticks. A mouse held perfectly still sends no events, so the 2 s pointer timeout stops it too; `timeoutMs={false}` turns that off, only where the robot runs its own watchdog. The emergency stop stays StopButton, beside it.
- **`feedback`**: `driveStart` and `driveStop` patterns (one and two short ticks) for manual driving.
- Icons `Move` (moving under manual driving) and `CirclePause` (standing still after manual driving ended).
- **`robot-map` 0.23.0 (beta): the kit's site map, as a component.** It lived only as a drawing inside `map-workspace`. `RobotMap` draws a floor plan in metres (an image URL or your SVG) in plain SVG, with no map library: zones (no entry, slow, charging, other) as hairline outlines with an icon and a name, never a fill; planned routes dashed in the in-progress blue, travelled tracks solid grey; robots as their status shape with a heading tick and their name, which moves aside rather than cover another, and the state in words when a robot needs someone; selection as a ring and a bold name. Pan and zoom by drag, two fingers, the wheel (once the map has focus, or with Ctrl, so a page still scrolls past it), 44 px zoom and fit buttons, and keys (arrows, + / -, 0), gliding at `--motion-base` unless motion is reduced. A scale bar, a north arrow when `northDeg` is given, and empty, loading and error states. The map is one Tab stop; `RobotMapList` lists the same robots with position, zone, heading and state, and a row selects its robot on the map. Coordinates are metres from the plan's top-left, y down, heading clockwise from the top; from a ROS map frame: `x = xRos − originX`, `y = height − (yRos − originY)`, `heading = 90 − yaw × 180 / π` (in the docs and the type).
- **`lint:rules`**: a block that draws a `RobotMap` must also render `RobotMapList`, as a chart block renders its table and a graph block its list.

### Changed
- **`map-workspace` 0.23.0** is built on `robot-map`: same layout, trays and markers, now with heading ticks, a named loading bay, a scale bar and pan and zoom. Its robots are listed in a Robots sheet from the top bar.
- **Localisation: every word the kit says can be translated without editing its source.** Components that showed or announced fixed English now take `labels`, the kit's existing pattern: an exported `<Name>Labels` type and English `default<Name>Labels`, merged under a partial `labels` prop, with functions for words that hold a number or a name. New in 0.23.0: Autocomplete, Breadcrumb, ChipGroup, CommandDialog, CopyButton, DataGrid (every part, `selectColumn` and `expandColumn` included; DataGridPagination passes Pagination's), DatePicker and DateRangePicker, DialogContent, PhoneInput, Questionnaire and QuestionField, RouteProgress, SearchField, Spinner, Attachment, Stepper and StepperCompact, Sortable (its drag announcements), Trace and TraceHeader (status words, counts, durations), TimePicker. The defaults are today's words; single props such as `label`, `placeholder` and `closeLabel` still work and win.
- **`locale` where a component formats a number, a day or a time itself:** ChipGroup, Filters, LoadMore and ShareBar (numbers; left out, the browser's language as before), DatePicker and DateRangePicker (the trigger's day with Intl, plus `calendarLocale` for react-day-picker's calendar), TimePicker (times with Intl), PhoneInput (country names and their order; English when left out). Calendar lets a react-day-picker locale such as `zhTW` name its days.
- **Docs: Localisation** (Getting started): why labels and locale, the pattern, a worked zh-TW example, and every component's keys with their English defaults, generated from the source (`npm run props` now records each labels prop's keys in site/props.json).

### Fixed
- **`tabs` 0.23.0: no scrollbar on the tab list on phones.** The triggers sit 1 px past the list's border (`-mb-px`, so the underline covers it); with `overflow-x: auto` for many tabs, `overflow-y` computes to auto too, so the list scrolled 1 px vertically and Android showed a scrollbar on first load. `overflow-y` is now hidden (also on the docs' component tabs and the drawer's area tabs). Checked on all 334 pages at phone width: no box scrolls by 1–4 px any more.

## 0.22.4 · 2026-11-20

Docs site only: no item changed, nothing to re-install.

### Fixed
- **The docs sidebar flashed on every page switch.** The current-page marker slid with a shared layout animation while the previous page's examples closed with a height animation above it; the column re-scrolled every frame to keep the clicked link still, and the marker, measured against the moving column, swept down the list as a grey box before settling. The marker is now static, the examples list appears and goes at once, and the column scrolls back in the same frame by however far the clicked link moved (Safari has no scroll anchoring). Recorded: 15 changing frames per switch before, 3 after.
- **Phones: picking a page in the navigation drawer showed the old page through the drawer, then the new one over it.** The page transition is a view transition, whose snapshots paint above everything, the open drawer included. A navigation from the drawer now skips it: the tapped link is marked at once, the drawer stays until the new page is there, then slides away from it. The drawer's click handler also runs in the capture phase now; next/link prevents the default in its own handler, so the 0.22.3 handler never ran.

### Changed
- **Block pages on phones.** "Built from" takes its own line, with the chips under it, so no chip wraps to sit under the label. Below 640 px the preview shows the phone view only: the device-width switch is hidden (a desktop layout would be drawn at a quarter of its size), Open shares the row with Preview and Code, and the block fills the card with no second frame, stage padding or width caption.

## 0.22.3 · 2026-11-20

Docs site only, on phones: no item changed, nothing to re-install.

### Fixed
- **Phones: the page jumped when you picked a page in the navigation drawer.** The drawer's list followed the address, and the drawer only began to close once the next page had arrived. So while it faded out, its list rearranged itself under your finger: the current-page marker slid to the new item, the old page's examples folded, the new page's unfolded, and the column re-scrolled to centre it. Now the drawer starts closing on the tap and its list stays as it was when you opened it; the next time it opens, it shows where you are. Measured on an iPhone 13 viewport: layout shifts during the switch went from 8 to 0.

### Changed
- **Phones: the navigation drawer, redesigned.** The area switcher was a 2×2 block of buttons with the current one solid black (white in dark), the loudest thing in the drawer; a large "Navigation" title and a lone "Home" row took the top; the open page's examples unfolded inside the drawer and pushed the other pages away; and on the home page the drawer was nearly empty. Now the drawer starts with the logo (the way home, as in the header), the four areas are one quiet row of tabs with an underline, like a component page's tabs, the examples stay on the page, and on the home page the four areas are the list.

## 0.22.2 · 2026-11-20

Missing data that looked like zero, and a bulk acknowledge that could take a critical alarm.

### Changed
- **`alarm` 0.22.2: "Acknowledge all" is opt-in and never takes a critical alarm.** It appeared whenever `onAcknowledge` was passed, so every product got bulk acknowledgement whether its procedures allowed it or not, and it took critical alarms with the rest. Now it appears only when you pass `onAcknowledgeAll`, and it never takes a critical alarm: each is read and acknowledged on its own row (ISA-18.2). While a critical alarm is unacknowledged the button reads "Acknowledge 3 non-critical" (label `acknowledgeNonCritical`). **Migrate:** if you relied on the button calling `onAcknowledge` per id, pass `onAcknowledgeAll={(ids) => ids.forEach(onAcknowledge)}`; if your procedures require every alarm on its own, pass nothing.
- **`app-shell` 0.22.2**: the command palette's "Acknowledge all alarms" is "Review alarms"; it only ever went to the alarms.
- **No data is not zero** (`syncrobotic-theme` 0.22.2, `heatmap-week-hours`, `heatmap-zones` 0.22.2). An empty heatmap cell (the bare track, about 1.7:1) meant both "none" and, in products, "no reading". New theme utility `no-data`: a hatch and inset outline in the field-edge colour (3:1). Both heatmaps take `null` as no data: the hatch, "No data" in the tooltip and to screen readers, a dash in the week-hours table, and a legend entry. Zero stays the bare track. The data-visualisation rules say so.

### Docs and CI
- `lint:versions` also fails when `package-lock.json` and `package.json` disagree on the kit's version (the lock had stayed at 0.19.0); bump both with `npm version <x> --no-git-tag-version`.

## 0.22.1 · 2026-11-20

Three things 0.22.0 left open: a chart grey too faint to see, two alarm shapes too alike, and an alarm list that could say "no alarms" when it did not know.

### Changed
- **Chart greys re-stepped** (`syncrobotic-theme` 0.22.1). Other (`--chart-4`) was 2.1:1 in light and 1.9:1 in dark, below the 3:1 a mark needs (WCAG 1.4.11): an Other bar on its own was close to invisible. Now every series, Other included, is at least 3:1 on a card in all four modes, and every pair still differs by ΔE 15 or more, to normal vision and under red-green colour blindness. Light: `--chart-2` #3a3a3f, `--chart-3` #67676c, `--chart-4` #939499. Dark: #edeef4, #babac0, #68686e (the strong grey is now the near-white one, the mid grey lighter, Other dimmer). High contrast light: #2b2b2f, #59595e, #85868b; dark: #f4f4fb, #919297, #646469. The accent is unchanged. Tested in `chart-palette.test.ts`.
- **`alarm` 0.22.1: low priority is a diamond.** At 20 px the circle (low) and the octagon (critical) read as the same round outline; without colour, the two ends of the scale looked alike. Low is now `DiamondAlert`, a diamond with "!" drawn on Lucide's grid, so the three shapes are an octagon, a triangle and a diamond. It ships in `robot-icons` 0.22.1, which `alarm` now depends on; it is on the Icons page, and `CircleAlert` no longer means a low alarm.
- **`AlarmList` loading and error states** (`alarm` 0.22.1). New `status`: `"loading"` shows placeholder rows in the rows' shape, sets `aria-busy` and says "Loading alarms" to screen readers, and never shows "No active alarms" before the alarms are known. `"error"` shows a danger-tint banner (`role="alert"`, not solid red): with nothing loaded, "Could not load alarms. There may be alarms you cannot see here."; with alarms already loaded, they stay and the banner says the list may be out of date. `updatedAt` adds "Last updated 13:42"; `onRetry` adds "Try again". Labels `loading`, `errorEmpty`, `errorStale`, `updatedAt`, `retry`. `useAlarmSignals` takes `ready`: the alarms that arrive with the first load are the starting point and do not buzz or get announced as new.

### Docs
- The Alarms foundation shows the diamond and adds the "Not known" state (loading, failed); the Alarm page has loading and error examples.
- ROADMAP brought up to date: 0.21–0.22 recorded, the duplicate adoption-scanner line and the per-version docs item (moved to After 1.0) removed.

## 0.22.0 · 2026-11-20

Charts in graphite and the brand indigo, alarms you can scan, and the brand kit on its own page.

### Added
- **Brand assets** (`/brand`, linked from the footer): the official SYNCROBOTIC logo kit (horizontal, stacked and compact logos, logomark, logotype) in black, grey, indigo and white as SVG and 2048 px PNG, one ZIP with full-size PNGs and the Illustrator source; the brand colours with their contrast; and how to show the brand in web and app interfaces: the product header, favicon and app icon, sign-in and splash screens, clear space and smallest sizes, and what not to do. Product photos are listed as waiting for files.

### Changed
- **Chart palette: graphite and one accent** (`syncrobotic-theme` 0.22.0). The categorical palette (purple, teal, olive, plum, grey) felt foreign to a monochrome UI. Now a chart has one series the reader should look at, in the brand indigo (`--chart-1`: #5347a8 light, #8986de dark, #3d2e8d and #b5b4ff in high contrast); the others are graphite (`--chart-2`, `--chart-3`), `--chart-4` is a light grey for Other and `--chart-5` the baseline (an alias of `--chart-3`, always dashed). The token names are unchanged; their meaning is not: code that used slots 2–5 as hues now draws them grey. Checked in all four modes against the card: any two of slots 1–3, and 3 beside 4, differ by ΔE 15 or more to normal vision and under red-green colour blindness; slots 1–3 reach 3:1 (Other sits at 2.1:1 in light and 1.9:1 in dark on purpose, always labelled; 3:1 or more in high contrast). Blue, green, amber and red stay for status.
- **`chart` 0.22.0: line style by series order.** `ChartContainer` gives every `Line` and `Area` outline that does not set `strokeDasharray` its style by its place in the config: solid, dashed (6 4), dotted (1.5 3.5); grouped bars get the kit's 2 px gap; the legend and tooltip draw each series' line (`ChartSwatch`). New exports `chartDash`, `chartDashes`, `ChartSwatch`. Three series and Other at most: fold the rest into Other, highlight one, or split into small multiples.
- **`share-bar` 0.22.0**: parts take the accent, two greys, then the Other grey for a fourth part and more; `"other"` is `--chart-4`. The part not shown is its own track segment, so the gaps show the surface.
- **Chart blocks** (0.22.0): `heatmap-week-hours` runs the accent's ramp from the track to the full accent; `heatmap-zones` up to 60 % (36 % in high contrast) so every written number keeps 4.5:1; `line-chart-compare` and `area-chart-cumulative` take their dashed second series from the chart; `histogram-battery` bins in the graphite mid; `radial-chart-capacity` rings in accent and greys; `area-chart-fleet-states` draws its stack as solid bands set apart by a 2 px card-coloured stroke, like a stacked bar. The other chart blocks keep their code and take the new palette and line styles from the theme and `chart`.
- Docs: the **Data visualisation** foundation explains the new model (accent, greys, line style, Other, baseline) with its separation and contrast tables computed from the theme in all four modes; the design language and checklist follow.
- **`bar-chart-stacked`, `bar-chart-missions`** (0.22.0) and `area-chart-fleet-states`: filled marks take the accent, then the mid and Other greys; the strong grey is for thin lines, because as a large fill it outweighs the accent (near-black in light, near-white in dark).
- **`alarm` redesign** (0.22.0). The same priority was said four ways (bar, icon, coloured word, tinted row), every row carried a heavy Acknowledge, the time was buried in the meta line and the state could only be read from small grey text. Now `AlarmList` is one panel of aligned rows: priority glyph → time (tabular, first, so order and age read down the column) → priority word and title, source under it → state and actions.
  - Colour only on the glyph and the priority word; no tinted rows, critical included.
  - Unacknowledged: bold title and a solid bar in the priority's colour. Cleared but not acknowledged: still bold, the bar dashed, "Cleared 14:07, not acknowledged". Acknowledged: regular, grey, "Acknowledged 13:42".
  - A lighter Acknowledge per row; after it, focus moves to the next Acknowledge (or the list's heading). The header gets "Acknowledge all" with two or more unacknowledged alarms in view; it takes only those (never shelved, suppressed or out-of-service ones; folded low alarms in a flood only while their group is open, when it reads "Acknowledge 2 shown") and announces how many it acknowledged.
  - Shelved, suppressed and out-of-service alarms stay counted in the panel's footer. Flood handling is unchanged.
  - Below 576 px of container width the row reflows: time and source under the title, state and buttons on their own line (44 px on touch).
  - New, all optional: `AlarmData.acknowledgedAt`, `AlarmData.clearedAt`, `AlarmList.onAcknowledgeAll(ids)` (without it, "Acknowledge all" calls `onAcknowledge` per id), labels `clearedWhen`, `acknowledgeAll`, `acknowledgeShown`, `acknowledgedCount`. `alarmPriority` gains `border`; its `tint` is no longer used by the kit. The list is now a card with its own border: drop any card you wrapped it in.
- **`island`** (0.22.0): `IslandAlarm` follows: never tinted, the time first in tabular figures, a lighter Acknowledge.
- **`console-overview`** (0.22.0): acknowledging records the time, and Acknowledge all is wired.
- Docs site: the header and footer use the official logomark (the S on its own); the disc stays for favicons, app icons and avatars. The footer's nameplate is the official logotype, not the name typed in Geist.

## 0.21.0 · 2026-11-20

What products were building by hand: menus, previews and banners, a lineage graph, a media player, a histogram, and the account screens every console needs.

### Added
- **`media-player`** (beta): a recorded clip (a robot's camera recording, an incident clip) with the kit's controls over a native `<video>`, no player library. Play / pause, a timeline (the kit's `Slider`, read as "0:42 of 1:00") with a tick per marker and the markers listed under the player, time in tabular numbers, mute, speed 0.5 / 1 / 1.5 / 2×, captions from WebVTT drawn above the controls, full screen. Space / K, ← / →, J / L, M and F work only while focus is in the player. The controls sit on a scrim in the dark theme so they read over a bright picture; they hide while playing once the pointer rests and stay while a finger or the keyboard is on them. `duration` shows the length and the markers before the file loads; `startAt` opens at the event; loading, buffering and "Clip unavailable: …" with a retry; `autoPlay` is muted and off under reduced motion. Not for a live camera feed, which will be its own component. A 30 KB generated sample clip, its poster and captions live in `public/media` (Storybook serves them through `staticDirs`).
- **`graph`** (beta): a directed acyclic graph for lineage and pipelines (Dataset v3 ← label sets ← raw captures; a training run's inputs and outputs; a mission's parallel steps), for when a node has several parents and a `tree` would list it twice. A small layered layout in the file, no dependency: longest-path layers, barycenter sweeps against crossings, edges routed between boxes as smooth curves under HTML boxes; left to right, or top to bottom with `orientation="vertical"`; up to about 60 nodes. Nodes carry a name, meta, a status (shape and word, colour only for warning and danger) and an optional link (`linkAs`). Selecting, pointing at or moving to a node draws its upstream and downstream path in the ink colour and quiets the rest. One Tab stop; the arrow keys follow the edges (forward to outputs, back to inputs, across within a column), Enter selects or follows, Esc clears. Each node's accessible name lists its inputs and outputs, and `GraphList` shows the same graph as text, to offer beside it as charts offer their table. Wider than a phone, it scrolls inside its frame with the kit's scroll fade.
- **`context-menu`** (beta): the menu a right-click, a long press on touch, or Shift+F10 opens on a row or card. It looks and moves exactly like `dropdown-menu` (items, destructive items, checkbox and radio items, labels, separators, shortcuts, submenus; the keyboard ring only in keyboard use). A shortcut only: the same actions are always on a visible control, such as the row's ⋯ menu.
- **`hover-card`** (beta): a preview of what a link leads to, on hover and keyboard focus, in the popover's look (500 ms before it opens, 300 ms before it closes). Preview only: nothing in it is a control, and everything in it is on the page the link opens.
- **`banner`** (beta): a full-width notice at the top of the page or app about the app itself: maintenance, read-only mode, a trial ending, no connection. Alert's tones (neutral, info, warning, danger; `role="alert"` only for danger), an icon that names the subject, one action, an optional close button whose dismissal the app remembers (`onDismiss`, `open`), enter and exit movements. Wraps on a 375 px phone with 44 px targets; the docs show how to sit it above `app-shell` with `--app-shell-height`.
- **`notification-center`** (block, new type Notifications): the bell for the app's top bar (AppShell `actions`) with its unread `CountBadge`, opening the notifications grouped by day (Today, Yesterday, then the date) in a popover on wide screens and a bottom sheet on phones. Unread rows carry a dot and weight, and say "Unread" to screen readers; each says what happened, which robot and site, when, and links to the thing. Mark one or all as read, filter All / Unread, "You're all caught up", loading and error. Arrow keys, Home and End move through the list; Esc closes and returns focus to the bell. Notifications are things worth knowing later: alarms that need action stay with `alarm` and the island, and the block's description and type rules say so. `NotificationPanel` renders the list without the overlay.
- **`settings-billing`** (block, Settings): plan and renewal, robots and seats against what the plan includes (a `Meter` that warns only past 90 %), this period's usage with its dates, the card on file as brand and last four, and invoices with tabular amounts, a status in words and icon (paid grey, due, overdue in danger text) and a PDF link each. Change plan and cancel (confirmed first, saying what stops) are entry points; there is no checkout or card form, which stay on the payment provider's pages. Money is formatted by Intl in the account's currency (USD and TWD samples). Empty, loading and error states.
- **`settings-webhooks`** (block): endpoints that receive fleet events, each with its whole URL, its events and its state (active and disabled in grey; failing in danger text with an icon, since when and the last error). Adding one is a sheet with a URL checked for https and event checkboxes in a `FieldSet`; its signing secret is shown once in a secret `CodeBlock` with a copy button and never again, and rotating shows the new one the same way. The chosen endpoint sends a test event and lists its recent deliveries (status, time, duration), a failed one opening to what the endpoint answered. Delete asks for the host to be typed. Loading, error and empty states.
- **`settings-sessions`** (block): where you are signed in, as browsers (never devices): browser and system, an approximate place, last active and "This browser". Sign one out at once; "Sign out all other browsers" confirms first and lists them. Below, the browsers that skip the 2FA code for 30 days, each one forgettable.
- **`auth-2fa`** (block, `AuthTwoFactor`): the step after the password, in Sign-in's frame and width: a 6-digit code in `InputOTP`, or a recovery code (XXXX-XXXX) in a text field; "Remember this browser for 30 days"; a wrong code says how many tries are left, too many pause sign-in and the button counts down; a passkey as the quicker way (`passkey={false}` when the account has none).
- **`histogram-battery`** (Patterns › Chart › Histogram): how one value is spread, here battery level at docking in 5 % bins on a number axis, the median and the 15 % line labelled, the bins under 15 % in warning with the count in words, counts on hover and a Chart / Table switch. Exports `binEqualWidth` (each bin holds its lower edge and not its upper; the last also holds the maximum; out-of-range values are counted apart) and `median`.
- Docs: **Next.js** (`/docs/nextjs`): the kit in an App Router project. `components.json`, the theme and Geist through `next/font`, which kit components are client components (read from their files) and why pages and layouts stay on the server, the theme without a flash, `next/link` through `linkAs`, the app shell in a layout with a client frame, route progress from `useLinkStatus`, forms with a Server Function, images, and the common errors with their messages. Every snippet was built and run in a Next.js 16 app.
- **Adoption scanner**: `npm run adoption -- <dir …>` reads the version header of every installed file and reports, per repo, each item, its installed and latest version, how many minors behind, beta or stable, and the CHANGELOG lines in between; `--github <org>` scans an organisation through the `gh` CLI (skipped when gh is missing or signed out); `--json` for machines.
- **`lint:rules`: a block that draws a `Graph` offers a `GraphList`**, as a chart block offers its table.
- Icon set: `CreditCard`, "A payment card, billing".
- Icons: `Volume2`, `VolumeX`, `Captions`, `Maximize`, `Minimize` in the icon set, for the media player.

### Changed
- **Status on every item.** The 47 items a product uses (DataCore's dashboard) are `stable`; the others are `beta`, so a page now tells you which APIs have settled. Blocks carry no status, as before.
- **`record-form`, `dialog-form`: validate like the `form` example**, without a form library: nothing is said before the first submit; after it, each error follows its value as you type, and a failed submit focuses the first field in error (`dialog-form` did not move focus before).
- **`slider`: `valueText`** sets each thumb's `aria-valuetext` on a controlled slider, so a screen reader hears "0:42 of 1:00" or "40 %" instead of a bare number.

### Docs and CI
- Examples are in English only: the Traditional Chinese examples of `annotated-image`, `code-block`, `form`, `metric-card`, `tree` and `theme-toggle` are gone. Each component still takes its words through `labels` (or its schema, for `form`).
- The Accessibility tab's measured data is checked in CI: a job builds the site, measures every component again and fails when `site/a11y.json` differs (only when a component or story changed). The measured file is attached to a failed run.
- Roadmap brought up to date.

## 0.20.0 · 2026-11-20

### Added
- **`form`** (beta): how to build a form with React Hook Form and the kit's Field, the way shadcn does it: no wrapper component, each control in a `Controller` and a `Field` (a `FieldSet` for a group). `npx shadcn add @syncrobotic/form` installs `MissionForm`, an example to change: a zod schema, errors after the first submit, focus on the first field in error (React Hook Form's own, with `field.ref` on a Select's trigger or a group's first choice), a refused save in an Alert above the fields, and a submit button that waits. React Hook Form, zod and @hookform/resolvers come with the example only; no other item depends on them. Examples: create, server errors on a field and on the form, a group with a rule across its choices, edit with undo, and Traditional Chinese.
- **`lint:registry`: one version range per package.** `chart` asked for any `recharts` while ten blocks asked for `recharts@^3`; it now asks for `^3` too, and the check fails when two items ask for the same package differently.

## 0.19.0 · 2026-11-20

Follow-ups to 0.18.0.

### Changed
- **`stats-filtered`, `sparkline-metric-tiles`: built on `MetricCard`**, like `stats-cards`, so a KPI card looks and reads the same everywhere. Visible: the value is 24 px (the card-figure size; `stats-filtered` was 28 px), the change sits beside the label with its arrow, the range is the caption. `stats-filtered` shows a change under half a percent as no change.
- **`code-block`: `labels.copy(title)`** names the copy button, so it can be translated with the other labels; `copyLabel` still sets the name as is.

### Fixed
- **`metric-card`: the sparkline shows on phones too**, on its own full-width line under the value (it was hidden below 640 px); from 640 px it stays beside the value. `stats-cards` and `sparkline-metric-tiles` show their trends on a phone again.
- **`metric-card`: no change has no arrow.** "0", "±0" or "0.0 %" drew an up arrow; a change of nothing has no direction.
- Docs: the search button's spoken name starts with the word on it, and the ⌘K key cap is a hint, not part of the name (WCAG 2.5.3); it also announces its shortcut.

### Kept
- `tree`: links in list mode stay without an underline. A tree is navigation, like the sidebar; its rows show they can be pressed by their hover fill. Underlines are for links in running text.

## 0.18.1 · 2026-11-20

Docs only: no component changed, so no item version moved.

### Changed
- Docs: each component page has three tabs, each at its own address: **Overview** (examples, usage, changelog), **Properties** (`/properties`, the API reference) and **Accessibility** (`/accessibility`). The Accessibility tab is generated, not written per page: the roles a screen reader meets, measured in a browser (`npm run a11y`); the WAI-ARIA pattern each follows; the keyboard table or what Tab does; and the contrast of the colours the component uses, computed from the theme in light and dark against WCAG 2.2 AA. Switching tab keeps the head of the page still: the underline travels and the tab's content appears (--motion-base). The Markdown twin gains the same Accessibility section.

## 0.18.0 · 2026-11-19

Four pieces the kit was missing, found by checking what products build by hand.

### Added
- **`annotated-image`** (beta): boxes, points, polygons and poses over a picture, in its own pixel space with non-scaling strokes. Predicted solid, ground truth dashed, the previous version dotted and faded, each on a halo; selected 3 px with handles; class words on the picture (all, selected or none); one image with a spoken summary, or, with `onSelectedChange`, a group of buttons (one Tab stop, arrows, Enter, Esc); raster overlays; loading and failed states; and `AnnotationLegend` for the kinds present.
- **`tree`** (beta): a hierarchy from data (lineage, sites › zones › robots, a dataset's folders) in two modes. `list` (default) is a nested list with a 1 px guide line per level, a disclosure button per branch and links in the normal Tab order; `select` is a WAI-ARIA tree (one Tab stop, arrow keys, Home / End, type-ahead, `*`, one selected node) with the kit's keyboard ring and selected look.
- **`metric-card`** (beta): one headline number on a card, taken out of `stats-cards`. Label, value and unit, a change coloured only when it is for the worse (read aloud as better or worse), a neutral sparkline and a caption; `href` makes the whole card one link, `loading` keeps its height, `unavailable` shows a dash and why instead of a 0. `MetricGrid` lays out the row (two across on a phone, four from 1280 px). `stats-cards` is now built on it; its value is 24 px, the card-figure size (was 28 px).
- **`code-block`** (beta): code or a command with its title and a copy button. `wrap="words"` wraps a shell command only between words and after "/", `wrap="none"` scrolls source sideways with the table's fade and takes focus, `secret` hides a one-time API key until Show is pressed (Copy copies the real value), `lineNumbers` adds a gutter. No highlighter inside: a highlighter's output goes in as children; the docs site's own code blocks now use it with shiki.

## 0.17.4 · 2026-11-19

Found by putting the kit into a real product (the DataCore dashboard), not by a review.

### Fixed
- **`select`, `dropdown-menu`: opened with a click, no keyboard ring.** The selected option was ringed on every mouse open; the ring now appears when a key moves in the list, or at once when the list was opened from the keyboard (as `command` already did).
- **`breadcrumb`: no gap after a short middle crumb.** The few-letters floor moved from the item to its name, so a two-character name is no longer padded to 64 px.
- **`table`, `data-grid`: the scroll cue is a mask** (`scrollFadeMask`): columns fade into whatever is behind them, so a grey header row no longer gets a light smear and the frame's edge stays whole. The edge and the focus ring sit on the frame. `ScrollFades` is deprecated.

## 0.17.3 · 2026-11-19

A second eyes-on review, of what the first did not see: every page in dark mode at desktop (full page), at tablet width (768 px) and every app screen scrolled to its end on a phone.

### Changed
- **New `--track` token** for tracks and quiet shapes (slider, progress, meter, rings, skeleton, steps), 1.5:1 on the surfaces they sit on; in dark mode they had been near invisible. **`--disabled` reaches 3:1** on every surface in every mode, and a disabled field keeps its grey fill with a quiet edge, so it never looks enabled in dark. Dark `--popover` sits one step above the card so overlays separate. Contrast tests cover all of it.
- **Below 1024 px the docs site uses the phone header and drawer**: the area tabs and the sidebar move into the drawer, so a tablet gets the full width (pages were 823 px wide at 768, and the 240 px sidebar left tables clipped and text one word per line).
- **App screens at tablet width**: secondary table columns show from 1024 px and long cells wrap, so tables fit beside the shell's rail. Full-screen blocks honour `--app-shell-height`.

### Fixed
- **`map-workspace`: the critical alarm shows at every width.** It was hidden below 1024 px.
- **`command`: the ring on the highlighted row appears only after keyboard use**; static lists showed it at rest (a regression in 0.17.2).
- `calendar` (two months: no doubled end day, months wrap), `navigation-menu` (aligned, never clipped), `data-grid` (summary totals when scrolling), `sheet` (sticky footer), `scroll-area` (no fade at the start), `resizable` (visible grip), `toggle-group` (divider between selected items), `table` (visible selected row), `breadcrumb`, `filters`, `image-grid`, `timeline`, `toast`, `phone-input`, `questionnaire`, `avatar`, `stop-button`, and five blocks whose tables drew two frames (`wizard-import` clipped its table).
- Docs: examples group a component's states instead of one near-empty card each; hooks and the tray have live demos; the API reference lists pass-through parts once; keyboard tables use real key caps.

## 0.17.2 · 2026-11-19

### Added
- **API reference on every component page**, generated from the types (`npm run props`, checked in CI): each part's own props with type, default and description, and what the rest come from (an HTML element or a Radix part). Also in each component's Markdown twin, for agents.
- **Beta and stable.** An item marked Beta may still change its API in a minor release; the label sits beside the version on its page, in its Markdown and in `/llms.txt`. Beta now: `filters`, `text-diff`, `image-grid`, `use-hotkeys`. New items start in beta (lint:registry asks for `meta.status`). See Versions and upgrades › Beta and stable.
- Component pages open with their first example, right under the title; install and when to use follow.
- **`lint:rules`** (in CI and `npm run ci`): the rules the 0.17 audit found broken by hand now fail the build. `outline-none` needs a visible focus in its place (or a `// focus-ring:` comment saying where focus shows); `outline-none` next to `focus-visible:outline-*` is an error, since Tailwind 4 cancels the ring; a battery threshold other than 15 % or a battery Meter with `critical`; a chart block without a table view. Field-edge contrast (`--input` 3:1 on card, page and muted tile, every theme) is a unit test.

### Fixed
- **Eyes on every page.** All 183 pages were looked at as screenshots (phone, full page; desktop, first screen), not only measured, and what looked wrong was fixed:
  - Tables on phones: a fade shows on the side that still hides columns (`table`, `data-grid`), and the blocks whose tables ran off their card got a phone layout: `data-catalog`, `maintenance-due`, `maintenance-work-order`, `users-invitations`, `users-roles`, `settings-notifications`, `incident-queue`, `heatmap-zones`, `mission-schedule` (a list per robot on phones).
  - `stepper` no longer squeezes and hyphenates the current label; `calendar` arrows sit on the caption row; `filters` always keeps its +N visible; `sheet-robot-detail` has a close button; `sheet-filters` and `app-shell-mobile-tabs` no longer stretch across a desktop.
  - One header order for every chart block (new `CardDataHeader`, `CardFigure`), true minus signs (`chartNumber`), even ticks with the last label inside, one heatmap scale with a legend, `%` written the same everywhere.
  - Consistency: one sample user in every shell, compact filter segments everywhere, one button style per action, `IconTileDot` neutral by default, `review-queue`'s progress neutral.
  - Docs: the API reference prints `ReactNode` instead of a six-line union and renders code in descriptions; install commands wrap between names instead of being cut; previews size to their content and centre; patterns draw at 100 % on phones and have descriptive titles; the sidebar never leaves an item half under the header; leads balance their last line.
- **`command`: an inline list no longer scrolls the page to itself as it mounts.** cmdk keeps the highlighted row in view with `scrollIntoView`, which also moved the page: the Command docs page opened 4,000 px down. Rows now scroll their own list only.
- Docs: a section still waiting to arrive prints as it is (printing before scrolling left blank sections). `check:wrap` also fails on text that should never show (a code comment, `NaN`, `[object Object]`).
- **`map-workspace`: the emergency stop is on screen on any phone.** On a 360 × 640 screen the robot tray and the map had pushed it below the edge (a regression from moving the tray out of the way of keyboard focus). Now the map gives way and the stop keeps its size.
- Docs: on a phone the version sits on its own line and Markdown, Prompt and Source share the next one in equal columns; Source had been left alone on a line on every component page. `agent-approval`'s actions stack on a phone. A new local check, `npm run check:wrap`, finds any row of actions that wraps with one left alone, which the overflow check could not see.
- **Keyboard position is visible in every list** (2.4.7). In `dropdown-menu`, `select`, `command`, `autocomplete` and `time-picker` the highlighted item showed only a pale fill (1.24:1); with the keyboard it now also has a 2 px inset ring, and with a mouse it stays a plain fill. `time-picker`'s 48 times are one Tab stop with arrow keys. `lint:rules` no longer accepts a background alone as focus.
- **`command`**: CommandDialog gives focus back to what opened it (a button or ⌘K); it fell to the page.
- **Named popovers**: `date-selector`, `time-picker` and `autocomplete` panels are named by their field; the `popover` rules say content needs a name.
- **Focus never hidden**: on phones `map-workspace` puts the robot tray above the map and the stop below it, so a focused marker is never under the tray; `action-rail-shell` keeps scroll padding for its floating bar.
- **Graphics reach 3:1**: status tracker cells and sparkline-table bars are opaque grey; no data is an outlined cell; the uptime strip is one Tab stop that reads each day. In high contrast, the segmented track, radial tracks and island action buttons have an edge.
- **Glove targets** (48 px): calendar month and year menus, navigation-menu links, the top-bar brand, row links in `data-catalog` and `agent-runs`, and the resizable handle on touch. `date-selector` scrolls inside on a small phone instead of running off the screen.
- **`console-overview`**: one search, the table's filter; the top-bar search box duplicated it.
- **Filter segments look the same everywhere**: `agent-runs`, `timeline-audit` and `incident-queue` use the compact segments with counts, like the fleet table.
- **`incident-detail`**: Post update is disabled until there is text, and says why beside it.
- Docs: block thumbnails on /blocks are readable. Each shows one telling region at about half size instead of a whole 1280 px screen, and App shell opens with a block that has content instead of an empty page.
- **Docs say each rule once, and the same way everywhere.** A review of every place a rule is written (README, CONTRIBUTING, ROADMAP, the theme's comments, the agent skill, component rules, foundation pages, lint messages) removed stale facts (counts, paths, links, CI claims) and settled the copies that disagreed: light is the default theme; 44 px on touch, 36 with a mouse; disabled outlines; the elevation recipes; six motion patterns; exit easing; waiting loops only; a table view for every chart with axes (sparklines, rings and status strips say their numbers in words); status is a shape and a word; danger is "needs someone now: stopped, failed"; WCAG large text is 24 px, or 18.66 px bold. Each topic has one source page; the others link to it or repeat it exactly.
- Docs: on a 375 px phone the header's "Design System" no longer wraps to two lines.
- Docs: the cards on the home page, Blocks, Components and the foundation previews showed no focus ring at all: `outline-none` cancelled their `focus-visible:outline-2` (a Tailwind 4 behaviour). Found by the new lint.
- **`progress`**: `tone="success"` is neutral. A finished bar stays grey; green is a confirmation that comes and goes, not a state that stays.
- **`breadcrumb`**: a crumb link is as tall as a compact control (36 px with a mouse, 44 px on touch); it was 20 px, too small to tap.
- Docs site:
  - The theme menu has three choices, Light, Match system and Dark, and matches the system by default (it was a two-way switch, light by default). It follows the system live while that choice is on.
  - Sections no longer rise 24 px and run back as you scroll. They arrive once with the theme's appear movement (8 px), as the motion rules ask.
  - Calm things on the foundation pages are no longer green: Do examples, accessibility passes and the checklist, list dots, a good-signal bar.
  - Touch targets reach 44 px on phones: the logo, a block's Open link, "Built from" chips, the data-visualisation item links, the Installation guide link.
  - Docs follow 0.17's rules: the agent skill's design language and checklist (offline grey, battery a Meter warning below 15 %, switch on primary, KPI colour only when worse, neutral environment badge, field edges 3:1, alarms first, a table view for every chart, focus rings never removed), CONTRIBUTING's pre-PR check, the Meter guidance (`low={15}`) and the ROADMAP.
  - Examples follow the rules they teach: Update available is a neutral alert (blue is only a process), the previous period in a chart is slot 5 grey, a finished progress bar is grey, the attachment composer shows focus.

## 0.17.1 · 2026-11-19

### Changed
- **`console-overview`**: alarms come first, above the numbers and the robots, and leave when none is active. On a phone, what needs someone is now the first thing on screen; it was about three screens down.
- **`stats-cards`**: two across on phones, so four numbers take half a screen. The change sits under the label so the values line up; the sparkline shows from 640 px.
- **`app-shell`**: the environment badge is a neutral outline for every environment. Staging was amber and Production red: a status colour on every page, all day, which dulls the warnings that do need someone. The sample nav has **Agents**, and the agent pages (`agent-runs`, `agent-trace`, `agent-approval`) mark it as current (they marked Event log or Alarms).

### Fixed
- **Field edges reach 3:1** (WCAG 1.4.11). `--input`, the edge of fields, checkboxes, radios and a switch that is off, was 1.2–1.4:1, and on a card that edge is all that shows where a control is. Now #80808a in light and #72727a in dark: 3:1 or more on the card, the page and a muted tile. `switch` draws its off state with it.
- **Focus rings put back**: `tabs` (the panel) and `chart` took keyboard focus and showed nothing.
- **`icon-tile`**: `tone="info"` is neutral, like success (a tile stays on screen; blue is only a process someone is waiting on). Solid warning takes the mode's ink, 4.5:1 or more in every theme; solid info was 2.5:1 in dark and solid warning 2.2:1 in light high contrast.
- **Battery threshold is 15 % everywhere**: `island` turned warning at 30 %, and `stats-meters` turned the fleet average danger at 15 % (a battery never turns danger). `event-log`'s sample says 15 %.
- **Every chart block has a table view**: the nine that lacked one (area, ranked, stacked and variance bars, compare and limit lines, the week-by-hour heatmap) now switch between Chart and Table, as the data-visualisation rule asks.
- Docs: on phones a long name in a changelog line no longer widens the page (Island, Alarm). "Built from" chips no longer link to pages that do not exist (`use-presence` has its own page now; `robot-icons` goes to Icons). Links in component pages no longer turn blue on hover.
- **`button`**: disabled outline and destructive buttons keep their outline and lose the ink. They were a filled grey that looked heavier than the enabled button beside them (pagination's Previous on the first page).
- **`app-shell`**: its height can be set with `--app-shell-height` (default the screen). The docs' preview strip uses it, so the emergency stop and the user menu are no longer pushed 44 px below the screen in a preview opened on its own.

### Docs: rules that contradicted each other, now one rule each
- Light is `:root` and dark the `.dark` class; the theme header said dark was the default.
- A battery (any level that stays) is a Meter, never a Progress.
- A switch that is on is the primary colour, never green.
- Offline is a neutral state: said in words and by its shape, no colour, no tray edge.
- 36 px controls are for a mouse only and become 44 px on touch (one place said "only inside cards").
- Buttons are medium weight; bold is for titles, figures and the stop.
- In a KPI, only a change for the worse gets colour.
- A run with a start and an end that someone is waiting on (a mission in progress, a rollout stage) is a process, so blue.

## 0.17.0 · 2026-11-19

### Changed
- **Docs: Blocks are compositions, Patterns are variants of one component.** The Blocks page now holds only Application and Solutions. Variants of a single component moved to that component's page, under a new **Patterns** section:
  - Line, area, bar, sparkline, status tracker, radial and heatmap charts → [Chart](https://design-system.syncrobotic.me/docs/components/chart#patterns).
  - `timeline-activity`, `timeline-audit` → Timeline.
  - `dialog-form`, `dialog-share` → Dialog; `dialog-confirm-destructive` → Alert dialog.
  - `sheet-robot-detail`, `sheet-filters` → Sheet.
- Install names are unchanged. Old `/blocks/<type>` and `/blocks/<name>` URLs redirect to the new place. Search, the sidebar, the sitemap, `llms.txt` and the Markdown twins follow the new grouping.

## 0.16.1 · 2026-11-19

### Added
- **`ResultBadge`** (`badge`): one prop for the verdict of a test, an evaluation or an audit.
  - `result="passed"`: grey with a check.
  - `"failed"`: danger outline and text.
  - `"insufficient"`: grey outline with a dashed circle.
  - The Colour foundation and the examples use it, so products no longer assemble the three by hand.

### Fixed
- **`filters` jumped**: with the picker open, a click on another part of the same chip closed it, so a second click was needed and the picker flashed between heights. Now it switches to that step in place; clicking the open part again closes it. Fields without an icon keep the icon's space, so names line up.
- **`command`**: the search row inside a picker popover no longer shows a heavy focus ring for good (the box always has focus there).
- **`review-queue`**: after the shortcuts dialog is opened with ? and closed by keyboard, focus goes back where it was (or to the shortcuts button), not to the page body.
- ROADMAP: the repository is public.

## 0.16.0 · 2026-11-19

### Added
- **`filters`**: a filter bar of chips, after ReUI's Filters but kept flat.
  - **+ Filter** picks a field, an operator and a value. Any part of a chip reopens that step.
  - Rules combine with "and". Fields can be text, option (single or multi), number with unit, date (single or range) and boolean.
  - Rules live in the URL (`toQueryString` / `fromSearchParams`) and filter rows in the browser (`filterRows`).
  - Fully keyboard operable: every step is announced, and focus returns where it came from. The DataGrid example filters 40 robots.
- **`text-diff`**: where two texts differ, word by word.
  - Insertions are a grey block with an underline. Removals are struck through in secondary text: a removal is not an error, so no green and no red. Each change is announced as added or removed.
  - Inline or side by side, with a "+3 words, −1 word" summary.
- **`use-hotkeys`**: shortcuts as a map of keys to handlers. They stay quiet while someone types in a field. The hook reports the key being pressed, so `kbd` (new `pressed` state) can show it going down.
- **`review-queue`** (block, Data operations): review items one at a time by keyboard.
  - 1/2/3 answer and advance. Esc goes back, Backspace or ⌘Z undoes, ? opens the shortcuts.
  - The key bar shows each key going down.
- **Test and audit results** (Colour foundation):
  - A pass is grey with a check, never green. A failure is a danger outline with danger text. Not enough samples is grey with a dashed circle.
  - There are Badge examples for all three.
- **`image-grid`**: a gallery of thumbnails, as a grid or a scroll-snap strip.
  - Tiles load lazily and keep their aspect.
  - States: loading (skeleton), hidden (RestrictedPreview), broken (shows the file name).
  - Single or multiple picking.
  - A lightbox with the position ("3 of 24"), ← → to move, Esc to close, and focus back on the tile.
- **`action-rail-shell`** (block): a page whose right column holds only the next step.
  - The rail holds one large primary button and a few small actions.
  - On phones it becomes a bar fixed to the bottom, above the safe area.
  - ← or Esc goes back.
- **Annotations on images** (theme and Data visualisation foundation):
  - Tokens: `--annotate-predicted`, `--annotate-truth`, `--annotate-previous`, `--annotate-selected`, `--annotate-halo`, `--annotate-fade`.
  - Line style is the primary encoding (solid, dashed, dotted, thick with handles).
  - A halo under every stroke keeps boxes and points at 3:1 or better on any photo.
- **Site search**: ⌘K, Ctrl+K or / opens a palette over pages, foundation sections (every rule by its heading), components, blocks and the icon set. Whole words, titles first. The index is written at build time and fetched the first time the search opens. An icon result opens that icon's details (`/icons?icon=Name`). On phones a 44 px search button sits in the header.

### Changed
- **CI is faster**: pull requests only, stale runs cancelled, story checks once per release (into stage) in Playwright's own image, registry-e2e skipped when no registry file changed.

### Fixed
- `command`: in CommandDialog the input row no longer shows a focus ring for good.

## 0.15.0 · 2026-11-19

### Added
- **`use-debounce`**: `useDebouncedValue` and `useDebouncedCallback` (with `cancel` and `flush`), for a search or an autosave that waits until changes pause. `autocomplete` takes `debounce` (ms): the text box updates on every key, `onQueryChange` fires when the typing pauses, and clearing never waits. The server-search example also drops answers that arrive after a newer query.
- **`avatar`, richer** (after ReUI's set, in our rules): four sizes; `shape="square"` for robots, sites and teams beside round people; `AvatarBadge` with a status (the StatusGlyph shapes, so only warning and danger are coloured) or a count; `AvatarGroup` with `max` folding the rest into +N and a `label` that names everyone. The default avatar looks as before.

### Changed
- **A selection travels:** `segmented-control`'s thumb and `tabs`' underline move to the option you pick (the Move pattern, `--motion-base`) instead of jumping; the label's colour changes with the travel.
- **`number-field` reads as one value:** the number and its unit sit together, centred between − and + ("20 %"), instead of the number in the middle and the unit pushed against the +, which drifted 140 px apart in a wide field. Angles sit on the number ("-2.5°"). `rollout-plan` writes its units in the fields, not the column headings.
- **Lists and pickers move with their state:** `autocomplete` and `select` turn their chevron while open, like `accordion` and `navigation-menu`; the highlight in `autocomplete`, `select`, `dropdown-menu` and `command` changes colour (`--motion-fast`) instead of jumping; `autocomplete`'s clear button fades in and out with the query and its selected check fades in. Filtering as you type stays still, so the list does not move under every keystroke.
- **`input-group` units follow the value:** `InputGroupUnit` writes the unit right after the value ("120 m") instead of at the far edge; the value is as wide as its text (`field-sizing: content`; browsers without it keep the unit at the edge). A press on the field's empty space puts the caret in the text box.

### Fixed
- **The docs site rang alarms**: an unacknowledged critical alarm in a block example (map-workspace on Fleet operations) repeated its tone every 10 s once the page had a click. The docs and previews keep sound and vibration off; the sample buttons on the Alarms page play only when pressed. Products are unchanged: critical alarms still repeat until acknowledged.
- `avatar` with an `aria-label` is announced as one picture (`role="img"`).
- **Keyboard focus was invisible** on chip-group, navigation-menu, scrollspy, stepper, trace, questionnaire, scroll-area, timeline, calendar's dropdowns and command's input: `outline-none` with `focus-visible:outline-2` draws nothing in Tailwind 4.3. Every one shows the 2 px ring again.
- **Phones (412 px), from a page-by-page audit:**
  - 15 block tables no longer scroll key columns off screen: secondary columns fold under the main cell. `agent-approval` shows Now and After before you approve.
  - `data-grid`'s empty state and totals stay in view.
  - `questionnaire`'s 0–10 scale wraps into rows of six.
  - `pagination` keeps its range on one line and folds to previous / current / next in a narrow container.
  - `island` wraps alarm and failure text to two lines instead of cutting it; safety text is never an ellipsis.
  - `navigation-menu`'s site header folds into a menu sheet.
  - `calendar`, `input-otp`, the time range example and `heatmap-zones` fit.
  - Fieldsets can shrink (theme).
- **`stepper`**: equal steps, labels centred under their dots, connectors from dot to dot. A narrow stepper keeps only the current step's label.
- **Charts:**
  - The earlier period and the plan are grey (slot 5), as the Data visualisation rules say.
  - Limit and dock labels no longer sit on the curve.
  - Ticks are even, so 70 and 18:00 are back.
- **Battery never shows danger and warns under 15 %** in every block: one rule, the Alarms foundation's.
- **Disabled text is readable**: `--disabled` is 3:1 on the page and cards, still lighter than secondary text. Every disabled example says why. The emergency stop row in Sortable priorities is fixed above the list with no handle.
- **State changes that jumped now move:**
  - Sort arrows cross-fade (`table`, `data-grid`).
  - Chips revealed by "N more" appear and leave.
  - `date-selector`'s Clear fades.
  - `restricted-preview` fades in.
  - `CommandCheck` marks picked rows.
- **Alignment:**
  - Alarm and list icons sit on the title's line.
  - Values sit next to their labels in `radial-chart-*`, `status-tracker-uptime`, `sheet-robot-detail` and `sheet-filters`.
  - `settings-notifications` checkboxes line up.
- **Smaller fixes:**
  - Checkbox and radio answer a 44 px touch.
  - `settings-api-keys` Revoke is destructive.
  - Search placeholders are no longer cut (`AppSearch.label`).
  - Block previews opened on their own put "Back to the docs" above the block instead of over its stop button.
- **Two clear crosses in a search field** (`input-group` with its own clear button): an input group with a button in it hides the browser's cross (`syncrobotic-theme`).
- **`input-otp`: the last digit kept changing** once the code was full: the library keeps the last character selected, so every further key swapped it. A full code now ignores extra keys; Backspace, select-all and paste still edit.
- **`phone-input`: the country list was cut off**, as narrow as the flag-and-code trigger (128 px). It now takes its own width (288 px) from the trigger's left edge; long names end in an ellipsis and the calling code keeps its column.
- The disabled NumberField example showed 1.5 m/s as "2" (no `step`, so it rounded to whole numbers).


## 0.14.2 · 2026-11-19

### Added
- **Page transitions on the docs site:** going to another page fades the old content out (`--motion-fast`) and brings the new one in with an 8 px rise (`--motion-base`), while the header and sidebar stay still and clickable. Reduced motion keeps the fade.
- **Motion foundation: Between pages.** A view transition makes whatever takes part in it unclickable while it runs, and by default that is the whole page: measured in Chromium, a stop button did not respond during the animation. The rule: only the content takes part, the root is never snapshotted, and the stop and the island are never inside a transition. The agent skill says the same (`agent-skill` 0.14.2).

## 0.14.1 · 2026-11-19

### Changed
- **Sheets float.** `sheet` sits 8 px from the screen's edges, the app shell's gutter, with every corner rounded, so a drawer or a bottom sheet reads as one more panel on the page instead of a slab glued to the glass. The bottom sheet clears the home indicator. A side sheet fills up to `max-w-sm` and auto margins keep it on its side: **drop `w-full` from your `SheetContent`** if you set it (re-install `sheet` and `syncrobotic-theme`).
- **`top-bar-shell` header**, the same as the docs header: at the top its menu icon or logo starts on the content's edge, in line with the page; on scroll it gathers into a floating panel as wide as the content column.
- The agent skill's design language, the README and the site's description now cover high contrast, chart limits and floating sheets.

### Fixed
- **Docs header on phones, done right:** 0.14.0 made the scrolled header a full-width bar, wider than the content column every other floating bar lines up with. Now at the top of the page the icons sit on the 16 px edge, in line with the headline; on scroll the bar gathers into a panel whose edges are the content column's 16 px, the icons moving in with it. Desktop is unchanged.

## 0.14.0 · 2026-11-19

### Added
- **High contrast** (`syncrobotic-theme`): `data-contrast="more"` on `<html>` or any container, in light or dark, for a tablet in bright sun, glare on an outdoor robot's screen, and low vision. Text and status reach 7:1 (WCAG AAA) on every surface they sit on, field and card edges reach 3:1 so they show without their fill, and trays over the map are opaque. Meanings do not change. Tested in CI; shown on the Accessibility page with its contrast table; exported as `color.light-hc` and `color.dark-hc` DTCG tokens; a Contrast switch in Storybook's toolbar. To follow the system setting, set the attribute from `matchMedia("(prefers-contrast: more)")`.

- **Data visualisation foundation** (`/docs/foundations/data-visualisation`). It covers:
  - which form fits which question, mapped to the kit's charts (and when the answer is a table or a trace);
  - colour by job (categorical, sequential, status, process);
  - how many series the palette carries, measured from the theme on every build: up to five for lines and bars, up to three for scatter and maps, because slots 1 and 4 are too close when any two can touch;
  - marks and axes, maps and robot tracks, and motion.

  CI now checks the chart palette for normal and colour-blind separation and 3:1 contrast in all four modes.

### Fixed
- **Docs header on phones:** the menu and theme icons sat 24 px inside the page edge, out of line with the headline, and once scrolled the floating panel was wider than the text. On phones the header is now a full-width bar that takes the card surface and a hairline when you scroll, as phone navigation bars do, with its icons on the content's 16 px edges before and after. Desktop keeps the floating panel aligned to the content column.
- **A `.dark` area on a light page kept light-mode ink** on cards, menus, secondary buttons and accents: their colours are aliases of `--foreground`, which CSS resolves where they are declared, so `.dark` now restates them. Re-install `syncrobotic-theme`.

## 0.13.2 · 2026-11-19

### Fixed
- **`sortable`: the dragged item drifted away from the pointer**, and dropped to the wrong place, inside any transformed container, such as the docs page's entrance animation. The overlay now renders on `<body>`. Without `renderOverlay` the item itself follows the pointer, lifted, instead of fading and staying behind.

## 0.13.1 · 2026-11-19

### Changed
- **Docs navigation, from a page-by-page review:**
  - Phones: a menu button in the header, on every page including the home page, opens the navigation from the left (the four areas and the pages of the one you are in), scrolled to the page you are on, with a close button. It replaces the folding menu inside the content, which scrolled away and was missing from the home page.
  - The sidebar opens scrolled to the page you are on; on the emergency stop page its link sat 3,800 px down, out of sight.
  - **Components has an index** (`/docs/components`): every component by group, with what it is for. The header, the home page and the end of the foundations lead there instead of straight to Button.
  - The 404 page keeps the site header, so a wrong link no longer strands you.
  - Getting started has previous and next, in sidebar order: Overview, Installation, Design tokens, Versions and upgrades, For AI agents, then Principles.
  - The phone menu button sits at the left of the header, the side its drawer opens from. The drawer starts with Home; on the home page no area is selected and the four areas are the choice.
- **Docs tables no longer cut columns off.** Token and rule tables (Accessibility, Alarms, Colour and the rest) wrap every column but the name, with even padding, so the Light contrast column and long descriptions show in full on a desktop. On a phone each row is a card with every value under its column's name, instead of a table whose colours, values and uses sat off screen. The DataGrid examples put Status right after the name, so it stays in view on a narrow screen.

### Fixed
- **A low battery showed as danger.** The Colour foundation says a low battery is attention, not failure, and the Alarms foundation makes battery under 15 % a high (amber) alarm, yet battery meters in `fleet-table`, `list-detail`, `map-workspace`, `sheet-robot-detail`, the DataGrid example and `radial-chart-battery` turned red below 15 %. Battery now takes only `low` and stops at warning. The Meter example shows danger with full storage instead, and the DataGrid sample no longer has a robot patrolling at 0 %.
- **Segmented controls were 36 px tall to a finger** (the icon size switch, the density demo, fleet-table's filters): each segment's hit area now reaches its track's edges, 44 px. The header's GitHub link, the Motion demo's Play, a component's version link and "How to upgrade", and the token file links are 44 px on touch too.
- **Raw Markdown on the page:** `**Markdown**` on the For AI agents page, and backticks in component changelogs and the Versions table. Docs copy renders `code` and **bold** everywhere now.
- The Button example's disabled button says why, beside it and to screen readers, as its own usage rule asks.
- **Component pages share one head:** title, one line, then the version and the Markdown, Prompt and Source buttons, always below (they jumped to the title's right when the line was short). Every component now has When to use and Use something else (nine were missing it) and usage rules (twelve were), and a line that only repeats the description is left out. Block pages keep Markdown and Prompt on the title's row, and the preview's toolbar keeps its height on the Code tab.
- **Example code runs when pasted:** each example carries the imports it uses, from where the CLI installs them (`@/components/ui/button`), and a bare snippet comes wrapped in a component. File names have no spaces (`button-variants.tsx`).
- **Icons:** names break between their words over two lines instead of being cut off; the kit's tiles show what each icon means; All Lucide explains its dot; a search with no result offers to clear it (and, in the kit, to look through every Lucide icon); for an icon not in the set, how to add it comes first and the code to copy waits behind "Copy anyway", in full instead of cut. The Iconography page names its twelve sample icons.
- **Search fields' clear button** (theme): the browser's small blue cross is the kit's grey cross at 20 px; blue means a process being waited on.
- **Polish from the page-by-page review:** the Colour neutrals break their names only after a hyphen; Radius shows its six corners in one row on a desktop with the value under the name; Spacing labels each height with its pixels and token and gives the do and don't their measurements; Motion's durations no longer wrap and the timing rules line up with their rail; the Dialog's description says what it is for; the shortcut keys in the overlay story line up on the right; a lone example button sits centred; the home page lists Foundations, Components, Blocks, Icons in the header's order; the icon search puts the exact name first; story names keep Bluetooth and Wi-Fi capitalised; Upgrading lists the most recently changed items first, each linked to its page.
- **Block previews opened on their own** have a title and a link back to the docs.
- `status-pages`: the heading is an h1 only when the page fills the screen; inside an app shell it is an h2.

## 0.13.0 · 2026-11-19

### Changed
- **`status` replaces `tone` on status displays** (StatusGlyph, StatusEyebrow, InlineStatus, Island): `active`, `normal`, `warning`, `danger`, `offline`. The old `tone` named colours (`info`, `success`, `neutral`) for states that are deliberately not coloured, and meant blue on a Badge but grey on a glyph. Badge, IconTile, Marker and the other colour components keep `tone`. **Not breaking:** `tone` still works until 1.0, maps info → active, success → normal, neutral → offline, and warns once in development. Every block and story uses `status`.
- **`size="sm"` replaces `density="dense"`** on DataGrid, Trace and Timeline, so it is not confused with the theme's `data-density`. `density` still works until 1.0.
- Touch is detected with `any-pointer: coarse`: a touch laptop with a trackpad keeps 44 px controls, and compact density applies only where nothing is a touch screen.
- Failed toasts are never closed for you. With more than three open, the oldest that is not a failure makes room; if all are failures, all stay.
- Mission schedule's now line is the foreground colour: a time marker, not a process being waited on.
- The icon set records that a low-priority alarm uses CircleAlert, so it keeps its own shape beside high and critical.
- The Island docs pair the edge as `alarmEdge(topAlarm(alarms)) ?? stateEdge`, so a low alarm does not erase the offline or stopped edge.

### Fixed
- Icons: picking an icon opened its details as a column beside the grid, which halved the grid's width on a desktop. The details now rise as a bar across the bottom (a sheet on a phone), so the grid keeps its width; a picked tile under the bar scrolls into view, and the last row can scroll clear of it.

### Added
- Buttons on the Alarms foundation to feel and hear each feedback pattern on a real device.

### Fixed
- Docs site on phones:
  - The menu button said only "Menu"; it now says where you are (area, then page). The four areas sat in one row where "Foundations" and "Components" did not fit; they are two by two. The open menu stays within most of the screen and scrolls inside, instead of pushing the page several screens down.
  - Block previews opened at desktop width, shrunk to a quarter and unreadable; on a narrow screen they start at the phone width, unless you pick another. The Preview and Code tabs no longer get cut by a scroll edge.
  - Once the header floats, the strip above it takes the page colour, so text no longer shows through above the header.

### Changed
- **Light is the default theme.** The design language says the interfaces are used outdoors, and in daylight and glare a dark screen washes out while dark text on a light surface holds. Dark stays complete and is for control rooms and night shifts: add `class="dark"` to `<html>`. The docs site, Storybook, the installation guide, the Principles page, the README and the agent skill now start in light; a visitor who chose dark keeps it. Components did not change: both themes were already complete and checked.

## 0.12.0 · 2026-11-18

### Added
- **Three more pieces for data tools**, from the DataCore review (the gaps used on two to four pages each):
  - `share-bar`: how a whole splits, as one thin bar in the chart palette, light enough for a table cell; with `legend`, a label, total and a legend that names every value. Colour follows the order given, never the size.
  - `load-more`: the end of a long list on a phone or in a gallery: "Showing 40 of 125" and "Show 20 more (85 left)", gone once everything is shown.
  - `restricted-preview`: pictures someone should choose to see (restricted tiers, faces, number plates) stay unloaded until asked, card by card, with the reason. Neutral: restricted is a property of the data, not a fault, so restricted tiers take no warning colour.
- **Pagination link mode**: `href` makes every page a URL (?page=3), so a page can be shared, Back works and it needs no JavaScript; `onNavigate` routes through the app's router.

### Fixed
The rest of the 0.11.0 audit and the design review: rules the kit stated but did not keep.
- **Disabled checkboxes, radios, switches and sliders faded to 50 %**, the last controls doing so. They keep their shape and say it with colour that stays readable in glare: grey instead of the primary when on, a grey label beside them.
- **Calm notices turned blue or green.** `toneSubtle` (behind a persistent or emphasised island notice) tinted busy and normal; only warning and danger tint now.
- **The Badge example showed the use the Colour foundation forbids**, a blue badge for "Patrolling", and a Badge for a count. It is a neutral badge with the status shape, and a CountBadge.
- **One icon, one meaning was broken by the kit itself.** Trace marked done and failed with Check and X (the set's "selected" and "close"); it uses CircleCheck and CircleAlert. In a stepper's step disc, where a circled icon would draw two rings, Check and X stay and the set now says so.
- **Touch targets under 44 px:** an expandable trace row in dense density (32 px), and stepper steps you can jump to (24–32 px). Both are at least `--h-md` now, so they follow density too; the switch's hit area does as well.
- **Screen readers did not hear "offline" or "charging"** on the island's status button. They do now.
- **A stepper step with an error stopped being the current step** for screen readers, and offered to jump to itself.
- The Accessibility contrast table listed blue as the colour of links; links are underlined text, and blue is a process being waited on.

## 0.11.1 · 2026-11-18

### Changed
- **Icons is an area of its own** (`/icons`, in the header beside Foundations, Components and Blocks; `/docs/icons` redirects). A grid of tiles instead of a list; picking one opens its details beside the grid (a sheet from the bottom on a phone): the drawing at 48, 24, 20 and 16 px, what it means, and copy buttons for the name, the import, JSX and the SVG. Two tabs: **Kit icons**, the 155 with their meanings, and **All Lucide**, all 1,544 icons of the Lucide version the kit ships with, searchable, with the kit's set marked by a dot. That list is built at build time and downloaded only on its tab. Picking a Lucide icon outside the set says how to add it, since lint still rejects it until then.

### Fixed
From a full audit of 0.11.0; most of these came with it.
- **Alarms on a phone signalled nothing.** Touch, sound and announcements lived only in `AlarmList`, but on a phone the island is the alarm surface, so a new critical alarm neither buzzed nor was heard. `IslandAlarm` now signals like the list (shared `useAlarmSignals` and `AlarmAnnouncer`); turn `feedback` off on one of them when both are on screen.
- **Critical alarms sounded once**, though the Alarms foundation said they repeat. An unacknowledged critical alarm now sounds every 10 s until acknowledged.
- **Shelved, suppressed and out-of-service alarms still buzzed, sounded and were announced.** They are silent now; an alarm back from shelving sounds again.
- **A critical alarm with `shelvedUntil` vanished** from the list, the island and the tray edge. Critical alarms are never shelved, whatever the data says.
- **A flood never ended.** Its clock stopped when the list mounted; it now moves on every 30 s, and only live alarms count. In a flood screen readers hear one count, assertively only when it includes a critical alarm.
- **The stop's "confirmed" pulse never played** in the dock's flow, where the button gives way to slide to release. The app plays it at that moment (`feedback("stopConfirmed")`); the docs, the home page demo and `map-workspace` do so, and `map-workspace` now stops and releases like the dock.
- **"No connection" on the stop and the wake button's disabled reason measured 2.1–2.6:1.** Both are muted text on muted now.
- **Slide to release could stick on "Releasing…".** `failed` puts the thumb back and says to slide again. The thumb follows a new `--h-thumb`, so it fills the track in glove and compact density.
- The island's "+N more" counted alarms the list does not show; `map-workspace` left an empty tray over the map once every alarm was acknowledged.
- **The agent skill taught the old rules** (blue for any state in progress, one easing for everything, no density, no touch and sound). Its design language and checklist now match 0.10 and 0.11.
- The site moved to its own domain, but the README (install example, MCP command, links), `package.json` and `registry.json` homepages, the agent skill's index link and the site's fallback URL still named `syncai-lib-designsystem.vercel.app`. They now say `design-system.syncrobotic.me`. Projects whose `components.json` still names the old address depend on Vercel keeping it (it does unless the domain is removed in the project settings); switch the registry `url` to the new domain. Re-install `agent-skill`.

## 0.11.0 · 2026-11-18

### Added
- **Touch and sound for safety moments** (`@syncrobotic/feedback`). One fixed vibration pattern per moment: the stop sent (at the touch), confirmed, not confirmed, release, a new critical alarm, a new high alarm. Critical and high alarms also sound, in the IEC 60601-1-8 burst rhythm (3 + 2 pulses at 880 Hz, 3 pulses at 660 Hz), generated with Web Audio so there is no audio file to ship. Low alarms stay silent. `configureFeedback({ haptics, sound })` turns either off app-wide. Vibration needs the Vibration API (Android, not iOS) and sound needs one tap on the page first, so neither replaces the screen. The Alarms foundation lists the patterns. Re-install `stop-button`, `use-slide-release` (and so `slide-to-release`) and `alarm`; `AlarmList` takes `feedback={false}` for a record view.
- **Alarm lifecycle beyond acknowledge** (ISA-18.2), in `alarm`. Shelved: an operator hides a nuisance alarm until a time (`shelvedUntil`, `onShelve`, `onUnshelve`); it leaves the live list into a quiet "Shelved" group and returns when the app clears it. Critical alarms cannot be shelved. Suppressed by design and out of service are counted under the list instead of vanishing silently. Floods: with `raisedAt`, over 10 alarms in 10 minutes puts up a banner, keeps critical and high in view, folds the low ones into one row, and screen readers hear one count instead of every title. The Alarms foundation has the table.
- **Density, including a glove mode** (theme). One attribute, `data-density`, on `<html>` or any container re-sizes every control under it, because every height is a token: `glove` for work gloves (48 px controls, 64 px rows and stop), `compact` for a control-room console with a mouse (36 px controls, 40 px rows; on a touch screen it stays at 44). No attribute is the bare-finger default. Type and spacing do not change, and the emergency stop never shrinks. `data-grid` virtual rows follow it. The Accessibility foundation has a live demo. Re-install the theme and `data-grid`.

### Fixed
- Docs, status pages preview: each of the five states is named above its frame. The loading state had no label, so its skeleton read as the preview itself still loading.

## 0.10.1 · 2026-11-18

### Changed
- Docs home page: a front page, not a sitemap. About two screens instead of five: what it is beside the working emergency stop, then how to install, the three rules side by side, and one row each for foundations, components and blocks (with counts). "Get started" leads, since most visitors are here to install. The full foundations and component grids stay on their own pages.

## 0.10.0 · 2026-11-18

Most items change in this release: re-install the theme and every component you use (`npx shadcn add @syncrobotic/<name> --overwrite`). Each item's changelog says what changed.


### Added
- **Icon set** (`/docs/icons`, under Iconography): the 155 icons the kit uses, in thirteen groups, each with the one thing it means. Search by name or meaning ("dock" finds ChargingDock), preview at 16, 20 or 24 px, click to copy the name. `site/icons.ts` is the single list: lint rejects a Lucide import outside it (`tokens-ok:` for a deliberate counter-example), a test fails when two icons share a meaning, and `llms-full.txt` carries the set for agents. Iconography gains "One icon, one meaning". Robot states Lucide already draws joined the set: Forklift, Joystick, Waypoints, LocateOff, TrafficCone, RouteOff, BatteryLow, Siren, SignalLow, SignalZero, BotOff, ScanLine, DoorOpen, Package.
- **`robot-icons`**: five robot icons Lucide does not have, drawn on its 24 px grid with its 2 px round stroke and built with its own factory, so they take the same props: `RobotArm`, `MobileRobot`, `ChargingDock`, `EStopPressed` (the physical stop on the machine, not the on-screen one) and `SafetyZone`.
- **Ready to make public.** A `LICENSE` (all rights reserved: the repository is source-available for reading, not open source), `CONTRIBUTING.md` (setup, checks, adding a component, baselines, releases, deployment; moved out of the README) and `SECURITY.md`. The README is rewritten for people who use the kit: what it is and who it is for, the rules, quick start, what's inside, the quality CI guarantees, AI agents. Before publishing, the whole git history (177 commits) was scanned for keys, tokens and `.env` files: none.
- **No environment variables to set.** `SITE_URL` and `SITE_PUBLIC` are gone: the canonical URL comes from Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, and only the production deployment (`VERCEL_ENV=production`) is open to search engines; previews stay `noindex`.
- **Building blocks for data tools**, from a page-by-page review of DataCore against the kit (it covered about 59 %; these close the gaps every page shares). All framework-free: navigation goes through an `onNavigate(url, "push" | "replace")` callback, every string is a prop.
  - `page-header`: breadcrumb above, one h1 and a line, `MetaPill` facts (a status pill takes a tone), actions at the right.
  - `chip-group`: one choice among several with counts; folds after `max` (the selected chip stays); chips with `href` are links with `aria-current`, for saved views and filters that work without JavaScript.
  - `filter-form`: filters kept in the URL. A GET form that applies itself after typing stops or at once on a pick, resets the page, makes a pick a history entry and a run of typing one entry; works with Radix Select and Checkbox. `filterUrl()` is exported.
  - `search-field`: the tool's one search box; `/` focuses it (not while typing elsewhere), Enter opens the results page, and on that page (`live`) it mirrors `?q=` and applies as you type. Built on `input-group`.
  - `theme-toggle`: light, match the system, dark; nothing selected until the stored choice is known.
  - `route-progress`: a thin blue bar while the next page loads, after 300 ms, never at the end, gives up after 10 s; still under reduced motion.
### Fixed
- One icon per meaning. The dock had three icons (`Home`, `RotateCcw`, `Radio`) and is now `ChargingDock` everywhere; retry was `RefreshCw` or `RotateCw` and is `RotateCw`; filters were `Filter`, `ListFilter` or `SlidersHorizontal` and are `SlidersHorizontal`; failed was `CircleX` in toasts and `CircleAlert` elsewhere and is `CircleAlert`; the critical marker is `OctagonAlert` like the alarm. Deprecated Lucide aliases (`Home`, `MoreHorizontal`, `AlertCircle`) are gone. Re-install `data-catalog`, `list-detail`, `map-workspace`, `sheet-robot-detail`, `status-pages`, `stop-button` and `toast`.
- Docs sidebar: group names (Actions, Inputs…) were grey like the pages under them and only a size smaller, so the groups ran together. Group names are now in ink and bold, and a hairline separates the groups.
- **`copy-button` works over plain HTTP.** It only used the Clipboard API, which browsers offer on HTTPS and localhost alone, and swallowed the error, so on a LAN tool served over HTTP pressing it did nothing and said nothing. It now falls back to `execCommand("copy")`, says "Not copied" with an alert icon when both fail, and announces the result for icon buttons too. `copyText()` is exported. The docs site's copy buttons use it.
- **Home page copy.** "Colour means something is wrong" sat over a line that called blue normal; it now reads "Colour is for what needs someone" with the defined meaning of blue. "Dark by default … reads in sunlight" was not true (a dark screen is the harder one to read in sun) and is gone. The foundation cards said six type sizes and five radius steps; they say nine and six, the type preview reads the scale from the theme, and a unit test fails if a card's count stops matching the theme. "Color" is "Colour" like the rest of the prose. The footer no longer reports the body text size.
- Popover example "with form" used a native number input (the browser's own spinner, no unit, no range); it uses `NumberField` now. Lint rejects `<Input type="number">` and now also checks the examples (stories), where it found four more off-scale values (a 10 px label, 40 and 48 px gaps), all fixed.
- Nested corners follow the radius rule (outer = inner + padding) everywhere: items in panels with 8 px padding use radius 8, not 12 (`command`, `navigation-menu`, `scrollspy`, `list-detail`, `mission-schedule`). A new radius-2xs (4) keeps controls of 24 px and smaller square: the `checkbox` no longer reads as a radio button, and `kbd` and the `sortable` handle sit clear of the corner around them. `npm run check:radius` checks every docs page and block preview; it found 12 cases and now finds none.
- Docs home: the hero no longer frames the dock in a box of the same radius (24 inside 24, which the radius rule forbids); the readouts and the dock stand on the page.

### Changed
- **Warning and danger are told apart.** In light mode the two read as one colour to deutan eyes (ΔE 1.5) and were close even with full colour vision (8.7); they now differ by hue and lightness: ΔE 10.8 / 16.4 light, 21.6 / 28.8 dark. Light warning `#865900`, danger `#860012`; dark warning `#ffd663`, danger `#f75b6b`. Both reach 4.8:1 or more as text on every surface they sit on: the page, the card, a muted tile or a selected row, and their tint.
- **Blue is defined.** It marks a process someone is waiting on, with an end: a progress bar, a stage that is running, a command being sent. A thing's state (patrolling, docked, charging) is a shape and neutral text even while it is busy. The theme notes, the principles, the color and iconography pages and the component rules say the same thing now; a stale note (a switch that is on uses green) is gone.
- **Disabled keeps its words readable.** No more 50 % opacity, which washes text out in sunlight: controls with a surface (button, input, select, pickers, upload) turn into a grey field with readable muted text; items and icons (tabs, menu items, toggles, steppers' buttons, calendar days) use the solid disabled colour; the label of a disabled control turns muted. Only checkbox, radio, switch and slider marks still dim, and their labels stay readable. A loading button keeps its look: busy is not unavailable. Button and input rules: disabled says why.
- **Exits have their own curve.** `--ease-exit` (`cubic-bezier(0.3, 0, 1, 1)`) for disappear, sheets closing and collapse: what leaves speeds away instead of lingering. `--ease-standard` stays for arrivals and state changes.
- **Focus ring is the foreground colour** (white on dark, ink on light), no longer the in-progress blue: blue now means in progress and nothing else.
- **Chart palette moves off the status hues.** Series 1–4 are violet, teal, olive and magenta, between the status hues, so no series reads as info, success, warning or danger; series 5 is grey for "Other". Validated for colour-vision deficiency (worst adjacent ΔE 14.6 dark, 16.0 light) and 3:1 against the card.
- **Type scale is locked.** It gains 2xl (24/32, the number that leads a card) and 4xl (36/40, hero on phones), and Tailwind's other sizes are cleared, so an off-scale size produces nothing; lint reports 6xl–9xl.
- **`badge` and `icon-tile`: `tone="success"` is neutral.** A calm state is grey; green is kept for confirmations that come and go (Toast, Alert). The prop value still works.

## 0.9.1 · 2026-11-18

### Changed
- Docs site, no more card grids: the foundations and component groups are ruled sheets (cells split by hairlines, open at the sides, the specimen then its name), arriving as one piece; block types show a framed screenshot with plain text under it. The last eyebrow (on /blocks) is gone.
- Docs site, less template: the home page leads with a working emergency stop (stop, then slide to release, with the real shell components) beside the three rules it shows, instead of a screenshot; a Blocks section; no eyebrow labels above any page title and no section numbers; the install panel and lists are ruled rows instead of boxed cards. Selection, caret, scrollbars and native controls take the theme's colours.
- Docs site CSS: Tailwind reads only the folders that render (`app`, `registry`, `stories`, `site`, `lib`) instead of the whole repo, so classes from READMEs, the built registry JSON and agent skills no longer ship. 94.4 KB → 87.5 KB (15.9 KB gzipped), no visual change.

### Added
- Agent skills for design work, installed for the project: `impeccable` (critique, audit and polish against an anti-pattern detector) and `stageshow` (faux product UI and animated demos for the home page). Pinned in `skills-lock.json`; restore with `npx skills experimental_install`.

## 0.9.0 · 2026-11-18

### Added
- `item`: a general-purpose row (media, title, description, actions) in default, outline and muted, md and sm; only a link draws the hover fill. Header and footer lines for card-like rows.
- `icon-tile`: one surface and size for icons in rows, cards and empty states: outline, muted, raised, soft and solid, sm to xl, square or circle, with a status dot. Solid danger stays on its tint.
- `kbd` and `KbdGroup`: keys and chords for shortcuts and instructions; adapts inside a tooltip.
- `button-group`: buttons, fields and menus joined into one strip (split button, stepper, pagination, search with scope), horizontal or vertical, with a text cell and a separator for filled buttons.
- `scroll-area`: a bounded, themed scroll region, vertical, horizontal or both, with fading edges; focusable for the keyboard.
- `toggle-group`: single or multiple toggles, joined or spaced, outline or ghost, horizontal or vertical. On is inverted.
- `autocomplete`: a text field that suggests as you type (WAI-ARIA combobox): filtering, groups with labels, disabled options, clear and show-all buttons, server search with a loading state, sm and md.
- `input-otp`: one-time codes and PINs, one 44 px box per character, with separators, paste and SMS autofill (input-otp).
- `phone-input`: country plus number, formatted as you type and stored as E.164; `isPhoneValid` for validation (libphonenumber-js).
- `calendar`: single, multiple or range, one or two months, disabled days, week numbers, month and year dropdowns, event dots (react-day-picker).
- `date-selector`: `DatePicker` and `DateRangePicker`, fields that open the calendar, with presets, clear and Field wiring.
- `time-picker`: `TimePicker` (slots in a popover, with step, bounds and taken slots) and `TimeInput` (typed: 930, 9:30, 21.30, 9:30 pm), on a 24-hour value.
- `data-grid`: a TanStack Table grid with sorting and column menus (sort, pin, hide), pagination, row selection with a bulk bar, column visibility, pinned and resizable columns, expandable rows, totals footer, sticky header, loading and empty states, density and striped / bordered / borderless variants, and virtual rows for thousands of records.
- `sortable`: reorderable lists and grids by handle, touch or keyboard, with spoken moves (dnd-kit).
- `resizable`: horizontal, vertical, nested and collapsible panels with an optional grip (react-resizable-panels).
- `file-upload`: a drop zone that is also a button; checks type, size and count and reports what it refused.
- `attachment`: a file as a row, chip or image tile with progress, error and Retry, Download and Remove.
- `file-type`: file icons from a name or extension, including robot formats (mcap, bag, db3, pgm, pcd, urdf, onnx).
- `stepper`: done, current, upcoming and error steps, horizontal or vertical (with the current step's content), optional steps, sm and md, clicking back to finished steps, and `StepperCompact` for phones. The current step is the neutral primary.
- `timeline`: events with a neutral dot, a status glyph or an icon; vertical, alternate or horizontal, dense, grouped by day.
- `scrollspy`: an On this page rail or pills that follow the reader through a page or a scroll area, and the `useScrollspy` hook.
- `navigation-menu`: a site's top navigation with panels of links and cards, a shared animated panel or one per trigger (Radix).
- `questionnaire`: choice, multiple choice (with a limit), scale and text questions, one per page with progress or all on one form, required checks without a shake, and a review page with Edit.
- `trace`: the steps of a run (a mission, an agent's tool calls, a rollout, a CI run, an audit trail) with status, duration, meta and time; steps open to show input, output, raw errors or nested steps; a waterfall bar; a header with counts; dense.
- `marker`: labelled lines across a log (a new day, an operator takeover, an e-stop, unread) and `MarkerRow`, one dense log line with a status glyph, monospace detail and time.

### Changed
- More examples for the existing Inputs: textarea, checkbox, radio group, switch, select, slider, label, input group, number field, field and choice field.
- More examples for Chart (stacked, horizontal, threshold line, step line, small multiples, no data), Command (status, no results, multi-select, nested pages, loading, recent) and Empty state (first run, filtered, no permission, offline, compact).
- `command`: CommandEmpty is a disabled option, so a list with no matches is never an empty listbox and screen readers read the message; it also holds a loading line.
- Accordion and Collapsible content share the expand and collapse animations.
- More examples, so every component has 6–8 and the complex ones 12 or more: pagination, number field, scroll area, scrollspy, attachment and breadcrumb; navigation menu, sortable, file upload, autocomplete, questionnaire, calendar, date selector, stepper, command and chart.
- `input-group` (and NumberField, which uses it): disabled is a muted surface instead of 50 % opacity, so a unit or prefix stays readable. A disabled stepper step is a muted disc, not a faded row, and is announced as unavailable.
- Docs site: sections below the home hero (and component page examples) rise into place as they scroll in and back out as they leave, tied to the scroll position in CSS. Sections already on screen at load move too, so the hero is no longer the only thing that moves; browsers without scroll timelines keep the one-time reveal, and reduced motion shows everything at rest.
- Charts blocks (21): line (telemetry with range and table view, against a limit, this period against the last), area (battery over a shift, fleet by state, progress to a target), bar (grouped, ranked, stacked, above and below plan), sparkline (robot list, metric tiles, table column), status tracker (30-day uptime, run history, rollout stages), radial (battery rings, progress to a goal, capacity) and heatmap (time of week, zones by time of day). Normal stays neutral; colour is for series identity or for what is abnormal.
- Application blocks (18): a phone shell with tab dock; stats as levels and as KPIs with a site and range filter; site and mission cards; passkey sign-in and accepting an invitation; a notification matrix and API keys (secret shown once); and four new types: Dialog (confirm a deletion, a short form, share), Sheet (robot detail panel, filters with a result count), Timeline (robot activity, audit history) and Wizard (add a robot with a live self-check, import a CSV).
- Solutions blocks (12): a mission schedule in Fleet operations; invitations and an audit log in Users and access; and four new types: Incidents (queue, one incident with updates), Maintenance (service due by hours run, a work order with sign-off), Firmware rollout (plan with stages and gates, a rollout in progress) and AI agents (runs, one run as a trace, a proposal waiting for approval).
- README lists every component and block by group and type, and how AI agents read the kit (llms.txt, Markdown twins, agent skill, MCP). Site description, social card line and keywords cover blocks, charts and agents. Visual baselines are accepted on `dev`, then `ci` is run by hand.
- MCP `search` ranks by how many of the query's words an item matches, then components before blocks: "battery level" finds Meter before the charts that show a battery.
- `switch`: the description no longer says on is success green; it is the primary colour, as it has been since 0.8.
- Docs site: Blocks are organised like Components. Three groups (Application, Charts, Solutions), a page per type that shows all its blocks with preview, code and install, and a sidebar that lists each type's blocks. Old block URLs redirect to their place on the type page; llms.txt lists blocks by group and type. "Built from" links to blocks as well as components.
- `app-shell`, `top-bar-shell`: the account button's name includes the initials it shows ("Mei Lin, ML, account menu"), so people using speech input can say what they see.
- Docs site: links to a place on the same page (the examples list in the sidebar, the version link) scroll there smoothly instead of jumping; instant under reduced motion, and a new page still opens at the top.
- Everything that comes also goes: the data grid's selection bar and expanded rows, a vertical stepper's step content, questionnaire pages (the question leaves before the next arrives) and attachments (`leaving` and `onLeft`, with usePresenceList) now have an exit as well as an entrance.
- Component pages: examples, usage rules, keys and changelog arrive as they scroll in. Whatever is on screen at load renders at once, and nothing is hidden without JavaScript.
- More examples for Breadcrumb (icon, collapsed levels, switcher, truncation), Sheet (navigation drawer, bottom actions, edit form), Toast (undo, failure with retry, title only, queue) and Label (optional, info tooltip, inline, disabled).
- More examples for the existing Actions and Display components: toggle, segmented control, copy button, badge, avatar, card, separator, progress, spinner, meter, description list, status glyph, status eyebrow and skeleton now show 4 to 8 real uses each.
- Story checks run the page clock past timed UI (the loading spinner, presence timers) before the screenshot, so visual baselines no longer depend on machine speed.

## 0.8.0 · 2026-11-17

### Added
- **MCP server** at `/mcp` (Streamable HTTP, stateless, read-only): `search`, `get_item`, `get_install_command`, `get_design_language`, `get_checklist`, answered from the same data as the pages and their twins. Connect: `claude mcp add --transport http syncrobotic https://syncai-lib-designsystem.vercel.app/mcp`.
- `meter`: a level in a known range (battery, storage), neutral until it crosses `low` or `critical`; `inline` for table cells. role="meter".
- `pagination`: the range (1–10 of 48) with previous / next, or numbered pages with gaps.
- `breadcrumb`: links to the levels above, the current page last; AppShell takes it as `breadcrumb`, with the title as the current page.
- `description-list`: label and value pairs, plain or as tiles.
- `choice-field` (ChoiceField, FieldSet): a checkbox, radio or switch as a whole 44 px row with label, description and count; a legend and one note line for the group.
- `copy-button`: copies and confirms in place, the icon swapping to a check for 1.5 s.
- `badge` › CountBadge: the one way to draw a count, danger on its tint or neutral, 99+.
- `use-presence`: keeps an element or list items on screen while they leave.

### Changed
- **Links are foreground with an underline**, not blue (`button` link variant, docs links): blue means in progress. The focus ring stays blue and now appears in that colour at once (it faded from the text colour on elements with `transition-colors`).
- **The home page is never blank without JavaScript**: the arrival movement is CSS; sections below the screen wait and play as they scroll in, everything else renders visible.
- `app-shell` hides the environment badge below 640 px; `console-overview` and `event-log` show their action as an icon on phones, so the title is not cut. Home: Charts card has an exhibit and the grid fills its rows; token tables wrap their last column; a component page skips the intro line when it repeats the description.
- **Hydration error #418 fixed** (intermittent, on most docs pages): the root layout wrote its own `<head>` for the theme script, and React sometimes hydrated `<body>` against Next's hidden metadata wrapper. The script now runs first thing in `<body>`, still before anything paints. 100 loads, 0 errors (was about 1 in 5).
- Review pass (ui-ux-pro-max): `dock` tabs put the label under the icon below 384 px so four fit a 360 px phone, and action labels wrap; `switch` has a 44 px hit area and is the primary colour when on (was green; a setting being on is a selection, not a status); `table` scroll container is focusable; `fleet-table` names are 44 px targets; `map-workspace` markers use the status shapes; previews no longer nest two `<main>`; `/docs` redirects to the foundations and unknown URLs get the kit's 404; normal states in the docs examples are neutral; the Motion page's looping "don't" stops under reduced motion.
- **Icon to label is 8 px everywhere** (`gap-2`): segmented control, table sort, field and choice notes, alert, alarm, toast, command, dock, island, status eyebrow, loading line, breadcrumb, app-shell nav and search scope, and the blocks that set their own. The Spacing foundation said 4; it now says 4 is for text to text and inside the 24 px Badge. `lint:motion` fails an icon row with a 4 or 12 px gap.
- `status-pages` redone: centred on both axes (it read off-balance left-aligned in a centred column); `fill="parent"` sits in an app shell's content; the Blocks page shows the four states side by side.
- `app-shell`: one gutter and one inset, panels 8 px apart and from the edge with 16 px inside each (24 px inside and 16 px outside read unbalanced).
- **Every exit is animated**: cleared alarms, island notices and the island alarm, finished governance tasks, the settings save bar and fixed form errors now leave with the disappear movement instead of vanishing.
- `field` / `select`: a Select inside a Field is labelled, described and marked invalid through its trigger (`useField`).
- `table`: sortable headers (`sort`, `onSort`) with aria-sort and an arrow.
- Blocks use them instead of hand-built copies: battery Meters in the fleet table, list and detail, and map; Pagination in the fleet table; Breadcrumb, CopyButton and DescriptionList in the dataset page; FieldSets of ChoiceFields as catalog filters and settings switches; Selects in Fields in the mission form, invitations and settings; CountBadge in the app shell, dock and island.

## 0.7.0 · 2026-11-17

### Added
- `input-group`: an icon, a unit or a button (clear, show password) inside the input's edge. The group draws the field, focus and error, so addons of any width fit; a Field around it labels the text box inside.
- `number-field`: a number with a range, a step and a unit (speed limits, thresholds, intervals). Typing is never blocked; the value is kept in range on blur. 44 px buttons; ↑↓, Shift, PageUp/PageDown, Home/End; a spinbutton that reads its unit.
- `command`: a filterable list and the ⌘K palette. AppShell `search` puts a field with a scope in the top bar that opens it.
- `chart`: line, area and bar charts on Recharts in the categorical palette, with a crosshair tooltip, a legend and a table view.
- `top-bar-shell`: the frame without a sidebar; its top bar gathers into a floating panel as the page scrolls.
- Every component page opens with what the component is, when to use it, and when to use something else.

### Changed
- **Errors grow in, never shake.** `field` 0.7.0: the message line grows open (height at --motion-base) and the error appears with an icon, so it never relies on colour alone; an error replacing a hint keeps the height. `input`, `textarea`, `select` 0.7.0: the error edge is 2 px and transitions at --motion-fast.
- `field` 0.7.0: a control that brings its own id keeps it, and the label follows (labels were lost before).

### App shell
- Inset layout by default: sidebar, top bar and content are separate panels 8 px apart and from the edge, 16 px inside each, top rows level. Below 1280 px the sidebar is a 72 px rail with the logo, opening over the content on hover or tap; the logo, icons and avatar hold the rail's centre line; a group's name gives way to a short line on the rail; the pin icon is filled when the sidebar is kept open. The user menu sits at the foot (44 px as a rail, 56 px open). Footer slot.

### Design-language pass (audit against the foundations)
- **Touch**: compact controls (`--h-sm`, 36 px) are for a mouse only; on touch screens the token is 44 px, so the island, the dock and phone layouts never go below a finger. Written into Accessibility › Target size.
- **Selected vs hover**: the current page in navigation is `--muted` with weight; hover is `--accent`. Inverted is for segmented control and toggle.
- **Motion**: every duration token travels with `--ease-standard` (lint); only the Spinner loops, and it stops under reduced motion (lint); radio and checkbox marks fade in; the sheet's scrim leaves with the panel; the app-shell frame resizes at `--motion-sheet`; chart marks no longer run Recharts' own timing, the chart fades in.
- **Radius**: menu and select items, alarm and island buttons and the dialog close are concentric with their containers.
- **Icons**: 16, 20 or 24 px with a 2 px stroke (lint).
- **One search field**: the shell, fleet table, list and detail, event log and data catalog all use InputGroup.
- **Colour**: counts are danger text on its tint everywhere; licence tiers are outline tags; the dock's destructive action is an outline.

### Fixed
- `use-slide-release` 0.7.0 (behind `slide-to-release`): the thumb follows the finger 1:1. The travel was measured from the thumb's current position, so it shrank mid-drag and the thumb outran the finger and released on its own.

## 0.6.0 · 2026-11-17

### Added
- **App shells for internal tools**, on the Blocks page with desktop, tablet and phone previews and the code, each installable with `npx shadcn add`:
  - `app-shell`: the frame. Collapsible sidebar (a drawer on phones), top bar with title, environment (production in red), search and user; `linkAs` takes your router's link; `bleed` for maps and video.
  - `console-overview`: fleet numbers, the robot table and the alarm list on one screen.
  - `list-detail`: filterable robot list and a detail pane; on phones the detail replaces the list.
  - `event-log`: time, level and text filters, an event table, one event in a side sheet.
  - `map-workspace`: the site map edge to edge with floating trays for the selected robot, the top alarm and the emergency stop.
  Every shell ships with sample data, so a prototype is one install and a data swap.

### Changed
- `sheet` 0.6.0: `side="left"` for navigation drawers.
- **Calmer colour.** A design review found the kit too colourful: every status coloured, alarm rows filled with tint, decorative swatches. Colour is now for what is abnormal:
  - `syncrobotic-theme` 0.6.0: status hues muted in both modes (contrast still ≥ 4.5:1 on every surface).
  - `status-glyph` 0.6.0: in progress and normal are shape + text colour; only warning, danger and offline are coloured. `InlineStatus` and `StatusEyebrow` follow.
  - `alarm`, `island` 0.6.0: only critical unacknowledged alarms are tinted; Acknowledge is an outline button, so a screen keeps one primary action.
  - `stats-cards` 0.6.0: sparklines neutral; only a change for the worse is coloured.
  - Docs site: a real product screen replaces the swatch collage on the home page; no dot grid behind examples; plain eyebrows; new Color rule "Colour is for what is abnormal".
- **Motion in every component.** The motion language was applied on the docs site but not in the components. Now: overlays (dialog, alert dialog, popover, dropdown menu, select, tooltip) appear and disappear; sheets slide from their edge and their scrim fades; accordion content expands; tab panels, alerts, alarms and island notices appear; field errors appear where the hint was; buttons, toggles, segments, the stop button, the dock, island zones and list rows press. All from theme tokens (`animate-*`, `press`), all off under reduced motion. `npm run lint:motion` (CI) fails a component that skips them or hard-codes timing.
- **Data tool blocks**, after DataCore, on the same shell: `data-catalog` (filters by tier, use and task; drawer on phones; sort; only restricted tiers coloured), `dataset-detail` (release verdict, open issues, counts and splits, annotated browse grid with layer toggles, lineage, compliance), `governance-todo` (what needs a maintainer or compliance reviewer, most blocking first).
- **Form and settings blocks**: `settings-page` (switches apply at once, a save bar appears only for unsaved text changes, danger zone confirms the consequence), `record-form` (one column, errors on submit with focus on the first), `users-roles` (role in place, invite dialog, remove with undo).
- **Sign-in and state blocks**: `sign-in` (company SSO first, email link fallback), `status-pages` (not found, no access, error with a reference, offline that says the stop still works, loading with only unknown values breathing). Never a dead end.
- Home page: Foundations as a bento grid (Principles leads, the rest in pairs and threes); cards lift their exhibit 2 px and show an arrow on hover at --motion-fast, no travel under reduced motion.
- `toggle` (new): an on/off button for a layer or option, inverted when on.
- Block previews follow the block's height at each device width, so nothing overflows or is cut off; app shells keep a screen height. Thumbnails on the Blocks page scale to the card width.

## 0.5.0 · 2026-11-17

### Added
- **Per-item versions.** Every registry item has `meta.version` and `meta.changelog` in `registry.json`, and every file it installs starts with a header naming the item and version (`// @syncrobotic/button v0.5.0 · update: …`), so a project can see what it has. All items start at 0.5.0.
- `npm run lint:versions` (in CI) fails when an item's files change without a version bump and a changelog line; `npm run versions` writes the headers and `registry/versions.lock.json`.
- **Design tokens as DTCG JSON**: `core.tokens.json`, `color.light.tokens.json` and `color.dark.tokens.json`, generated from the CSS theme (`npm run tokens`), checked in CI (`npm run lint:dtcg`) and served at `/tokens/…`.
- Docs: Design tokens (files, Figma via Tokens Studio, Style Dictionary for native apps) and Versions and upgrades (rules, steps, every item's current version). Component pages show their version and changelog.

### Changed
- Installed files now start with the version header. Re-installing any item adds it; nothing else in the files changed.

## 0.4.0 · 2026-11-17

### Added
- **Alarms foundation** (`/docs/foundations/alarms`), after ISA-18.2 and IEC 62682: which surface a message belongs on (emergency stop, alarm, alert, toast), three priorities with their own shape, colour and word, the acknowledge/clear lifecycle, sound and haptics per priority, and flood limits.
- `alarm`: `Alarm`, `AlarmList` and `sortAlarms`. Unacknowledged alarms sort first, then by priority, then newest; new critical alarms are announced assertively to screen readers, others politely. Every string can be replaced through `labels`.
- `toast`: `toast()` from anywhere plus `<Toaster />` once at the root. 4 s, 8 s with an action, failures until dismissed; at most three on screen, and a failure is never pushed out first. Same timings as the island's notices.
- Theme: `animate-appear` and `animate-disappear`, the motion patterns as CSS. Under reduced motion, appear fades without rising.
- `IslandAlarm`, `topAlarm` and `alarmEdge`: the control app's island shows the most urgent unacknowledged alarm from the same data as `AlarmList`, and the tray edge takes its colour. Re-install `island` (it now depends on `alarm`).
- Feedback group on the docs site: alarm, alert, toast. Stories that render a stateful helper now show the helper's source in the code tab.
- ROADMAP.md: how work is chosen, reviewed and released, and the plan to 1.0. Issue templates for proposals and bugs, and a pull request checklist.

## 0.3.0 · 2026-11-17

### Added
- **Motion patterns.** The Motion foundation now defines five movements, each tied to a state change and a duration token: appear (200 ms, rise 8 px), sheet (320 ms), press (120 ms, scale 0.97), swap (120 ms) and move (200 ms, a selection travelling to its new place). Live demos on the Motion page.
- Spacing utilities for page sections: `pt-section`, `gap-section-sm` and so on, from `--space-section` and `--space-section-sm`. Re-install `syncrobotic-theme` to use them.
- Radius rules: `rounded-full` is only for things that are round by nature (avatars, dots, switch, radio, slider and progress tracks, count badges, the sheet grabber). The brand mark is exempt from the radius scale; icon tiles take a 22 % corner.

### Changed
- The token lint (`npm run lint:tokens`) now checks the docs site as well as the registry, and fails on `rounded-full` outside its uses. The site had 90 violations: off-scale spacing, arbitrary font sizes, raw colours. All fixed; social images and the web manifest now read colours from the theme file.
- Docs site: pages and tab panels appear, the current-page and area markers slide, the mobile menu opens as a sheet, controls press, the copy and theme icons swap, and block previews resize smoothly between device widths. All of it honours reduced motion.
- Favicon: the official mark on a dark tile with a 22 % corner.

## 0.2.0 · 2026-11-16

### Fixed
- **Emergency stop works without a pointer.** `StopButton` listened to pointer events only, so Enter, Space, screen readers and switch control could not stop the robot. Enter or Space now stops, holding either for 2 s stops all, and an assistive-technology click stops. A key press followed by the browser's synthetic click stops once, not twice. Re-install `stop-button` and `use-long-press`.
- **Slide to release reads the live position.** On pointer up, `useSlideRelease` decided from the last rendered position, which could lag a fast flick. It now uses the position the pointer reached. Re-install `use-slide-release`.
- Slider thumbs take their accessible name from the slider label.
- Light `--warning` `#b45309` → `#a14a07` for AA contrast on the page background.

### Changed
- Repository layout: robot shell components moved from `registry/syncrobotic/blocks/` to `registry/syncrobotic/shell/`, and blocks from `registry/syncrobotic/sections/` to `registry/syncrobotic/blocks/`. Item names and install commands are unchanged.
- `status-glyph` exports `toneSubtle` next to `toneText`, so every status display maps a tone to the same classes.

### Added
- Blocks: `stats-cards`, `fleet-table`, `robot-status-card`, `marketing-hero`.
- 28 general components on Radix UI, with 2–7 examples each.
- Marketing-only tokens: `--text-5xl`, `--space-section`, `--space-section-sm`.
- CI gates: registry dependency check, behaviour tests for the stop and release interactions, axe on every story (dark and light), and an end-to-end install of every item into a fresh Next.js app.

## 0.1.0 · 2026-11-16

First release: theme tokens, robot shell components (emergency stop, slide to release, dock, dynamic island, list, status, skeleton), Storybook, token lint.
