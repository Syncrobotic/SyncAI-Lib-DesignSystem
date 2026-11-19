## What and why

<!-- The problem, and the issue it closes. A change to the language (a token, a rule, a new pattern) also gives the options considered and the choice. -->

## Checklist

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the steps and the checks.

- [ ] Uses tokens only (`npm run lint:tokens`)
- [ ] `registry.json` dependencies complete (`npm run lint:registry`)
- [ ] Rules self-check: colour only for what needs someone, focus never removed, field edges `--input`, battery a `Meter` warning below 15 %, a chart with axes has a table view, 44 px on touch (`npm run lint:rules`, then the skill's `references/checklist.md`)
- [ ] One story per state; the docs page renders them
- [ ] Usage rules in `site/catalog.ts` and the overview in `site/overview.ts`; a block also in `site/block-types.ts` (its type and order) and `site/blocks.tsx`
- [ ] Behaviour test for interaction logic
- [ ] Keyboard and screen reader checked by hand, not only axe
- [ ] Each changed item: `meta.version` bumped and a `meta.changelog` line in `registry.json`, then `npm run versions` (`npm run lint:versions`)
- [ ] `CHANGELOG.md` entry under Unreleased; breaking changes say how to migrate
