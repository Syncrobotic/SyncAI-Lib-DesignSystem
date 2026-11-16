# SYNCROBOTIC Design System

**Design language and React UI kit for robot control apps.** Emergency stop, slide to release, dock, dynamic island and design tokens, shipped as a [shadcn/ui](https://ui.shadcn.com) registry for Tailwind CSS v4.

Like [ReUI](https://reui.io), components install into your project as source code: you can read them, change them and keep them in step with the shadcn ecosystem.

- **Docs site:** [https://syncai-lib-designsystem.vercel.app](https://syncai-lib-designsystem.vercel.app) (Next.js app in `app/`, deployed on Vercel; behind Vercel Authentication until open-sourced)
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
       "url": "https://syncai-lib-designsystem.vercel.app/r/{name}.json",
       "headers": { "x-vercel-protection-bypass": "${SYNCROBOTIC_REGISTRY_TOKEN}" }
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

40 registry items, grouped as on the docs site. Every component follows the colour, radius, height and spacing rules, and every state has a story.

| Group | Items |
| --- | --- |
| Theme | `syncrobotic-theme` (colour, radius, type, height and motion tokens) |
| Actions | `button`, `segmented-control` |
| Inputs | `input`, `textarea`, `label`, `field`, `checkbox`, `radio-group`, `switch`, `select`, `slider` |
| Display | `badge`, `card`, `avatar`, `separator`, `progress`, `spinner`, `alert`, `empty-state`, `table`, `list`, `status-glyph`, `status-eyebrow`, `skeleton` |
| Navigation | `tabs`, `accordion` |
| Overlays | `dialog`, `alert-dialog`, `sheet`, `popover`, `tooltip`, `dropdown-menu` |
| Robot shell | `stop-button`, `slide-to-release`, `dock`, `island`, `tray` |
| Hooks | `use-long-press`, `use-slide-release` |

General components are built on [Radix UI](https://www.radix-ui.com) primitives, the same base as shadcn/ui, so keyboard and screen-reader behaviour comes from Radix.

## Develop

```bash
npm install
npm run dev              # docs site at http://localhost:3000 (no password locally)
npm run storybook        # http://localhost:6006, toolbar switches dark and light
npm run lint:tokens      # fails on any value outside the tokens
npm run typecheck
npm run build            # registry JSON in public/r + docs site
npm run build-storybook
npm run test:visual      # screenshots every story in dark and light
```

The first `test:visual` run writes baselines; commit them (`tests/__screenshots__/`). After that, any change to how a component looks fails CI with a diff image. To accept the new look: `npx playwright test --update-snapshots`.

### Rules CI enforces

- No arbitrary Tailwind lengths (`h-[72px]`); use tokens (`h-(--h-stop)`, `rounded-md`)
- No raw colours; use tokens such as `bg-stop` and `text-info`
- Spacing only 1, 2, 3, 4, 6, 8 (4, 8, 12, 16, 24, 32 px)
- Font weights only 400, 500, 700

### Adding a component

1. Write it in `registry/syncrobotic/ui/` (general) or `registry/syncrobotic/blocks/` (robot shell). Import from `@/lib/utils` and `@/registry/syncrobotic/...`; the CLI rewrites these to the consumer's paths on install.
2. Add an entry to `registry.json` with its `dependencies` (npm) and `registryDependencies` (other `@syncrobotic/...` items).
3. Write one story per state in `stories/`. The docs site renders the same stories.
4. Add it to `site/catalog.ts` with its usage rules.
5. Open a PR once `npm run ci` passes.

## Branches

`feat/*` → `dev` → `stage` → `main`, each step through a pull request with CI green.

## Deploy (Vercel)

The project lives in the company Vercel team. `vercel.json` pins the framework to Next.js; `npm run build` builds the registry and the site. `main` deploys to production; `dev` and `stage` get preview URLs.

### Access

Until the project is open-sourced, the site and the registry are private through Vercel's own Deployment Protection, not code in this repo:

- **People** sign in with their Vercel account (Settings → Deployment Protection → Vercel Authentication, covering production too).
- **The shadcn CLI** sends the project's *Protection Bypass for Automation* secret in the `x-vercel-protection-bypass` header (see Install). Maintainers create it on the same settings page and hand it to engineers as `SYNCROBOTIC_REGISTRY_TOKEN`.

### Environment variables

| Name | Purpose |
| --- | --- |
| `SITE_URL` | Canonical URL, e.g. `https://design.example.com`. Defaults to the Vercel production URL |
| `SITE_PUBLIC` | `true` lets search engines index the site (robots, sitemap). Leave unset until open-sourcing |

### Open-sourcing

Turn off Vercel Authentication, set `SITE_PUBLIC=true` and redeploy. Consumers can then drop the `headers` block from `components.json`.

## Known issues

- Installing two or more components that share `@syncrobotic/cn` prints "Circular dependency detected". The CLI is merging shared dependencies; the result is correct.
- The shadcn CLI fetches base colours from ui.shadcn.com during install, so the machine needs access to it.
