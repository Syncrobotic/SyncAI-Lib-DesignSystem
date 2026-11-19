// @syncrobotic/users-invitations v0.15.0 · update: npx shadcn add @syncrobotic/users-invitations --overwrite
"use client"

import * as React from "react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

type Invite = { email: string; role: string; by: string; sent: string; expires: string; expired?: boolean }

const initial: Invite[] = [
  { email: "night.shift@example.com", role: "Operator", by: "Mei Lin", sent: "Today", expires: "in 7 days" },
  { email: "contractor@partner.example", role: "Viewer", by: "Kai Chen", sent: "12 Nov", expires: "in 2 days" },
  { email: "ana.ruiz@example.com", role: "Supervisor", by: "Mei Lin", sent: "3 Nov", expires: "10 Nov", expired: true },
]

const roleHint: Record<string, string> = {
  Viewer: "Sees robots, maps and logs; changes nothing.",
  Operator: "Runs missions, acknowledges alarms, stops and releases robots.",
  Supervisor: "Everything an Operator does, plus schedules and routes.",
}

function Expiry({ invite }: { invite: Invite }) {
  return invite.expired ? (
    <span className="flex items-center gap-2 text-warning">
      <StatusGlyph status="warning" /> Expired {invite.expires}
    </span>
  ) : (
    <span className="text-muted-foreground">{invite.expires}</span>
  )
}

/**
 * Invitations that have not been accepted yet: invite in one row at the top, what the chosen role allows written under
 * it, then the pending list. An expired invitation says so and offers to send it again; revoking can be undone.
 */
export function UsersInvitations() {
  const [invites, setInvites] = React.useState(initial)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("Operator")
  const [error, setError] = React.useState<string>()

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter an email address, e.g. name@example.com")
    if (invites.some((i) => i.email === email)) return setError("This person already has an invitation. Send it again from the list.")
    setInvites((l) => [{ email, role, by: "Mei Lin", sent: "Just now", expires: "in 7 days" }, ...l])
    toast({ tone: "success", title: "Invitation sent", description: email })
    setEmail("")
    setError(undefined)
  }

  const resend = (i: Invite) => {
    setInvites((l) => l.map((x) => (x.email === i.email ? { ...x, sent: "Just now", expires: "in 7 days", expired: false } : x)))
    toast({ title: "Invitation sent again", description: i.email })
  }

  const revoke = (i: Invite) => {
    setInvites((l) => l.filter((x) => x.email !== i.email))
    toast({ title: `Invitation for ${i.email} revoked`, action: { label: "Undo", onClick: () => setInvites((l) => [...l, i]) } })
  }

  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#settings" title="Invitations" user={sampleUser}>
      <div className="flex flex-col gap-6">
        <form noValidate onSubmit={send} className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
          <h2 className="text-sm font-medium">Invite someone</h2>
          <div className="grid items-start gap-3 sm:grid-cols-[1fr_12rem_auto]">
            <Field label="Email" error={error}>
              <Input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Role" hint={roleHint[role]}>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(roleHint).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {/* A blank line the height of a label, so the button lines up with the fields. */}
            <div className="flex flex-col gap-2">
              <span aria-hidden="true" className="hidden h-5 sm:block" />
              <Button type="submit">Send invitation</Button>
            </div>
          </div>
        </form>

        <section aria-labelledby="pending-title" className="flex flex-col gap-3">
          <h2 id="pending-title" className="text-lg font-bold">
            Pending <span className="font-normal text-muted-foreground tabular-nums">{invites.length}</span>
          </h2>
          <div className="overflow-hidden rounded-md bg-card ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Invited by</TableHead>
                  <TableHead className="hidden sm:table-cell">Expires</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((i) => (
                  <TableRow key={i.email}>
                    <TableCell className="py-2">
                      <span className="font-medium">{i.email}</span>
                      {/* On a phone the role and expiry sit under the email; they are columns from wider screens. */}
                      <span className="flex flex-col text-xs sm:hidden">
                        <span className="text-muted-foreground">{i.role}</span>
                        <Expiry invite={i} />
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{i.role}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {i.by}, {i.sent}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Expiry invite={i} />
                    </TableCell>
                    <TableCell className="py-2 text-right whitespace-nowrap">
                      <span className="flex flex-col items-end sm:flex-row sm:justify-end">
                        <Button size="sm" variant={i.expired ? "secondary" : "ghost"} onClick={() => resend(i)} aria-label={`Send again to ${i.email}`}>
                          Send again
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => revoke(i)} aria-label={`Revoke invitation for ${i.email}`}>
                          Revoke
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
      <Toaster />
    </AppShell>
  )
}
