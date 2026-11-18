# Changelog

Components install as source, so a project keeps the version it installed. Re-run `npx shadcn add @syncrobotic/<item> --overwrite` to take a newer one, and read the entries below first.

## Unreleased

Most items change in this release: re-install the theme and every component you use (`npx shadcn add @syncrobotic/<name> --overwrite`). Each item's changelog says what changed.


### Added
- **Building blocks for data tools**, from a page-by-page review of DataCore against the kit (it covered about 59 %; these close the gaps every page shares). All framework-free: navigation goes through an `onNavigate(url, "push" | "replace")` callback, every string is a prop.
  - `page-header`: breadcrumb above, one h1 and a line, `MetaPill` facts (a status pill takes a tone), actions at the right.
  - `chip-group`: one choice among several with counts; folds after `max` (the selected chip stays); chips with `href` are links with `aria-current`, for saved views and filters that work without JavaScript.
  - `filter-form`: filters kept in the URL. A GET form that applies itself after typing stops or at once on a pick, resets the page, makes a pick a history entry and a run of typing one entry; works with Radix Select and Checkbox. `filterUrl()` is exported.
  - `search-field`: the tool's one search box; `/` focuses it (not while typing elsewhere), Enter opens the results page, and on that page (`live`) it mirrors `?q=` and applies as you type. Built on `input-group`.
  - `theme-toggle`: light, match the system, dark; nothing selected until the stored choice is known.
  - `route-progress`: a thin blue bar while the next page loads, after 300 ms, never at the end, gives up after 10 s; still under reduced motion.
### Fixed
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
