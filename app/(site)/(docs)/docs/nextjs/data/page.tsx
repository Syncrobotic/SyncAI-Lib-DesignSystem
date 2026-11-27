import type { Metadata } from "next"
import * as React from "react"
import Link from "next/link"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { Pager } from "@/site/doc"
import { startNeighbours } from "@/site/foundations"
import { H2, Inline, PageTitle } from "@/site/prose"

const description =
  "Forms and lists in a Next.js App Router project: save through a Server Function that returns a refusal, and keep a list's page, sort and search in the URL with useListQuery."

export const metadata: Metadata = pageMeta({ title: "Forms and lists in Next.js", description, path: "/docs/nextjs/data" })

// Every snippet below was built and run in a Next.js 16 app with the kit installed (tsc, next build, and a browser).

const listAdapter = `"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type ListQueryAdapter, useListQuery } from "@/hooks/use-list-query"

// The URL goes through the router, so a list's query takes part in navigation and server rendering.
export function useRouterListQuery(options?: Parameters<typeof useListQuery>[0]) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const adapter: ListQueryAdapter = {
    read: () => searchParams.toString(),
    write: (search, mode) => router[mode](search ? \`\${pathname}?\${search}\` : pathname, { scroll: false }),
  }
  return useListQuery({ ...options, adapter })
}`

const listPage = `import { parseListQuery } from "@/lib/list-query"

// The server reads the same query the browser will, so the first HTML is the right page.
export default async function DevicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseListQuery(await searchParams, { sortable: ["name", "lastSeenAt"] })
  const page = await getDevices(query) // { items, total }: count with total, never items.length
  return <DevicesTable initial={page} />
}`

const actions = `"use server"

import type { MissionValues } from "@/components/form"

// A refusal is a return value: an error thrown here reaches the browser without its message in production.
export async function saveMission(values: MissionValues): Promise<{ error?: string }> {
  if (values.name.toLowerCase().includes("test")) return { error: "A mission named “test” already exists on this site." }
  // … write it to your API or database
  return {}
}`

const newMission = `"use client"

import { useRouter } from "next/navigation"
import { MissionForm } from "@/components/form"
import { saveMission } from "./actions"

export function NewMission() {
  const router = useRouter()
  return (
    <MissionForm
      onSave={async (values) => {
        const { error } = await saveMission(values)
        if (error) throw new Error(error) // MissionForm shows it above the fields and keeps what was typed
        router.push("/missions")
      }}
    />
  )
}`

function P({ text, className = "pb-3" }: { text: string; className?: string }) {
  return (
    <p className={`max-w-3xl text-base ${className}`}>
      <Inline text={text} />
    </p>
  )
}

function Stack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>
}

export default function NextjsDataPage() {
  return (
    <article>
      <PageTitle
        title="Forms and lists in Next.js"
        lead="Writes go through a Server Function; a list's query lives in the URL, so the server renders the right page first."
      />

      <H2 id="forms">Forms</H2>
      <P text="Start from the `form` example: React Hook Form and zod drawn with the kit's Field, installed with `npx shadcn add @syncrobotic/form`. `MissionForm` is a client component. Save through a Server Function that returns a refusal instead of throwing it, and turn it into an error in a small client file." />
      <Stack>
        <CodeBlock code={actions} lang="ts" title="app/(app)/missions/new/actions.ts" />
        <CodeBlock code={newMission} lang="tsx" title="app/(app)/missions/new/new-mission.tsx" />
      </Stack>
      <P className="pt-3" text="The page (`page.tsx`) stays a Server Component that renders `<NewMission />`." />
      <p className="max-w-3xl text-base">
        <Link href="/docs/components/form" className="underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
          The form example
        </Link>{" "}
        <Inline text="covers the rest: errors after the first submit, focus on the first field in error, and a button that waits." />
      </p>

      <H2 id="list-query">A list's query in the URL</H2>
      <P text="`useListQuery` keeps page, limit, sort and search in the URL through an adapter. Its default writes `window.history`; in the App Router, pass one on the router so the query takes part in navigation. `useSearchParams` re-renders the component when the URL changes, so the adapter needs no `subscribe`. Wrap the list in `<Suspense>`, as `useSearchParams` asks." />
      <Stack>
        <CodeBlock code={listAdapter} lang="tsx" title="hooks/use-router-list-query.ts" />
        <CodeBlock code={listPage} lang="tsx" title="app/(app)/devices/page.tsx" />
      </Stack>

      <Pager {...startNeighbours("/docs/nextjs/data")} />
    </article>
  )
}
