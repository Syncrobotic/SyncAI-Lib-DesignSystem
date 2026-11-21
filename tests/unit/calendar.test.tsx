import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import * as React from "react"
import { zhTW } from "react-day-picker/locale/zh-TW"
import { afterEach, describe, expect, it } from "vitest"
import { Calendar } from "@/registry/syncrobotic/ui/calendar"
import { DatePicker, DateRangePicker, type DateRange } from "@/registry/syncrobotic/ui/date-selector"

// Calendar and the date selector wrap react-day-picker. These tests pin down what the kit promises on top of the library
// (its classNames on each part, its day button, its spoken names, Monday first), so a major upgrade of the library that
// changes any of it fails here instead of in a product.
afterEach(cleanup)

const november = new Date(2026, 10, 1)
// The kit's own spoken name of a day starts with the number on the button, so it is what a test looks a day up by.
const day = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`) })
const cell = (name: string) => day(name).closest("td")!

describe("Calendar", () => {
  it("starts weeks on Monday and names each day with its number first", () => {
    render(<Calendar mode="single" month={november} />)
    const weekdays = [...document.querySelectorAll("thead th")].map((th) => th.textContent)
    expect(weekdays[0]).toBe("Mo")
    expect(weekdays[6]).toBe("Su")
    expect(day("3 November 2026, Tuesday")).toBeTruthy()
  })

  it("marks the picked day as selected, inverted, and says so", () => {
    render(<Calendar mode="single" month={november} selected={new Date(2026, 10, 12)} />)
    const picked = day("12 November 2026, Thursday, selected")
    expect(picked.className).toContain("bg-primary")
    expect(cell("12 November 2026").getAttribute("aria-selected")).toBe("true")
  })

  it("rings today and sets it in bold", () => {
    render(<Calendar mode="single" month={november} today={new Date(2026, 10, 21)} />)
    const today = day("21 November 2026, Saturday, today")
    expect(today.className).toContain("font-bold")
    expect(today.className).toContain("ring-1")
  })

  it("picks a range in two clicks and fills between its ends", () => {
    function Range() {
      const [range, setRange] = React.useState<DateRange | undefined>()
      return <Calendar mode="range" month={november} selected={range} onSelect={setRange} />
    }
    render(<Range />)
    fireEvent.click(day("3 November 2026"))
    fireEvent.click(day("6 November 2026"))
    // The ends are inverted buttons; the cells between them carry the muted fill, and each end's cell rounds its own side.
    expect(day("3 November 2026").className).toContain("bg-primary")
    expect(day("6 November 2026").className).toContain("bg-primary")
    expect(cell("3 November 2026").className).toContain("rounded-l-xs")
    expect(cell("6 November 2026").className).toContain("rounded-r-xs")
    for (const middle of ["4 November 2026", "5 November 2026"]) {
      expect(cell(middle).className).toContain("bg-muted")
      expect(day(middle).className).toContain("rounded-none")
      expect(day(middle).className).not.toContain("bg-primary")
    }
    expect(cell("7 November 2026").className).not.toContain("bg-muted")
  })

  it("refuses a disabled day: the button is disabled, struck through, and a click selects nothing", () => {
    let picked: Date | undefined
    render(<Calendar mode="single" month={november} disabled={{ before: new Date(2026, 10, 10) }} onSelect={(d) => (picked = d)} />)
    const off = day("9 November 2026")
    expect((off as HTMLButtonElement).disabled).toBe(true)
    expect(off.className).toContain("line-through")
    expect(cell("9 November 2026").className).toContain("text-disabled")
    fireEvent.click(off)
    expect(picked).toBeUndefined()
    fireEvent.click(day("10 November 2026"))
    expect(picked?.getDate()).toBe(10)
  })

  it("dims the days of neighbouring months on a single month, and hides them with two", () => {
    const { unmount } = render(<Calendar mode="single" month={november} />)
    expect(cell("26 October 2026").className).toContain("text-muted-foreground")
    unmount()
    render(<Calendar mode="single" month={november} numberOfMonths={2} />)
    // The 26 October cell is still there to keep the grid's shape, but invisible and without a button.
    expect(screen.queryByRole("button", { name: /^26 October 2026/ })).toBeNull()
    expect(screen.getAllByRole("grid")).toHaveLength(2)
  })

  it("moves focus with the arrow keys, Home, End and Page Down, and picks the focused day", () => {
    let picked: Date | undefined
    // defaultMonth, not month: a controlled month would hold the grid on November when Page Down asks for December.
    render(<Calendar mode="single" defaultMonth={november} onSelect={(d) => (picked = d)} />)
    const start = day("3 November 2026")
    act(() => start.focus())
    const key = (k: string) => act(() => void fireEvent.keyDown(document.activeElement!, { key: k }))
    key("ArrowRight")
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/^4 November 2026/)
    key("ArrowDown")
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/^11 November 2026/)
    // Home and End go to the week's first and last day, which is Monday to Sunday in the kit.
    key("Home")
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/^9 November 2026, Monday/)
    key("End")
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/^15 November 2026, Sunday/)
    // Page Down turns the month and keeps the day.
    key("PageDown")
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(/^15 December 2026/)
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("December 2026")
    fireEvent.click(document.activeElement!)
    expect(picked?.getMonth()).toBe(11)
    expect(picked?.getDate()).toBe(15)
  })

  it("turns the month with its previous and next buttons", () => {
    render(<Calendar mode="single" defaultMonth={november} />)
    fireEvent.click(screen.getByRole("button", { name: "Go to the Next Month" }))
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("December 2026")
    fireEvent.click(screen.getByRole("button", { name: "Go to the Previous Month" }))
    fireEvent.click(screen.getByRole("button", { name: "Go to the Previous Month" }))
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("October 2026")
  })

  it("writes month, weekdays and day names in a react-day-picker locale", () => {
    render(<Calendar mode="single" locale={zhTW} month={november} selected={new Date(2026, 10, 3)} />)
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("2026年11月")
    const weekdays = [...document.querySelectorAll("thead th")].map((th) => th.textContent)
    expect(weekdays).toEqual(["一", "二", "三", "四", "五", "六", "日"])
    // The locale's own spoken name replaces the kit's English one, selected state included.
    expect(screen.getByRole("button", { name: "2026年11月3日 星期二，已選取" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "前往下個月" })).toBeTruthy()
  })
})

describe("DatePicker and DateRangePicker", () => {
  it("picks a day from its calendar, writes it on the trigger and closes", async () => {
    function Picker() {
      const [value, setValue] = React.useState<Date | undefined>(new Date(2026, 10, 3))
      return <DatePicker aria-label="Service date" value={value} onValueChange={setValue} />
    }
    render(<Picker />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Service date 3 Nov 2026" })))
    await act(async () => fireEvent.click(day("12 November 2026")))
    expect(screen.getByRole("button", { name: "Service date 12 Nov 2026" })).toBeTruthy()
    expect(screen.queryByRole("grid")).toBeNull()
  })

  it("keeps a disabled day out of reach", async () => {
    const picks: (Date | undefined)[] = []
    render(<DatePicker aria-label="Service date" value={new Date(2026, 10, 12)} disabledDays={{ before: new Date(2026, 10, 10) }} onValueChange={(d) => picks.push(d)} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /^Service date/ })))
    await act(async () => fireEvent.click(day("9 November 2026")))
    expect(picks).toEqual([])
  })

  it("picks a range in two clicks across two months and writes both ends on the trigger", async () => {
    function Picker() {
      const [value, setValue] = React.useState<DateRange | undefined>({ from: new Date(2026, 10, 3) })
      return <DateRangePicker aria-label="Shift" value={value} onValueChange={setValue} />
    }
    render(<Picker />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Shift 3 Nov 2026" })))
    expect(screen.getAllByRole("grid").map((g) => g.getAttribute("aria-label"))).toEqual(["November 2026", "December 2026"])
    await act(async () => fireEvent.click(day("2 December 2026")))
    expect(screen.getByRole("button", { name: "Shift 3 Nov 2026 – 2 Dec 2026" })).toBeTruthy()
  })

  it("writes the trigger with Intl in `locale` and the calendar in `calendarLocale`", async () => {
    render(<DateRangePicker aria-label="班次" value={{ from: new Date(2026, 10, 3), to: new Date(2026, 10, 5) }} locale="zh-TW" calendarLocale={zhTW} />)
    // The words are Intl's own range in that language, so they are compared with what Intl writes on this machine.
    const words = new Intl.DateTimeFormat("zh-TW", { day: "numeric", month: "short", year: "numeric" }).formatRange(new Date(2026, 10, 3), new Date(2026, 10, 5))
    const trigger = screen.getByRole("button", { name: `班次 ${words}` })
    await act(async () => fireEvent.click(trigger))
    expect(screen.getAllByRole("grid")[0].getAttribute("aria-label")).toBe("2026年11月")
    expect(screen.getByRole("button", { name: /^2026年11月4日 星期三/ })).toBeTruthy()
  })
})
