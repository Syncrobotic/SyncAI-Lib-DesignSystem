// @syncrobotic/users-roles v0.8.0 · update: npx shadcn add @syncrobotic/users-roles --overwrite
"use client"

import * as React from "react"
import { Ellipsis, UserPlus } from "lucide-react"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
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
      current="#settings"
      title="Users"
      user={{ name: "Mei Lin", initials: "ML" }}
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
              <TableHead className="w-44">Role</TableHead>
              <TableHead className="w-16">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(u)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 font-medium">
                        {u.name || u.email}
                        {u.invited && <Badge tone="outline">Invited</Badge>}
                      </span>
                      {u.name && <span className="truncate text-xs text-muted-foreground">{u.email}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
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
                <TableCell>
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
