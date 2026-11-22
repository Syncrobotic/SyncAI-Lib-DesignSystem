// @syncrobotic/users-roles v0.28.0 · update: npx shadcn add @syncrobotic/users-roles --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Ellipsis, UserPlus } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/syncrobotic/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

type Role = "Admin" | "Operator" | "Viewer"
type User = { id: string; name: string; email: string; role: Role; invited?: boolean }

const roles: Record<Role, string> = {
  Admin: "Everything, including users and billing",
  Operator: "Run missions and stop or release robots",
  Viewer: "See everything, change nothing",
}

const initial: User[] = [
  { id: "u1", name: "Mei Lin", email: "mei@example.com", role: "Admin" },
  { id: "u2", name: "Kai Chen", email: "kai@example.com", role: "Operator" },
  { id: "u3", name: "Ana Ruiz", email: "ana@example.com", role: "Operator" },
  { id: "u4", name: "", email: "night.shift@example.com", role: "Viewer", invited: true },
]

const initials = (u: User) =>
  (u.name || u.email)
    .split(/[ .@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("")

/** A long email wraps before its @, not in the middle of a word. */
const breakAtSign = (email: string) => {
  const at = email.indexOf("@")
  return at < 0 ? (
    email
  ) : (
    <>
      {email.slice(0, at)}
      <wbr />
      {email.slice(at)}
    </>
  )
}

/** Users and roles: who can do what. Change a role in place; invite by email; remove from the row menu (last, after a separator). */
export function UsersRoles() {
  const [users, setUsers] = React.useState(initial)
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<Role>("Viewer")
  const [error, setError] = React.useState<string>()

  const invite = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter an email address, e.g. name@example.com")
    setUsers((u) => [...u, { id: crypto.randomUUID(), name: "", email, role, invited: true }])
    toast({ tone: "success", title: "Invitation sent", description: email })
    setEmail("")
    setError(undefined)
    setOpen(false)
  }

  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#users"
      title="Users"
      user={sampleUser}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus aria-hidden="true" /> Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite someone</DialogTitle>
              <DialogDescription>They get an email with a link that works for 7 days.</DialogDescription>
            </DialogHeader>
            <Field label="Email" error={error}>
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Role" hint={roles[role]}>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(roles) as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button onClick={invite}>Send invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="flex max-w-5xl flex-col gap-4">
        <p className="text-sm text-muted-foreground">{users.length} people can sign in to this site.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead className="w-32 px-2 sm:w-44 sm:px-4">Role</TableHead>
              <TableHead className="w-16 px-2 sm:px-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                {/* w-full max-w-0: the person takes what the role and menu leave, and a long email wraps instead of pushing the role off a phone. */}
                <TableCell className="w-full max-w-0 py-2 whitespace-normal">
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden sm:flex">
                      <AvatarFallback>{initials(u)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col items-start">
                      {/* Someone invited has no name yet: the badge takes the name's line and the email its own, whole, so it
                          is never cut to a few letters beside the badge. */}
                      {u.name ? (
                        <span className="max-w-full truncate font-medium">{u.name}</span>
                      ) : (
                        <Badge tone="outline">Invited</Badge>
                      )}
                      <span className={cn("max-w-full text-xs wrap-break-word", u.name ? "text-muted-foreground" : "mt-1 font-medium text-foreground")}>
                        {breakAtSign(u.email)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-2 sm:px-4">
                  <Select value={u.role} onValueChange={(v) => setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role: v as Role } : x)))}>
                    <SelectTrigger aria-label={`Role of ${u.name || u.email}`} className="h-(--h-sm)">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(roles) as Role[]).map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="px-2 sm:px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`More for ${u.name || u.email}`}>
                        <Ellipsis aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {u.invited && (
                        <DropdownMenuItem onSelect={() => toast({ title: "Invitation sent again", description: u.email })}>Resend invitation</DropdownMenuItem>
                      )}
                      <DropdownMenuItem>View activity</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        onSelect={() => {
                          setUsers((list) => list.filter((x) => x.id !== u.id))
                          toast({ title: `${u.name || u.email} removed`, action: { label: "Undo", onClick: () => setUsers((list) => [...list, u]) } })
                        }}
                      >
                        Remove from site
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Toaster />
    </AppShell>
  )
}
