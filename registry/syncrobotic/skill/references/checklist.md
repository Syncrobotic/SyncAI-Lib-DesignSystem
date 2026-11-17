# Check after every UI change

Run through each line for the files you changed, fix what fails, then report.

1. Every value is a token: no hex, no `px` in class names, no `duration-150`, no `ease-in-out`.
2. Every duration class has `ease-(--ease-standard)` next to it.
3. Interactive things are at least `h-(--h-md)` on touch; `--h-sm` only for mouse-only density.
4. Colour appears only on abnormal states; status has a shape and a word; no solid red except the stop.
5. Each registry part is used as documented in its `.md` twin (Field around controls, InputGroup for icons in inputs, Meter for levels, CountBadge for counts, Alarm for what needs action).
6. Enter and exit both animate; nothing loops but the Spinner; reduced motion is respected.
7. Icon-only buttons have an aria-label; images have alt; headings are in order; focus is visible.
8. Empty, loading and error states exist for every list, table and page you touched.
9. Light and dark both read correctly (the theme does this if you used tokens).
10. In this repo: `npm run lint:tokens && npm run lint:motion && npm run typecheck` pass.
