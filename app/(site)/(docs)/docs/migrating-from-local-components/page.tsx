import type { Metadata } from "next"
import Link from "next/link"
import { readSource } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta, site } from "@/site/config"
import { Pager, TokenTable } from "@/site/doc"
import { startNeighbours } from "@/site/foundations"
import { H2, Inline, PageTitle, textLink } from "@/site/prose"
import { dotToGlyph } from "@/site/status-mapping"
import { installed } from "@/site/story-source"

const description =
  "Moving a product's own page header, metric card, section header, detail field, empty state, confirm dialog, date range and status dot to the SYNCROBOTIC kit: prop maps, a codemod and the order."

export const metadata: Metadata = pageMeta({ title: "Migrating from local components", description, path: "/docs/migrating-from-local-components" })

const registries = `{
  "registries": {
    "@localmind": "https://localmind.xyz/r/{name}.json",
    "@syncrobotic": "${site.registryUrl}/r/{name}.json"
  }
}`

const install = `npx shadcn add @syncrobotic/syncrobotic-theme
npx shadcn add @syncrobotic/status-glyph @syncrobotic/page-header @syncrobotic/section-header @syncrobotic/metric-card @syncrobotic/empty-state`

const codemod = `# In a checkout of the design system, next to the product's
node scripts/codemods/portal-to-kit.mjs ../portal/src           # dry run: a diff and the notes, nothing written
node scripts/codemods/portal-to-kit.mjs ../portal/src --write   # apply
npm run adoption -- ../portal                                  # what is left: every look-alike still defined`

type Row = [string, string, string]
const table = (rows: Row[]) => <TokenTable head={["Local", "Kit", "How"]} rows={rows.map((r) => r.map((c) => <Inline key={c} text={c} />))} />

