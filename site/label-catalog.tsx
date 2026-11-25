"use client"

import * as React from "react"
import Link from "next/link"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import type { LabelGroup } from "./label-catalog-data"
import { Inline } from "./prose"
import { TokenTable } from "./token-table"

const mono = "font-mono text-sm"
const linkCls = "whitespace-nowrap font-mono text-sm underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"

let request: Promise<LabelGroup[]> | null = null
const load = () => {
  request ??= fetch("/localisation-labels.json").then((r) => {
    if (!r.ok) throw new Error(`labels: ${r.status}`)
    return r.json() as Promise<LabelGroup[]>
  })
  // A failed request is forgotten, so a later visit asks the server again.
  request.catch(() => (request = null))
  return request
}

/**
 * Every component's labels, each key with its English default and note: fetched once the page has shown
 * (/localisation-labels.json, built from site/props.json), since its 700-odd rows made the page six times its size.
 */
export function LabelCatalog() {
  const [groups, setGroups] = React.useState<LabelGroup[] | null>(null)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => {
    let live = true
    load().then(
      (g) => live && setGroups(g),
      () => live && setFailed(true),
    )
    return () => {
      live = false
    }
  }, [])
  // A link to one component's table (#labels-data-grid-DataGrid) lands on it once the tables are there.
  React.useEffect(() => {
    if (groups && location.hash.startsWith("#labels-")) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView()
  }, [groups])

  if (failed) return <p className="text-sm text-muted-foreground">The labels did not load. Reload the page to try again.</p>
  if (!groups)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" delay={0} label="" /> Loading the labels
      </p>
    )
  return (
    <div className="flex flex-col gap-8">
      {groups.map((g) => {
        const id = `labels-${g.item}-${g.names[0]}`
        const text = g.names.join(", ")
        return (
          <section key={`${g.item}-${g.names.join()}`} aria-labelledby={id} className="flex flex-col gap-3">
            <h3 id={id} className="text-base font-medium">
              {g.page ? (
                <Link href={`/docs/components/${g.item}`} className={`${linkCls} inline-flex min-h-(--h-sm) items-center`}>
                  {text}
                </Link>
              ) : (
                <span className={mono}>{text}</span>
              )}
            </h3>
            <TokenTable
              head={["Key", "English default"]}
              rows={g.keys.map(([name, value, note]) => [
                <code key="k" className={mono}>
                  {name}
                </code>,
                <span key="d" className="flex flex-col gap-1">
                  <code className="font-mono text-xs break-words">{value}</code>
                  {note && (
                    <span className="text-muted-foreground">
                      <Inline text={note} />
                    </span>
                  )}
                </span>,
              ])}
            />
          </section>
        )
      })}
    </div>
  )
}
