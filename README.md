<img src="public/brand/syncrobotic-mark.svg" alt="SYNCROBOTIC" width="56" />

# SYNCROBOTIC Design System

**One design language for every SYNCROBOTIC product.** Colour, type, spacing, radius and motion tokens, 75 React components and 69 blocks, shipped as a [shadcn/ui](https://ui.shadcn.com) registry for Tailwind CSS v4.

Like [ReUI](https://reui.io), components install into your project as source code: you can read them, change them and keep them in step with the shadcn ecosystem.

- **Docs site:** [https://syncai-lib-designsystem.vercel.app](https://syncai-lib-designsystem.vercel.app) (Next.js app in `app/`, deployed on Vercel; open to anyone with the link, not indexed until open-sourced)
- **Registry:** `https://syncai-lib-designsystem.vercel.app/r/{name}.json`
- **Blocks:** [https://syncai-lib-designsystem.vercel.app/blocks](https://syncai-lib-designsystem.vercel.app/blocks): application screens, charts and whole robot-operations screens, each installable as source
- **For AI agents:** [`/llms.txt`](https://syncai-lib-designsystem.vercel.app/llms.txt), a Markdown twin of every page, an agent skill and a read-only MCP server (see [below](#for-ai-agents))
- **Workbench:** Storybook, with visual regression tests on every state

## Why

Operators control robots outdoors, one-handed and sometimes in a hurry. The system is built around that:

- **Solid red is for the emergency stop only.** One touch stops, holding stops every robot, release takes a deliberate slide.
- **Readable outdoors.** Dark by default, 44 px minimum touch targets, status as shape plus colour.
- **UI only.** Components never send commands. The app sends, waits for the robot, falls back to Bluetooth and passes the result back as `state`, so every component is testable on its own.

## Install

1. Run `npx shadcn init` in a React or Next.js project (Tailwind CSS v4).
2. Add the registry to `components.json`:

   ```json
   "registries": {
     "@syncrobotic": {
       "url": "https://syncai-lib-designsystem.vercel.app/r/{name}.json"
     }
   }
   ```

3. Install the theme, import it after Tailwind in `globals.css` (`@import "../styles/syncrobotic-theme.css";`) and delete the `:root`, `.dark` and `@theme inline` blocks that shadcn init generated:

   ```bash
   npx shadcn add @syncrobotic/syncrobotic-theme
   ```

4. Install components:

   ```bash
   npx shadcn add @syncrobotic/dock @syncrobotic/stop-button @syncrobotic/slide-to-release @syncrobotic/island
   ```

Dark is the default: `<html class="dark">`. Default copy is English; every visible and screen-reader string can be replaced through props to localise.

## Components

75 components and 2 hooks in eight groups, as on the docs site. Every component follows the colour, radius, height and spacing rules, and every state has a story.

| Group | Items |
| --- | --- |
| Theme | `syncrobotic-theme` (colour, radius, type, height and motion tokens) |
| Actions | `button`, `segmented-control`, `toggle`, `copy-button`, `button-group`, `toggle-group` |
| Inputs | `input`, `input-group`, `number-field`, `textarea`, `label`, `field`, `checkbox`, `radio-group`, `switch`, `choice-field`, `select`, `slider`, `autocomplete`, `input-otp`, `phone-input`, `calendar`, `date-selector`, `time-picker`, `sortable`, `file-upload`, `questionnaire` |
| Display | `status-glyph`, `status-eyebrow`, `list`, `skeleton`, `spinner`, `badge`, `card`, `avatar`, `separator`, `progress`, `description-list`, `meter`, `empty-state`, `table`, `item`, `icon-tile`, `kbd`, `scroll-area`, `data-grid`, `resizable`, `attachment`, `file-type`, `timeline`, `trace`, `marker` |
| Charts | `chart` (Recharts) |
| Feedback | `alert`, `alarm`, `toast` |
| Navigation | `tabs`, `pagination`, `breadcrumb`, `accordion`, `stepper`, `scrollspy`, `navigation-menu` |
| Overlays | `dialog`, `alert-dialog`, `sheet`, `popover`, `tooltip`, `dropdown-menu`, `command` |
| Robot shell | `tray`, `stop-button`, `slide-to-release`, `dock`, `island` |
| Hooks | `use-long-press`, `use-slide-release` |

## Blocks

69 blocks, grouped like the components: a group, then a type, then its blocks. The docs site has one page per type with every block's preview at desktop, tablet and phone width, its code and its install command.

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

General components are built on [Radix UI](https://www.radix-ui.com) primitives, the same base as shadcn/ui, so keyboard and screen-reader behaviour comes from Radix.

## For AI agents

Coding agents can read the whole kit without scraping the site:

- **`/llms.txt`** lists every component and block with a one-line summary; **`/llms-full.txt`** is everything in one file: the design language, every block, and every component with when to use it.
- **Markdown twins.** Every component, block and foundation page has a Markdown version at its URL plus `.md`, e.g. `/docs/components/button.md`. The docs site's Markdown and Prompt buttons copy them.
- **Agent skill.** `npx shadcn add @syncrobotic/agent-skill` installs the workflow and the design language into `.claude/skills/syncrobotic-ui/`.
- **MCP server** (read-only, no sign-in): `claude mcp add --transport http syncrobotic https://syncai-lib-designsystem.vercel.app/mcp`. Tools: `search`, `get_item` (source, stories and rules), `get_install_command`, `get_design_language` and `get_checklist`.

## Develop

```bash
npm install
npm run dev              # docs site at http://localhost:3000
npm run storybook        # http://localhost:6006, toolbar switches dark and light
npm run lint:tokens      # fails on any value outside the tokens, in the registry and the docs site
npm run lint:registry    # fails when an item's dependencies drift from its imports
npm run typecheck
npm test                 # behaviour tests (Vitest): stop, stop all, slide to release, keyboard and AT paths
npm run build            # registry JSON in public/r + docs site
npm run build-storybook
npm run test:stories     # every story, dark and light: screenshot against its baseline, then axe (WCAG 2.2 AA)
npm run test:registry    # installs every item into a fresh Next.js app, then typechecks and builds it
```

### Repository layout

| Path | What |
| --- | --- |
| `registry/syncrobotic/styles/` | The theme: every token |
| `registry/syncrobotic/ui/` | General components (Radix UI based) |
| `registry/syncrobotic/shell/` | Robot shell components: emergency stop, slide to release, dock, island, status |
| `registry/syncrobotic/blocks/` | Blocks: application screens, charts and robot-operations screens |
| `registry/syncrobotic/hooks/`, `lib/` | Interaction hooks and `cn()` |
| `stories/` | One story per state; the docs site, visual tests and axe all read them |
| `tests/unit/` | Behaviour tests |
| `app/`, `site/` | The docs site; `site/block-types.ts` holds the block groups, types and order |

Baselines live in `tests/__screenshots__/` and are written only by CI (Actions → `visual-baseline`), never locally: fonts and anti-aliasing differ between machines. Stories render in Geist, loaded before each screenshot, with the page clock run past timed UI. Any change to how a component looks fails CI with a diff image; to accept it, run the workflow on `dev` (not on `stage`: a baseline commit that exists only on `stage` conflicts with the next promotion). A commit pushed by the workflow does not start CI by itself, so run Actions → `ci` on the branch afterwards.

### Rules CI enforces

- No arbitrary Tailwind lengths (`h-[72px]`); use tokens (`h-(--h-stop)`, `rounded-md`)
- No raw colours; use tokens such as `bg-stop` and `text-info`
- `rounded-full` only for round things (avatars, dots, switch, radio, tracks, count badges, grabber); everything else uses `rounded-xs`…`rounded-xl`
- Animation only marks a state change and uses the motion tokens; in JavaScript, import `site/motion.ts`
- Spacing only 1, 2, 3, 4, 6, 8 (4, 8, 12, 16, 24, 32 px)
- Font weights only 400, 500, 700

### Adding a component

1. Write it in `registry/syncrobotic/ui/` (general), `registry/syncrobotic/shell/` (robot shell) or `registry/syncrobotic/blocks/` (blocks). Import from `@/lib/utils` and `@/registry/syncrobotic/...`; the CLI rewrites these to the consumer's paths on install.
2. Add an entry to `registry.json` with its `dependencies` (npm) and `registryDependencies` (other `@syncrobotic/...` items).
3. Write one story per state in `stories/`. The docs site renders the same stories.
4. Add it to `site/catalog.ts` with its usage rules. A block instead goes into `site/block-types.ts` (its type and order) and `site/blocks.tsx` (its preview).
5. Interaction logic gets a behaviour test in `tests/unit/`.
6. Open a PR once `npm run ci` passes. Add a line to `CHANGELOG.md`.

After changing an item's files, bump its `meta.version` in `registry.json`, add a `meta.changelog` line and run `npm run versions`. After changing the theme, run `npm run tokens`.

Visual regression: every story is compared, dark and light, with the baselines in `tests/__screenshots__/`, together with axe. These story checks run on PRs into `stage` and `main` and on demand (Actions → `ci` → Run workflow); PRs into `dev` get the fast checks (lint, types, unit tests, builds, registry e2e). They are written on CI's own browser: after an intended visual change, run Actions → `visual-baseline` on the branch and review the committed screenshots in the PR.

Releases: when `main` gets a `package.json` version that has no tag, the `release` workflow tags it `vX.Y.Z` and publishes a GitHub Release with that version's `CHANGELOG.md` section. CI checks that the section exists.

New components start as a proposal issue. How work is chosen, reviewed and released is in [ROADMAP.md](ROADMAP.md).

## Branches

`feat/*` → `dev` → `stage` → `main`, each step through a pull request with CI green.

## Deploy (Vercel)

The project lives in the company Vercel team. `vercel.json` pins the framework to Next.js; `npm run build` builds the registry and the site. `main` deploys to production; `dev` and `stage` get preview URLs.

### Access

No sign-in and no token: anyone with the link can read the docs and install from the registry. Vercel Deployment Protection is off for the production deployment. Until the project is open-sourced the site is `noindex` and `robots.txt` disallows everything, so it stays out of search results.

### Environment variables

| Name | Purpose |
| --- | --- |
| `SITE_URL` | Canonical URL, e.g. `https://design.example.com`. Defaults to the Vercel production URL |
| `SITE_PUBLIC` | `true` lets search engines index the site (robots, sitemap). Leave unset until open-sourcing |

### Open-sourcing

Set `SITE_PUBLIC=true` and redeploy. Search engines may then index the site, and the sitemap is published.

## Known issues

- Installing two or more components that share `@syncrobotic/cn` prints "Circular dependency detected". The CLI is merging shared dependencies; the result is correct.
- The shadcn CLI fetches base colours from ui.shadcn.com during install, so the machine needs access to it.
