// @syncrobotic/users-invitations v0.53.0 · update: npx shadcn add @syncrobotic/users-invitations --overwrite
"use client"

import * as React from "react"
import { Mail, Send, Trash2 } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { ResponsiveTable } from "@/registry/syncrobotic/ui/responsive-table"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
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

// An expired invitation says so with the warning shape and word; one that is still open is a quiet date.
const Expiry = ({ invite }: { invite: Invite }) =>
  invite.expired ? <InlineStatus status="warning">Expired {invite.expires}</InlineStatus> : <span className="text-muted-foreground">{invite.expires}</span>

/**
 * Pending invitations: invite in one row with what the role allows, then the list, where expired ones say so and
 * revoking can be undone. A table where there is room, a list on a phone; an expired invitation offers to send it
 * again.
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
    <AppShell product="Fleet console" nav={sampleNav} current="#invitations" title="Invitations" user={sampleUser}>
      <div className="flex flex-col gap-6">
        <form noValidate onSubmit={send} className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
          <SectionHeader variant="surface" as="h2" title="Invite someone" />
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
          <SectionHeader id="pending-title" title="Pending" count={invites.length} />
          {/* One list of columns: the email is the row's title, the role the line under it, an expiry its trailing state. */}
          <ResponsiveTable
            label="Pending invitations"
            rows={invites}
            rowKey={(i) => i.email}
            columns={[
              { id: "email", header: "Email", cell: (i) => <span className="font-medium">{i.email}</span>, phoneCell: (i) => i.email },
              { id: "role", header: "Role", cell: (i) => i.role },
              { id: "by", header: "Invited by", cell: (i) => `${i.by}, ${i.sent}`, phone: "hidden", className: "hidden text-muted-foreground lg:table-cell" },
              {
                id: "expires",
                header: "Expires",
                phone: "trailing",
                cell: (i) => <Expiry invite={i} />,
                phoneCell: (i) => (i.expired ? <InlineStatus status="warning">Expired</InlineStatus> : undefined),
              },
            ]}
            // An expired invitation offers to send it again in view; every row has both actions in its ⋯ menu.
            rowActions={(i) => (
              <span className="flex items-center gap-2">
                {i.expired && (
                  <Button size="sm" variant="secondary" onClick={() => resend(i)} aria-label={`Send again to ${i.email}`}>
                    Send again
                  </Button>
                )}
                <DropdownMenu modal={false}>
                  <DropdownMenuMoreTrigger name={i.email} size="icon-sm" />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => resend(i)}>
                      <Send aria-hidden="true" /> Send again
                    </DropdownMenuItem>
                    <DropdownMenuItem destructive onSelect={() => revoke(i)}>
                      <Trash2 aria-hidden="true" /> Revoke
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
            )}
            empty={<EmptyState size="inline" icon={Mail} title="No pending invitations" description="Everyone you invited has joined. Invite someone above." />}
          />
        </section>
      </div>
      <Toaster />
    </AppShell>
  )
}
