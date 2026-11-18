<img src="public/brand/syncrobotic-mark.svg" alt="SYNCROBOTIC" width="56" />

# SYNCROBOTIC Design System

**Interfaces for the people who run robots.** The design language behind every SYNCROBOTIC product: design tokens, 81 React components and 69 ready-made blocks, shipped as a [shadcn/ui](https://ui.shadcn.com) registry for Tailwind CSS v4. Components install into your project as source you can read and change.

[Documentation](https://syncai-lib-designsystem.vercel.app) · [Components](https://syncai-lib-designsystem.vercel.app/docs/components/button) · [Blocks](https://syncai-lib-designsystem.vercel.app/blocks) · [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md)

[![CI](https://github.com/Syncrobotic/SyncAI-Lib-DesignSystem/actions/workflows/ci.yml/badge.svg)](https://github.com/Syncrobotic/SyncAI-Lib-DesignSystem/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Syncrobotic/SyncAI-Lib-DesignSystem)](https://github.com/Syncrobotic/SyncAI-Lib-DesignSystem/releases)

![The docs site's home page: a working emergency stop beside the three rules it demonstrates](https://syncai-lib-designsystem.vercel.app/opengraph-image)

> **Source-available, not open source.** This repository is public so it can be read. Using, copying or redistributing it needs a written agreement with SYNCROBOTIC; see [LICENSE](LICENSE).

## Built for one job

Operators control fleets of robots from a console in a control room and from a phone outdoors, one-handed, sometimes in a hurry. Every rule in the system follows from that.

- **Solid red means stop.** The emergency stop is the only solid red on any screen. One touch stops, holding stops every robot, and release takes a deliberate slide. Everything else that is wrong is a tint, a shape and a word.
- **Colour is for what needs someone.** A calm fleet is grey, busy or idle. Amber needs attention, red needs someone now, and blue marks only a process someone is waiting on.
- **Made for one thumb, outdoors.** 44 px touch targets, and every status as a shape and a word, so it reads in glare and without colour vision.
- **UI only.** Components never send commands. The app sends, waits for the robot, falls back to Bluetooth and passes the result back as `state`, so every component can be tested on its own.

## Quick start

In a React or Next.js project with Tailwind CSS v4:

1. Run `npx shadcn init`, then add the registry to `components.json`:

   ```json
   "registries": {
     "@syncrobotic": { "url": "https://syncai-lib-designsystem.vercel.app/r/{name}.json" }
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

Dark is the default (`<html class="dark">`). Copy is English; every visible and screen-reader string is a prop, so it localises. The [installation guide](https://syncai-lib-designsystem.vercel.app/docs/installation) covers the details.

## What's inside

| | |
| --- | --- |
| **Foundations** | Principles, colour, typography, spacing, radius, elevation, motion, iconography, accessibility and alarms, each with its tokens and the rules for using them, plus an [icon set](https://syncai-lib-designsystem.vercel.app/icons) that gives each icon one meaning, with robot icons Lucide lacks drawn to match. Tokens also ship as [DTCG JSON](public/tokens) for design tools. |
| **81 components** | General UI on Radix primitives, a charts component on Recharts, building blocks for data tools, and the robot shell: emergency stop, slide to release, dock and dynamic island. |
| **69 blocks** | Whole screens in three groups: Application (shells, stats, cards, sign-in, settings, forms, dialogs, sheets, timelines, wizards), Charts, and Solutions for robot operations (fleet operations, data operations, users and access, incidents, maintenance, firmware rollout, AI agents). |

<details>
<summary>Every component, by group</summary>

| Group | Components |
| --- | --- |
| Actions | `button`, `segmented-control`, `toggle`, `copy-button`, `button-group`, `toggle-group`, `theme-toggle` |
| Inputs | `input`, `input-group`, `number-field`, `textarea`, `label`, `field`, `checkbox`, `radio-group`, `switch`, `choice-field`, `select`, `slider`, `chip-group`, `filter-form`, `search-field`, `autocomplete`, `input-otp`, `phone-input`, `calendar`, `date-selector`, `time-picker`, `sortable`, `file-upload`, `questionnaire` |
| Icons | `robot-icons` |
| Display | `status-glyph`, `status-eyebrow`, `list`, `skeleton`, `spinner`, `badge`, `card`, `avatar`, `separator`, `progress`, `description-list`, `meter`, `empty-state`, `table`, `item`, `icon-tile`, `kbd`, `scroll-area`, `data-grid`, `resizable`, `attachment`, `file-type`, `timeline`, `trace`, `marker` |
| Charts | `chart` |
| Feedback | `alert`, `alarm`, `toast`, `route-progress` |
| Navigation | `tabs`, `pagination`, `breadcrumb`, `accordion`, `page-header`, `stepper`, `scrollspy`, `navigation-menu` |
| Overlays | `dialog`, `alert-dialog`, `sheet`, `popover`, `tooltip`, `dropdown-menu`, `command` |
| Robot shell | `tray`, `stop-button`, `slide-to-release`, `dock`, `island` |
| Hooks | `use-long-press`, `use-slide-release` |

</details>

<details>
<summary>Every block, by group and type</summary>

| Group | Type | Blocks |
| --- | --- | --- |
| Application | App shell | `app-shell`, `top-bar-shell`, `app-shell-mobile-tabs` |
| Application | Stats | `stats-cards`, `stats-meters`, `stats-filtered` |
| Application | Card | `robot-status-card`, `card-site`, `card-mission` |
| Application | Sign-in | `sign-in`, `auth-passkey`, `auth-invite` |
| Application | Settings | `settings-page`, `settings-notifications`, `settings-api-keys` |
| Application | Form | `record-form` |
| Application | Empty and error states | `status-pages` |
| Application | Landing | `marketing-hero` |
| Application | Dialog | `dialog-confirm-destructive`, `dialog-form`, `dialog-share` |
| Application | Sheet | `sheet-robot-detail`, `sheet-filters` |
| Application | Timeline | `timeline-activity`, `timeline-audit` |
| Application | Wizard | `wizard-commission`, `wizard-import` |
| Charts | Line chart | `line-chart-telemetry`, `line-chart-limit`, `line-chart-compare` |
| Charts | Area chart | `area-chart-battery`, `area-chart-fleet-states`, `area-chart-cumulative` |
| Charts | Bar chart | `bar-chart-missions`, `bar-chart-ranked`, `bar-chart-stacked`, `bar-chart-variance` |
| Charts | Sparkline | `sparkline-robot-list`, `sparkline-metric-tiles`, `sparkline-table` |
| Charts | Status tracker | `status-tracker-uptime`, `status-tracker-runs`, `status-tracker-rollout` |
| Charts | Radial chart | `radial-chart-battery`, `radial-chart-goal`, `radial-chart-capacity` |
| Charts | Heatmap | `heatmap-week-hours`, `heatmap-zones` |
| Solutions | Fleet operations | `console-overview`, `map-workspace`, `list-detail`, `event-log`, `fleet-table`, `mission-schedule` |
| Solutions | Data operations | `data-catalog`, `dataset-detail`, `governance-todo` |
| Solutions | Users and access | `users-roles`, `users-invitations`, `users-audit-log` |
| Solutions | Incidents | `incident-queue`, `incident-detail` |
| Solutions | Maintenance | `maintenance-due`, `maintenance-work-order` |
| Solutions | Firmware rollout | `rollout-overview`, `rollout-plan` |
| Solutions | AI agents | `agent-runs`, `agent-trace`, `agent-approval` |

</details>

## Quality you can rely on

The rules are not a style guide that drifts: CI enforces them on every change.

- **Accessibility.** Every story, in dark and light, is checked with axe against WCAG 2.2 AA. Status colours are validated for colour-vision deficiency, and the warning and danger pair stays apart for deutan eyes.
- **Visual regression.** Every state of every component is a screenshot compared with its baseline in both themes; a change to how anything looks needs an approved new baseline.
- **Tokens only.** Lint rejects raw colours, arbitrary lengths, off-scale spacing, type sizes and weights, native number inputs (NumberField replaces them) and icons outside the icon set. A check walks every page for nested corners that break the radius rule.
- **Installs for real.** Every registry item is installed into a fresh Next.js app, type-checked and built.
- **Versioned per item.** Each component carries its own version and changelog, so a team knows when to re-install. The [upgrading guide](https://syncai-lib-designsystem.vercel.app/docs/upgrading) lists them.

## For AI agents

Coding agents can read the whole kit without scraping the site:

- **`/llms.txt`** lists every component and block with a one-line summary; **`/llms-full.txt`** is everything in one file: the design language, every block, and every component with when to use it.
- **Markdown twins.** Every component, block and foundation page has a Markdown version at its URL plus `.md`, for example `/docs/components/button.md`.
- **Agent skill.** `npx shadcn add @syncrobotic/agent-skill` installs the workflow and the design language into `.claude/skills/syncrobotic-ui/`.
- **MCP server** (read-only, no sign-in): `claude mcp add --transport http syncrobotic https://syncai-lib-designsystem.vercel.app/mcp`. Tools: `search`, `get_item`, `get_install_command`, `get_design_language` and `get_checklist`.

## Contributing

Work happens in pull requests: `feat/*` → `dev` → `stage` → `main`, each step with CI green. [CONTRIBUTING.md](CONTRIBUTING.md) covers the setup, the checks, adding a component and how releases work; [ROADMAP.md](ROADMAP.md) covers how work is chosen.

## Known issues

- Installing two or more components that share `@syncrobotic/cn` prints "Circular dependency detected". The CLI is merging shared dependencies; the result is correct.
- The shadcn CLI fetches base colours from ui.shadcn.com during install, so the machine needs access to it.

## License

Copyright © 2026 SYNCROBOTIC. All rights reserved. Source-available for reading; see [LICENSE](LICENSE).
