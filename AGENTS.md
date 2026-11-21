# Agents in this repository

- How to work here (setup, the checks, the rules the lints enforce, adding a component, releases): [CONTRIBUTING.md](CONTRIBUTING.md).
- Commit subjects and pull request titles: English Conventional Commits (`feat(scope): …`, `fix(scope): …`), never `0.x.y: …` or `Merge branch …` (CONTRIBUTING, "Branches and releases").
- The design language and the check to run after every UI change: the agent skill in `registry/syncrobotic/skill/` (`SKILL.md`, `references/design-language.md`, `references/checklist.md`). The foundation pages on the docs site are the source of each rule.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
