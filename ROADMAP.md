# Roadmap and process

How the design system decides what to build, how work is reviewed and released, and the plan to 1.0.

## How work flows

1. **Intake.** Every change starts as an issue: a *Proposal* (new component, pattern, token) or a *Bug*. A proposal names the product that needs it and the evidence; one team asking is a signal, two teams is a component.
2. **Triage, weekly.** The maintainers sort issues into the current milestone, the next one, or *not now* with a reason. Bugs marked *Safety* or *Accessibility* go into the current release, ahead of everything else.
3. **Design decision.** Anything that changes the language (a token, a rule, a new pattern) gets a short decision record in the PR description: the problem, the options considered, the choice. Components that only apply existing rules skip this.
4. **Build.** `feat/*` branch, following [Adding a component](CONTRIBUTING.md#adding-a-component). The PR template is the definition of done.
5. **Review.** One engineer and one designer approve. CI must be green. On every pull request: tokens, registry, rules, motion, versions, DTCG, types, tests, build (and, when the registry changed, an end-to-end install). Before a release (pull requests into `stage`): axe and screenshots of every story.
6. **Release.** When a batch of work on `dev` is verified, it goes `dev` → `stage` (where the story checks run), then `stage` → `main` after a check of the stage preview. There is no fixed schedule. Safety fixes ship as soon as they are green.

## Versions

Components install as source, so a version tells a team when to re-install. How versions move (patch, minor, major) is on the [upgrading page](https://design-system.syncrobotic.me/docs/upgrading#versions).

Every entry in [CHANGELOG.md](CHANGELOG.md) names the items to re-install. Breaking changes say how to migrate.

## Measures

Reviewed each release, so the roadmap follows evidence rather than taste.

- **Adoption:** products and screens using the registry; which items, which version.
- **Drift:** token lint violations in consuming apps, and local copies of components that have diverged.
- **Quality:** open Safety and Accessibility bugs (target: zero older than one release).
- **Alarms in the field:** share of critical / high / low per product against the 5 / 15 / 80 guide, and floods per operator shift.

## Plan

The milestones are themes, not version numbers, listed by number. 0.4 to 0.9 and 1.0 were planned first; 0.16 and 0.17 were added later, so 0.9 is still open while they are done. The kit is at 0.24, and the open items below are what is left of each theme. Checked 2026-11-21 (0.24.0).

### 0.4 · Alarms and feedback
- [x] Alarms foundation, `alarm`, `toast`
- [x] Process: this file, issue templates, PR checklist
- [x] Commit the visual baselines so CI fails on any visual change (#26)
- [x] Island notices and alarms share one data shape; the control app's island shows the highest unacknowledged alarm

### 0.5 · Versions and design source
- [x] Per-item version and changelog in the registry, a version header in every file, and an upgrade guide (#27)
- [x] Tokens exported as W3C Design Tokens (DTCG JSON), generated from the theme file and checked in CI (#28)
- [ ] Figma library fed from the same tokens (Tokens Studio), so design and code share one source (#29: sync path documented; binding the Figma components needs a designer)

### 0.6 · Components teams are missing
- [x] Combobox (`autocomplete`), date picker (`calendar`, `date-selector`), pagination, breadcrumb, stepper, file upload
- [x] Data table with sort and pagination (`data-grid`), filters beside it (`filter-form`)
- [x] Form validation with React Hook Form (`form`): Field and FieldSet wired to a form library, with examples
- [x] Charts (`chart` and the chart items)
- [x] Data-visualisation rules as a foundation page (palette, axes, maps and robot tracks)

### 0.7 · Environments
- [x] Compact density for dashboards (`data-density="compact"`, mouse only)
- [x] High-contrast theme for bright sun and outdoor robots (`data-contrast="more"`)
- [x] Glove-sized targets for field use (`data-density="glove"`)

### 0.8 · Documentation
- [x] Props tables generated from the types (API reference on every component page and in its Markdown); status labels (beta, stable) per item
- [x] Site search (⌘K, Ctrl+K, /) over pages, rules, components, blocks and icons
- [x] Information architecture: Blocks hold compositions; variants of one component are Patterns on its page
- [x] Adoption scanner: a script that reports registry items and versions across company repos (`npm run adoption`)

### 0.9 · Accessibility evidence
- [ ] Manual screen-reader and keyboard test matrix per component (VoiceOver, TalkBack, NVDA)
- [ ] Accessibility conformance report (ACR / VPAT)

### 0.16 · Data tools and review (done)
- [x] Filters: a flat chip filter bar (field, operator, value) that lives in the URL
- [x] For labelling and model review (VLM-Forge): text diff, image grid with a lightbox, keyboard-first review queue with `use-hotkeys`, action-rail page, annotation overlay tokens, and colours for test and audit results
- [x] CI: pull requests only, stale runs cancelled, story checks once per release in Playwright's image

### 0.17 · Audit: the kit follows its own rules
- [x] Page-by-page design review and a rule-compliance audit of every component, block and page (dark and light, desktop and phone, axe)
- [x] Overview puts alarms first; neutral environment badge; lighter disabled outlines; every chart with axes has a table view
- [x] Field edges 3:1 (WCAG 1.4.11), focus rings never removed, battery threshold 15 % everywhere, 44 px targets on the docs site
- [x] One rule where two disagreed (default theme, battery as Meter, switch on, offline, 36 px, button weight, KPI colour, missions as processes)
- [x] Lints for what the audit found by hand (`lint:rules`): `outline-none` without a replacement, battery thresholds, a chart block without `ChartTable`; field-edge contrast as a unit test
- [x] Docs site: component pages open with the first example; block thumbnails readable; one search on the overview; filter segments the same everywhere

### 0.18 – 0.20 · What products build by hand
- [x] Components found by putting the kit into a product: `annotated-image`, `tree`, `metric-card` (all KPI blocks built on it), `code-block` (the docs site's own code blocks use it)
- [x] Component pages in three tabs, each at its own address: Overview, Properties, Accessibility; the Accessibility tab generated from roles measured in a browser and contrast computed from the theme, checked against the components in CI
- [x] Forms with React Hook Form the way shadcn does them: Controller around Field, an installable example (`form`), no wrapper and no form library in any other item
- [x] One version range per npm package across the registry (`lint:registry`)
- [x] Status on every item: stable for what a product uses, beta for the rest

### 0.21 – 0.22 · Filling the gaps, and the brand
- [x] Components products asked for: `context-menu`, `hover-card`, `banner`, `graph`, `media-player`; blocks for notifications, billing, webhooks, sessions, two-factor sign-in and a battery histogram
- [x] Accessibility data measured in CI (`a11y-data`), so the Accessibility tab cannot drift from the components
- [x] Charts: graphite and the brand indigo (C3), every series at least 3:1 and told apart by line style too
- [x] Alarms redesigned as aligned rows; low priority is a diamond, so no two priorities share a round outline; the list has loading and error states that never read as "no alarms"
- [x] Brand assets page (`/brand`): logos, colours, use in web and app interfaces

### 0.23 – 0.24 · Robots, and the kit compiles anywhere
- [x] Robot components: `camera-feed`, `teleop-pad`, `robot-map` (with ROS occupancy grids, laser scans and editing), `point-cloud` (WebGL2, no library), `robot-model` (URDF, the only three.js item), `joint-state`
- [x] Every word translatable (`labels`, `locale`)
- [x] Engineering: ESLint with the React Compiler rules, strict TypeScript, every item compiling under `noUncheckedIndexedAccess` in CI, security headers

### 1.0 · Public, source-available
- [x] Licence (all rights reserved, source-available), CONTRIBUTING, SECURITY
- [x] Production indexed by search engines with no configuration; previews stay `noindex`
- [x] Make the repository public on GitHub

### After 1.0
- [ ] Docs kept for each major version (a frozen site for 1.x once 2.0 ships), as package libraries do. Not per minor: items install as source, so a project's own copy, its version header and the CHANGELOG already say what it has and what changed.
