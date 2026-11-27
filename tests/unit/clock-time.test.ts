import { describe, expect, it } from "vitest"
import { formatClockTime } from "@/registry/syncrobotic/lib/clock-time"

describe("formatClockTime", () => {
  it("without locale or zone: 24-hour HH:MM:SS in the local zone, zero-padded", () => {
    expect(formatClockTime(new Date(2026, 0, 2, 14, 2, 31))).toBe("14:02:31")
    expect(formatClockTime(new Date(2026, 0, 2, 0, 0, 0))).toBe("00:00:00")
    expect(formatClockTime(new Date(2026, 0, 2, 23, 59, 59))).toBe("23:59:59")
    expect(formatClockTime(new Date(2026, 0, 2, 9, 5, 7, 999))).toBe("09:05:07")
  })

  it("with a time zone: that zone's time, midnight as 00", () => {
    const d = new Date("2026-01-02T23:30:05Z")
    expect(formatClockTime(d, undefined, "UTC")).toBe("23:30:05")
    expect(formatClockTime(d, undefined, "Asia/Taipei")).toBe("07:30:05")
    expect(formatClockTime(new Date("2026-01-02T00:00:00Z"), undefined, "UTC")).toBe("00:00:00")
  })

  it("follows daylight saving in the zone it is given", () => {
    expect(formatClockTime(new Date("2026-01-15T12:00:00Z"), "en", "Europe/Berlin")).toBe("13:00:00")
    expect(formatClockTime(new Date("2026-07-15T12:00:00Z"), "en", "Europe/Berlin")).toBe("14:00:00")
  })

  it("with a locale: that locale's formatting, still 24-hour", () => {
    const d = new Date("2026-01-02T14:02:31Z")
    expect(formatClockTime(d, "en-US", "UTC")).toBe("14:02:31")
    expect(formatClockTime(d, "zh-TW", "UTC")).toBe(d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "UTC" }))
    expect(formatClockTime(d, "zh-TW", "UTC")).toContain("14")
  })
})
