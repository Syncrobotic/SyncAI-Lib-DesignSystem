# Check after every UI change

Run through each line for the files you changed, fix what fails, then report.

1. Every value is a token: no hex, no `px` in class names, no `duration-150`, no `ease-in-out`, no font size or weight off the scale.
2. Every duration class has `ease-(--ease-standard)` beside it. Leaving uses the exit animations (`animate-disappear`, sheet-out, collapse), which carry `--ease-exit`.
3. Interactive things are at least 44 px on touch; 36 (`--h-sm`) with a mouse only. They use height tokens, never fixed sizes, so `data-density` (glove, compact) works.
4. Colour appears only on what needs someone; calm states are grey (offline too); blue only for a bounded process being waited on (the running work's bar or cell is blue, its state word stays grey); status is a shape and a word, colour only when it is abnormal; no solid red except the stop; disabled text stays readable; battery warns below 15 % and never turns danger.
5. Every chart with axes (line, area, bar, heatmap) has a table view; chart colour is only on the series that matters (`--chart-1`), the rest graphite, three series and Other at most; sparklines, rings and status strips write their numbers in words instead; field edges use `--input`; nothing focusable removes its focus ring (`outline-none` only with a visible replacement).
6. Each registry part is used as documented in its `.md` twin (Field around controls, InputGroup for icons in inputs, Meter for levels, CountBadge for counts, Alarm for what needs action, NumberField for numbers).
7. Enter and exit both animate; loops only while waiting (Spinner, skeleton, caret); reduced motion is respected.
8. Icons come from the icon set, one meaning each; icon-only buttons have an aria-label; images have alt; headings are in order (no skipped level: CardTitle, AccordionTrigger and PageHeader take `as`, CardDataHeader `titleAs`, so a card or accordion right under the h1 is an h2); focus is visible.
9. Empty, loading and error states exist for every list, table and page you touched.
10. Light and dark both read correctly (the theme does this if you used tokens).
