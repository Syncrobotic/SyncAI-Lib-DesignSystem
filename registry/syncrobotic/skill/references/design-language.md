# SYNCROBOTIC design language

Everything here is a token in `syncrobotic-theme.css`; use the token, never the value.

## Colour: colour is for what needs someone
- Light is the default theme: it reads outdoors, in daylight and glare. Dark (`class="dark"` on `<html>`) is for control rooms and night shifts. Both are complete; never design for one only.
- Surfaces: `--background` is the page only; `--card` for panels, cards and the fields on them; `--popover` for overlays; `--muted` for tracks and the current page in navigation; `--accent` for hover.
- Text: `--foreground`, `--muted-foreground`. Text never takes a series or status colour except the status word itself. Disabled controls keep their words readable, never opacity on text: a filled control (field, button) becomes `bg-muted text-muted-foreground`; a text-only one (ghost and link buttons, tabs, segments, menu items) takes `text-disabled`, 3:1 on the page and lighter than secondary text. Say why it is disabled, beside it or in its label.
- Status: `warning` (needs attention), `danger` (needs someone now), each with a `-subtle` tint; pair foreground on tint. A calm state (normal, idle, busy, patrolling, charging) is grey: shape + neutral text. `success` green only for a confirmation that comes and goes (toast, alert), never for a state.
- Test and audit results (a test run, an evaluation, an audit): pass is grey with a check (neutral Badge, `CircleCheck`); fail is a danger outline and danger text (`CircleAlert`); not enough samples is grey with a dashed circle (outline Badge, `text-muted-foreground`, `CircleDashed`) and is never shown as a pass. Never a green pass: a pass is the expected result, a state, not a confirmation.
- Blue (`info`) only for a bounded process someone is waiting on: progress, a running stage, a command being sent. Never for a state, never for links (links are underlined foreground).
- Solid red (`--stop`) is the emergency stop only. Destructive actions: danger outline and text.
- Focus ring is the foreground colour (`--ring`), so focus never looks like a status.
- Selected controls (segmented control, toggle) are inverted. Current page in navigation: muted fill + weight; hover: accent.
- Charts: `--chart-1…5` for series identity in a fixed order, off the status hues; slot 5 is grey for Other or an earlier period. Up to five series in lines, bars and stacks; up to three (slots 1–3) in scatter plots and on maps, where any two marks can touch. A sixth is folded into Other, never a new colour. Never status colours for series. Pick the form from the question first (/docs/foundations/data-visualisation).
- Annotations on images (boxes and points over a photo): line style first, colour second. Predicted solid 2 px (`--annotate-predicted`), ground truth dashed 2 px (`--annotate-truth`), the previous version dotted at `--annotate-fade` (`--annotate-previous`), selected 3 px with corner handles (`--annotate-selected`, the focus ink). Every stroke is drawn first in `--annotate-halo`, 2 px wider (3:1 against it), so it shows on light and dark photos. The class is a word in the label, never a colour; never status colours.
- High contrast: `data-contrast="more"` on `<html>` or a container, in light or dark, for bright sun and low vision: 7:1 text and status, 3:1 edges, nothing translucent. Set it from `matchMedia("(prefers-contrast: more)")` or a setting; meanings do not change.

## Type
- Sizes: xs 12 (hints, metadata, tags), sm 14 (buttons, rows, labels), base 16 (body, inputs), lg 18 (card titles), xl 20 (section and sheet titles), 2xl 24 (the number that leads a card), 3xl 28 (page titles), 4xl 36 and 5xl 48 (marketing heroes only). Nothing else.
- Numbers are tabular. Weights: 400, 500, 700 only.

## Spacing, size and density
- 4 px base, steps 4, 8, 12, 16, 24, 32. Icon to label 8 (`gap-2`) everywhere: buttons, menus, tabs, nav, notes, alerts, alarms; the one exception is inside a 24 px Badge, 4.
- Heights are tokens: `--h-sm` 36 (mouse only; 44 on touch), `--h-md` 44 (minimum interactive), `--h-lg` 48, `--h-row` 56 (rows, bars), `--h-stop` 56 (stop, wake and slide to release only). Never hard-code a height: use the token so density works.
- Density: `data-density="glove"` on `<html>` or a container (48 px controls, 64 px rows and stop) for gloved outdoor work; `data-density="compact"` (36 px controls, 40 px rows, mouse only) for a control-room console. The stop never shrinks.
- App shell: panels 8 px apart and from the edge, 16 px inside each. Sheets float 8 px from the screen's edges too, every corner rounded.
- Action rail (a page that leads to one next step): the right column holds only that step, its title, one line, one `--h-lg` primary and a few small actions. On phones it is a floating bar fixed above the safe area, and the page is padded by its height. ← and Esc go back up a level, never while typing or with an overlay open.
- A top bar over plain page content is invisible at the top with its first and last controls on the content's edge; on scroll it gathers into a floating panel whose edges are the content column's.

## Radius
- 2xs 4 (controls 24 px and smaller), xs 8, sm 12, md 16, lg 20, xl 24. Nested corners are concentric: outer = inner + padding when the inner part is within 8 px of the corner.
- `rounded-full` only for things that are round: avatars, dots, switch, radio, slider, progress track, count badges.

## Elevation
- Surface: `bg-card ring-1 ring-border`, no shadow. Float (trays, save bars, toasts): `bg-float shadow-float ring-edge backdrop-blur-xl`. Overlay (menus, dialogs, tooltips): `bg-popover shadow-overlay ring-border`, with a scrim for modal ones.

## Motion: movement only marks a change of state
- Tokens: `--motion-fast` 120 ms (press, hover, icon swap, exits), `--motion-base` 200 ms (state changes, appear), `--motion-sheet` 320 ms (panels and frames that change size). Entering and changing: `ease-(--ease-standard)`; leaving: `ease-(--ease-exit)` (the disappear, sheet-out and collapse animations already use it).
- Patterns: appear / disappear, fade-in, sheet in/out, expand / collapse, press (`press` utility, scale .97), swap (icon to icon), move (a value or selection travelling).
- Between pages only the content moves (old: fade out, --motion-fast; new: fade in and 8 px rise, --motion-base). Anything inside a view transition cannot be clicked while it runs, so the root is never snapshotted (`:root { view-transition-name: none }`, `::view-transition { pointer-events: none }`) and the stop and the island are never inside one.
- Every enter has an exit (`usePresence` keeps leaving items mounted). Loops only for waiting: the Spinner, the skeleton's breath and the caret. Reduced motion: opacity only, loops stop.

## Touch and sound
- `@syncrobotic/feedback` holds one vibration pattern per safety moment (stop sent, confirmed, unconfirmed, release, new critical or high alarm) and the alarm tones. Use `feedback(name)`, never `navigator.vibrate` directly. Critical repeats until acknowledged; low is silent. Neither replaces the screen (no vibration on iOS; sound needs a first tap).

## Icons
- Lucide at 16, 20, 24 px, 2 px stroke, plus `@syncrobotic/robot-icons`. One icon per meaning: look the meaning up in the icon set (/icons) and use its icon; a new icon is a new entry there.

## Alarms
- Three priorities, each a shape, colour and word. An alarm stays until it clears and is acknowledged. Shelving is for a set time and never for critical; suppressed and out-of-service alarms are counted, not hidden silently. Over 10 in 10 minutes is a flood: name it, keep critical and high in view.

## Accessibility
- 44 × 44 targets on touch (48 in gloves); visible focus; never colour alone; icon-only buttons have aria-label; overlays trap focus and return it; new alarms are announced.
