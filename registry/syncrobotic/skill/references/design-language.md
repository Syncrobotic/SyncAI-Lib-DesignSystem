# SYNCROBOTIC design language

Everything here is a token in `syncrobotic-theme.css`; use the token, never the value.

## Colour: colour is for what is abnormal
- Surfaces: `--background` is the page only; `--card` for panels, cards and the fields on them; `--popover` for overlays; `--muted` for tracks and the current page in navigation; `--accent` for hover.
- Text: `--foreground`, `--muted-foreground`. Text never takes a series or status colour except the status word itself.
- Status: `info` (in progress), `success`, `warning`, `danger`, each with a `-subtle` tint. Pair foreground on tint. Normal and in-progress render as shape + neutral text.
- Solid red (`--stop`) is the emergency stop only. Destructive actions: danger outline and text.
- Selected controls (segmented control, toggle) are inverted. Current page in navigation: muted fill + weight; hover: accent.
- Charts: `--chart-1…5` for series identity in a fixed order. Never status colours for series.

## Type
- Sizes: xs 12 (hints, metadata, tags), sm 14 (buttons, rows, labels), base 16 (body, inputs), lg 18 (card titles), xl 20 (section and sheet titles), 2xl+ (page titles).
- Numbers are tabular. Weights: regular, medium, bold.

## Spacing and size
- 4 px base, steps 4, 8, 12, 16, 24, 32. Icon to label 8 (`gap-2`) everywhere: buttons, menus, tabs, nav, notes, alerts, alarms; the one exception is inside a 24 px Badge, 4.
- Heights: `--h-sm` 36 (mouse only; 44 on touch), `--h-md` 44 (minimum interactive), `--h-lg` 48, `--h-row` 56 (rows, bars), `--h-stop` 56 (stop only).
- App shell: panels 8 px apart and from the edge, 16 px inside each.

## Radius
- xs 8, sm 12, md 16, lg 20, xl 24. Nested corners are concentric: outer = inner + padding when the inner part is within 8 px of the corner.
- `rounded-full` only for things that are round: avatars, dots, switch, radio, slider, progress track, count badges.

## Elevation
- Surface: `bg-card ring-1 ring-border`, no shadow. Float (trays, save bars, toasts): `bg-float shadow-float ring-edge backdrop-blur-xl`. Overlay (menus, dialogs, tooltips): `bg-popover shadow-overlay ring-border`, with a scrim for modal ones.

## Motion: movement only marks a change of state
- Tokens: `--motion-fast` 120 ms (press, hover, icon swap, exits), `--motion-base` 200 ms (state changes, appear), `--motion-sheet` 320 ms (panels and frames that change size). Always `ease-(--ease-standard)`.
- Patterns: appear / disappear, fade-in, sheet in/out, expand / collapse, press (`press` utility, scale .97), swap (icon to icon), move (a value or selection travelling).
- Every enter has an exit (`usePresence` keeps leaving items mounted). Nothing loops except the Spinner. Reduced motion: opacity only.

## Accessibility
- 44 × 44 targets on touch; visible focus (outline-ring); never colour alone; icon-only buttons have aria-label; overlays trap focus and return it.
