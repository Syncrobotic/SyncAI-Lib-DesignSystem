# Changelog

Components install as source, so a project keeps the version it installed. Re-run `npx shadcn add @syncrobotic/<item> --overwrite` to take a newer one, and read the entries below first.

## 0.4.0 · 2026-11-17

### Added
- **Alarms foundation** (`/docs/foundations/alarms`), after ISA-18.2 and IEC 62682: which surface a message belongs on (emergency stop, alarm, alert, toast), three priorities with their own shape, colour and word, the acknowledge/clear lifecycle, sound and haptics per priority, and flood limits.
- `alarm`: `Alarm`, `AlarmList` and `sortAlarms`. Unacknowledged alarms sort first, then by priority, then newest; new critical alarms are announced assertively to screen readers, others politely. Every string can be replaced through `labels`.
- `toast`: `toast()` from anywhere plus `<Toaster />` once at the root. 4 s, 8 s with an action, failures until dismissed; at most three on screen, and a failure is never pushed out first. Same timings as the island's notices.
- Theme: `animate-appear` and `animate-disappear`, the motion patterns as CSS. Under reduced motion, appear fades without rising.
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
