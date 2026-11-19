# Contributing

How to work on the design system: setup, the checks, adding a component, and how a change reaches a release. How work is chosen and reviewed is in [ROADMAP.md](ROADMAP.md).

## Setup

```bash
npm install
npm run dev              # docs site at http://localhost:3000
npm run storybook        # http://localhost:6006; the toolbar switches dark and light
```

## Checks

`npm run ci` runs what CI runs on every pull request into `dev`. Each step on its own:

```bash
npm run lint:tokens      # any value outside the tokens, in the registry, the docs site and the stories
npm run lint:registry    # an item's dependencies drifting from its imports; a file with hooks missing "use client"
npm run lint:rules       # focus never removed, battery thresholds, a chart with axes without its table view
npm run lint:motion      # durations and easing outside the motion tokens, buttons without press feedback
npm run lint:versions    # an item changed without a version bump and changelog line
npm run lint:dtcg        # the DTCG token files out of date with the theme
npm run typecheck
npm test                 # behaviour tests (Vitest)
npm run build            # registry JSON in public/r, and the docs site
npm run build-storybook
```

CI runs on pull requests only (a merge lands a tree its pull request already passed) and cancels a run when a newer push makes it stale. The checks above run on every pull request. The slower ones:

```bash
npm run test:stories     # every story, dark and light: screenshot against its baseline, then axe (WCAG 2.2 AA)
npm run test:registry    # every item installed into a fresh Next.js app, type-checked and built
npm run check:radius     # with the site running (npm start): nested corners follow outer = inner + padding, on the
                         # home page, the foundation pages, every component page and every block preview
```

- Story checks run on pull requests into `stage`, where a release is assembled, in Playwright's own image (`mcr.microsoft.com/playwright`), four shards. `main` receives `stage`'s tree unchanged, so they are not repeated there. Run them on any branch with Actions → `ci` → Run workflow.
- The registry install test runs on every pull request that touches `registry/`, `registry.json`, the package files or the TypeScript config, and is skipped otherwise.
- `check:radius` is local only.

### Rules the lints enforce

