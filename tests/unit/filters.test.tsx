import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Filters,
  describeValue,
  filterRows,
  fromSearchParams,
  isComplete,
  matchRule,
  operatorsFor,
  toQueryString,
  toSearchParams,
  type FilterField,
  type FilterRule,
} from "@/registry/syncrobotic/ui/filters"

const fields: FilterField[] = [
  { key: "name", label: "Robot", type: "text" },
  {
    key: "status",
    label: "Status",
    type: "option",
    multiple: true,
    options: [
      { value: "patrolling", label: "Patrolling" },
      { value: "offline", label: "Offline" },
      { value: "stopped", label: "Stopped" },
    ],
  },
  { key: "site", label: "Site", type: "option", options: [{ value: "North gate", label: "North gate" }, { value: "Hall, B", label: "Hall, B" }] },
  { key: "battery", label: "Battery", type: "number", unit: "%" },
  { key: "serviced", label: "Last service", type: "date" },
  { key: "charging", label: "Charging", type: "boolean" },
]
const f = (key: string) => fields.find((x) => x.key === key)!
const rule = (field: string, operator: FilterRule["operator"], value: FilterRule["value"]): FilterRule => ({ id: field, field, operator, value })

const rows = [
  { name: "Patrol dog 7F3A", status: "patrolling", site: "North gate", battery: 72, serviced: "2026-11-03", charging: false },
  { name: "Courier 2B10", status: "offline", site: "Hall, B", battery: 18, serviced: new Date(2026, 9, 12), charging: true },
  { name: "Patrol dog 9C44", status: "stopped", site: "North gate", battery: 40, serviced: "2026-11-20T08:00:00", charging: false },
]

describe("operators", () => {
  it("follow the field type, the first being the default", () => {
    expect(operatorsFor(f("name"))).toEqual(["contains", "not_contains", "is"])
    expect(operatorsFor(f("status"))).toEqual(["any_of", "none_of"])
    expect(operatorsFor(f("site"))).toEqual(["is", "is_not"])
    expect(operatorsFor(f("battery"))).toEqual(["eq", "neq", "lt", "gt", "between"])
    expect(operatorsFor(f("serviced"))).toEqual(["is", "before", "after", "between"])
    expect(operatorsFor(f("charging"))).toEqual(["is_true", "is_false"])
  })
})

describe("matchRule", () => {
  const names = (r: FilterRule) => rows.filter((row) => matchRule(r, row, f(r.field))).map((x) => x.name)

  it("compares text without case", () => {
    expect(names(rule("name", "contains", "DOG"))).toEqual(["Patrol dog 7F3A", "Patrol dog 9C44"])
    expect(names(rule("name", "not_contains", "dog"))).toEqual(["Courier 2B10"])
    expect(names(rule("name", "is", "courier 2b10"))).toEqual(["Courier 2B10"])
  })
  it("matches options one or several at a time", () => {
    expect(names(rule("status", "any_of", ["offline", "stopped"]))).toHaveLength(2)
    expect(names(rule("status", "none_of", ["offline", "stopped"]))).toEqual(["Patrol dog 7F3A"])
    expect(names(rule("site", "is_not", "North gate"))).toEqual(["Courier 2B10"])
  })
  it("compares numbers, ranges including both ends in either order", () => {
    expect(names(rule("battery", "lt", 40))).toEqual(["Courier 2B10"])
    expect(names(rule("battery", "gt", 40))).toEqual(["Patrol dog 7F3A"])
    expect(names(rule("battery", "eq", 40))).toEqual(["Patrol dog 9C44"])
    expect(names(rule("battery", "neq", 40))).toHaveLength(2)
    expect(names(rule("battery", "between", [72, 40]))).toEqual(["Patrol dog 7F3A", "Patrol dog 9C44"])
  })
  it("compares dates by calendar day, from strings, Dates and timestamps", () => {
    expect(names(rule("serviced", "is", "2026-10-12"))).toEqual(["Courier 2B10"])
    expect(names(rule("serviced", "before", "2026-11-03"))).toEqual(["Courier 2B10"])
    expect(names(rule("serviced", "after", "2026-11-03"))).toEqual(["Patrol dog 9C44"])
    expect(names(rule("serviced", "between", ["2026-11-03", "2026-11-20"]))).toEqual(["Patrol dog 7F3A", "Patrol dog 9C44"])
  })
  it("reads booleans from the operator alone", () => {
    expect(names(rule("charging", "is_true", null))).toEqual(["Courier 2B10"])
    expect(names(rule("charging", "is_false", null))).toHaveLength(2)
  })
  it("lets every row through an incomplete rule", () => {
    expect(isComplete(rule("battery", "between", [20, null] as unknown as [number, number]), f("battery"))).toBe(false)
    expect(names(rule("name", "contains", "  "))).toHaveLength(3)
    expect(names(rule("status", "any_of", []))).toHaveLength(3)
  })
  it("uses an accessor when the value is not row[key]", () => {
    const nested: FilterField = { key: "soc", label: "Battery", type: "number", accessor: (r) => (r as { power: { soc: number } }).power.soc }
    expect(matchRule(rule("soc", "gt", 50), { power: { soc: 60 } }, nested)).toBe(true)
  })
})

