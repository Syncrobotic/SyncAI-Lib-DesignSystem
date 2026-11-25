"use client"

import * as React from "react"
import { CodeBlock as Frame } from "@/registry/syncrobotic/ui/code-block"
import { Button } from "@/registry/syncrobotic/ui/button"
import type { CodeData } from "./code-data"

// One request per listing for the page's life: a panel opened twice, or hovered then opened, reads the same promise.
const requests = new Map<string, Promise<CodeData>>()
const loaded = new Map<string, CodeData>()

/** Starts loading a listing (a Code tab or sheet's trigger calls it on hover and focus, so the panel opens filled). */
export function loadCode(src: string) {
  let p = requests.get(src)
  if (!p) {
    p = fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`${src}: ${r.status}`)
        return r.json() as Promise<CodeData>
      })
      .then((d) => {
        loaded.set(src, d)
        return d
      })
    // A failed request is forgotten, so Try again asks the server again.
    p.catch(() => requests.delete(src))
    requests.set(src, p)
  }
  return p
}

/** "registry/syncrobotic/ui/chart.tsx" with a break chance after each "/", as the code block's own header wraps it. */
function Path({ text }: { text: string }) {
  const parts = text.split("/")
  return (
    <>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <span className="whitespace-nowrap">{i < parts.length - 1 ? `${p}/` : p}</span>
          {i < parts.length - 1 && <wbr />}
        </React.Fragment>
      ))}
    </>
  )
}

/**
 * A listing that is fetched when it is shown (site/code-data.ts): Radix mounts a tab's or a sheet's content only when it
 * opens, so mounting is opening. Until it arrives the frame is drawn with its title and `lines` empty lines, at the
 * listing's own height, so nothing moves when the code fills it.
 */
export function LazyCode({ src, title, lang, lines }: { src: string; title: string; lang: "tsx" | "ts" | "css"; lines: number }) {
  const [data, setData] = React.useState<CodeData | null>(() => loaded.get(src) ?? null)
  const [failed, setFailed] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    if (data) return
    let live = true
    loadCode(src).then(
      (d) => {
        if (live) setData(d)
      },
      () => {
        if (live) setFailed(true)
      },
    )
    return () => {
      live = false
    }
  }, [src, data, attempt])

  if (data) {
    return (
      <Frame code={data.code} title={title} language={lang} labels={{ code: `${lang} code` }}>
        <div className="code" dangerouslySetInnerHTML={{ __html: data.html }} />
      </Frame>
    )
  }
  return (
    <div data-slot="code-block" aria-busy={!failed} className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border py-1 pr-1 pl-4">
        <span className="min-w-0 font-mono text-xs text-muted-foreground">
          <Path text={title} />
        </span>
        {/* Where the copy button will be, so the header is its height already. */}
        <span aria-hidden="true" className="ml-auto size-(--h-sm) shrink-0" />
      </div>
      {/* As many empty lines as the listing has, set as the code block sets them, so the height is the code's to the pixel
          (a line is the mono face's line box, a pixel taller than its 20 px line-height). */}
      <div className="relative min-w-0 text-sm [&_pre]:p-4 [&_pre]:font-mono [&_pre]:leading-5 [&_pre]:tabular-nums">
        <div aria-hidden="true" className="code">
          <pre>
            <code>
              {Array.from({ length: lines }, (_, i) => (
                <React.Fragment key={i}>
                  {i > 0 && "\n"}
                  <span className="line"> </span>
                </React.Fragment>
              ))}
            </code>
          </pre>
        </div>
        <div role="status" className="absolute inset-x-4 top-4 flex items-center gap-3 text-muted-foreground">
          {failed ? (
            <>
              <span>Could not load the code.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFailed(false)
                  setAttempt((a) => a + 1)
                }}
              >
                Try again
              </Button>
            </>
          ) : (
            <span className="sr-only">Loading code</span>
          )}
        </div>
      </div>
    </div>
  )
}
