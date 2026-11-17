# Roadmap and process

How the design system decides what to build, how work is reviewed and released, and the plan to 1.0.

## How work flows

1. **Intake.** Every change starts as an issue: a *Proposal* (new component, pattern, token) or a *Bug*. A proposal names the product that needs it and the evidence; one team asking is a signal, two teams is a component.
2. **Triage, weekly.** The maintainers sort issues into the current milestone, the next one, or *not now* with a reason. Bugs marked *Safety* or *Accessibility* go into the current release, ahead of everything else.
3. **Design decision.** Anything that changes the language (a token, a rule, a new pattern) gets a short decision record in the PR description: the problem, the options considered, the choice. Components that only apply existing rules skip this.
4. **Build.** `feat/*` branch, following [Adding a component](README.md#adding-a-component). The PR template is the definition of done.
5. **Review.** One engineer and one designer approve. CI must be green: tokens, registry, types, behaviour tests, build, axe on every story, visual regression, end-to-end install.
6. **Release train, every two weeks.** `dev` → `stage` on Monday, `stage` → `main` on Wednesday after a check of the stage preview. Safety fixes ship as soon as they are green.

## Versions

Components install as source, so a version tells a team when to re-install.

| Change | Version | Example |
| --- | --- | --- |
| Fix, no API change | patch, 0.4.**1** | Contrast fix, keyboard bug |
| New item, token or prop | minor, 0.**5**.0 | Combobox, `--space-section` |
| Rename or remove a token, prop or item | major (minor before 1.0) | `tone` renamed |

Every entry in [CHANGELOG.md](CHANGELOG.md) names the items to re-install. Breaking changes say how to migrate.

## Measures

Reviewed each release, so the roadmap follows evidence rather than taste.

- **Adoption:** products and screens using the registry; which items, which version.
- **Drift:** token lint violations in consuming apps, and local copies of components that have diverged.
- **Quality:** open Safety and Accessibility bugs (target: zero older than one release).
- **Alarms in the field:** share of critical / high / low per product against the 5 / 15 / 80 guide, and floods per operator shift.

## Plan

Ordered by what blocks adoption first. Each milestone is one or two release trains.

### 0.4 · Alarms and feedback (this release)
- [x] Alarms foundation, `alarm`, `toast`
- [x] Process: this file, issue templates, PR checklist
- [ ] Commit the visual baselines so CI fails on any visual change (#26)
- [x] Island notices and alarms share one data shape; the control app's island shows the highest unacknowledged alarm

### 0.5 · Versions and design source
- [x] Per-item version and changelog in the registry, a version header in every file, and an upgrade guide (#27)
- [x] Tokens exported as W3C Design Tokens (DTCG JSON), generated from the theme file and checked in CI (#28)
- [ ] Figma library fed from the same tokens (Tokens Studio), so design and code share one source (#29: sync path documented; binding the Figma components needs a designer)

### 0.6 · Components teams are missing
- [ ] Combobox, date picker, pagination, breadcrumb, stepper, file upload
- [ ] Data table with sort, filter and pagination; form validation with React Hook Form
- [ ] Charts and data-visualisation rules (palette, axes, maps and robot tracks)

### 0.7 · Environments
- [ ] Compact density for dashboards
- [ ] High-contrast theme for bright sun and outdoor robots
- [ ] Glove-sized targets for field use

### 0.8 · Documentation
- [ ] Props tables generated from the types; status labels (beta, stable) per item
- [ ] Site search (⌘K); docs per released version
- [ ] Adoption scanner: a script that reports registry items and versions across company repos

### 0.9 · Accessibility evidence
- [ ] Manual screen-reader and keyboard test matrix per component (VoiceOver, TalkBack, NVDA)
- [ ] Accessibility conformance report (ACR / VPAT)

### 1.0 · Open source
- [ ] Licence, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY
- [ ] Public roadmap and `SITE_PUBLIC=true`
