import type { Metadata } from "next"
import Link from "next/link"
import { getItem } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { Pager, TokenTable } from "@/site/doc"
import { startNeighbours } from "@/site/foundations"
import props from "@/site/props.json"
import { H2, Inline, PageTitle, Rules } from "@/site/prose"

const description =
  "Translate every word the kit's components show or say to screen readers, and format numbers, days and times in your app's language: the labels and locale props."

export const metadata: Metadata = pageMeta({ title: "Localisation", description, path: "/docs/localisation" })

type Key = { name: string; type: string; default?: string; description: string }
type Prop = { name: string; type: string; description: string; keys?: Key[] }
type Part = { name: string; props: Prop[] }
const table = props as unknown as Record<string, Part[] | string>

// Generated from the source (scripts/props.mjs writes each labels prop's keys, defaults and notes into site/props.json),
// so the table below never drifts from the components.
const withLabels = Object.entries(table)
  .filter((e): e is [string, Part[]] => Array.isArray(e[1]))
  .flatMap(([item, parts]) => {
    // Parts of one item that take the same words (Trace and TraceHeader) share a table.
    const groups: { names: string[]; keys: Key[] }[] = []
    for (const part of parts) {
      const keys = part.props.find((p) => p.name === "labels")?.keys
      if (!keys?.length) continue
      const sig = keys.map((k) => k.name).join()
      const same = groups.find((g) => g.keys.map((k) => k.name).join() === sig)
      if (same) same.names.push(part.name)
      else groups.push({ names: [part.name], keys })
    }
    return groups.map((g) => ({ item, ...g }))
  })

const withLocale = Object.entries(table)
  .filter((e): e is [string, Part[]] => Array.isArray(e[1]))
  .flatMap(([item, parts]) => parts.flatMap((part) => part.props.filter((p) => p.name === "locale" || p.name === "calendarLocale").map((p) => ({ item, part: part.name, prop: p }))))

const pattern = `// The kit's own pattern, in every component that says words (here, Spinner).
export type SpinnerLabels = {
  /** The spinner's name for screen readers. */
  loading: string
}

// The English words, exported: spread them to change one or two.
export const defaultSpinnerLabels: SpinnerLabels = { loading: "Loading" }

export function Spinner({ labels, ...props }: { labels?: Partial<SpinnerLabels> /* … */ }) {
  const l = { ...defaultSpinnerLabels, ...labels } // any key you leave out stays English
  // …
}`

const example = `// lib/kit-labels.zh-TW.ts: the kit's words for the Taiwan console, in one place.
import type { DataGridLabels } from "@/components/ui/data-grid"
import type { DatePickerLabels } from "@/components/ui/date-selector"
import type { QuestionnaireLabels } from "@/components/ui/questionnaire"

export const locale = "zh-TW"

export const dataGrid: Partial<DataGridLabels> = {
  region: "機器人列表",
  empty: "沒有符合的機器人",
  resize: (column) => \`調整「\${column}」欄寬\`,
  ascending: "遞增排序",
  descending: "遞減排序",
  hideColumn: "隱藏此欄",
  columns: "欄位",
  showColumns: "顯示欄位",
  selected: (count, total) => \`已選取 \${count} / \${total}\`,
  selectAll: "選取本頁全部",
  selectRow: "選取此列",
}

export const datePicker: Partial<DatePickerLabels> = { pickDay: "選擇日期", clear: "清除" }

export const questionnaire: Partial<QuestionnaireLabels> = {
  position: (n, total) => \`第 \${n} 題，共 \${total} 題\`,
  percent: (n) => \`\${n}%\`,
  back: "上一題",
  next: "下一題",
  submit: "送出檢查表",
  required: "請回答這一題再繼續。",
  requiredMark: "（必填）",
}`

const usage = `"use client"

import { zhTW } from "react-day-picker/locale"
import { DataGrid, DataGridTable } from "@/components/ui/data-grid"
import { DatePicker } from "@/components/ui/date-selector"
import * as zh from "@/lib/kit-labels.zh-TW"

export function ServiceLog({ table }: { table: Parameters<typeof DataGrid>[0]["table"] }) {
  return (
    <>
      {/* The trigger reads "2026年11月3日"; the calendar names months and days in Chinese. */}
      <DatePicker aria-label="保養日期" locale={zh.locale} calendarLocale={zhTW} labels={zh.datePicker} clearable />
      <DataGrid table={table} labels={zh.dataGrid}>
        <DataGridTable />
      </DataGrid>
    </>
  )
}`

const intl = `// With next-intl (or any i18n library you already use), build the same objects from your messages.
const t = useTranslations("kit.dataGrid")
const labels: Partial<DataGridLabels> = {
  empty: t("empty"),
  selected: (count, total) => t("selected", { count, total }),
}`

const mono = "font-mono text-sm"
const linkCls = "whitespace-nowrap font-mono text-sm underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"

