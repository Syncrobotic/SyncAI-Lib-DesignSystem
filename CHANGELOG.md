# Changelog

Components install as source, so a project keeps the version it installed. Re-run `npx shadcn add @syncrobotic/<item> --overwrite` to take a newer one, and read the entries below first.

## 0.7.0 · 2026-11-17

### Added
- `input-group`: an icon, a unit or a button (clear, show password) inside the input's edge. The group draws the field, focus and error, so addons of any width fit; a Field around it labels the text box inside.
- `number-field`: a number with a range, a step and a unit (speed limits, thresholds, intervals). Typing is never blocked; the value is kept in range on blur. 44 px buttons; ↑↓, Shift, PageUp/PageDown, Home/End; a spinbutton that reads its unit.

### Changed
- **Errors grow in, never shake.** `field` 0.7.0: the message line grows open (height at --motion-base) and the error appears with an icon, so it never relies on colour alone; an error replacing a hint keeps the height. `input`, `textarea`, `select` 0.7.0: the error edge is 2 px and transitions at --motion-fast.
- `field` 0.7.0: a control that brings its own id keeps it, and the label follows (labels were lost before).

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