const pageHeader: Row[] = [
  ["`title`, `description`, `className`", "the same", "The title is an h1; `as=\"h2\"` under another h1."],
  ["`badge`", "`badges`", "A state (online, revoked) goes in `status` as one `InlineStatus`, not in a badge. Codemod."],
  ["`back={{ href, label }}`", "`breadcrumb`", "A Breadcrumb ending at the parent page."],
  ["`actions={{ primary, secondary }}`", "`actions`", "The buttons themselves: a `primary` Button and `secondary` ones; more than two fold into a DropdownMenu with `DropdownMenuMoreTrigger`."],
  ["`icon`, `avatar`, `avatarUrl`, `avatarFallback`, `colorTheme`", "none", "Dropped: the breadcrumb says where, the title says what. Codemod."],
  ["(none)", "`meta`, `status`", "Facts as `MetaPill`s (counts, owner, last update); the page's state as `InlineStatus`."],
]
const metricCard: Row[] = [
  ["`label`, `value`", "the same", "The value already formatted (`formatCount`)."],
  ["`description`", "`caption`", "Codemod."],
  ["`isLoading`", "`loading`", "Codemod."],
  ["`internalHref`", "`href` with `linkAs={Link}`", "Codemod, importing your router's Link."],
  ["`href` (a new tab)", "none", "The kit's `href` stays in the tab; link to a page of your own."],
  ["`valueClassName` (a colour)", "`tone`", "`warning` or `danger`, with the reason in `caption`. The value stays ink."],
  ["`footer` (a sparkline)", "`series`", "The last values, oldest first."],
  ["`icon`, `compact`", "none", "Dropped; `MetricGrid` lays out the row. Codemod."],
  ["`onClick`", "none", "A card is a link or nothing: a Button in `caption`, or a page."],
  ["(none)", "`unit`, `delta`, `trend`, `unavailable`", "`unavailable` shows a dash and why, never a made-up 0."],
]
const sectionHeader: Row[] = [
  ["`SectionHeader` `title`, `description`", "the same", "16 px bold h2, outside cards."],
  ["`action`", "`actions`", "Codemod."],
  ["`Section` (header and children)", "`<section>` with `SectionHeader` first", "Codemod: `gap-3`, a `className` merged with `cn`."],
  ["`SubsectionHeader`", "`SectionHeader variant=\"surface\"`", "14 px medium h3, inside a card. Codemod."],
  ["`icon`, `tone`, `iconClassName`, `align`", "none", "Dropped: a heading is never coloured; say the state in words. Codemod."],
  ["(none)", "`count`, `as`, `id`", "`count` is written in full (1,284)."],
]
const detailField: Row[] = [
  ["a grid of `DetailField`s", "one `DescriptionList`", "`items={[{ label, value, … }]}` with `columns` (1–4) and `variant` (`plain` in a card, `bare` on one)."],
  ["`label`, `children`", "`label`, `value`", "An empty value is a dash, heard as Not set."],
  ["`hint`, `mono`, `icon`", "the same", "On the item."],
  ["`hintAs=\"tooltip\"`", "none", "The hint is always under the value."],
  ["(none)", "`copy`", "A copy button after an id or a fingerprint."],
]
const emptyState: Row[] = [
  ["`title`, `description`, `icon`, `className`", "the same", "The kit draws no icon by default (the Portal drew a Box)."],
  ["`actionLabel` with `actionHref` or `onAction`", "`action`", "The Button itself. Codemod."],
  ["`eyebrow`", "none", "Dropped. Codemod."],
  ["(none)", "`size`, `variant`", "`inline` in a table or list; `overlay` over a canvas."],
]
const confirmDialog: Row[] = [
  ["`open`, `onOpenChange`", "`AlertDialog`", "The same props."],
  ["`title`, `description`", "`AlertDialogTitle`, `AlertDialogDescription`", "The title is the question."],
  ["`confirmLabel`, `cancelLabel`", "the children of `AlertDialogAction`, `AlertDialogCancel`", "Required: name the consequence (\"Revoke key\"), never \"Confirm\"."],
  ["`variant=\"destructive\"`", "`AlertDialogAction destructive`", "The danger outline; never solid red."],
  ["`isLoading`, `confirmDisabled`, `confirmIcon`", "a `Button` inside `AlertDialogAction asChild`", "`loading`, `disabled`, the icon as a child."],
  ["`DeleteConfirmDialog`", "the destructive confirm pattern", "What is lost, who it affects, the name typed for the worst cases."],
  ["`InlineConfirmDialog` `trigger`", "`AlertDialogTrigger asChild`", "Uncontrolled."],
]
const dateRange: Row[] = [
  ["`from`, `to` (`YYYY-MM-DD`)", "`value` (`{ from?: Date, to?: Date }`)", "`parseISO` in, `format(d, \"yyyy-MM-dd\")` out, for the URL."],
  ["`onFromChange`, `onToChange`", "`onValueChange(range)`", "One callback for the range."],
  ["`label`", "a `Field` label, or `aria-label`", "Which date the range bounds."],
  ["the clear button", "`clearable`", ""],
  ["`to` not before `from`", "built in", "A range calendar cannot pick it."],
  ["(none)", "`presets`, `locale`, `labels`", "`datePickerLabels` from labels-zh-tw."],
]
const statusDot: Row[] = [
  ...Object.entries(dotToGlyph).map(([from, to]): Row => [`\`status="${from}"\``, `\`status="${to}"\``, from === "pending" ? "Waiting on a person: `warning`. Waiting on a process: `active`. Codemod picks `warning`." : "Codemod."]),
  ["`size`, `pulse`", "none", "12 px; loops are only for waiting. Dropped. Codemod."],
  ["a colour only", "a shape, and the word beside it", "The glyph is hidden from screen readers: write the status (`InlineStatus` draws both)."],
]

