---
name: syncrobotic-ui
description: Build SYNCROBOTIC interfaces (robot control apps, internal engineering tools, the marketing site) with the SYNCROBOTIC design system's shadcn registry. Use whenever you create or change UI in a project that has @syncrobotic in components.json, or when asked for a screen, page, form, table, dashboard, app shell or any component in SYNCROBOTIC style.
---

# SYNCROBOTIC UI

The design system ships as a shadcn registry: tokens, components, robot-shell parts and whole blocks, installed as source with `npx shadcn add @syncrobotic/<name>`. Build with them; do not hand-roll what they already are.

Machine-readable index: https://syncai-lib-designsystem.vercel.app/llms.txt. Every component, block and foundation page also answers as markdown at its URL plus `.md` (for example `/docs/components/meter.md`): what it is, when to use it, when not to (and what to use instead), rules, keyboard, agent notes, install command, version.

## Workflow

1. **Plan before code.** In your reply, write the screen in a few lines: the frame (app shell with sidebar, top-bar shell, or a page), the regions top to bottom, what fills each, and the empty, loading and error states.
2. **Start from a block.** Read `/llms.txt` › Blocks and pick the closest: `app-shell` (internal tools), `top-bar-shell` (no sidebar), `console-overview`, `list-detail`, `event-log`, `map-workspace`, `data-catalog`, `dataset-detail`, `settings-page`, `record-form`, `users-roles`, `sign-in`, `status-pages`, `stats-cards`, `fleet-table`, `robot-status-card`. Install it, then replace the sample data.
3. **Read before you use.** For each component, open its `.md` twin and follow its rules and agent notes. Never invent props; read the source the CLI installed.
4. **Reuse, do not restyle.** Keep the installed structure and classes. Compose from registry parts; if one is missing, build it from tokens (below), never from raw values.
5. **Check.** Run the checklist at the end of this file on everything you changed, fix what it finds, then report in a few lines what you built and what you checked.

## Never

- Raw colours, px values or durations: use tokens (`bg-card`, `text-muted-foreground`, `h-(--h-md)`, `duration-(--motion-base) ease-(--ease-standard)`).
- Solid red anywhere but the emergency stop. Destructive actions are the danger outline.
- Colour for normal states. Colour marks what is abnormal; status is always shape + word + colour (StatusGlyph, InlineStatus).
- Anything interactive under 44 px on touch. `--h-sm` (36) is for a mouse only and becomes 44 on touch by itself.
- A toast for something a person must act on (that is an Alarm), or a shake for an error (errors grow in under the field).
- Decorative or looping motion. Only the Spinner loops.
- An icon absolutely positioned over an Input (use InputGroup), a hand-built label + error (use Field), a hand-built count (use CountBadge), a battery bar (use Meter).

## Topics

Read the one the task touches:

- `references/design-language.md`: colour, type, spacing, radius, elevation, motion and touch rules, with the tokens.
- `references/checklist.md`: the checks to run after every UI change.
