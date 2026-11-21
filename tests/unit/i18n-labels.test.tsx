import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { zhTW } from "react-day-picker/locale"
import { afterEach, describe, expect, it } from "vitest"
import { Attachment } from "@/registry/syncrobotic/ui/attachment"
import { Autocomplete } from "@/registry/syncrobotic/ui/autocomplete"
import { Breadcrumb, BreadcrumbPage } from "@/registry/syncrobotic/ui/breadcrumb"
import { Calendar } from "@/registry/syncrobotic/ui/calendar"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
import { CommandDialog, CommandList } from "@/registry/syncrobotic/ui/command"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { DataGrid, DataGridTable, selectColumn } from "@/registry/syncrobotic/ui/data-grid"
import { DatePicker } from "@/registry/syncrobotic/ui/date-selector"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/registry/syncrobotic/ui/dialog"
import { Filters, type FilterField } from "@/registry/syncrobotic/ui/filters"
import { LoadMore } from "@/registry/syncrobotic/ui/load-more"
import { PhoneInput } from "@/registry/syncrobotic/ui/phone-input"
import { Questionnaire } from "@/registry/syncrobotic/ui/questionnaire"
import { RouteProgress } from "@/registry/syncrobotic/ui/route-progress"
import { SearchField } from "@/registry/syncrobotic/ui/search-field"
import { ShareBar } from "@/registry/syncrobotic/ui/share-bar"
import { Sortable, SortableHandle, SortableItem } from "@/registry/syncrobotic/ui/sortable"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { Stepper, StepperCompact, StepperItem } from "@/registry/syncrobotic/ui/stepper"
import { TimePicker } from "@/registry/syncrobotic/ui/time-picker"
import { Trace, TraceHeader, TraceItem } from "@/registry/syncrobotic/ui/trace"

// Every component that says words takes `labels` (and `locale` where it formats numbers, dates or times): a product team
// translates the kit without editing its source. Each test passes its own words and finds them in the DOM.
afterEach(cleanup)

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })

