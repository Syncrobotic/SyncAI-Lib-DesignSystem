// @syncrobotic/meter v0.31.0 · update: npx shadcn add @syncrobotic/meter --overwrite
import { cn } from "@/lib/utils"

/** How a level reads: neutral, or past a threshold. */
export type MeterTone = "normal" | "warning" | "danger"

/**
 * The tone of a level by Meter's thresholds: danger from `critical`, warning from `low`, below them (or at and above them
 * when `higherIsWorse`). Shared with `attitude`'s Gauge, so a level means the same on a bar and on a dial.
 */
export function meterTone(value: number, { low, critical, higherIsWorse = false }: { low?: number; critical?: number; higherIsWorse?: boolean }): MeterTone {
  const worse = (a: number, b: number) => (higherIsWorse ? a >= b : a < b)
  return critical !== undefined && worse(value, critical) ? "danger" : low !== undefined && worse(value, low) ? "warning" : "normal"
}

/**
 * What the colour means, in words, after the value in `aria-valuetext`: ", critical", or ", high" for a level that fills up
 * or heats up (`higherIsWorse`) and ", low" for one that runs out; "" while normal. `words` translates them.
 */
export function meterSaid(
  tone: MeterTone,
  higherIsWorse = false,
  words: { critical: string; high: string; low: string } = { critical: "critical", high: "high", low: "low" },
): string {
  return tone === "normal" ? "" : `, ${tone === "danger" ? words.critical : higherIsWorse ? words.high : words.low}`
}

export type MeterLabels = {
  /** The value with the range's end, for `showMax`: "412 of 512". Both come formatted. */
  range: (value: string, max: string) => string
  /** Read after the value once past `critical`. */
  critical: string
  /** Read after the value past `low` when `higherIsWorse`. */
  high: string
  /** Read after the value past `low`. */
  low: string
}

export const defaultMeterLabels: MeterLabels = {
  range: (value, max) => `${value} of ${max}`,
  critical: "critical",
  high: "high",
  low: "low",
}

/**
 * A level within a known range: battery, storage, signal. Neutral while normal; it turns warning below `low` and danger
 * below `critical` (or above `high` / `critical` when `higherIsWorse`), so colour appears only when something is wrong,
 * and the value is always written beside it. role="meter", unlike Progress, which is for work that is under way.
 */
export function Meter({
  value,
  min = 0,
  max = 100,
  low,
  critical,
  higherIsWorse = false,
  label,
  unit = "%",
  inline = false,
  showMax = false,
  locale,
  format,
  showThresholds = false,
  labels,
  className,
}: {
  value: number
  min?: number
  max?: number
  /** Warning from here (below it, or above it when higherIsWorse). */
  low?: number
  /** Danger from here. */
  critical?: number
  higherIsWorse?: boolean
  /** What is measured, e.g. "Battery". Shown above the bar, and read with the value. */
  label: string
  /** Written after the value: "%" (the default, written "72 %"), "°C", "GB". Leading spaces are ignored. */
  unit?: string
  /** Write the range's end beside the value ("412 of 512 GB"), for an amount whose total matters, such as storage. */
  showMax?: boolean
  /** One line for table cells: bar and value, the label only read by screen readers. */
  inline?: boolean
  /** Formats the value and the range's end (a BCP 47 tag such as "zh-TW"): "412,345 of 1,000,000 items". */
  locale?: string
  /** How to write the value and the range's end, e.g. `{ notation: "compact" }` (412K) or `{ maximumFractionDigits: 1 }`. */
  format?: Intl.NumberFormatOptions
  /** Mark `low` and `critical` on the track with a thin tick, so a reader sees how close the level is before it crosses. */
  showThresholds?: boolean
  /** The words it says, to translate them. */
  labels?: Partial<MeterLabels>
  className?: string
}) {
  const tone = meterTone(value, { low, critical, higherIsWorse })
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const u = unit.trim()
  const suffix = u ? ` ${u}` : ""
  // Written as given unless a locale or a format is asked for, so a number never changes between server and browser.
  const num = (n: number) => (locale !== undefined || format ? n.toLocaleString(locale, format) : String(n))
  const l = { ...defaultMeterLabels, ...labels }
  const text = `${showMax ? l.range(num(value), num(max)) : num(value)}${suffix}`
  // What the colour means, in words: a level that runs out is low; one that fills up or heats up is high.
  const said = meterSaid(tone, higherIsWorse, l)
  const at = (n: number) => Math.min(100, Math.max(0, ((n - min) / (max - min)) * 100))
  const ticks = showThresholds ? [low, critical].filter((n): n is number => n !== undefined) : []
  const track = (
    <span aria-hidden={ticks.length ? undefined : "true"} className={cn("relative block h-2 overflow-hidden rounded-full bg-track", inline && !ticks.length ? "w-20" : "w-full")}>
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-(--motion-base) ease-(--ease-standard)",
          tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-muted-foreground",
        )}
        style={{ width: `${pct}%` }}
      />
    </span>
  )
  // A threshold is a 1 px tick 8 px taller than the track (padding keeps it inside the meter), so its ends show over the fill too. Grey, not the warning
  // colour: colour still means crossed. Drawn as a border, which forced colours keep.
  const bar = ticks.length ? (
    <span aria-hidden="true" className={cn("relative block py-1", inline ? "w-20" : "w-full")}>
      {track}
      {ticks.map((n, i) => (
        <span key={i} data-threshold="" className="absolute top-1/2 h-4 -translate-x-1/2 -translate-y-1/2 border-l border-muted-foreground" style={{ left: `${at(n)}%` }} />
      ))}
    </span>
  ) : (
    track
  )
  const valueText = (
    <span className={cn("tabular-nums", tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : inline ? "text-muted-foreground" : "")}>
      {text}
    </span>
  )
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={`${text}${said}`}
      data-slot="meter"
      data-tone={tone}
      className={cn(inline ? "flex items-center gap-2 text-sm" : "flex flex-col gap-2", className)}
    >
      {inline ? (
        <>
          {bar}
          {valueText}
        </>
      ) : (
        <>
          <span className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{valueText}</span>
          </span>
          {bar}
        </>
      )}
    </div>
  )
}
