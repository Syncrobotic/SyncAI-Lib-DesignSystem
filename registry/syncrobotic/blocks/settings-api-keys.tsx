// @syncrobotic/settings-api-keys v0.40.0 · update: npx shadcn add @syncrobotic/settings-api-keys --overwrite
"use client"

import * as React from "react"
import { KeyRound, Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Code } from "@/registry/syncrobotic/ui/code"
import { CodeBlock } from "@/registry/syncrobotic/ui/code-block"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/registry/syncrobotic/ui/item"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

export type ApiKey = { id: string; name: string; prefix: string; created: string; lastUsed: string }

export const sampleKeys: ApiKey[] = [
  { id: "k1", name: "Warehouse system", prefix: "sk_live_7f3a", created: "3 Mar 2026", lastUsed: "2 minutes ago" },
  { id: "k2", name: "Nightly report export", prefix: "sk_live_c2b0", created: "18 Jun 2026", lastUsed: "Today, 02:00" },
  { id: "k3", name: "Old test script", prefix: "sk_live_9e37", created: "9 Jan 2026", lastUsed: "Never" },
]

// The sample's stand-in for the server. A real key comes from your API once, in the create response.
const fakeSecret = (name: string) => `sk_live_${(name.length * 7919).toString(16).padStart(4, "0")}_${"x7Kq2mVb9TzR4wYp8NcH3sLd".slice(0, 24)}`

/**
 * API keys: the list, creating one, and revoking one. A new key's secret is shown once, with a copy button, and dropped
 * from memory when you leave it; afterwards only its first characters are shown. Revoking asks first and says what will
 * stop working.
 */
export function SettingsApiKeys({ keys: initial = sampleKeys }: { keys?: ApiKey[] }) {
  const [keys, setKeys] = React.useState(initial)
  const [creating, setCreating] = React.useState(false)
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string>()
  // The secret lives only here, only until "Done". Never put it in a cache, a store or the URL.
  const [secret, setSecret] = React.useState<string | null>(null)

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError("Name the key after what uses it, e.g. Warehouse system.")
    const value = fakeSecret(name)
    setKeys((k) => [{ id: `k${Date.now()}`, name: name.trim(), prefix: value.slice(0, 12), created: "Just now", lastUsed: "Never" }, ...k])
    setSecret(value)
    setCreating(false)
    setName("")
    setError(undefined)
  }

  return (
    <section aria-labelledby="keys-title" className="flex flex-col gap-4">
      <SectionHeader
        id="keys-title"
        title="API keys"
        description="Keys let other systems read robots and start missions as your organisation."
        actions={
          !creating &&
          !secret && (
            <Button variant="secondary" onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" />
              Create key
            </Button>
          )
        }
      />

      {creating && (
        <form noValidate onSubmit={create} className="flex animate-appear flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">
          <Field label="Key name" hint="Name it after what uses it, so you know what breaks if you revoke it." error={error}>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit">Create key</Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {secret && (
        <div role="status" className="flex animate-appear flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Copy your new key now</span>
            <span className="text-sm text-muted-foreground">You will not see it again. If you lose it, revoke it and create another.</span>
          </div>
          <CodeBlock code={secret} title="API key" secret copyLabel="Copy the new key" />
          <Button variant="secondary" className="self-start" onClick={() => setSecret(null)}>
            Done, I have copied it
          </Button>
        </div>
      )}

      <Card className="gap-0 p-0">
        {keys.length === 0 ? (
          <EmptyState
            size="inline"
            icon={KeyRound}
            title="No API keys"
            description="Create one for each system that reads robots or starts missions, so you can revoke it alone."
          />
        ) : (
          <ItemGroup aria-label="API keys" className="gap-0">
            {keys.map((k) => (
              <Item key={k.id} role="listitem" className="flex-wrap rounded-none border-b border-border px-4 last:border-b-0">
                <ItemMedia variant="plain">
                  <KeyRound aria-hidden="true" className="size-5 text-muted-foreground" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    <span>{k.name}</span>
                  </ItemTitle>
                  <ItemDescription className="text-xs">
                    <Code>{k.prefix}…</Code> · Created {k.created} · Last used {k.lastUsed}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      {/* Neutral in the list: three red buttons at rest would shout on a calm page. Red is for the
                          confirmation, where the key is actually revoked. */}
                      <Button variant="outline" size="sm" aria-label={`Revoke ${k.name}`}>
                        Revoke
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke {k.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Anything using <Code>{k.prefix}…</Code> stops working at once. You cannot undo this; create a new key instead.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep key</AlertDialogCancel>
                        <AlertDialogAction destructive onClick={() => setKeys((all) => all.filter((x) => x.id !== k.id))}>
                          Revoke key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </Card>
    </section>
  )
}