describe("labels reach the DOM", () => {
  it("Spinner", () => {
    render(<Spinner delay={0} labels={{ loading: "載入中" }} />)
    expect(screen.getByRole("status", { name: "載入中" })).toBeTruthy()
  })

  it("RouteProgress", async () => {
    render(<RouteProgress active delay={0} labels={{ loading: "頁面載入中" }} />)
    await flush()
    expect(screen.getByRole("progressbar", { name: "頁面載入中" })).toBeTruthy()
  })

  it("DialogContent", () => {
    render(
      <Dialog open>
        <DialogContent labels={{ close: "關閉" }}>
          <DialogTitle>刪除任務</DialogTitle>
          <DialogDescription>無法復原。</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByRole("button", { name: "關閉" })).toBeTruthy()
  })

  it("Breadcrumb", () => {
    render(
      <Breadcrumb labels={{ nav: "導覽路徑" }}>
        <BreadcrumbPage>站點</BreadcrumbPage>
      </Breadcrumb>,
    )
    expect(screen.getByRole("navigation", { name: "導覽路徑" })).toBeTruthy()
  })

  it("CopyButton", () => {
    render(<CopyButton value="sk_live_1" labels={{ copy: "複製金鑰" }} />)
    expect(screen.getByRole("button", { name: "複製金鑰" })).toBeTruthy()
  })

  it("Autocomplete", () => {
    render(<Autocomplete aria-label="機器人" options={[]} labels={{ placeholder: "搜尋機器人", showAll: "顯示全部" }} />)
    expect(screen.getByPlaceholderText("搜尋機器人")).toBeTruthy()
    expect(screen.getByRole("button", { name: "顯示全部" })).toBeTruthy()
  })

  it("ChipGroup, with counts in the locale", () => {
    const items = [
      { value: "all", label: "All", count: 12345 },
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ]
    render(<ChipGroup label="區域" items={items} max={1} labels={{ more: (n) => `還有 ${n} 個` }} locale="de" />)
    expect(screen.getByRole("button", { name: "還有 2 個" })).toBeTruthy()
    expect(screen.getByText("12.345")).toBeTruthy()
  })

  it("CommandDialog", () => {
    render(
      <CommandDialog open labels={{ title: "搜尋", description: "搜尋頁面、機器人與動作" }}>
        <CommandList />
      </CommandDialog>,
    )
    expect(screen.getByRole("dialog", { name: "搜尋" })).toBeTruthy()
  })

  it("DataGrid", () => {
    type Row = { name: string }
    const columns: ColumnDef<Row>[] = [selectColumn<Row>(), { accessorKey: "name", header: "Robot" }]
    function Grid() {
      const table = useReactTable<Row>({ data: [], columns, getCoreRowModel: getCoreRowModel() })
      return (
        <DataGrid table={table} labels={{ region: "資料", empty: "沒有資料", selectAll: "全選本頁" }}>
          <DataGridTable />
        </DataGrid>
      )
    }
    render(<Grid />)
    expect(screen.getByRole("region", { name: "資料" })).toBeTruthy()
    expect(screen.getByText("沒有資料")).toBeTruthy()
    expect(screen.getByRole("checkbox", { name: "全選本頁" })).toBeTruthy()
  })

  it("DatePicker, with the day in the locale", () => {
    const { rerender } = render(<DatePicker labels={{ pickDay: "選擇日期" }} />)
    expect(screen.getByRole("button", { name: "選擇日期" })).toBeTruthy()
    rerender(<DatePicker value={new Date(2026, 10, 3)} locale="zh-TW" clearable labels={{ clear: "清除" }} />)
    expect(screen.getByText("2026年11月3日")).toBeTruthy()
    expect(screen.getByRole("button", { name: "清除" })).toBeTruthy()
  })

  it("Calendar, with a react-day-picker locale", () => {
    render(<Calendar mode="single" locale={zhTW} month={new Date(2026, 10, 1)} />)
    expect(screen.getAllByRole("button", { name: /2026年11月3日/ }).length).toBeGreaterThan(0)
  })

  it("PhoneInput", () => {
    render(<PhoneInput labels={{ country: "國家", phoneNumber: "手機號碼" }} locale="zh-TW" />)
    expect(screen.getByRole("combobox", { name: "國家" })).toBeTruthy()
    expect(screen.getByRole("textbox", { name: "手機號碼" })).toBeTruthy()
  })

  it("Questionnaire", () => {
    render(
      <Questionnaire
        onSubmit={() => {}}
        labels={{ next: "下一題", position: (n, total) => `第 ${n} 題，共 ${total} 題` }}
        questions={[
          { id: "a", type: "text", title: "地點" },
          { id: "b", type: "text", title: "備註" },
        ]}
      />,
    )
    expect(screen.getByRole("button", { name: "下一題" })).toBeTruthy()
    expect(screen.getByText("第 1 題，共 2 題")).toBeTruthy()
  })

  it("SearchField", () => {
    render(<SearchField labels={{ label: "搜尋", placeholder: "搜尋機器人與站點" }} hotkey={null} />)
    expect(screen.getByRole("search", { name: "搜尋" })).toBeTruthy()
    expect(screen.getByPlaceholderText("搜尋機器人與站點")).toBeTruthy()
  })

  it("Attachment", () => {
    render(<Attachment name="report.pdf" status="error" onRemove={() => {}} labels={{ uploadFailed: "上傳失敗", remove: (n) => `移除 ${n}` }} />)
    expect(screen.getByText("上傳失敗")).toBeTruthy()
    expect(screen.getByRole("button", { name: "移除 report.pdf" })).toBeTruthy()
  })

  it("Stepper and StepperCompact", () => {
    render(
      <>
        <Stepper value={1} labels={{ current: "目前步驟" }}>
          <StepperItem title="連線" />
          <StepperItem title="校正" />
        </Stepper>
        <StepperCompact value={1} total={2} labels={{ position: (n, t) => `步驟 ${n}/${t}`, progress: "步驟" }} />
      </>,
    )
    expect(screen.getByText(/目前步驟/)).toBeTruthy()
    expect(screen.getByText("步驟 1/2")).toBeTruthy()
    expect(screen.getByRole("progressbar", { name: "步驟" })).toBeTruthy()
  })

  it("Sortable", async () => {
    render(
      <Sortable value={["a"]} onValueChange={() => {}} getId={(x) => x} labels={{ instructions: "按空白鍵拿起" }}>
        <SortableItem id="a">
          <SortableHandle label="移動 a" />
        </SortableItem>
      </Sortable>,
    )
    expect(await screen.findByText("按空白鍵拿起")).toBeTruthy()
  })

  it("Trace and TraceHeader", () => {
    render(
      <>
        <TraceHeader title="任務" status="done" counts={{ done: 3 }} labels={{ done: "完成", count: (n, s) => `${n} 個${s}` }} />
        <Trace labels={{ running: "執行中", duration: (ms) => `${ms} 毫秒` }}>
          <TraceItem status="running" title="導航" duration={840} />
        </Trace>
      </>,
    )
    expect(screen.getByText("3 個完成")).toBeTruthy()
    expect(screen.getByText(/執行中/)).toBeTruthy()
    expect(screen.getByText("840 毫秒")).toBeTruthy()
  })

  it("TimePicker, with times in the locale", () => {
    const { rerender } = render(<TimePicker labels={{ placeholder: "選擇時間" }} />)
    expect(screen.getByText("選擇時間")).toBeTruthy()
    rerender(<TimePicker value="09:30" hour12 locale="zh-TW" />)
    expect(screen.getByText(/上午\s?9:30/)).toBeTruthy()
  })

  it("Filters counts in the locale", async () => {
    const fields: FilterField[] = [{ key: "site", label: "Site", type: "option", options: [{ value: "north", label: "North", count: 12345 }] }]
    render(<Filters fields={fields} defaultValue={[{ id: "site", field: "site", operator: "is", value: "north" }]} locale="de" />)
    fireEvent.click(screen.getByRole("button", { name: "North, change value" }))
    expect(await screen.findByText("12.345")).toBeTruthy()
  })

  it("LoadMore, with numbers in the locale", () => {
    render(<LoadMore shown={20} total={12345} step={20} onMore={() => {}} locale="de" labels={{ more: (n, left, locale) => `再顯示 ${n} 筆（剩 ${left.toLocaleString(locale)} 筆）` }} />)
    expect(screen.getByText("Showing 20 of 12.345")).toBeTruthy()
    expect(screen.getByRole("button", { name: "再顯示 20 筆（剩 12.325 筆）" })).toBeTruthy()
  })

  it("ShareBar, with numbers in the locale", () => {
    render(<ShareBar label="影像" segments={[{ key: "t", label: "訓練", value: 1234 }]} locale="de" />)
    expect(screen.getByRole("img", { name: "影像: 訓練 1.234" })).toBeTruthy()
  })
})
