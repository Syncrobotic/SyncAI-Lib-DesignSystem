// @syncrobotic/text-diff v0.16.2 · update: npx shadcn add @syncrobotic/text-diff --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/** One run of the diff: words both texts share, or words only one of them has. `text` keeps the words' own spacing. */
export type DiffPart = { type: "same" | "added" | "removed"; text: string; words: number }

// A word is a run of non-space characters, punctuation included ("pallets." is one word). Chinese and Japanese have no
// spaces, so each of their characters is a word of its own; otherwise a whole sentence would be one change.
const CJK = "\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uff01-\\uff60"
const WORD = new RegExp(`([${CJK}]|[^\\s${CJK}]+)(\\s*)`, "g")

/**
 * Words, each with the spacing that follows it, so joining their `text` gives back the original for any input. Spacing
 * before the first word joins that word. A text of spacing alone is one token with an empty `word`: it is no word to
 * diff, but dropping it would lose the text.
 */
export function tokenize(text: string): { word: string; text: string }[] {
  const tokens = [...text.matchAll(WORD)].map((m) => ({ word: m[1] ?? "", text: m[0] }))
  const lead = text.match(/^\s*/)?.[0] ?? ""
  const first = tokens[0]
  if (!lead) return tokens
  if (!first) return [{ word: "", text: lead }]
  first.text = lead + first.text
  return tokens
}

// Past this many cells (about 2,000 words against 2,000) the table would cost more than the answer is worth: the
// middle that differs is then shown as removed and added whole.
const MAX_CELLS = 4_000_000

// The diff below reads the token lists, the LCS table and the op list only at indices its loops have already bounded by
// their lengths, which noUncheckedIndexedAccess cannot see. `at` states that bound once, instead of a `!` on every read.
const at = <T,>(list: ArrayLike<T>, i: number): T => list[i] as T

/**
 * Word-level diff of two texts, by longest common subsequence. Runs of the same kind are merged; within a change the
 * removed words come before the added ones.
 */
export function diffWords(before: string, after: string): DiffPart[] {
  const a = tokenize(before)
  const b = tokenize(after)
  // Shared start and end need no table.
  let start = 0
  while (start < a.length && start < b.length && at(a, start).word === at(b, start).word) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && at(a, endA - 1).word === at(b, endB - 1).word) {
    endA--
    endB--
  }
  // `words` is 0 for a token of spacing alone, so it never counts as a word changed.
  const ops: { type: DiffPart["type"]; text: string; words: number }[] = []
  const op = (type: DiffPart["type"], t: { word: string; text: string }) => {
    // Spacing is not a change: after-text spacing reads as shared (the result reads as the new text, as for shared
    // words), and before-text spacing has nothing to show.
    if (!t.word) {
      if (type !== "removed") ops.push({ type: "same", text: t.text, words: 0 })
      return
    }
    ops.push({ type, text: t.text, words: 1 })
  }
  // Shared words take the after text's spacing: the result reads as the new text.
  for (let i = 0; i < start; i++) op("same", at(b, i))

  const n = endA - start
  const m = endB - start
  if (n * m > MAX_CELLS) {
    for (let i = start; i < endA; i++) op("removed", at(a, i))
    for (let j = start; j < endB; j++) op("added", at(b, j))
  } else {
    // lcs[i][j]: length of the longest common subsequence of a[start+i…] and b[start+j…], filled from the end.
    const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
    for (let i = n - 1; i >= 0; i--) {
      const row = at(lcs, i)
      const below = at(lcs, i + 1)
      for (let j = m - 1; j >= 0; j--)
        row[j] = at(a, start + i).word === at(b, start + j).word ? at(below, j + 1) + 1 : Math.max(at(below, j), at(row, j + 1))
    }
    let i = 0
    let j = 0
    while (i < n || j < m) {
      if (i < n && j < m && at(a, start + i).word === at(b, start + j).word) {
        op("same", at(b, start + j))
        i++
        j++
      } else if (j >= m || (i < n && at(at(lcs, i + 1), j) >= at(at(lcs, i), j + 1))) {
        op("removed", at(a, start + i))
        i++
      } else {
        op("added", at(b, start + j))
        j++
      }
    }
  }
  for (let j = endB; j < b.length; j++) op("same", at(b, j))

  // Merge runs, and order each change as removed, then added, so "the red cup" → "a blue cup" reads "~~the red~~ a blue".
  const parts: DiffPart[] = []
  let k = 0
  while (k < ops.length) {
    const next = at(ops, k)
    if (next.type === "same") {
      const last = parts[parts.length - 1]
      if (last?.type === "same") {
        last.text += next.text
        last.words += next.words
      } else parts.push({ type: "same", text: next.text, words: next.words })
      k++
      continue
    }
    const removed: string[] = []
    const added: string[] = []
    while (k < ops.length && at(ops, k).type !== "same") {
      const change = at(ops, k++)
      ;(change.type === "removed" ? removed : added).push(change.text)
    }
    if (removed.length) parts.push({ type: "removed", text: removed.join(""), words: removed.length })
    if (added.length) parts.push({ type: "added", text: added.join(""), words: added.length })
  }
  return parts
}

