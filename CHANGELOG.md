# Changelog

Components install as source, so a project keeps the version it installed. Re-run `npx shadcn add @syncrobotic/<item> --overwrite` to take a newer one, and read the entries below first.

## Unreleased

### Fixed
- **`progress`**: `tone="success"` is neutral. A finished bar stays grey; green is a confirmation that comes and goes, not a state that stays.
- **`breadcrumb`**: a crumb link is as tall as a compact control (36 px with a mouse, 44 px on touch); it was 20 px, too small to tap.
- Docs site:
  - The theme menu has three choices, Light, Match system and Dark, and matches the system by default (it was a two-way switch, light by default). It follows the system live while that choice is on.
  - Sections no longer rise 24 px and run back as you scroll. They arrive once with the theme's appear movement (8 px), as the motion rules ask.
  - Calm things on the foundation pages are no longer green: Do examples, accessibility passes and the checklist, list dots, a good-signal bar.
  - Touch targets reach 44 px on phones: the logo, a block's Open link, "Built from" chips, the data-visualisation item links, the Installation guide link.
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
