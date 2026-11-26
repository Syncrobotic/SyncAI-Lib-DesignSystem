// @syncrobotic/sign-in v0.17.3 · update: npx shadcn add @syncrobotic/sign-in --overwrite
"use client"

import * as React from "react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { PageHeader } from "@/registry/syncrobotic/ui/page-header"
import { Separator } from "@/registry/syncrobotic/ui/separator"

/**
 * Sign in to an internal tool: company single sign-on first, email as the fallback. One column, the product name on top,
 * the error said in words under the field it belongs to, the button names what happens.
 */
export function SignIn({ product = "Fleet console", onSignIn }: { product?: string; onSignIn?: (method: "sso" | "email", email?: string) => void }) {
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string>()
  const [sent, setSent] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter your work email, e.g. name@example.com")
    setError(undefined)
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      setSent(true)
      onSignIn?.("email", email)
    }, 600)
  }

  return (
    <main className="flex min-h-[var(--app-shell-height,100dvh)] items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <PageHeader title={`Sign in to ${product}`} description="Use your SYNCROBOTIC account." className="pb-0" />

        {sent ? (
          <div role="status" className="flex animate-appear flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
            <span className="font-medium">Check your inbox</span>
            <span className="text-sm text-muted-foreground">
              We sent a sign-in link to {email}. It works for 15 minutes.
            </span>
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setSent(false)}>
              Use another email
            </Button>
          </div>
        ) : (
          <>
            <Button size="lg" onClick={() => onSignIn?.("sso")}>
              Continue with company SSO
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              or
              <Separator className="flex-1" />
            </div>
            <form noValidate onSubmit={submit} className="flex flex-col gap-4">
              <Field label="Work email" error={error}>
                <Input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Button type="submit" variant="secondary" size="lg" loading={busy}>
                Email me a sign-in link
              </Button>
            </form>
          </>
        )}

        <p className="text-xs text-muted-foreground">No account? Ask your site admin to invite you.</p>
      </div>
    </main>
  )
}