describe("filterRows", () => {
  it("combines rules with AND and ignores rules about unknown fields", () => {
    const rules = [rule("name", "contains", "dog"), rule("battery", "gt", 50), rule("ghost", "is", "x")]
    expect(filterRows(rows, rules, fields).map((r) => r.name)).toEqual(["Patrol dog 7F3A"])
    expect(filterRows(rows, [], fields)).toBe(rows)
  })
})

describe("URL serialisation", () => {
  const rules: FilterRule[] = [
    rule("status", "any_of", ["offline", "stopped"]),
    rule("site", "is", "Hall, B"),
    rule("battery", "between", [20, 80]),
    rule("serviced", "before", "2026-11-03"),
    rule("charging", "is_true", null),
    rule("name", "contains", "dog: 7F"),
  ]

  it("writes one readable parameter per rule", () => {
    expect(toSearchParams(rules).toString()).toBe(
      "status=any_of%3Aoffline%2Cstopped&site=is%3AHall%2C+B&battery=between%3A20%2C80&serviced=before%3A2026-11-03&charging=is_true&name=contains%3Adog%3A+7F",
    )
    expect(toSearchParams([rule("name", "contains", "")]).toString()).toBe("")
    expect(toSearchParams([rule("charging", "is_false", null)], { prefix: "f." }).toString()).toBe("f.charging=is_false")
  })

  it("has a readable query string that parses back the same", () => {
    const q = toQueryString(rules)
    expect(q).toBe("status=any_of:offline,stopped&site=is:Hall,+B&battery=between:20,80&serviced=before:2026-11-03&charging=is_true&name=contains:dog:+7F")
    expect(fromSearchParams(q, fields)).toEqual(fromSearchParams(toSearchParams(rules), fields))
    const multi: FilterField = { key: "sites", label: "Sites", type: "option", multiple: true, options: [{ value: "Hall, B", label: "Hall, B" }, { value: "Dock", label: "Dock" }] }
    const list = toQueryString([rule("sites", "any_of", ["Hall, B", "Dock"])])
    expect(list).toBe("sites=any_of:Hall%252C%2520B,Dock")
    expect(fromSearchParams(list, [multi])[0].value).toEqual(["Hall, B", "Dock"])
  })

  it("round-trips, with stable ids per field", () => {
    const back = fromSearchParams(toSearchParams(rules), fields)
    expect(back.map(({ field, operator, value }) => ({ field, operator, value }))).toEqual(rules.map(({ field, operator, value }) => ({ field, operator, value })))
    expect(back.map((r) => r.id)).toEqual(["status-0", "site-0", "battery-0", "serviced-0", "charging-0", "name-0"])
  })

  it("keeps commas inside a multi-select value", () => {
    const multi: FilterField = { key: "sites", label: "Sites", type: "option", multiple: true, options: [{ value: "Hall, B", label: "Hall, B" }, { value: "Dock", label: "Dock" }] }
    const r = rule("sites", "any_of", ["Hall, B", "Dock"])
    expect(fromSearchParams(toSearchParams([r]), [multi])[0].value).toEqual(["Hall, B", "Dock"])
  })

  it("reads a query string, URLSearchParams or a searchParams record, in URL order", () => {
    const fromString = fromSearchParams("?battery=lt:30&status=any_of:offline&battery=gt:5&page=2", fields)
    expect(fromString.map((r) => r.id)).toEqual(["battery-0", "status-0", "battery-1"])
    const fromRecord = fromSearchParams({ battery: ["lt:30", "gt:5"], q: "x", status: undefined }, fields)
    expect(fromRecord.map((r) => r.value)).toEqual([30, 5])
    expect(fromSearchParams(new URLSearchParams("f.charging=is_true&charging=is_false"), fields, { prefix: "f." })).toEqual([
      { id: "charging-0", field: "charging", operator: "is_true", value: null },
    ])
  })

  it("skips what a hand-edited or stale link gets wrong", () => {
    const bad = "status=any_of:ghost&site=is:Mars&battery=lt:lots&battery=between:1&serviced=after:yesterday&name=sounds_like:x&name=contains:&charging=maybe&battery=gt:%E0%A4%A"
    expect(fromSearchParams(bad, fields)).toEqual([])
    // Unknown options are dropped from a list; the rest of the rule stays.
    expect(fromSearchParams("status=any_of:ghost,offline", fields)[0].value).toEqual(["offline"])
  })
})

