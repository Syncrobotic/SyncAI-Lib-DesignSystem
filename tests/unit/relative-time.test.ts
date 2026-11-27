import { describe, expect, it } from "vitest"
import { formatAbsolute, formatDuration, formatRelative, refreshInterval, relativeParts, toTime } from "@/registry/syncrobotic/lib/relative-time"

const NOW = Date.UTC(2026, 10, 27, 6, 2, 0)
const s = 1000
const min = 60 * s
const h = 60 * min
const d = 24 * h

describe("toTime", () => {
  it("reads a Date, ms and ISO text; anything else is null", () => {
    expect(toTime(new Date(NOW))).toBe(NOW)
    expect(toTime(NOW)).toBe(NOW)
    expect(toTime("2026-11-27T06:02:00Z")).toBe(NOW)
    expect(toTime(null)).toBeNull()
    expect(toTime(undefined)).toBeNull()
    expect(toTime("")).toBeNull()
    expect(toTime("not a date")).toBeNull()
    expect(toTime(Number.NaN)).toBeNull()
  })
})

describe("relativeParts", () => {
  it("takes the largest unit and rounds toward zero, so 59 minutes is never an hour", () => {
    expect(relativeParts(NOW - 59 * min - 59 * s, NOW)).toEqual({ value: -59, unit: "minute" })
    expect(relativeParts(NOW - h, NOW)).toEqual({ value: -1, unit: "hour" })
    expect(relativeParts(NOW - 3 * d, NOW)).toEqual({ value: -3, unit: "day" })
    expect(relativeParts(NOW - 15 * d, NOW)).toEqual({ value: -2, unit: "week" })
    expect(relativeParts(NOW - 90 * d, NOW)).toEqual({ value: -3, unit: "month" })
    expect(relativeParts(NOW - 800 * d, NOW)).toEqual({ value: -2, unit: "year" })
    expect(relativeParts(NOW + 2 * min, NOW)).toEqual({ value: 2, unit: "minute" })
    expect(relativeParts(NOW, NOW)).toEqual({ value: 0, unit: "second" })
  })
})

describe("formatRelative", () => {
  it("English by default: now under ten seconds, then whole units", () => {
    expect(formatRelative(NOW - 4 * s, { now: NOW })).toBe("now")
    expect(formatRelative(NOW - 42 * s, { now: NOW })).toBe("42 seconds ago")
    expect(formatRelative(NOW - 3 * min, { now: NOW })).toBe("3 minutes ago")
    expect(formatRelative(NOW - 1 * d, { now: NOW })).toBe("1 day ago")
    expect(formatRelative(NOW + 2 * h, { now: NOW })).toBe("in 2 hours")
  })

  it("zh-TW through Intl", () => {
    expect(formatRelative(NOW - 3 * min, { now: NOW, locale: "zh-TW" })).toBe("3 分鐘前")
    expect(formatRelative(NOW - 2 * d, { now: NOW, locale: "zh-TW" })).toBe("2 天前")
    expect(formatRelative(NOW - 2 * s, { now: NOW, locale: "zh-TW" })).toBe("現在")
  })

  it("minUnit minute says this minute under a minute; clamp says a fast clock's future as now", () => {
    expect(formatRelative(NOW - 42 * s, { now: NOW, minUnit: "minute" })).toBe("this minute")
    expect(formatRelative(NOW + 5 * min, { now: NOW, future: "clamp" })).toBe("now")
    expect(formatRelative(NOW + 5 * min, { now: NOW, future: "clamp", minUnit: "minute" })).toBe("this minute")
  })

  it("short style, an unreadable locale falls back to English, an invalid date is empty", () => {
    expect(formatRelative(NOW - 3 * min, { now: NOW, style: "short" })).toBe("3 min. ago")
    expect(formatRelative(NOW - 3 * min, { now: NOW, locale: "en_US" })).toBe("3 minutes ago")
    expect(formatRelative("nope", { now: NOW })).toBe("")
  })
})

describe("formatAbsolute", () => {
  it("date and 24-hour time in the given zone and locale", () => {
    expect(formatAbsolute(NOW, { timeZone: "UTC" })).toBe("Nov 27, 2026, 06:02")
    expect(formatAbsolute(NOW, { timeZone: "Asia/Taipei" })).toBe("Nov 27, 2026, 14:02")
    expect(formatAbsolute(NOW, { timeZone: "Asia/Taipei", locale: "zh-TW" })).toBe("2026年11月27日 14:02")
  })

  it("precision: second, date, day and time", () => {
    expect(formatAbsolute(NOW + 7 * s, { timeZone: "UTC", precision: "second" })).toBe("Nov 27, 2026, 06:02:07")
    expect(formatAbsolute(NOW, { timeZone: "UTC", precision: "date" })).toBe("Nov 27, 2026")
    expect(formatAbsolute(NOW, { timeZone: "UTC", precision: "day" })).toBe("Nov 27")
    expect(formatAbsolute(NOW, { timeZone: "UTC", precision: "time" })).toBe("06:02")
    expect(formatAbsolute(NOW, { timeZone: "UTC", withZone: true })).toBe("Nov 27, 2026, 06:02 UTC")
    expect(formatAbsolute("", {})).toBe("")
  })
})

describe("formatDuration", () => {
  it("the two largest units, in the locale", () => {
    expect(formatDuration(2 * h + 15 * min + 9 * s)).toBe("2 hr 15 min")
    expect(formatDuration(45 * s)).toBe("45 sec")
    expect(formatDuration(3 * d + 2 * min)).toBe("3 days")
    expect(formatDuration(0)).toBe("0 sec")
    expect(formatDuration(-90 * s)).toBe("1 min 30 sec")
    expect(formatDuration(2 * h, { locale: "zh-TW" })).toBe("2 小時")
  })
})

describe("refreshInterval", () => {
  it("every second under a minute, every minute under an hour, then hourly", () => {
    expect(refreshInterval(NOW - 10 * s, NOW)).toBe(s)
    expect(refreshInterval(NOW - 10 * min, NOW)).toBe(min)
    expect(refreshInterval(NOW - 10 * h, NOW)).toBe(h)
  })
})