/** How many words were added and removed. */
export function diffStats(parts: DiffPart[]) {
  return {
    added: parts.reduce((s, p) => s + (p.type === "added" ? p.words : 0), 0),
    removed: parts.reduce((s, p) => s + (p.type === "removed" ? p.words : 0), 0),
  }
}

const plural = (n: number) => `${n} ${n === 1 ? "word" : "words"}`

export type TextDiffLabels = {
  /** Read before an insertion. */
  added: string
  /** Read before a deletion. */
  removed: string
  /** Read after either, so the listener hears where the change ends. */
  end: string
  /** The summary line. */
  summary: (added: number, removed: number) => string
  /** Instead of the summary when the texts are the same. */
  none: string
  /** In a side-by-side column whose text is empty. */
  empty: string
}

const defaultLabels: TextDiffLabels = {
  added: "added:",
  removed: "removed:",
  end: "(end)",
  // A real minus sign (U+2212), so +3 and −1 line up.
  summary: (added, removed) => [added ? `+${plural(added)}` : "", removed ? `−${plural(removed)}` : ""].filter(Boolean).join(", "),
  none: "No changes",
  empty: "Empty",
}

// Inserted: shape first (a grey block with an underline), so it reads without colour. Removed: struck through in
// secondary text. A removal is not an error: no danger, and no green or blue either.
const ins = "rounded-2xs bg-muted text-foreground underline decoration-foreground underline-offset-4 box-decoration-clone"
const del = "text-muted-foreground line-through decoration-muted-foreground"

function Mark({ part, labels }: { part: DiffPart; labels: TextDiffLabels }) {
  if (part.type === "same") return <span>{part.text}</span>
  // Spacing after the last word stays outside the mark, so the underline and the strike stop at the word.
  const body = part.text.trimEnd()
  const tail = part.text.slice(body.length)
  const Tag = part.type === "added" ? "ins" : "del"
  return (
    <>
      <Tag data-slot={`text-diff-${part.type}`} className={part.type === "added" ? ins : del}>
        <span className="sr-only">{part.type === "added" ? labels.added : labels.removed} </span>
        {body}
        <span className="sr-only"> {labels.end}</span>
      </Tag>
      {tail}
    </>
  )
}

const cjk = new RegExp(`[${CJK}]`)

/**
 * Parts in order. Where two runs meet without a space (a removed last word followed by the added one, or a change after
 * the other text's last word) one is put back, except between Chinese or Japanese characters, which take none.
 */
function Run({ parts, labels }: { parts: DiffPart[]; labels: TextDiffLabels }) {
  return parts.map((p, i) => {
    const prev = parts[i - 1]?.text ?? ""
    const gap = prev !== "" && !/\s$/.test(prev) && !/^\s/.test(p.text) && !cjk.test(prev.slice(-1)) && !cjk.test(p.text.charAt(0))
    return (
      <React.Fragment key={i}>
        {gap && " "}
        <Mark part={p} labels={labels} />
      </React.Fragment>
    )
  })
}

export type TextDiffProps = Omit<React.ComponentProps<"div">, "children"> & {
  before: string
  after: string
  /** inline: one text with both kinds of change marked. side-by-side: before on the left with its removals, after on the right with its insertions. */
  mode?: "inline" | "side-by-side"
  /** Column headings in side-by-side mode, e.g. "Base model" and "Fine-tuned". */
  beforeLabel?: string
  afterLabel?: string
  /** The "+3 words, −1 word" line above the text. */
  showSummary?: boolean
  labels?: Partial<TextDiffLabels>
}

/**
 * Where two texts differ, word by word: a base model's caption against a fine-tuned one, a label before and after an
 * edit. Insertions are a grey block with an underline, removals are struck through; screen readers hear "added" and
 * "removed" around each change.
 */
export function TextDiff({
  before,
  after,
  mode = "inline",
  beforeLabel = "Before",
  afterLabel = "After",
  showSummary = true,
  labels: given,
  className,
  ...props
}: TextDiffProps) {
  const labels = { ...defaultLabels, ...given }
  const parts = diffWords(before, after)
  const { added, removed } = diffStats(parts)
  const text = "whitespace-pre-wrap break-words"

  return (
    <div data-slot="text-diff" data-mode={mode} className={cn("@container flex flex-col gap-2 text-base", className)} {...props}>
      {showSummary && (
        <p data-slot="text-diff-summary" className="text-xs text-muted-foreground tabular-nums">
          {added || removed ? labels.summary(added, removed) : labels.none}
        </p>
      )}
      {mode === "inline" ? (
        <p className={text}>
          <Run parts={parts} labels={labels} />
        </p>
      ) : (
        <div className="grid gap-4 @md:grid-cols-2">
          {(
            [
              [beforeLabel, "removed", before],
              [afterLabel, "added", after],
            ] as const
          ).map(([heading, kind, source]) => (
            <section key={kind} aria-label={heading} className="flex min-w-0 flex-col gap-1">
              <span aria-hidden="true" className="text-xs font-medium text-muted-foreground">
                {heading}
              </span>
              <p className={text}>
                <Run parts={parts.filter((p) => p.type === "same" || p.type === kind)} labels={labels} />
                {!source.trim() && <span className="text-muted-foreground">{labels.empty}</span>}
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
