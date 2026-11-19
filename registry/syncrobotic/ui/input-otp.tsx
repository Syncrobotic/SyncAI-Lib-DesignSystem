// @syncrobotic/input-otp v0.15.0 · update: npx shadcn add @syncrobotic/input-otp --overwrite
"use client"

import * as React from "react"
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS }

/**
 * A one-time code or PIN, one box per character (input-otp). One real input underneath, so paste, autofill from SMS
 * (`autoComplete="one-time-code"`) and screen readers work as with any field. Boxes are 44 px, the touch minimum.
 */
export function InputOTP({
  className,
  containerClassName,
  value: controlled,
  defaultValue,
  onChange,
  maxLength,
  ...props
}: React.ComponentProps<typeof OTPInput>) {
  const [inner, setInner] = React.useState(String(defaultValue ?? ""))
  const value = controlled ?? inner
  return (
    <OTPInput
      data-slot="input-otp"
      autoComplete="one-time-code"
      containerClassName={cn("flex items-center gap-2 has-disabled:text-muted-foreground", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      maxLength={maxLength}
      value={value}
      onChange={(next: string) => {
        // A full code is done: input-otp keeps its last character selected, so every further key would swap that
        // character and the last box would keep changing. Ignore it; Backspace, select-all or a paste still edit.
        if (value.length === maxLength && next.length === maxLength && next !== value && next.slice(0, -1) === value.slice(0, -1)) return
        if (controlled === undefined) setInner(next)
        onChange?.(next)
      }}
      {...props}
    />
  )
}

export function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="input-otp-group" className={cn("flex items-center gap-2", className)} {...props} />
}

/** One box. The caret blinks only while focused and stops under reduced motion. */
export function InputOTPSlot({ index, className, ...props }: React.ComponentProps<"div"> & { index: number }) {
  const ctx = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = ctx?.slots[index] ?? {}
  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-(--h-md) items-center justify-center rounded-sm bg-card font-mono text-lg font-medium ring-1 ring-input ring-inset",
        "transition-shadow duration-(--motion-fast) ease-(--ease-standard) data-[active=true]:ring-2 data-[active=true]:ring-ring",
        "aria-invalid:ring-2 aria-invalid:ring-danger",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* motion-ok: the caret blinks like a native one, and stops under reduced motion (theme) */}
          <span className="h-5 w-px animate-caret-blink bg-foreground" />
        </span>
      )}
    </div>
  )
}

export function InputOTPSeparator(props: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" className="text-muted-foreground" {...props}>
      <Minus aria-hidden="true" className="size-4" />
    </div>
  )
}
