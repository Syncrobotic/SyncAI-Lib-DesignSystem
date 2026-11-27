// @syncrobotic/clock-time v0.53.0 · update: npx shadcn add @syncrobotic/clock-time --overwrite
import { pad } from "@/registry/syncrobotic/lib/math"

/**
 * A time of day, 24-hour with seconds ("14:02:31"), in a locale and an optional time zone: the one format every live
 * component writes its last-update times in. Without `timeZone` (IANA) it is the runtime's zone. The server and the
 * browser rarely share a zone, so format a time from the clock or a message only once in the browser (in state an
 * effect, timer or message set), or pass `timeZone`.
 */
export function formatClockTime(date: Date, locale?: string, timeZone?: string) {
  if (locale || timeZone) return date.toLocaleTimeString(locale || "en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone })
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map((n) => pad(n)).join(":")
}