describe("describeValue", () => {
  it("says the value as the chip shows it", () => {
    expect(describeValue(rule("status", "any_of", ["offline", "stopped"]), f("status"))).toBe("Offline +1")
    expect(describeValue(rule("battery", "between", [20, 80]), f("battery"))).toBe("20 – 80 %")
    expect(describeValue(rule("serviced", "is", "2026-11-03"), f("serviced"))).toBe("3 Nov 2026")
    expect(describeValue(rule("serviced", "between", ["2026-02-01", "2026-10-31"]), f("serviced"))).toBe("1 Feb – 31 Oct 2026")
    expect(describeValue(rule("serviced", "between", ["2025-12-01", "2026-01-31"]), f("serviced"))).toBe("1 Dec 2025 – 31 Jan 2026")
    expect(describeValue(rule("charging", "is_true", null), f("charging"))).toBe("")
  })
})

describe("Filters", () => {
  afterEach(cleanup)

  function Harness({ initial = [], onChange }: { initial?: FilterRule[]; onChange?: (r: FilterRule[]) => void }) {
    const [rules, setRules] = React.useState(initial)
    return (
      <Filters
        fields={fields}
        value={rules}
        onValueChange={(r) => {
          setRules(r)
          onChange?.(r)
        }}
      />
    )
  }

  it("shows each rule as field, operator and value, said with AND", () => {
    render(<Harness initial={[rule("status", "any_of", ["offline"]), rule("charging", "is_true", null)]} />)
    expect(screen.getByRole("group", { name: "Status is any of Offline" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Offline, change value" })).toBeTruthy()
    expect(screen.getByRole("list", { name: "Active filters, all must match" })).toBeTruthy()
    expect(screen.getByText("and")).toBeTruthy()
  })

  it("adds a rule through the three steps", async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Filter" }))
    expect(await screen.findByRole("dialog", { name: "Choose a field" })).toBeTruthy()
    fireEvent.click(screen.getByRole("option", { name: "Charging" }))
    expect(await screen.findByRole("dialog", { name: "Charging: choose an operator" })).toBeTruthy()
    fireEvent.click(screen.getByRole("option", { name: "is false" }))
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ field: "charging", operator: "is_false", value: null })])
  })

  it("enters a value, and Back walks one step back", async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Filter" }))
    fireEvent.click(await screen.findByRole("option", { name: "Robot" }))
    fireEvent.click(await screen.findByRole("option", { name: "is" }))
    expect(await screen.findByRole("dialog", { name: "Robot is: enter a value" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(await screen.findByRole("dialog", { name: "Robot: choose an operator" })).toBeTruthy()
    fireEvent.click(screen.getByRole("option", { name: "contains" }))
    fireEvent.change(await screen.findByRole("textbox", { name: "Robot contains: enter a value" }), { target: { value: "dog" } })
    fireEvent.click(screen.getByRole("button", { name: "Apply" }))
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ field: "name", operator: "contains", value: "dog" })])
  })

  it("amends the operator in place, keeping a value that still fits", async () => {
    const onChange = vi.fn()
    render(<Harness initial={[rule("status", "any_of", ["offline"])]} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "is any of, change operator" }))
    fireEvent.click(await screen.findByRole("option", { name: "is none of" }))
    expect(onChange).toHaveBeenLastCalledWith([{ id: "status", field: "status", operator: "none_of", value: ["offline"] }])
  })

  it("removes a rule and clears them all", () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<Harness initial={[rule("status", "any_of", ["offline"]), rule("charging", "is_true", null)]} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Remove filter: Status is any of Offline" }))
    expect(onChange).toHaveBeenLastCalledWith([rule("charging", "is_true", null)])
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }))
    expect(onChange).toHaveBeenLastCalledWith([])
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull()
    vi.useRealTimers()
  })
})
