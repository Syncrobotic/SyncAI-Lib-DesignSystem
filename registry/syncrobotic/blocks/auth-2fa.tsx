// @syncrobotic/auth-2fa v0.40.0 · update: npx shadcn add @syncrobotic/auth-2fa --overwrite
"use client"

import * as React from "react"
import { CircleAlert, Fingerprint } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField } from "@/registry/syncrobotic/ui/choice-field"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { PageHeader } from "@/registry/syncrobotic/ui/page-header"
import { InputOTP, InputOTPGroup, InputOTPSlot, REGEXP_ONLY_DIGITS } from "@/registry/syncrobotic/ui/input-otp"
import { Separator } from "@/registry/syncrobotic/ui/separator"

export type TwoFactorMethod = "app" | "recovery"

/** What your server said about a code. `retryAfter` is in seconds. */
export type TwoFactorResult = { ok: true } | { ok: false; reason: "wrong"; attemptsLeft?: number } | { ok: false; reason: "locked"; retryAfter: number }

const RECOVERY = /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/

const minutes = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
const inWords = (s: number) => (s >= 90 ? `${Math.ceil(s / 60)} minutes` : s > 60 ? "a minute and a half" : s === 60 ? "a minute" : `${s} seconds`)

// The sample's stand-in for the server: 123456 and 7KQ2-MV9T work, five wrong codes pause sign-in for 5 minutes.
function sampleVerifier() {
  let wrong = 0
  return async (code: string, method: TwoFactorMethod): Promise<TwoFactorResult> => {
    await new Promise((r) => window.setTimeout(r, 600))
    if (method === "app" ? code === "123456" : code.replace("-", "") === "7KQ2MV9T") return { ok: true }
    wrong += 1
    return wrong >= 5 ? { ok: false, reason: "locked", retryAfter: 300 } : { ok: false, reason: "wrong", attemptsLeft: 5 - wrong }
  }
}

