# Changelog

Components install as source, so a project keeps the version it installed. Re-run `npx shadcn add @syncrobotic/<item> --overwrite` to take a newer one, and read the entries below first.

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
