// @syncrobotic/clock-time v0.36.0 · update: npx shadcn add @syncrobotic/clock-time --overwrite
import { pad } from "@/registry/syncrobotic/lib/math"

/**
 * A time of day, 24-hour with seconds: "14:02:31". With `locale`, in that locale's digits and separators; without, the
 * same for every browser and the server. With `timeZone` (an IANA name, "Europe/Berlin"), in that zone; without, in the
 * time zone of whatever runs it.
 *
 * The server and the browser rarely share a time zone (a server in UTC, an operator in Taipei), so a time written during
 * the server's render and again while the page hydrates comes out different. Format a time read from the clock or from a
 * message only once the component is in the browser (in state an effect, a timer or a message set), or pass `timeZone`.
 */
export function formatClockTime(date: Date, locale?: string, timeZone?: string) {
  if (locale || timeZone) return date.toLocaleTimeString(locale || "en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone })
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map((n) => pad(n)).join(":")
}