- No arbitrary Tailwind lengths (`h-[72px]`); use tokens (`h-(--h-stop)`, `rounded-md`).
- No raw colours; use tokens such as `bg-stop` and `text-info`.
- Spacing only 1, 2, 3, 4, 6, 8 (4, 8, 12, 16, 24, 32 px).
- Font sizes only from the scale (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl); weights only 400, 500, 700.
- `rounded-full` only for what is round by nature: avatars, dots and bullets, switch and radio, tracks and thumbs (slider, progress, meter, scrollbar), count badges, step circles, grips and grabbers. The [Radius foundation](https://design-system.syncrobotic.me/docs/foundations/radius#full) is the source; each file that uses it is listed with its use in `scripts/check-tokens.mjs` (`ROUND`).
- Motion only marks a change of state and uses the motion tokens; in JavaScript, import `site/motion.ts`. Every duration class has `ease-(--ease-standard)` beside it; overlays animate in and out; every button presses.
- Loops only while waiting: the Spinner, the skeleton's breath and the caret (no `animate-pulse`, `ping` or `bounce`).
- Icons are 16, 20 or 24 px (`size-4`, `size-5`, `size-6`) with a 2 px stroke; an icon beside a label is 8 px from it (`gap-2`), except inside a 24 px Badge.
- A registry file that uses hooks or handlers starts with `"use client"` (`lint:registry`).
- `lint:rules`: `outline-none` only with a visible focus in its place (or a `// focus-ring:` comment saying where focus shows); a battery warns below 15 % and has no `critical`; a chart block with axes has a table view.
- No native number input; use `NumberField`.
- Icons only from the icon set (`site/icons.ts`, browsable at `/icons`), one meaning per icon. A new icon is a new entry there, with its meaning.

## Visual baselines

Baselines live in `tests/__screenshots__/` and are written only by CI (Actions → `visual-baseline`), never locally: fonts and anti-aliasing differ between machines. A change to how a component looks fails the story checks with a diff image. To accept it, run `visual-baseline` on `dev` (not on `stage`: a baseline commit that exists only on `stage` conflicts with the next promotion), review the committed screenshots, then run Actions → `ci` on `dev`, because a commit pushed by a workflow does not start CI by itself.

## Adding a component

1. Write it in `registry/syncrobotic/ui/` (general), `registry/syncrobotic/shell/` (robot shell) or `registry/syncrobotic/blocks/` (blocks). Import from `@/lib/utils` and `@/registry/syncrobotic/...`; the shadcn CLI rewrites these to the consumer's paths on install. Keep it free of any framework: navigation goes through a callback, and every string is a prop.
2. Add an entry to `registry.json` with its `dependencies` (npm) and `registryDependencies` (other `@syncrobotic/...` items).
3. Write one story per state in `stories/`. The docs site, the screenshots and axe all read them.
4. Add it to `site/catalog.ts` with its usage rules, to `site/overview.ts` (what it is, when to use it, what to use instead, and agent notes only for what the rules do not already say), and to `site/examples.tsx`. A block goes into `site/block-types.ts` (its type and order) and `site/blocks.tsx` (its preview) instead. Block or pattern: if it composes several components into a screen or section, it is a block (group Application or Solutions). If it is a ready-made use of one component (a chart, a dialog, a sheet, a timeline), it is a pattern: give its type `group: "Patterns"` and `home: "<component>"`, and it shows on that component's page under Patterns instead of on /blocks. Either way it installs under its own name.
5. Interaction logic gets a behaviour test in `tests/unit/`.
   Before you open it, check it against the rules the audit kept finding: colour only for what needs someone (calm states and offline are grey; blue only for a process being waited on); nothing focusable removes its focus ring; field edges use `--input`; a battery is a `Meter` that warns below 15 %; a chart with axes (line, area, bar, heatmap) ships a Chart / Table switch, and a sparkline, ring or status strip writes its numbers in words; every target is at least 44 px on touch; 36 (`--h-sm`) with a mouse only. The agent skill's checklist (`registry/syncrobotic/skill/references/checklist.md`) is the full list. `npm run lint:rules` checks the focus, battery and chart-table rules; where `outline-none` is right because focus shows elsewhere, say where in a `// focus-ring:` comment above it.
6. Add a line to `CHANGELOG.md` under Unreleased, and open a pull request once `npm run ci` passes.

After changing an item's files, bump its `meta.version` in `registry.json`, add a `meta.changelog` line and run `npm run versions`. After changing a component's props, run `npm run props` (CI checks the API reference matches the types). A new item starts with `meta.status: "beta"` (lint:registry asks for it); set it to `"stable"` once a product has used it and its API has settled. After changing the theme, run `npm run tokens`.

## Repository layout

| Path | What |
| --- | --- |
| `registry/syncrobotic/styles/` | The theme: every token |
| `registry/syncrobotic/ui/` | General components (Radix UI based) |
| `registry/syncrobotic/shell/` | Robot shell: emergency stop, slide to release, dock, island, status |
| `registry/syncrobotic/blocks/` | Blocks (application and robot-operations screens) and patterns (ready-made uses of one component, such as charts) |
| `registry/syncrobotic/hooks/`, `lib/` | Interaction hooks and `cn()` |
| `stories/` | One story per state |
| `tests/unit/` | Behaviour tests |
| `app/`, `site/` | The docs site |

## Branches and releases

`feat/*` → `dev` → `stage` → `main`, each step through a pull request with CI green.

When `main` gets a `package.json` version that has no tag, the `release` workflow tags it `vX.Y.Z` and publishes a GitHub Release with that version's section of `CHANGELOG.md`. CI checks that the section exists.

## Deployment

The docs site and the registry deploy on Vercel: `main` to production, `dev` and `stage` to preview URLs. `vercel.json` pins the framework to Next.js, and `npm run build` builds the registry and the site. No environment variables are needed: the canonical URL comes from Vercel's `VERCEL_PROJECT_PRODUCTION_URL` (the custom domain once one is attached), and only the production deployment (`VERCEL_ENV=production`) is open to search engines; previews are `noindex`.
