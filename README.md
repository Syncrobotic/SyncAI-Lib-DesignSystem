<img src="public/brand/syncrobotic-mark.svg" alt="SYNCROBOTIC" width="56" />

# SYNCROBOTIC Design System

**One design language for every SYNCROBOTIC product.** Colour, type, spacing, radius and motion tokens, React components and blocks, shipped as a [shadcn/ui](https://ui.shadcn.com) registry for Tailwind CSS v4.

Like [ReUI](https://reui.io), components install into your project as source code: you can read them, change them and keep them in step with the shadcn ecosystem.

- **Docs site:** [https://syncai-lib-designsystem.vercel.app](https://syncai-lib-designsystem.vercel.app) (Next.js app in `app/`, deployed on Vercel; open to anyone with the link, not indexed until open-sourced)
- **Registry:** `https://syncai-lib-designsystem.vercel.app/r/{name}.json`
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

47 registry items, grouped as on the docs site. Every component follows the colour, radius, height and spacing rules, and every state has a story.

| Group | Items |
| --- | --- |
| Theme | `syncrobotic-theme` (colour, radius, type, height and motion tokens) |
| Actions | `button`, `segmented-control` |
| Inputs | `input`, `textarea`, `label`, `field`, `checkbox`, `radio-group`, `switch`, `select`, `slider` |
| Display | `badge`, `card`, `avatar`, `separator`, `progress`, `spinner`, `empty-state`, `table`, `list`, `status-glyph`, `status-eyebrow`, `skeleton` |
| Feedback | `alarm`, `alert`, `toast` |
| Navigation | `tabs`, `accordion` |
| Overlays | `dialog`, `alert-dialog`, `sheet`, `popover`, `tooltip`, `dropdown-menu` |
| Robot shell | `stop-button`, `slide-to-release`, `dock`, `island`, `tray` |
| Hooks | `use-long-press`, `use-slide-release` |
| Blocks | `stats-cards`, `fleet-table`, `robot-status-card`, `marketing-hero` |

General components are built on [Radix UI](https://www.radix-ui.com) primitives, the same base as shadcn/ui, so keyboard and screen-reader behaviour comes from Radix.

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
npm run test:a11y        # axe (WCAG 2.2 AA) on every story, dark and light
npm run test:visual      # screenshots every story in dark and light
npm run test:registry    # installs every item into a fresh Next.js app, then typechecks and builds it
```

### Repository layout

| Path | What |
| --- | --- |
| `registry/syncrobotic/styles/` | The theme: every token |
| `registry/syncrobotic/ui/` | General components (Radix UI based) |
| `registry/syncrobotic/shell/` | Robot shell components: emergency stop, slide to release, dock, island, status |
| `registry/syncrobotic/blocks/` | Blocks: composed sections for dashboards, apps and marketing pages |
| `registry/syncrobotic/hooks/`, `lib/` | Interaction hooks and `cn()` |
| `stories/` | One story per state; the docs site, visual tests and axe all read them |
| `tests/unit/` | Behaviour tests |
| `app/`, `site/` | The docs site |

The first `test:visual` run writes baselines; commit them (`tests/__screenshots__/`). After that, any change to how a component looks fails CI with a diff image. To accept the new look: `npx playwright test --update-snapshots`.

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
4. Add it to `site/catalog.ts` with its usage rules.
5. Interaction logic gets a behaviour test in `tests/unit/`.
6. Open a PR once `npm run ci` passes. Add a line to `CHANGELOG.md`.

After changing an item's files, bump its `meta.version` in `registry.json`, add a `meta.changelog` line and run `npm run versions`. After changing the theme, run `npm run tokens`.

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
