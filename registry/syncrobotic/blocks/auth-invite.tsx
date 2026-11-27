// @syncrobotic/auth-invite v0.53.0 · update: npx shadcn add @syncrobotic/auth-invite --overwrite
"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { IconTile } from "@/registry/syncrobotic/ui/icon-tile"
import { Input } from "@/registry/syncrobotic/ui/input"
import { PageHeader } from "@/registry/syncrobotic/ui/page-header"

export type Invitation = {
  from: { name: string; initials: string }
  site: string
  role: string
  /** What the role lets you do, in words. */
  can: string[]
  email: string
  expires: string
}

export const sampleInvitation: Invitation = {
  from: { name: "Mei Lin", initials: "ML" },
  site: "Taoyuan plant",
  role: "Operator",
  can: ["Start, pause and stop missions", "Acknowledge alarms", "See robots and the live map"],
  email: "chen.wei@example.com",
  expires: "24 November",
}

/**
 * Accepting an invitation: who invited you, to what, and what the role lets you do, then one field and one action to
 * join. Declining is quiet but always there.
 */
export function AuthInvite({
  invitation = sampleInvitation,
  product = "Fleet console",
  onAccept,
  onDecline,
}: {
  invitation?: Invitation
  product?: string
  onAccept?: (name: string) => void
  onDecline?: () => void
}) {
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string>()
  const [state, setState] = React.useState<"open" | "busy" | "accepted">("open")
  // The sample's reply (the robot confirming, the server answering); cleared on unmount so it never lands on a page
  // that is gone.
  const reply = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(reply.current), [])
  // Focus follows the outcome: the field in error once it shows the error, so both are read together; the status once
  // the invitation is accepted. Never left on the page body.
  const [attempt, setAttempt] = React.useState(0)
  const form = React.useRef<HTMLFormElement>(null)
  const status = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (attempt) form.current?.querySelector<HTMLElement>(":is(input, textarea, select, button)[aria-invalid=true]")?.focus()
  }, [attempt])
  const accepted = state === "accepted"
  React.useEffect(() => {
    if (accepted) status.current?.focus()
  }, [accepted])

  const accept = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Enter your name as your team knows it.")
      return setAttempt((n) => n + 1)
    }
    setError(undefined)
    setState("busy")
    reply.current = setTimeout(() => {
      setState("accepted")
      onAccept?.(name.trim())
    }, 600)
  }

  const i = invitation
  return (
    <main className="flex min-h-[var(--app-shell-height,100dvh)] items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Mounted from the start, empty and out of the flow until the invitation is accepted, so its message is announced. */}
        <div ref={status} role="status" tabIndex={-1} className={accepted ? "flex animate-appear flex-col gap-4" : "sr-only"}>
          {accepted && (
            <>
              <IconTile variant="muted">
                <Check aria-hidden="true" />
              </IconTile>
              <PageHeader title={`You have joined ${i.site}`} description={`You are an ${i.role}. ${i.from.name} can change your role.`} className="pb-0" />
              <Button size="lg">Open {product}</Button>
            </>
          )}
        </div>
        {!accepted && (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback>{i.from.initials}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{i.from.name}</span> invited you
              </p>
            </div>
            <PageHeader title={`Join ${i.site} as ${i.role}`} description={`In ${product}, as ${i.email}.`} className="pb-0" />
            <div className="flex flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
              <span className="text-sm font-medium">As {i.role} you can</span>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {i.can.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <form ref={form} noValidate onSubmit={accept} className="flex flex-col gap-4">
              <Field label="Your name" hint="Shown to your team in alarms and logs." error={error}>
                <Input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Button type="submit" size="lg" loading={state === "busy"}>
                Accept and join
              </Button>
              <Button type="button" variant="ghost" onClick={onDecline}>
                Decline
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">This invitation expires on {i.expires}.</p>
          </>
        )}
      </div>
    </main>
  )
}
