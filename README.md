<img src="public/brand/syncrobotic-mark.svg" alt="SYNCROBOTIC" width="56" />

# SYNCROBOTIC Design System

**A robotics UI kit for React.** Interfaces for the people who run robots: the design language behind every SYNCROBOTIC product, with design tokens, 122 React components, 59 blocks and 18 patterns, shipped as a [shadcn/ui](https://ui.shadcn.com) registry for Tailwind CSS v4. Components install into your project as source you can read and change.

For robot apps it has what general UI kits leave out: an emergency stop, a fail-safe teleoperation pad, a robot map with ROS occupancy grids, laser scans and mission editing, a live camera feed, a LiDAR point cloud viewer, a URDF robot model, joint states and an alarm system. See [Robotics UI kit](https://design-system.syncrobotic.me/docs/robotics).

[Documentation](https://design-system.syncrobotic.me) · [Components](https://design-system.syncrobotic.me/docs/components/button) · [Blocks](https://design-system.syncrobotic.me/blocks) · [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md)

[![CI](https://github.com/Syncrobotic/SyncAI-Lib-DesignSystem/actions/workflows/ci.yml/badge.svg)](https://github.com/Syncrobotic/SyncAI-Lib-DesignSystem/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Syncrobotic/SyncAI-Lib-DesignSystem)](https://github.com/Syncrobotic/SyncAI-Lib-DesignSystem/releases)

![The docs site's home page: a working emergency stop beside the three rules it demonstrates](https://design-system.syncrobotic.me/opengraph-image)

> **Source-available, not open source.** This repository is public so it can be read. Using, copying or redistributing it needs a written agreement with SYNCROBOTIC; see [LICENSE](LICENSE).

## Built for one job

Operators control fleets of robots from a console in a control room and from a phone outdoors, one-handed, sometimes in a hurry. Every rule in the system follows from that.

- **Solid red means stop.** The emergency stop is the only solid red on any screen. One touch stops, holding stops every robot, and release takes a deliberate slide. Everything else that is wrong is a tint, a shape and a word.
- **Colour is for what needs someone.** A calm fleet is grey, busy or idle. Amber needs attention, red needs someone now: stopped, failed. Blue marks only a process someone is waiting on.
- **Made for one thumb, outdoors.** At least 44 px on touch (36 with a mouse only), and every status a shape and a word, colour only when it is abnormal, so it reads in glare and without colour vision.
- **UI only.** Components never send commands. The app sends, waits for the robot, falls back to Bluetooth and passes the result back as `state`, so every component can be tested on its own.

## Quick start

In a React or Next.js project with Tailwind CSS v4:

1. Run `npx shadcn init`, then add the registry to `components.json`:

   ```json
   "registries": {
     "@syncrobotic": { "url": "https://design-system.syncrobotic.me/r/{name}.json" }
   }
   ```

2. Install the theme. Import it after Tailwind in `globals.css` (`@import "../styles/syncrobotic-theme.css";`) and delete the `:root`, `.dark` and `@theme inline` blocks that `shadcn init` generated:

   ```bash
   npx shadcn add @syncrobotic/syncrobotic-theme
   ```

3. Install what you need, a component or a whole screen:

   ```bash
   npx shadcn add @syncrobotic/button @syncrobotic/data-grid
   npx shadcn add @syncrobotic/console-overview
   ```

Light is the default, because it reads in daylight and glare; add `class="dark"` to `<html>` for control rooms and night shifts, `data-contrast="more"` for bright sun and low vision (7:1 text, in light or dark), and `data-density="glove"` or `"compact"` for gloved field work or a mouse-driven console. Copy is English; every visible and screen-reader string is a prop, so it localises. The [installation guide](https://design-system.syncrobotic.me/docs/installation) covers the details. On Next.js, the [Next.js guide](https://design-system.syncrobotic.me/docs/nextjs) covers server and client components, the theme without a flash, `next/link` and the app shell in a layout.

## What's inside

| | |
| --- | --- |
| **Foundations** | Principles, colour, typography, spacing, radius, elevation, motion, iconography, accessibility, alarms and data visualisation, each with its tokens and the rules for using them, plus an [icon set](https://design-system.syncrobotic.me/icons) that gives each icon one meaning, with robot icons Lucide lacks drawn to match. Tokens also ship as [DTCG JSON](public/tokens) for design tools, in light, dark and high contrast. |
| **122 components** | General UI on Radix primitives, a charts component on Recharts, building blocks for data tools (filters, data grid, text diff, image grid), and the robot shell: emergency stop, slide to release, dock and dynamic island. |
| **59 blocks, 18 patterns** | Blocks are whole screens and sections in two groups: Application (shells, including an action-rail page, stats, cards, sign-in, settings, forms, wizards) and Solutions for robot operations (fleet operations, data operations with a keyboard-first review queue, users and access, incidents, maintenance, firmware rollout, AI agents). Patterns are ready-made uses of one component (charts, timelines, dialogs, sheets) and live on that component's page. Both install the same way. |

<details>
<summary>Every component, by group</summary>

<!-- catalog:components -->
| Group | Components |
| --- | --- |
| Actions | `button`, `segmented-control`, `toggle`, `copy-button`, `button-group`, `toggle-group`, `theme-toggle` |
| Inputs | `input`, `input-group`, `number-field`, `textarea`, `label`, `field`, `form`, `checkbox`, `radio-group`, `switch`, `choice-field`, `select`, `slider`, `autocomplete`, `input-otp`, `phone-input`, `calendar`, `date-selector`, `time-picker`, `questionnaire` |
| Robotics | `stop-button`, `slide-to-release`, `dock`, `island`, `tray`, `teleop-pad`, `robot-map`, `geo-map`, `waypoint-editor`, `camera-feed`, `camera-wall`, `point-cloud`, `robot-model`, `attitude`, `joint-state`, `diagnostics`, `viewport-overlay` |
| Lists & tables | `table`, `responsive-table`, `data-grid`, `list`, `item`, `description-list`, `tree`, `sortable`, `log-viewer` |
| Status & values | `status-glyph`, `status-eyebrow`, `badge`, `tier-badge`, `meter`, `metric-card` |
| Search & filters | `search-field`, `filters`, `filter-form`, `chip-group`, `facets` |
| Data display | `code-block`, `avatar`, `text-diff`, `graph`, `icon-tile`, `kbd`, `code`, `streaming-text`, `timeline`, `trace`, `marker` |
| Charts | `chart`, `streaming-chart`, `share-bar`, `bar-list` |
| Media & files | `restricted-preview`, `thumbnail`, `image-grid`, `annotated-image`, `grounded-text`, `media-player`, `file-upload`, `attachment`, `file-type` |
| Feedback | `skeleton`, `spinner`, `progress`, `banner`, `alert`, `alarm`, `toast`, `empty-state`, `route-progress` |
| Navigation | `tabs`, `pagination`, `breadcrumb`, `accordion`, `collapsible`, `sidebar`, `load-more`, `stepper`, `scrollspy`, `navigation-menu` |
| Overlays | `dialog`, `alert-dialog`, `sheet`, `popover`, `hover-card`, `tooltip`, `dropdown-menu`, `context-menu`, `command` |
| Layout | `card`, `separator`, `scroll-area`, `page-header`, `section-header`, `resizable` |
| Hooks & libraries | `ros`, `use-long-press`, `use-slide-release`, `use-presence`, `use-debounce`, `use-ros`, `use-hotkeys`, `format-count`, `clock-time`, `feedback`, `use-now`, `use-reduced-motion` |
| Icons | `robot-icons` (robot icons Lucide lacks, drawn to match) |
<!-- /catalog:components -->

</details>

<details>
<summary>Every block and pattern, by group and type</summary>

<!-- catalog:blocks -->
| Group | Type | Blocks |
| --- | --- | --- |
| Application | App shell | `app-shell`, `top-bar-shell`, `action-rail-shell`, `app-shell-mobile-tabs` |
| Application | Stats | `stats-cards`, `sparkline-metric-tiles`, `stats-meters`, `stats-filtered` |
| Application | Data table | `fleet-table` |
| Application | Data visualisation | `sparkline-robot-list`, `sparkline-table`, `status-tracker-uptime`, `status-tracker-runs`, `status-tracker-rollout`, `radial-chart-battery`, `radial-chart-goal`, `radial-chart-capacity`, `heatmap-week-hours`, `heatmap-zones` |
| Application | Card | `robot-status-card`, `card-site`, `card-mission` |
| Application | Sign-in | `sign-in`, `auth-passkey`, `auth-invite`, `auth-2fa` |
| Application | Settings | `settings-page`, `settings-notifications`, `settings-api-keys`, `settings-billing`, `settings-webhooks`, `settings-sessions` |
| Application | Notifications | `notification-center` |
| Application | Form | `record-form` |
| Application | Empty and error states | `status-pages` |
| Application | Landing | `marketing-hero` |
| Application | Wizard | `wizard-commission`, `wizard-import` |
| Solutions | Fleet operations | `console-overview`, `map-workspace`, `list-detail`, `event-log`, `mission-schedule` |
| Solutions | Data operations | `data-catalog`, `dataset-detail`, `governance-todo`, `review-queue` |
| Solutions | Users and access | `users-roles`, `users-invitations`, `users-audit-log` |
| Solutions | Incidents | `incident-queue`, `incident-detail` |
| Solutions | Maintenance | `maintenance-due`, `maintenance-work-order` |
| Solutions | Firmware rollout | `rollout-overview`, `rollout-plan` |
| Solutions | AI agents | `agent-runs`, `agent-trace`, `agent-approval` |
| Patterns: Alert dialog | Confirm a destructive action | `dialog-confirm-destructive` |
| Patterns: Dialog | Form and share dialogs | `dialog-form`, `dialog-share` |
| Patterns: Sheet | Detail sheet | `sheet-robot-detail` |
| Patterns: Facets | Filters on a phone | `sheet-filters` |
| Patterns: Timeline | Activity and audit timelines | `timeline-activity`, `timeline-audit` |
| Patterns: Chart | Line chart | `line-chart-telemetry`, `line-chart-limit`, `line-chart-compare` |
| Patterns: Chart | Area chart | `area-chart-battery`, `area-chart-fleet-states`, `area-chart-cumulative` |
| Patterns: Chart | Bar chart | `bar-chart-missions`, `bar-chart-ranked`, `bar-chart-stacked`, `bar-chart-variance` |
| Patterns: Chart | Histogram | `histogram-battery` |
<!-- /catalog:blocks -->

</details>

## Quality you can rely on

The rules are not a style guide that drifts: checks enforce them. On every pull request: tokens, registry, rules, numbers, motion, versions, DTCG, types, tests, build. Before a release (pull requests into `stage`): axe and screenshots of every story.

- **Accessibility.** Before a release, every story, in dark and light, is checked with axe against WCAG 2.2 AA. Status colours are validated for colour-vision deficiency, and the warning and danger pair stays apart for deutan eyes.
- **Visual regression.** Before a release, every state of every component is a screenshot compared with its baseline in both themes; a change to how anything looks needs an approved new baseline.
- **Tokens only.** Lint rejects raw colours, arbitrary lengths, off-scale spacing, type sizes and weights, native number inputs (NumberField replaces them) and icons outside the icon set. A local check (`npm run check:radius`) walks the foundation, component and block pages for nested corners that break the radius rule.
- **Installs for real.** On a pull request that touches the registry, every item is installed into a fresh Next.js app, type-checked and built.
- **Versioned per item.** Each component carries its own version and changelog, so a team knows when to re-install. The [upgrading guide](https://design-system.syncrobotic.me/docs/upgrading) lists them.
- **Adoption you can measure.** `npm run adoption -- ../your-app` reads the version header of every installed file and lists each item, its version, the latest, how many minors behind it is and the changelog lines in between; `--github <org>` scans every repo of an organisation through the `gh` CLI, `--json` prints it for other tools.

## For AI agents

Coding agents can read the whole kit without scraping the site:

- **`/llms.txt`** lists every component and block with a one-line summary; **`/llms-full.txt`** is everything in one file: the design language, every block, and every component with when to use it.
- **Markdown twins.** Every component and block page has a Markdown version at its URL plus `.md`, for example `/docs/components/button.md`. A foundation page's twin carries the whole design language.
- **Agent skill.** `npx shadcn add @syncrobotic/agent-skill` installs the workflow and the design language into `.claude/skills/syncrobotic-ui/`.
- **MCP server** (read-only, no sign-in): `claude mcp add --transport http syncrobotic https://design-system.syncrobotic.me/mcp`. Tools: `search`, `get_item`, `get_install_command`, `get_design_language` and `get_checklist`.

## Contributing

Work happens in pull requests: `feat/*` → `dev` → `stage` → `main`, each step with CI green. [CONTRIBUTING.md](CONTRIBUTING.md) covers the setup, the checks, adding a component and how releases work; [ROADMAP.md](ROADMAP.md) covers how work is chosen.

## Known issues

- Installing two or more components that share `@syncrobotic/cn` prints "Circular dependency detected". The CLI is merging shared dependencies; the result is correct.
- The shadcn CLI fetches base colours from ui.shadcn.com during install, so the machine needs access to it.

## License

Copyright © 2026 SYNCROBOTIC. All rights reserved. Source-available for reading; see [LICENSE](LICENSE).