export default function MigratingPage() {
  return (
    <article>
      <PageTitle
        title="Migrating from local components"
        lead="A product that built its own page header, metric card or status dot moves to the kit's: set up the registry, run the codemod, then finish by hand what it lists. Written for the LocalMind Portal's components/common; any shadcn new-york product maps the same way."
      />

      <H2 id="setup">Set up the registry</H2>
      <p className="max-w-3xl pb-3 text-base">
        <Inline text="Add `@syncrobotic` beside the product's own registry in `components.json`, then the theme and the items the codemod moves." />
      </p>
      <div className="flex flex-col gap-4">
        <CodeBlock code={registries} lang="json" title="components.json" />
        <CodeBlock code={install} lang="bash" title="Terminal" />
      </div>
      <p className="max-w-3xl pt-3 text-base">
        <Inline text="Import the theme in `globals.css`, delete the product's own `:root`, `.dark`, `.light` and `@theme inline` colour blocks, and keep the brand in the brand layer. `node scripts/brand.mjs src/app/globals.css` lists every theme token still redefined and every brand pair below its contrast." />
      </p>
      <p className="max-w-3xl pt-3 text-base">
        <Inline text="The kit installs into the same folders. In the Portal, `card`, `button`, `alert-dialog`, `calendar`, `label` and `popover` already exist in `components/ui`, and `@syncrobotic/cn` writes `lib/utils.ts`, which would shadow `lib/utils/index.ts`. The CLI asks before it overwrites: decline `cn` (the same function) and take the others one at a time, on purpose: the kit's Button is `primary`, `secondary`, `outline`, not `default`." />
      </p>
      <p className="max-w-3xl pt-3 text-sm text-muted-foreground">
        The brand: <Link href="/docs/tokens#brand" className={textLink}>Design tokens, brand layer</Link>. Statuses:{" "}
        <Link href="/docs/foundations/color#healthy-is-grey" className={textLink}>
          healthy is grey
        </Link>
        .
      </p>

      <H2 id="order">Order</H2>
      <ol className="flex max-w-3xl list-decimal flex-col gap-2 pl-6 text-base">
        <li>
          <Inline text="Theme and brand. No call site changes; the product looks like the kit in its own purple." />
        </li>
        <li>
          <Inline text="Statuses: StatusDot to StatusGlyph, and `status-tone.ts` to the decision record's table. Grey when healthy." />
        </li>
        <li>
          <Inline text="The codemod: PageHeader, SectionHeader and Section, MetricCard, EmptyState, StatusDot." />
        </li>
        <li>
          <Inline text="By hand: DetailField, ConfirmDialog, DateRangeField, and the notes the codemod printed." />
        </li>
        <li>
          <Inline text="Delete the local files. `npm run adoption -- ../portal` lists every look-alike still defined, with its kit item." />
        </li>
      </ol>

      <H2 id="codemod">Codemod</H2>
      <CodeBlock code={codemod} lang="bash" title="Terminal" />
      <p className="max-w-3xl pt-3 text-base">
        <Inline text="It parses each file with the TypeScript compiler and changes only what it touches: the imports (to `@/components/ui/<item>`, StatusGlyph to `@/components/status-glyph`; `--ui`, `--components` and `--link-from` follow other aliases), the renamed props, StatusDot's statuses where every value is written in the file, EmptyState's action, Section's wrapper, and the imports a dropped prop leaves unused. Each dropped prop and each thing left to do is printed with its file and line." />
      </p>
      <p className="max-w-3xl pt-3 text-base">
        <Inline text="What it cannot do: rebuild PageHeader's `actions` and `back`, merge a grid of DetailFields into one list, rewrite a ConfirmDialog or a DateRangeField, map a status that comes from a variable, follow relative imports or spread props, or decide whether a pending state waits on a person or a process. Formatting is left to the product's formatter." />
      </p>

      <H2 id="page-header">PageHeader</H2>
      {table(pageHeader)}
      <H2 id="metric-card">MetricCard</H2>
      {table(metricCard)}
      <H2 id="section-header">SectionHeader, Section and SubsectionHeader</H2>
      {table(sectionHeader)}
      <H2 id="detail-field">DetailField to DescriptionList</H2>
      {table(detailField)}
      <H2 id="empty-state">EmptyState</H2>
      {table(emptyState)}
      <H2 id="confirm-dialog">ConfirmDialog to AlertDialog</H2>
      {table(confirmDialog)}
      <p className="max-w-3xl py-3 text-base">
        <Inline text="To move the look before the call sites, keep the props and build them on the kit's parts:" />
      </p>
      <CodeBlock code={readSource("site/snippets/confirm-dialog.tsx").split("\n").map((l) => (l.startsWith("} from") || l.startsWith("import") ? installed(l) : l)).join("\n")} lang="tsx" title="components/common/confirm-dialog.tsx" />
      <H2 id="date-range-field">DateRangeField to DateRangePicker</H2>
      {table(dateRange)}
      <H2 id="status-dot">StatusDot to StatusGlyph</H2>
      {table(statusDot)}

      <H2 id="no-equivalent">No equivalent yet</H2>
      <ul className="flex max-w-3xl list-disc flex-col gap-1 pl-6 text-base">
        <li>
          <Inline text="A page icon or avatar in the header, coloured icon tiles (`colorTheme`), and a stat card's icon: left out on purpose, colour is for what is abnormal." />
        </li>
        <li>
          <Inline text="A metric card that opens a dialog (`onClick`) or a new tab, and a hint folded into a tooltip (`hintAs`)." />
        </li>
        <li>
          <Inline text="The `brand` tone of `status-tone.ts`: a role or a plan is a fixed attribute, an outline Badge, not a state." />
        </li>
        <li>
          <Inline text="String dates in a date range: the picker takes Dates; the URL keeps the strings." />
        </li>
      </ul>

      <Pager {...startNeighbours("/docs/migrating-from-local-components")} />
    </article>
  )
}
