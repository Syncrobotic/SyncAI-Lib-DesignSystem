// @syncrobotic/code-block v0.50.0 · update: npx shadcn add @syncrobotic/code-block --overwrite
"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { scrollFadeMask, useScrollEdges } from "@/registry/syncrobotic/ui/table"

export type CodeBlockLabels = {
  /** The copy button's name, from the block's title when it has one: (title) => "Copy " + title. */
  copy: (title?: string) => string
  /** Said after a copy. */
  copied: string
  /** Said when the browser refused the copy. */
  failed: string
  /** The secret toggle's name; aria-pressed says whether the value is shown. */
  show: string
  /** Read in place of the dots while a secret is hidden. */
  hidden: string
  /** The scroll box's name when there is no title. */
  code: string
}

const defaultLabels: CodeBlockLabels = {
  copy: (title) => (title ? `Copy ${title}` : "Copy code"),
  copied: "Copied",
  failed: "Could not copy: select the text and copy it",
  show: "Show value",
  hidden: "Hidden",
  code: "Code",
}

// A name is one token: "@syncrobotic/" then "number-field". A "/" ends its token, so a path breaks after it; a scheme
// stays with its host ("https://portal.example.com/").
const TOKEN = /(?:[a-z][\w+.-]*:\/\/)?[^\s/]+\/?|\//gi

/** Text split into names that never break inside, with a break chance after each "/". */
function Words({ text }: { text: string }) {
  const out: React.ReactNode[] = []
  let at = 0
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > at) out.push(text.slice(at, m.index))
    out.push(
      <span key={m.index} className="whitespace-nowrap">
        {m[0]}
      </span>,
    )
    if (m[0].endsWith("/")) out.push(<wbr key={`${m.index}-wbr`} />)
    at = m.index + m[0].length
  }
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}

/**
 * Code or a command to read and copy: a framed block with a header (the title, or the language) and a CopyButton that
 * copies `code` exactly. There is no highlighter inside: pass a highlighter's output as `children` (shiki's `<pre>`,
 * as the docs site does) and it takes the plain text's place; without children the code is plain text.
 *
 * `wrap="words"` is for shell commands: a line wraps only between words and after a "/", never inside a name, and a
 * continued line is indented. `wrap="none"` (the default, for source) scrolls sideways; the box takes focus so the
 * arrow keys scroll it, and fades on the side that still hides text. `secret` hides a one-time value (an API key)
 * behind dots until Show is pressed; Copy always copies the real value.
 */
export function CodeBlock({
  code,
  title,
  language,
  wrap = "none",
  lineNumbers = false,
  secret = false,
  copyLabel,
  labels: given,
  children,
  className,
}: {
  /** The exact text; it is what Copy copies, also when `children` shows it highlighted. */
  code: string
  /** Shown in the header and names the scroll box, e.g. a file name or "Terminal". Never put a secret here. */
  title?: string
  /** Shown in the header when there is no title. */
  language?: string
  /** "words" for shell commands (wrap between words, never inside a name); "none" scrolls sideways. */
  wrap?: "words" | "none"
  /** Numbers each line in a gutter that stays put while the code scrolls; hidden from screen readers. With wrap="none" only. */
  lineNumbers?: boolean
  /** Hide the value behind dots, with a Show toggle; Copy still copies the real value. */
  secret?: boolean
  /** The copy button's name, as is. Without it the name comes from `labels.copy(title)` ("Copy <title>", "Copy code"). */
  copyLabel?: string
  labels?: Partial<CodeBlockLabels>
  /** Highlighted code (a `<pre>` from shiki or similar) shown in place of the plain text. */
  children?: React.ReactNode
  className?: string
}) {
  const labels = { ...defaultLabels, ...given }
  const [shown, setShown] = React.useState(false)
  const scroller = React.useRef<HTMLDivElement>(null)
  const edges = useScrollEdges(scroller)
  const masked = secret && !shown
  const words = wrap === "words"
  const gutter = lineNumbers && !words && !masked
  const lines = code.replace(/\n$/, "").split("\n")
  const heading = title ?? language
  // A command that fits needs no tab stop; one that overflows (a long token) or source that scrolls does.
  const focusable = !words || edges.start || edges.end
  const icon = "absolute size-4 transition-[opacity,scale] duration-(--motion-fast) ease-(--ease-standard)"

  let body: React.ReactNode
  if (masked) {
    body = (
      <pre>
        <code>
          <span aria-hidden="true">{"•".repeat(Math.min(Math.max(code.length, 8), 24))}</span>
          <span className="sr-only">{labels.hidden}</span>
        </code>
      </pre>
    )
  } else if (children) {
    body = children
  } else {
    body = (
      <pre>
        <code>
          {lines.map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && "\n"}
              <span className="line">{words ? <Words text={line} /> : line}</span>
            </React.Fragment>
          ))}
        </code>
      </pre>
    )
  }

  return (
    <div
      data-slot="code-block"
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card",
        // The frame draws the focus ring, so the fade on the scroll box never hides it.
        "has-[[data-slot=code-block-scroll]:focus-visible]:outline-2 has-[[data-slot=code-block-scroll]:focus-visible]:outline-offset-2 has-[[data-slot=code-block-scroll]:focus-visible]:outline-ring",
        className,
      )}
    >
      <div data-slot="code-block-header" className="flex items-center gap-2 border-b border-border py-1 pr-1 pl-4">
        {heading && (
          <span className="min-w-0 font-mono text-xs text-muted-foreground">
            <Words text={heading} />
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {secret && (
            <Button variant="ghost" size="icon-sm" aria-label={labels.show} aria-pressed={shown} onClick={() => setShown((s) => !s)}>
              <span className="relative flex size-4 items-center justify-center">
                <Eye aria-hidden="true" className={cn(icon, shown ? "scale-60 opacity-0" : "scale-100 opacity-100")} />
                <EyeOff aria-hidden="true" className={cn(icon, shown ? "scale-100 opacity-100" : "scale-60 opacity-0")} />
              </span>
            </Button>
          )}
          <CopyButton value={code} label={copyLabel ?? labels.copy(title)} copiedLabel={labels.copied} failedLabel={labels.failed} />
        </div>
      </div>
      <div data-slot="code-block-body" className="flex">
        {gutter && (
          <div aria-hidden="true" data-slot="code-block-gutter" className="shrink-0 py-4 pl-4 text-right font-mono text-sm leading-5 text-muted-foreground tabular-nums select-none">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        <div
          ref={scroller}
          data-slot="code-block-scroll"
          role="group"
          aria-label={title ?? labels.code}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region is a Tab stop so the keyboard can scroll it (WCAG 2.1.1)
          tabIndex={focusable ? 0 : undefined}
          style={words ? undefined : scrollFadeMask(edges)}
          // focus-ring: the frame around it draws the ring (has-[…:focus-visible]), so the fade does not hide it.
          className={cn(
            "min-w-0 flex-1 overflow-x-auto text-sm outline-none",
            "[&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:font-mono [&_pre]:leading-5 [&_pre]:tabular-nums",
            words
              ? // A wrapped line's continuation is indented, so it never reads as a second command.
                "[&_.line]:inline-block [&_.line]:w-full [&_.line]:pl-4 [&_.line]:-indent-4 [&_pre]:wrap-anywhere [&_pre]:whitespace-pre-wrap"
              : "[&_pre]:w-max [&_pre]:min-w-full",
          )}
        >
          {body}
        </div>
      </div>
    </div>
  )
}
