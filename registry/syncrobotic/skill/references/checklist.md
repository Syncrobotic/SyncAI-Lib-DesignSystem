# Check after every UI change

Run through each line for the files you changed, fix what fails, then report.

1. Every value is a token: no hex, no `px` in class names, no `duration-150`, no `ease-in-out`, no font size or weight off the scale.
2. Every duration class has an easing token next to it: `ease-(--ease-standard)` for entering and changing, `ease-(--ease-exit)` for leaving.
3. Interactive things are at least `h-(--h-md)` and use height tokens, never fixed sizes, so `data-density` (glove, compact) works; `--h-sm` only for mouse-only density.
4. Colour appears only on what needs someone; calm states are grey (offline too); blue only for a bounded process being waited on; status has a shape and a word; no solid red except the stop; disabled text stays readable; battery warns below 15 % and never turns danger.
5. Every chart has a table view; field edges use `--input`; nothing focusable removes its focus ring (`outline-none` only with a visible replacement).
6. Each registry part is used as documented in its `.md` twin (Field around controls, InputGroup for icons in inputs, Meter for levels, CountBadge for counts, Alarm for what needs action, NumberField for numbers).
7. Enter and exit both animate; loops only while waiting (Spinner, skeleton, caret); reduced motion is respected.
8. Icons come from the icon set, one meaning each; icon-only buttons have an aria-label; images have alt; headings are in order; focus is visible.
9. Empty, loading and error states exist for every list, table and page you touched.
10. Light and dark both read correctly (the theme does this if you used tokens).
11. In this repo: `npm run lint:tokens && npm run lint:motion && npm run typecheck` pass.
