// @syncrobotic/phone-input v0.51.0 · update: npx shadcn add @syncrobotic/phone-input --overwrite
"use client"

import * as React from "react"
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js"
import { cn } from "@/lib/utils"
import { useField } from "@/registry/syncrobotic/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/registry/syncrobotic/ui/select"

export type { CountryCode }

const flag = (c: string) => String.fromCodePoint(...[...c].map((ch) => 0x1f1a5 + ch.charCodeAt(0)))
type Country = { code: CountryCode; name: string; dial: string }
const byLocale = new Map<string, Country[]>()
/** Every country with its name in `locale`, sorted for that language; built once per language. */
function countriesIn(locale: string) {
  let list = byLocale.get(locale)
  if (!list) {
    let names: Intl.DisplayNames | null = null
    try {
      names = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames([locale], { type: "region" }) : null
    } catch {
      names = null
    }
    const collator = new Intl.Collator(locale)
    list = getCountries()
      .map((c) => ({ code: c, name: names?.of(c) ?? c, dial: getCountryCallingCode(c) }))
      .sort((a, b) => collator.compare(a.name, b.name))
    byLocale.set(locale, list)
  }
  return list
}

export type PhoneInputLabels = {
  /** The country menu's name for screen readers. */
  country: string
  /** The number box's name (unless `aria-label` or a Field names it) and its placeholder. */
  phoneNumber: string
}

export const defaultPhoneInputLabels: PhoneInputLabels = { country: "Country", phoneNumber: "Phone number" }

/** True when the number is complete and valid for its country. */
export function isPhoneValid(e164: string | undefined) {
  return !!e164 && !!parsePhoneNumberFromString(e164)?.isValid()
}

/**
 * A phone number with its country (libphonenumber-js), formatted as you type; the value is E.164 (+886912345678).
 * Validation is yours, through Field's error, so it never scolds someone halfway through typing.
 */
export function PhoneInput({
  value,
  onValueChange,
  defaultCountry = "TW",
  countryOptions,
  placeholder,
  disabled,
  readOnly,
  className,
  id,
  "aria-label": ariaLabel,
  labels,
  locale = "en",
}: {
  value?: string
  onValueChange?: (e164: string | undefined, country: CountryCode) => void
  defaultCountry?: CountryCode
  /** Limit the country list, e.g. the countries you operate in. */
  countryOptions?: CountryCode[]
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
  id?: string
  /** Wins over `labels.phoneNumber` as the box's name. */
  "aria-label"?: string
  /** The words it says, to translate them. */
  labels?: Partial<PhoneInputLabels>
  /** The language of the country names and their order (a BCP 47 tag such as "zh-TW"). English when left out. */
  locale?: string
}) {
  const f = useField()
  const l = { ...defaultPhoneInputLabels, ...labels }
  const countries = countriesIn(locale)
  const parsed = value ? parsePhoneNumberFromString(value) : undefined
  const [country, setCountry] = React.useState<CountryCode>(parsed?.country ?? defaultCountry)
  const [text, setText] = React.useState(parsed ? parsed.formatNational() : "")
  const list = countryOptions ? countries.filter((c) => countryOptions.includes(c.code)) : countries

  const update = (raw: string, c: CountryCode) => {
    if (raw.trim().startsWith("+")) {
      const intl = parsePhoneNumberFromString(raw)
      if (intl?.country) {
        setCountry(intl.country)
        setText(intl.formatNational())
        return onValueChange?.(intl.number, intl.country)
      }
    }
    const typer = new AsYouType(c)
    const formatted = typer.input(raw)
    setText(formatted)
    onValueChange?.(typer.getNumber()?.number, c)
  }

  return (
    <div
      data-slot="phone-input"
      aria-invalid={f?.invalid || undefined}
      className={cn(
        "flex h-(--h-md) w-full min-w-0 items-stretch rounded-sm bg-card ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
        "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring aria-invalid:ring-2 aria-invalid:ring-danger",
        disabled && "bg-muted text-muted-foreground ring-border",
        // Read-only is not disabled: it stays full contrast so it can be read and copied.
        readOnly && "bg-muted",
        className,
      )}
    >
      <Select
        value={country}
        disabled={disabled || readOnly}
        onValueChange={(c) => {
          setCountry(c as CountryCode)
          update(text, c as CountryCode)
        }}
      >
        <SelectTrigger
          aria-label={l.country}
          // Transparent in every state, disabled and invalid too: a fill or a ring of its own would paint over the field's
          // inset outline, which must run unbroken round both segments (the field's own ring says it is invalid).
          className={cn("h-full w-auto shrink-0 gap-1 rounded-r-none bg-transparent px-3 ring-0 disabled:bg-transparent aria-invalid:ring-0", readOnly && "disabled:opacity-100")}
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true">{flag(country)}</span>
            <span className="text-sm text-muted-foreground tabular-nums">+{getCountryCallingCode(country)}</span>
          </span>
        </SelectTrigger>
        {/* The trigger is only the flag and code, so the list takes its own width (not the trigger's), from the trigger's
            left edge: names fit, a long one ends in an ellipsis, and the code keeps its column on the right. */}
        <SelectContent align="start" className="max-h-72 w-72">
          {list.map((c) => (
            <SelectItem key={c.code} value={c.code} className="[&>span:first-child]:min-w-0 [&>span:first-child]:flex-1">
              <span className="flex w-full min-w-0 items-center gap-2">
                <span aria-hidden="true">{flag(c.code)}</span>
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">+{c.dial}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span aria-hidden="true" className="my-2 w-px bg-border" />
      <input data-slot="phone-input-number"
        type="tel"
        id={id ?? f?.id}
        // Inside a Field its label names the box, so the name is what people see ("On-call phone"); a fixed aria-label
        // would override it. Alone, without aria-label, it is "Phone number".
        aria-label={ariaLabel ?? (f ? undefined : l.phoneNumber)}
        aria-describedby={f?.describedBy}
        aria-invalid={f?.invalid || undefined}
        autoComplete="tel"
        inputMode="tel"
        placeholder={placeholder ?? l.phoneNumber}
        disabled={disabled}
        readOnly={readOnly}
        value={text}
        onChange={(e) => update(e.target.value, country)}
        // focus-ring: the field around it draws the ring (has-[input:focus-visible]).
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  )
}
