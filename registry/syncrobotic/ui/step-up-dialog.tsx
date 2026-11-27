// @syncrobotic/step-up-dialog v0.55.0 · update: npx shadcn add @syncrobotic/step-up-dialog --overwrite
"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"
import { errorCodeOf, type StepUpProof } from "@/registry/syncrobotic/hooks/use-step-up"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/registry/syncrobotic/ui/dialog"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot, REGEXP_ONLY_DIGITS } from "@/registry/syncrobotic/ui/input-otp"

export type StepUpDialogLabels = {
  title: string
  /** Under the title, per method. */
  totpBody: string
  passwordBody: string
  /** The code field's name. */
  code: string
  password: string
  /** Switches between the methods when both are offered. */
  usePassword: string
  useCode: string
  verify: string
  cancel: string
  close: string
  /** When no second factor is set up yet, so there is nothing to check. */
  setupTitle: string
  setupBody: string
  setup: string
  /** The message when verify fails, per error code; `failed` when its code has none. */
  errors: Record<string, string>
  failed: string
}

export const defaultStepUpDialogLabels: StepUpDialogLabels = {
  title: "Confirm it is you",
  totpBody: "This action needs a fresh check. Enter the 6-digit code from your authenticator app.",
  passwordBody: "This action needs a fresh check. Enter your password.",
  code: "6-digit code",
  password: "Password",
  usePassword: "Use your password instead",
  useCode: "Use an authenticator code instead",
  verify: "Verify",
  cancel: "Cancel",
  close: "Close",
  setupTitle: "Turn on two-step verification",
  setupBody: "This action needs a second check, and your account has no second factor yet. Set one up, then try again.",
  setup: "Set up two-step verification",
  errors: {
    INVALID_CODE: "That code is not right. Codes change every 30 seconds: try the current one.",
    INVALID_PASSWORD: "That password is not right.",
    RATE_LIMITED: "Too many tries. Wait a minute, then try again.",
  },
  failed: "That did not work. Try again.",
}

/**
 * Asks for a fresh check (an authenticator code or the password) before a sensitive action, then hands back to the
 * action. Verifies through your `verify()`; usually opened by useStepUp from the server's step-up error code.
 */
export function StepUpDialog({
  open,
  setup = false,
  verify,
  onVerified,
  onCancel,
  onSetup,
  methods = ["totp"],
  labels,
}: {
  open: boolean
  /** No second factor yet (TWO_FACTOR_SETUP_REQUIRED): offers `onSetup` instead of a field. */
  setup?: boolean
  /** Checks the proof with your auth server; rejects with an error whose `code` picks the message. */
  verify: (proof: StepUpProof) => Promise<void>
  onVerified: () => void
  /** Cancel, Esc, the close button or a click outside. */
  onCancel: () => void
  /** Goes to the second-factor setup (your router); the pending action is cancelled. */
  onSetup?: () => void
  /** Which proofs to offer, the first shown first. */
  methods?: readonly StepUpProof["method"][]
  labels?: Partial<StepUpDialogLabels>
}) {
  const l = { ...defaultStepUpDialogLabels, ...labels, errors: { ...defaultStepUpDialogLabels.errors, ...labels?.errors } }
  const [method, setMethod] = React.useState(methods[0] ?? "totp")
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  // A code sends itself on its sixth digit and Enter may follow: one check at a time, or the code is spent twice.
  const inFlight = React.useRef(false)
  const field = React.useRef<HTMLInputElement>(null)
  // Opened from code, it has no trigger for Radix to return to: focus goes back to what had it (the action's button).
  const returnTo = React.useRef<HTMLElement | null>(null)
  const errorId = React.useId()

  // Each opening starts clean, on the first method.
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setMethod(methods[0] ?? "totp")
      setValue("")
      setError("")
      setBusy(false)
    }
  }

  const complete = method === "totp" ? value.length === 6 : value.length > 0

  const submit = async (proof: string) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError("")
    try {
      await verify({ method, value: proof })
      onVerified()
    } catch (e) {
      const code = errorCodeOf(e)
      setError((code && l.errors[code]) || l.failed)
      setValue("")
      field.current?.focus()
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const switchTo = (next: StepUpProof["method"]) => {
    setMethod(next)
    setValue("")
    setError("")
    // After the field changes, focus moves into the new one.
    requestAnimationFrame(() => field.current?.focus())
  }
  const other = methods.find((m) => m !== method)
  const invalid = error ? true : undefined
  const describedBy = error ? errorId : undefined

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel()
      }}
    >
      <DialogContent
        data-slot="step-up-dialog"
        labels={{ close: l.close }}
        onOpenAutoFocus={(e) => {
          returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
          if (setup) return
          e.preventDefault()
          field.current?.focus()
        }}
        onCloseAutoFocus={(e) => {
          if (!returnTo.current?.isConnected) return
          e.preventDefault()
          returnTo.current.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{setup ? l.setupTitle : l.title}</DialogTitle>
          <DialogDescription>{setup ? l.setupBody : method === "totp" ? l.totpBody : l.passwordBody}</DialogDescription>
        </DialogHeader>

        {setup ? (
          <DialogFooter>
            <Button variant="secondary" onClick={onCancel}>
              {l.cancel}
            </Button>
            {onSetup && (
              <Button
                onClick={() => {
                  onCancel()
                  onSetup()
                }}
              >
                {l.setup}
              </Button>
            )}
          </DialogFooter>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (complete) void submit(value)
            }}
          >
            {method === "totp" ? (
              <InputOTP
                ref={field}
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                aria-label={l.code}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                value={value}
                onChange={(v) => {
                  setValue(v)
                  if (v) setError("")
                }}
                onComplete={(v: string) => void submit(v)}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} aria-invalid={invalid} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            ) : (
              <Field label={l.password}>
                <Input
                  ref={field}
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value)
                    setError("")
                  }}
                />
              </Field>
            )}
            {error && (
              <p id={errorId} role="alert" className="flex items-start gap-2 text-sm text-danger">
                <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}
            {other && (
              <Button type="button" variant="link" className="self-start px-0" onClick={() => switchTo(other)}>
                {other === "password" ? l.usePassword : l.useCode}
              </Button>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
                {l.cancel}
              </Button>
              <Button type="submit" loading={busy} disabled={!complete}>
                {l.verify}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