function ItemLink({ item, names }: { item: string; names: string[] }) {
  const text = names.join(", ")
  return getItem(item) ? (
    <Link href={`/docs/components/${item}`} className={linkCls}>
      {text}
    </Link>
  ) : (
    <span className={mono}>{text}</span>
  )
}

function P({ text, className = "pb-3" }: { text: string; className?: string }) {
  return (
    <p className={`max-w-3xl text-base ${className}`}>
      <Inline text={text} />
    </p>
  )
}

export default function LocalisationPage() {
  return (
    <article>
      <PageTitle
        title="Localisation"
        lead="Every word a component shows or says to a screen reader can be replaced from outside, and numbers, days and times follow the locale you pass. No i18n library: your app hands the kit its words."
      />

      <H2 id="why">Why labels and locale</H2>
      <P text="The kit ships in English, but products run in Taiwan, Japan and Europe. A component is only translated when all of it is: the button text, the empty message, and the names only a screen reader hears (`Clear`, `Select row`, `Picked up Dock A. Position 2 of 5.`). Editing the installed source would be lost on the next `npx shadcn add --overwrite`, so every one of these words comes in through a prop." />
      <P text="Numbers, days and times are words too. A count of 12,345 is written 12.345 in German; 3 November 2026 is 2026年11月3日 in Taiwan. Components that write a number, a day or a time themselves take `locale` and format with the browser's Intl, so nothing is added to your bundle." />

      <H2 id="pattern">The pattern</H2>
      <P text="Each component that says words exports a `<Name>Labels` type and its English `default<Name>Labels`, and takes `labels`, a partial: pass only the keys you change. A word that contains a number or a name is a function, so each language can put it where its grammar wants it." />
      <CodeBlock code={pattern} lang="tsx" title="registry/syncrobotic/ui/spinner.tsx" />
      <div className="pt-4">
        <Rules
          rules={[
            "Leave `labels` out and nothing changes: the defaults are today's English words.",
            "Older single props (`label`, `placeholder`, `emptyText`, `closeLabel`…) still work, and win over `labels` when both are given.",
            "An `aria-label` you pass still names the element; `labels` fills in when there is none.",
            "`locale` is a BCP 47 tag (`zh-TW`, `en-GB`, `de`). Left out, numbers use the browser's language as before; days, times and country names keep the kit's English form.",
            "Text you pass as data (titles, options, column headers, presets) is already yours to translate; `labels` covers only the words the kit writes itself.",
          ]}
        />
      </div>

      <H2 id="example">A worked example: zh-TW</H2>
      <P text="Keep the kit's words for each language in one file and pass them where the components are used. The objects are plain data, so a Server Component can pass the strings; a function label (a count) needs a client file, like any other function prop." />
      <div className="flex flex-col gap-4">
        <CodeBlock code={example} lang="ts" title="lib/kit-labels.zh-TW.ts" />
        <CodeBlock code={usage} lang="tsx" title="app/(app)/service/service-log.tsx" />
        <CodeBlock code={intl} lang="tsx" title="With an i18n library" />
      </div>

      <H2 id="locale">Components that take locale</H2>
      <TokenTable
        head={["Component", "Prop", "What it formats"]}
        rows={withLocale.map((r) => [
          <ItemLink key="c" item={r.item} names={[r.part]} />,
          <code key="p" className={mono}>
            {r.prop.name}
          </code>,
          <span key="d" className="text-muted-foreground">
            <Inline text={r.prop.description} />
          </span>,
        ])}
      />
      <P
        className="pt-3"
        text="Calendar takes react-day-picker's own `locale` and `labels` (`import { zhTW } from &quot;react-day-picker/locale&quot;`): month names, weekdays and its buttons follow it."
      />

      <H2 id="labels">Every component&apos;s labels</H2>
      <P text={`${withLabels.length} components, each key with its English default and what it is. Functions receive the number or name to place in the sentence.`} />
      <div className="flex flex-col gap-8">
        {withLabels.map((g) => (
          <section key={`${g.item}-${g.names.join()}`} aria-labelledby={`labels-${g.item}-${g.names[0]}`} className="flex flex-col gap-3">
            <h3 id={`labels-${g.item}-${g.names[0]}`} className="text-base font-medium">
              <ItemLink item={g.item} names={g.names} />
            </h3>
            <TokenTable
              head={["Key", "English default"]}
              rows={g.keys.map((k) => [
                <code key="k" className={mono}>
                  {k.name}
                </code>,
                <span key="d" className="flex flex-col gap-1">
                  <code className="font-mono text-xs break-words">{k.default ?? k.type}</code>
                  {k.description && (
                    <span className="text-muted-foreground">
                      <Inline text={k.description} />
                    </span>
                  )}
                </span>,
              ])}
            />
          </section>
        ))}
      </div>
      <Pager {...startNeighbours("/docs/localisation")} />
    </article>
  )
}