function Problem({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex animate-appear items-start gap-2 text-sm text-danger">
      <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

/**
 * The step after the password: a 6-digit code from an authenticator app, or a recovery code instead, with "Remember this
 * browser for 30 days". Errors say what to do in words: a wrong code says how many tries are left, too many pauses
 * sign-in and the button counts down. A passkey is offered as the quicker way unless `passkey` is false. Same frame and
 * width as Sign-in.
 */
export function AuthTwoFactor({
  product = "Fleet console",
  email = "mei.lin@example.com",
  defaultMethod = "app",
  onVerify,
  passkey: offerPasskey = true,
  onPasskey,
  onSignedIn,
  onBack,
}: {
  product?: string
  /** Who is signing in, so someone on a shared screen sees whose code is asked for. */
  email?: string
  defaultMethod?: TwoFactorMethod
  /** Check the code on your server. `remember` asks it to trust this browser for 30 days. */
  onVerify?: (code: string, method: TwoFactorMethod, remember: boolean) => Promise<TwoFactorResult>
  /** Offer a passkey as the quicker way; false when the account has none. */
  passkey?: boolean
  /** Start WebAuthn (navigator.credentials.get) and resolve true when it succeeds. */
  onPasskey?: () => Promise<boolean>
  onSignedIn?: () => void
  /** Back to the password step, to sign in as someone else. */
  onBack?: () => void
}) {
  const [method, setMethod] = React.useState<TwoFactorMethod>(defaultMethod)
  const [code, setCode] = React.useState("")
  const [recovery, setRecovery] = React.useState("")
  const [remember, setRemember] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [lockedUntil, setLockedUntil] = React.useState<number>()
  const [now, setNow] = React.useState(() => Date.now())
  const [passkey, setPasskey] = React.useState<"idle" | "waiting" | "failed">("idle")
  const [sample] = React.useState(() => sampleVerifier())
  const verify = onVerify ?? sample
  const field = React.useRef<HTMLInputElement>(null)

  const left = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0
  const locked = left > 0

  React.useEffect(() => {
    if (!lockedUntil) return
    const t = window.setInterval(() => {
      const at = Date.now()
      setNow(at)
      if (at >= lockedUntil) {
        setLockedUntil(undefined)
        setError(undefined)
      }
    }, 1000)
    return () => window.clearInterval(t)
  }, [lockedUntil])

  const switchTo = (m: TwoFactorMethod) => {
    setMethod(m)
    setError(undefined)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked || busy) return
    const value = method === "app" ? code : recovery.trim().toUpperCase()
    if (method === "app" && value.length < 6) return setError("Enter all 6 digits.")
    if (method === "recovery" && !RECOVERY.test(value)) return setError("A recovery code is 8 letters and numbers, like 7KQ2-MV9T.")
    setBusy(true)
    setError(undefined)
    const result = await verify(value, method, remember)
    setBusy(false)
    if (result.ok) {
      setDone(true)
      return onSignedIn?.()
    }
    if (result.reason === "locked") {
      setNow(Date.now())
      setLockedUntil(Date.now() + result.retryAfter * 1000)
      return setError(`Too many wrong codes. To keep your account safe, sign-in is paused; try again in ${inWords(result.retryAfter)}.`)
    }
    const tries = result.attemptsLeft === undefined ? "" : result.attemptsLeft === 1 ? " 1 try left." : ` ${result.attemptsLeft} tries left.`
    setError(
      method === "app"
        ? `That code did not match. Codes change every 30 seconds; enter the one showing now.${tries}`
        : `That recovery code did not match, or it was used already.${tries}`,
    )
    field.current?.focus()
  }

  const usePasskey = async () => {
    setPasskey("waiting")
    // Without a handler the sample fails, to show the way back to the code.
    const ok = onPasskey ? await onPasskey() : await new Promise<boolean>((r) => window.setTimeout(() => r(false), 900))
    setPasskey(ok ? "idle" : "failed")
    if (ok) {
      setDone(true)
      onSignedIn?.()
    }
  }


  return (
    <main className="flex min-h-[var(--app-shell-height,100dvh)] items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <PageHeader
          title={method === "app" ? "Enter your 2FA code" : "Use a recovery code"}
          description={
            <>
              {method === "app" ? `Open your authenticator app and enter the code for ${product}.` : "Each recovery code works once."} Signing in as{" "}
              <span className="font-medium text-foreground wrap-anywhere">{email}</span>.
            </>
          }
          className="pb-0"
        />

        {done ? (
          <p role="status" className="animate-appear text-sm">
            Verified. Opening {product}…
          </p>
        ) : (
          <>
            <form noValidate onSubmit={submit} className="flex flex-col gap-4">
              {method === "app" ? (
                <Field label="6-digit code" error={error}>
                  <InputOTP
                    ref={field}
                    autoFocus
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    disabled={locked}
                    value={code}
                    onChange={(v) => {
                      setCode(v)
                      if (!locked) setError(undefined)
                    }}
                    // The six boxes share the column's width, so their edges line up with the button below.
                    containerClassName="w-full"
                  >
                    <InputOTPGroup className="w-full gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} aria-invalid={error ? true : undefined} className="w-auto flex-1" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </Field>
              ) : (
                <Field label="Recovery code" hint="One of the 10 codes you saved when you set up 2FA." error={error}>
                  <Input
                    ref={field}
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="XXXX-XXXX"
                    className="font-mono uppercase"
                    disabled={locked}
                    value={recovery}
                    onChange={(e) => {
                      setRecovery(e.target.value)
                      if (!locked) setError(undefined)
                    }}
                  />
                </Field>
              )}
              <ChoiceField
                label="Remember this browser for 30 days"
                description="Not on a shared or public computer."
                control={<Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />}
              />
              <Button type="submit" size="lg" loading={busy} disabled={locked}>
                {/* The countdown is the button's own text and is not announced every second; the error above says it once. */}
                {locked ? <span className="tabular-nums">Try again in {minutes(left)}</span> : "Verify and sign in"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => switchTo(method === "app" ? "recovery" : "app")}>
                {method === "app" ? "Use a recovery code instead" : "Use the code from your app"}
              </Button>
            </form>

            {offerPasskey && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Separator className="flex-1" />
                  or
                  <Separator className="flex-1" />
                </div>
                <Button variant="secondary" size="lg" loading={passkey === "waiting"} onClick={usePasskey}>
                  <Fingerprint aria-hidden="true" />
                  Use a passkey instead
                </Button>
                <div role="status" className="min-h-5 text-sm">
                  {passkey === "waiting" && <span className="text-muted-foreground">Confirm in the prompt from your browser.</span>}
                  {passkey === "failed" && <Problem id="two-factor-passkey-error">No passkey for {product} in this browser. Use your code instead.</Problem>}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-muted-foreground">Lost your phone and your recovery codes? Ask your site admin to reset your 2FA.</p>
          {onBack && (
            <Button variant="link" size="sm" className="px-0" onClick={onBack}>
              Sign in as someone else
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
