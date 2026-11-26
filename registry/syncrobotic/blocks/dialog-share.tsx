// @syncrobotic/dialog-share v0.40.0 · update: npx shadcn add @syncrobotic/dialog-share --overwrite
"use client"

import * as React from "react"
import { Share2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Code } from "@/registry/syncrobotic/ui/code"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/syncrobotic/ui/dialog"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/registry/syncrobotic/ui/item"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Separator } from "@/registry/syncrobotic/ui/separator"

type Person = { name: string; initials: string; email: string; access: "owner" | "edit" | "view" }

const samplePeople: Person[] = [
  { name: "Mei Lin", initials: "ML", email: "mei.lin@example.com", access: "owner" },
  { name: "Chen Wei", initials: "CW", email: "chen.wei@example.com", access: "edit" },
  { name: "Ana Souza", initials: "AS", email: "ana.souza@example.com", access: "view" },
]

const accessLabel = { owner: "Owner", edit: "Can edit", view: "Can view" } as const

/**
 * Sharing one thing: invite people by email, change what each can do in place, and copy a link. Who can open the link is
 * said in words above it, so nobody shares more than they meant to.
 */
export function DialogShare({
  title = "Incident report, 14 Nov, loading bay",
  link = "https://console.example.com/incidents/IN-2041",
  defaultOpen,
  focusOnOpen = true,
}: {
  title?: string
  link?: string
  defaultOpen?: boolean
  /** false for previews that open on load, so the page around them keeps its focus. */
  focusOnOpen?: boolean
}) {
  const [people, setPeople] = React.useState(samplePeople)
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string>()
  const [linkAccess, setLinkAccess] = React.useState("org")

  const invite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter an email, e.g. name@example.com")
    // The check above guarantees an @, so the name is everything before the first one.
    const name = email.slice(0, email.indexOf("@")).replace(/[._]/g, " ")
    setPeople((p) => [...p, { name, initials: name.slice(0, 2).toUpperCase(), email, access: "view" }])
    setEmail("")
    setError(undefined)
  }

  return (
    <div className="flex min-h-[var(--app-shell-height,100dvh)] items-center justify-center bg-background p-6">
      <Dialog defaultOpen={defaultOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">
            <Share2 aria-hidden="true" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg" onOpenAutoFocus={focusOnOpen ? undefined : (e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Share {title}</DialogTitle>
            <DialogDescription>People you add get an email with a link.</DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={invite} className="flex items-start gap-2">
            <Field label="Invite by email" error={error} className="min-w-0 flex-1">
              <Input placeholder="name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {/* A blank line the height of the label, so the button lines up with the field, not with its error. */}
            <div className="flex flex-col gap-2">
              <span aria-hidden="true" className="h-5" />
              <Button type="submit" variant="secondary">
                Invite
              </Button>
            </div>
          </form>
          <ItemGroup aria-label="People with access" className="gap-0">
            {people.map((p) => (
              <Item key={p.email} role="listitem" className="px-0">
                <ItemMedia variant="avatar">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">{p.initials}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle className="capitalize">
                    <span>{p.name}</span>
                  </ItemTitle>
                  <ItemDescription className="truncate text-xs">{p.email}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  {p.access === "owner" ? (
                    <span className="px-3 text-sm text-muted-foreground">Owner</span>
                  ) : (
                    <Select
                      value={p.access}
                      onValueChange={(v) => setPeople((all) => all.map((x) => (x.email === p.email ? { ...x, access: v as Person["access"] } : x)))}
                    >
                      <SelectTrigger aria-label={`Access for ${p.name}`} className="w-32">
                        <SelectValue>{accessLabel[p.access]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="edit">Can edit</SelectItem>
                        <SelectItem value="view">Can view</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
          <Separator />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span id="link-access" className="text-sm font-medium">
                Link
              </span>
              <Select value={linkAccess} onValueChange={setLinkAccess}>
                <SelectTrigger aria-labelledby="link-access" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="people">Only people added</SelectItem>
                  <SelectItem value="org">Your organisation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-sm">
                <Code>{link}</Code>
              </span>
              <CopyButton value={link} label="Copy link" variant="outline">
                Copy link
              </CopyButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
