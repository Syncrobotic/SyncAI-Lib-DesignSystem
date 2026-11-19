// @syncrobotic/auth-passkey v0.17.3 · update: npx shadcn add @syncrobotic/auth-passkey --overwrite
"use client"

import * as React from "react"
import { Fingerprint } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot, REGEXP_ONLY_DIGITS } from "@/registry/syncrobotic/ui/input-otp"
import { Label } from "@/registry/syncrobotic/ui/label"
import { Separator } from "@/registry/syncrobotic/ui/separator"

type Step = "passkey" | "waiting" | "failed" | "code"

/**
 * Sign in with a passkey: one button, then the browser's own prompt (fingerprint, face or device PIN). If the passkey is
 * not there, a six-digit code from an authenticator app is the way back in, on the same page.
 */
export function AuthPasskey({
  product = "Fleet console",
  onPasskey,
  onCode,
}: {
  product?: string
  /** Start WebAuthn here (navigator.credentials.get) and resolve true when it succeeds. */
  onPasskey?: () => Promise<boolean>
  onCode?: (code: string) => Promise<boolean>
}) {
  const [step, setStep] = React.useState<Step>("passkey")
  const [code, setCode] = React.useState("")
  const [codeError, setCodeError] = React.useState<string>()
  const [busy, setBusy] = React.useState(false)

  const passkey = async () => {
    setStep("waiting")
    // Without a handler the sample fails, to show what happens when the passkey is not on this device.
    const ok = onPasskey ? await onPasskey() : await new Promise<boolean>((r) => window.setTimeout(() => r(false), 900))
    setStep(ok ? "passkey" : "failed")
  }

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 6) return setCodeError("Enter all 6 digits.")
    setBusy(true)
    const ok = onCode ? await onCode(code) : await new Promise<boolean>((r) => window.setTimeout(() => r(code === "123456"), 600))
    setBusy(false)
    setCodeError(ok ? undefined : "That code did not work. Codes change every 30 seconds; try the current one.")
  }

  return (
    <main className="flex min-h-[var(--app-shell-height,100dvh)] items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">Sign in to {product}</h1>
          <p className="text-sm text-muted-foreground">No password: use the passkey on this device.</p>
        </div>

        {step === "code" ? (
          <form noValidate onSubmit={submitCode} className="flex animate-appear flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="auth-code">Code from your authenticator app</Label>
              <InputOTP
                id="auth-code"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={code}
                onChange={(v) => {
                  setCode(v)
                  setCodeError(undefined)
                }}
                aria-invalid={codeError ? true : undefined}
                aria-describedby={codeError ? "auth-code-error" : undefined}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {codeError && (
                <p id="auth-code-error" className="text-sm text-danger">
                  {codeError}
                </p>
              )}
            </div>
            <Button type="submit" size="lg" loading={busy}>
              Sign in with code
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep("passkey")}>
              Use a passkey instead
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <Button size="lg" onClick={passkey} loading={step === "waiting"}>
              <Fingerprint aria-hidden="true" />
              Sign in with a passkey
            </Button>
            <div role="status" className="min-h-5 text-sm">
              {step === "waiting" && <span className="text-muted-foreground">Confirm in the prompt from your browser.</span>}
              {step === "failed" && <span className="text-danger">No passkey for {product} on this device. Use a code, or try another device.</span>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              or
              <Separator className="flex-1" />
            </div>
            <Button variant="secondary" size="lg" onClick={() => setStep("code")}>
              Use a code from an authenticator app
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">Lost your device? Ask your site admin to reset your sign-in.</p>
      </div>
    </main>
  )
}
