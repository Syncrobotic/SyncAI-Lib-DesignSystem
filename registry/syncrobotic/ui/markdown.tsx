// @syncrobotic/markdown v0.51.0 · update: npx shadcn add @syncrobotic/markdown --overwrite
"use client"

import * as React from "react"
import { FileImage } from "lucide-react"
import { cn } from "@/lib/utils"
import { Code } from "@/registry/syncrobotic/ui/code"
import { CodeBlock, type CodeBlockLabels } from "@/registry/syncrobotic/ui/code-block"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/*
  A model's Markdown as the kit's own elements: a safe subset parsed here, never as HTML (no dangerouslySetInnerHTML).
  Links only to http(s) or mailto, decided by the URL parser ("java\tscript:" is caught); images only from `imageOrigins`,
  else a link. Not read: raw HTML, setext headings, indented code, reference links, footnotes, task lists. While
  `streaming`, finished blocks are parsed once and half-formed syntax does not flash. Headings start at `headingLevel` and
  never skip a level. It never speaks: StreamingText's `format="markdown"` reads the words.
*/

export type MarkdownLabels = {
  /** An image that is not loaded: a link to it, with its alt text. */
  image: (alt: string) => string
  /** After a link that opens in a new tab, for screen readers. */
  newTab: string
  /** What a code block is read as by `markdownToText` (StreamingText reads that), in place of its code. */
  spokenCode: (language: string | undefined) => string
  /** The code block's copy button and its words. */
  codeBlock?: Partial<CodeBlockLabels>
}

export const defaultMarkdownLabels: MarkdownLabels = {
  image: (alt) => (alt ? `Image: ${alt}` : "Image"),
  newTab: "(opens in a new tab)",
  spokenCode: (language) => (language ? `Code in ${language}.` : "Code."),
}

// ---------- The parsed tree ----------

export type MarkdownAlign = "left" | "center" | "right" | null

/** One list item: its own source (to tell when it changed) and its blocks. */
export type MarkdownListItem = { src: string; blocks: MarkdownBlock[] }

export type MarkdownBlock = { start: number; src: string } & (
  | { type: "paragraph"; text: string }
  | { type: "heading"; depth: number; text: string; /** The h level it renders at, set by the outline (see Markdown's headingLevel). */ level?: number }
  | { type: "code"; lang: string; code: string; closed: boolean }
  | { type: "list"; ordered: boolean; from: number; tight: boolean; items: MarkdownListItem[] }
  | { type: "quote"; children: MarkdownBlock[] }
  | { type: "table"; align: MarkdownAlign[]; head: string[]; rows: string[][] }
  | { type: "rule" }
)

export type MarkdownInline =
  | { type: "text"; value: string }
  | { type: "em" | "strong" | "del"; children: MarkdownInline[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: MarkdownInline[] }
  | { type: "image"; src: string; alt: string }
  | { type: "break" }
  | { type: "cite"; numbers: number[] }

// Containers (lists and quotes) deeper than this are read as plain paragraphs, and inline nesting deeper than
// INLINE_DEPTH as its words: a hostile text cannot overflow the stack or the screen.
const BLOCK_DEPTH = 8
const INLINE_DEPTH = 24
// The longest URL or link destination looked for, so a text full of "[a](" stays linear.
const MAX_URL = 2048

// ---------- Lines ----------

type Line = { text: string; start: number }

const isBlank = (s: string) => {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c !== 32 && c !== 9) return false
  }
  return true
}

/** The columns of leading whitespace (a tab to the next multiple of 4). */
function indentOf(s: string) {
  let col = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c === 32) col++
    else if (c === 9) col += 4 - (col % 4)
    else break
  }
  return col
}

/** The line without its first `n` columns of indentation. */
function dedent(s: string, n: number) {
  let col = 0
  let i = 0
  while (i < s.length && col < n) {
    const c = s.charCodeAt(i)
    if (c === 32) col++
    else if (c === 9) {
      const w = 4 - (col % 4)
      if (col + w > n) return " ".repeat(col + w - n) + s.slice(i + 1)
      col += w
    } else break
    i++
  }
  return s.slice(i)
}

// ---------- Block starts: each a single pass over one line, never a backtracking pattern ----------

type Fence = { char: string; length: number; info: string; indent: number }
function fenceOf(s: string): Fence | null {
  const indent = indentOf(s)
  if (indent > 3) return null
  const t = s.trimStart()
  const char = t[0]
  if (char !== "`" && char !== "~") return null
  let n = 0
  while (t[n] === char) n++
  if (n < 3) return null
  const info = t.slice(n).trim()
  if (char === "`" && info.includes("`")) return null
  return { char, length: n, info, indent }
}

function closesFence(s: string, f: Fence) {
  if (indentOf(s) > 3) return false
  const t = s.trim()
  if (t.length < f.length) return false
  for (let i = 0; i < t.length; i++) if (t[i] !== f.char) return false
  return true
}

function headingOf(s: string): { depth: number; text: string } | null {
  if (indentOf(s) > 3) return null
  const t = s.trimStart()
  let depth = 0
  while (t[depth] === "#") depth++
  if (depth < 1 || depth > 6) return null
  if (depth < t.length && t[depth] !== " " && t[depth] !== "\t") return null
  let text = t.slice(depth).trim()
  // A closing run of #, after a space (or the whole of it), is not part of the heading.
  let end = text.length
  while (end > 0 && text[end - 1] === "#") end--
  if (end === 0) text = ""
  else if (end < text.length && (text[end - 1] === " " || text[end - 1] === "\t")) text = text.slice(0, end).trimEnd()
  return { depth, text }
}

function isRule(s: string) {
  if (indentOf(s) > 3) return false
  let char = ""
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === " " || c === "\t") continue
    if (c !== "-" && c !== "*" && c !== "_") return false
    if (char && c !== char) return false
    char = c
    n++
  }
  return n >= 3
}

const isQuote = (s: string) => indentOf(s) <= 3 && s.trimStart()[0] === ">"

/** The line inside a quote: without its ">" and one space after it. */
function unquote(s: string) {
  const t = s.trimStart().slice(1)
  if (t[0] === " ") return t.slice(1)
  if (t[0] === "\t") return dedent(t, 2)
  return t
}

type Marker = { indent: number; ordered: boolean; kind: string; from: number; content: number; rest: string }
function markerOf(s: string): Marker | null {
  const indent = indentOf(s)
  const t = s.trimStart()
  let width: number
  let ordered = false
  let kind: string
  let from = 1
  const c = t[0]
  if (c === "-" || c === "+" || c === "*") {
    width = 1
    kind = c
  } else {
    let n = 0
    while (n < 9 && t.charCodeAt(n) >= 48 && t.charCodeAt(n) <= 57) n++
    if (n === 0 || (t[n] !== "." && t[n] !== ")")) return null
    ordered = true
    kind = t[n]!
    from = Number(t.slice(0, n))
    width = n + 1
  }
  const after = t.slice(width)
  if (after !== "" && after[0] !== " " && after[0] !== "\t") return null
  const spaces = indentOf(after)
  const rest = after.trimStart()
  // Five spaces or more after the marker, or none before the end of the line: the content starts one space in.
  const content = indent + width + (rest === "" || spaces > 4 ? 1 : spaces)
  return { indent, ordered, kind, from, content, rest: rest === "" || spaces <= 4 ? rest : dedent(after, 1) }
}

/** The cells of a table row, split at pipes that are not escaped. */
function cellsOf(s: string): string[] {
  let t = s.trim()
  if (t.startsWith("|")) t = t.slice(1)
  if (t.endsWith("|") && !t.endsWith("\\|")) t = t.slice(0, -1)
  const cells: string[] = []
  let cell = ""
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (c === "\\" && t[i + 1] === "|") {
      cell += "|"
      i++
    } else if (c === "|") {
      cells.push(cell.trim())
      cell = ""
    } else cell += c
  }
  cells.push(cell.trim())
  return cells
}

function alignOf(row: string): MarkdownAlign[] | null {
  if (!row.includes("|")) return null
  const cells = cellsOf(row)
  const out: MarkdownAlign[] = []
  for (const c of cells) {
    let dashes = 0
    for (let i = 0; i < c.length; i++) {
      const ch = c[i]
      if (ch === "-") dashes++
      else if (!(ch === ":" && (i === 0 || i === c.length - 1))) return null
    }
    if (dashes === 0) return null
    const left = c[0] === ":"
    const right = c[c.length - 1] === ":"
    out.push(left && right ? "center" : right ? "right" : left ? "left" : null)
  }
  return out
}

/** A header line and the delimiter line under it, with as many cells. */
function tableOf(line: string, next: string | undefined) {
  if (next === undefined || !line.includes("|") || indentOf(line) > 3) return null
  const align = alignOf(next)
  if (!align) return null
  const head = cellsOf(line)
  return head.length === align.length ? { head, align } : null
}

const sameList = (a: Marker, b: Marker) => a.ordered === b.ordered && a.kind === b.kind

/** Whether a line ends the paragraph before it (or a lazy continuation of one). */
function interrupts(s: string, next: string | undefined) {
  if (isBlank(s) || fenceOf(s) || headingOf(s) || isRule(s) || isQuote(s)) return true
  const m = markerOf(s)
  if (m && m.indent <= 3 && m.rest !== "" && (!m.ordered || m.from === 1)) return true
  return !!tableOf(s, next)
}

// ---------- Blocks ----------

type BlockOptions = { streaming: boolean }

function parseBlocks(lines: Line[], depth: number, options: BlockOptions, tail: boolean): MarkdownBlock[] {
  const out: MarkdownBlock[] = []
  const n = lines.length
  const srcOf = (from: number, to: number) => lines.slice(from, to).map((l) => l.text).join("\n")
  // Past the last line with words, everything is the end of the text.
  let end = n
  while (end > 0 && isBlank(lines[end - 1]!.text)) end--
  let i = 0
  while (i < n) {
    const line = lines[i]!.text
    const begin = i
    const start = lines[i]!.start
    if (isBlank(line)) {
      i++
      continue
    }

    const fence = fenceOf(line)
    if (fence) {
      const code: string[] = []
      let closed = false
      i++
      while (i < n) {
        if (closesFence(lines[i]!.text, fence)) {
          closed = true
          i++
          break
        }
        code.push(dedent(lines[i]!.text, fence.indent))
        i++
      }
      out.push({ type: "code", start, src: srcOf(begin, i), lang: fence.info.split(/\s/)[0] ?? "", code: code.join("\n"), closed })
      continue
    }

    const heading = headingOf(line)
    if (heading) {
      i++
      out.push({ type: "heading", start, src: line, ...heading })
      continue
    }

    if (isRule(line)) {
      i++
      out.push({ type: "rule", start, src: line })
      continue
    }

    if (depth < BLOCK_DEPTH && isQuote(line)) {
      const inner: Line[] = []
      let lazy = false
      while (i < n) {
        const l = lines[i]!.text
        if (isQuote(l)) {
          const u = unquote(l)
          inner.push({ text: u, start: lines[i]!.start })
          lazy = !isBlank(u) && !fenceOf(u)
        } else if (lazy && !interrupts(l, lines[i + 1]?.text)) {
          inner.push({ text: l.trimStart(), start: lines[i]!.start })
        } else break
        i++
      }
      out.push({ type: "quote", start, src: srcOf(begin, i), children: parseBlocks(inner, depth + 1, options, tail && i === n) })
      continue
    }

    const first = markerOf(line)
    if (depth < BLOCK_DEPTH && first && first.indent <= 3) {
      let marker = first
      const items: MarkdownListItem[] = []
      let loose = false
      for (;;) {
        const itemStart = i
        const inner: Line[] = [{ text: marker.rest, start: lines[i]!.start }]
        i++
        while (i < n) {
          const l = lines[i]!.text
          if (isBlank(l)) {
            inner.push({ text: "", start: lines[i]!.start })
            i++
            continue
          }
          const indent = indentOf(l)
          if (indent >= marker.content) {
            inner.push({ text: dedent(l, marker.content), start: lines[i]!.start })
            i++
            continue
          }
          const m = markerOf(l)
          // A nested list indented by two spaces under "1. " (less than its content) is still nested, as models write it.
          if (m && indent >= marker.indent + 2) {
            inner.push({ text: dedent(l, indent), start: lines[i]!.start })
            i++
            continue
          }
          if (m) break
          const prev = inner[inner.length - 1]?.text ?? ""
          if (!isBlank(prev) && !interrupts(l, lines[i + 1]?.text)) {
            inner.push({ text: l.trimStart(), start: lines[i]!.start })
            i++
            continue
          }
          break
        }
        // Blank lines at an item's end belong between items: they make the list loose if another item follows.
        let blanks = 0
        while (inner.length > 1 && isBlank(inner[inner.length - 1]!.text)) {
          inner.pop()
          blanks++
        }
        const blocks = parseBlocks(inner, depth + 1, options, tail && i === n && blanks === 0)
        // A blank line between two blocks of one item makes the list loose too.
        if (blocks.length > 1 && inner.some((l, k) => k > 0 && isBlank(l.text))) loose = true
        items.push({ src: srcOf(itemStart, i - blanks), blocks })
        const next = i < n ? markerOf(lines[i]!.text) : null
        if (next && sameList(next, first) && next.indent < marker.indent + 2) {
          if (blanks) loose = true
          marker = next
          continue
        }
        // Trailing blank lines are not part of the list.
        i -= blanks
        break
      }
      out.push({ type: "list", start, src: srcOf(begin, i), ordered: first.ordered, from: first.from, tight: !loose, items })
      continue
    }

    const table = tableOf(line, lines[i + 1]?.text)
    if (table) {
      i += 2
      const rows: string[][] = []
      while (i < n && !isBlank(lines[i]!.text) && lines[i]!.text.includes("|") && !fenceOf(lines[i]!.text) && !isQuote(lines[i]!.text)) {
        const cells = cellsOf(lines[i]!.text)
        rows.push(table.head.map((_, k) => cells[k] ?? ""))
        i++
      }
      out.push({ type: "table", start, src: srcOf(begin, i), align: table.align, head: table.head, rows })
      continue
    }

    // A paragraph: lines up to a blank one or the start of another block.
    const para: string[] = [line.trimStart()]
    i++
    while (i < n && !interrupts(lines[i]!.text, lines[i + 1]?.text)) {
      para.push(lines[i]!.text.trimStart())
      i++
    }
    if (options.streaming && tail && i >= end) {
      // A table whose delimiter line has not arrived is held back, so its header never flashes as a paragraph.
      while (para.length && para[para.length - 1]!.trimStart().startsWith("|")) para.pop()
      if (!para.length) continue
    }
    out.push({ type: "paragraph", start, src: srcOf(begin, i), text: para.join("\n").trimEnd() })
  }
  return out
}

function linesOf(text: string, offset: number): Line[] {
  const lines: Line[] = []
  let at = 0
  for (;;) {
    const nl = text.indexOf("\n", at)
    if (nl < 0) {
      lines.push({ text: text.slice(at), start: offset + at })
      return lines
    }
    lines.push({ text: text.slice(at, nl), start: offset + at })
    at = nl + 1
  }
}

const normalise = (text: string) => (/[\r\0]/.test(text) ? text.replace(/\r\n?/g, "\n").replace(/\0/g, "\uFFFD") : text)

/** Whether the last line, still being written, is only a block's marker so far ("#", "- ", "1.", ">", "|", "```"). */
function markerOnly(line: string) {
  const t = line.trim()
  if (t === "") return false
  let digits = 0
  while (digits < t.length && t.charCodeAt(digits) >= 48 && t.charCodeAt(digits) <= 57) digits++
  if (digits > 0) return digits === t.length - 1 && (t[digits] === "." || t[digits] === ")")
  for (let i = 0; i < t.length; i++) if (!"#>*+-_=|`~: \t".includes(t[i]!)) return false
  return true
}

/** Parses Markdown into blocks. With `streaming`, what is still forming at the end is held back (see Markdown). */
export function parseMarkdown(text: string, options: { streaming?: boolean } = {}): MarkdownBlock[] {
  return createMarkdownParser().parse(text, options.streaming ?? false)
}

/**
 * A parser that keeps the blocks it has finished: when the next text starts with the same finished blocks, only the
 * last block is parsed again. One per Markdown; `parseMarkdown` is the same without the memory.
 */
export function createMarkdownParser() {
  let stable = "" // the text up to the start of the last block
  let head: MarkdownBlock[] = []
  const run = (text: string, options: BlockOptions) => {
    const reuse = stable !== "" && text.startsWith(stable)
    const from = reuse ? stable.length : 0
    const tail = parseBlocks(linesOf(text.slice(from), from), 0, options, true)
    const blocks = reuse ? head.concat(tail) : tail
    const last = blocks[blocks.length - 1]
    if (last) {
      head = blocks.slice(0, -1)
      stable = text.slice(0, last.start)
    } else {
      head = []
      stable = ""
    }
    return blocks
  }
  return {
    parse(input: string, streaming: boolean): MarkdownBlock[] {
      const text = normalise(input)
      const options = { streaming }
      if (streaming) {
        const nl = text.lastIndexOf("\n")
        if (markerOnly(text.slice(nl + 1))) {
          const held = run(text.slice(0, nl + 1), options)
          const last = held[held.length - 1]
          // Inside an open code fence the line is code, not a marker.
          if (!(last?.type === "code" && !last.closed)) return held
        }
      }
      return run(text, options)
    },
  }
}

// ---------- Inline ----------

/** A link destination the kit will follow: http, https or mailto, as the URL parser reads it. Anything else is null. */
export function safeHref(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:" ? url.href : null
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  deg: "°",
  times: "×",
  divide: "÷",
  plusmn: "±",
  middot: "·",
  bull: "•",
  larr: "←",
  rarr: "→",
  uarr: "↑",
  darr: "↓",
  le: "≤",
  ge: "≥",
  ne: "≠",
  micro: "µ",
}

/** The entity at `i` ("&amp;", "&#169;", "&#xA9;") and where it ends, or null. */
function entityAt(text: string, i: number, next: Next): { value: string; end: number } | null {
  const semi = next(";", i)
  if (semi < 0 || semi - i > 33) return null
  const body = text.slice(i + 1, semi)
  if (body[0] === "#") {
    const hex = body[1] === "x" || body[1] === "X"
    const digits = body.slice(hex ? 2 : 1)
    if (!digits || digits.length > (hex ? 6 : 7) || !(hex ? /^[0-9a-f]+$/i : /^[0-9]+$/).test(digits)) return null
    const cp = parseInt(digits, hex ? 16 : 10)
    const ok = cp > 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff)
    return { value: ok ? String.fromCodePoint(cp) : "�", end: semi + 1 }
  }
  const value = ENTITIES[body]
  return value === undefined ? null : { value, end: semi + 1 }
}

const SPACE = /\s/
// CJK punctuation (「」，。) counts as a letter, so **「引用」**之後 is strong, as people who write Chinese expect.
const PUNCT = /[\p{P}\p{S}]/u
const isSpace = (c: string | undefined) => c === undefined || SPACE.test(c)
const isPunct = (c: string | undefined) => {
  if (c === undefined || !PUNCT.test(c)) return false
  const cp = c.charCodeAt(0)
  return !((cp >= 0x3000 && cp <= 0x303f) || (cp >= 0xff00 && cp <= 0xffef))
}
const ASCII_PUNCT = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"

// The working list while a paragraph is read: text, delimiter runs (*, _, ~~), finished pieces and wrappers.
type Node = {
  prev: Node | null
  next: Node | null
  /** text (also what an unmatched delimiter or bracket shows) */
  value: string
  piece?: MarkdownInline
  wrap?: "em" | "strong" | "del" | "link"
  href?: string
  first?: Node | null
  last?: Node | null
}
type Delim = { node: Node; char: string; count: number; canOpen: boolean; canClose: boolean; index: number; onlyOpen: boolean }
type Bracket = { node: Node; image: boolean; delims: number; active: boolean }

type InlineOptions = { open: boolean; cite: boolean; breaks: boolean }

/** A citation token at `i`: [1], [^1], [1, 2]; the numbers and where it ends, or null. */
function citeAt(text: string, i: number): { numbers: number[]; end: number } | "partial" | null {
  const numbers: number[] = []
  let j = i + 1
  for (;;) {
    while (text[j] === " ") j++
    if (text[j] === "^") j++
    const from = j
    while (j - from < 3 && text.charCodeAt(j) >= 48 && text.charCodeAt(j) <= 57) j++
    if (j === text.length) return "partial"
    if (j === from) return null
    const n = Number(text.slice(from, j))
    if (n < 1) return null
    numbers.push(n)
    while (text[j] === " ") j++
    if (j === text.length) return "partial"
    if (text[j] === "]") {
      // [1](url) is a link, not a citation.
      if (text[j + 1] === "(") return null
      return { numbers, end: j + 1 }
    }
    if (text[j] !== ",") return null
    j++
    if (j === text.length) return "partial"
  }
}

/** The next position of a character at or after `from`, or -1. */
type Next = (char: string, from: number) => number

/**
 * `indexOf` that remembers its last answer per character, so asking again from a later place costs nothing until it
 * passes that answer: a text of a thousand "<" without a ">" is scanned once, not a thousand times.
 */
function nextFinder(text: string): Next {
  const cache = new Map<string, { from: number; at: number }>()
  return (char, from) => {
    const known = cache.get(char)
    if (known && from >= known.from && (known.at === -1 || known.at >= from)) return known.at
    const at = text.indexOf(char, from)
    cache.set(char, { from, at })
    return at
  }
}

/** A link's destination after "(": the URL, an optional title, then ")". `partial` when the text ends first. */
function destinationAt(text: string, i: number, next: Next): { href: string; end: number } | "partial" | null {
  let j = i
  const stop = Math.min(text.length, i + MAX_URL)
  while (j < stop && (text[j] === " " || text[j] === "\t")) j++
  let href = ""
  if (text[j] === "<") {
    const close = next(">", j)
    if (close < 0 || close > stop) return text.length <= stop ? "partial" : null
    href = text.slice(j + 1, close)
    if (href.includes("\n")) return null
    j = close + 1
  } else {
    let depth = 0
    const from = j
    while (j < stop) {
      const c = text[j]
      if (c === "\\" && j + 1 < stop && ASCII_PUNCT.includes(text[j + 1]!)) {
        j += 2
        continue
      }
      if (c === " " || c === "\t" || c === "\n") break
      // Stricter than CommonMark: a bracket ends a bare destination (a URL writes it %5B), so a text of "[a](b" never
      // scans the same characters twice.
      if (c === "[" || c === "]") return null
      if (c === "(") depth++
      else if (c === ")") {
        if (depth === 0) break
        depth--
      }
      j++
    }
    href = text.slice(from, j).replace(/\\([!-/:-@[-`{-~])/g, "$1")
  }
  while (j < stop && (text[j] === " " || text[j] === "\t" || text[j] === "\n")) j++
  const q = text[j]
  if (q === '"' || q === "'" || (q === "(" && href)) {
    const closeChar = q === "(" ? ")" : q
    const close = next(closeChar, j + 1)
    if (close < 0 || close > stop) return text.length <= stop ? "partial" : null
    j = close + 1
    while (j < stop && (text[j] === " " || text[j] === "\t" || text[j] === "\n")) j++
  }
  if (j >= text.length) return "partial"
  if (text[j] !== ")") return null
  return { href, end: j + 1 }
}

/** The bare http(s) URL starting at `i`, without the punctuation that ends its sentence. */
function bareUrlAt(text: string, i: number): number {
  let j = i
  const stop = Math.min(text.length, i + MAX_URL)
  while (j < stop && !isSpace(text[j]) && text[j] !== "<") j++
  for (;;) {
    const c = text[j - 1]
    if (c !== undefined && "?!.,:;*_~'\"".includes(c)) j--
    else if (c === ")") {
      let open = 0
      let close = 0
      for (let k = i; k < j; k++) {
        if (text[k] === "(") open++
        else if (text[k] === ")") close++
      }
      if (close > open) j--
      else break
    } else break
  }
  return j
}

/** Parses one paragraph's (or heading's, or cell's) text into inline pieces, in time linear in its length. */
export function parseInline(text: string, options: Partial<InlineOptions> = {}): MarkdownInline[] {
  const { open = false, cite = false, breaks = true } = options
  let first: Node | null = null
  let last: Node | null = null
  const push = (node: Node) => {
    node.prev = last
    node.next = null
    if (last) last.next = node
    else first = node
    last = node
    return node
  }
  const textNode = (value: string) => push({ prev: null, next: null, value })
  const piece = (p: MarkdownInline) => push({ prev: null, next: null, value: "", piece: p })

  // Backtick runs by length, found once, so a code span finds its closer without scanning again.
  const runs = new Map<number, number[]>()
  const cursor = new Map<number, number>()
  for (let i = 0; i < text.length; ) {
    if (text[i] !== "`") {
      i++
      continue
    }
    let j = i
    while (text[j] === "`") j++
    const list = runs.get(j - i)
    if (list) list.push(i)
    else runs.set(j - i, [i])
    i = j
  }
  const closerOf = (length: number, from: number) => {
    const list = runs.get(length)
    if (!list) return -1
    let k = cursor.get(length) ?? 0
    while (k < list.length && list[k]! < from) k++
    cursor.set(length, k)
    return list[k] ?? -1
  }

  const delims: Delim[] = []
  const brackets: Bracket[] = []
  const next = nextFinder(text)
  // No ")" after a "(" means no link destination there, whatever comes between.
  const lastParen = text.lastIndexOf(")")

  // Moves the nodes strictly between `a` and `b` into a new wrapper between them.
  const wrapBetween = (a: Node, b: Node | null, wrap: Node["wrap"], href?: string): Node => {
    const inner = a.next === b ? null : a.next
    const innerLast = b ? (b.prev === a ? null : b.prev) : last === a ? null : last
    const w: Node = { prev: a, next: b, value: "", wrap, href, first: inner, last: innerLast }
    if (inner) inner.prev = null
    if (innerLast) innerLast.next = null
    a.next = w
    if (b) b.prev = w
    else last = w
    return w
  }

  // CommonMark's delimiter matching, kept linear: one stack of openers per character, nearest first.
  const emphasis = (bottom: number): Delim[] => {
    const stacks: Record<string, Delim[]> & { "*": Delim[]; _: Delim[]; "~": Delim[] } = { "*": [], _: [], "~": [] }
    for (let k = bottom; k < delims.length; k++) {
      const d = delims[k]!
      if (d.canClose) {
        const stack = stacks[d.char]!
        while (d.count > 0 && stack.length) {
          const o = stack[stack.length - 1]!
          // Openers of another character between the two cannot match any more: they stay text.
          for (const c of ["*", "_", "~"]) {
            if (c === d.char) continue
            const s = stacks[c]!
            while (s.length && s[s.length - 1]!.index > o.index) s.pop()
          }
          const use = d.char === "~" ? 2 : o.count >= 2 && d.count >= 2 ? 2 : 1
          wrapBetween(o.node, d.node, d.char === "~" ? "del" : use === 2 ? "strong" : "em")
          o.count -= use
          d.count -= use
          o.node.value = d.char.repeat(o.count)
          d.node.value = d.char.repeat(d.count)
          if (o.count === 0) stack.pop()
        }
        if (d.count > 0 && d.canOpen) stack.push(d)
      } else if (d.canOpen) stacks[d.char]!.push(d)
    }
    delims.length = bottom
    return [...stacks["*"], ...stacks._, ...stacks["~"]].sort((a, b) => a.index - b.index)
  }

  const removeNode = (node: Node) => {
    if (node.prev) node.prev.next = node.next
    else first = node.next
    if (node.next) node.next.prev = node.prev
    else last = node.prev
  }

  let from = 0 // the start of the text not yet pushed
  const flush = (to: number) => {
    if (to > from) textNode(text.slice(from, to))
  }

  let i = 0
  const len = text.length
  while (i < len) {
    const c = text[i]
    if (c === "\\") {
      const next = text[i + 1]
      if (next !== undefined && ASCII_PUNCT.includes(next)) {
        flush(i)
        textNode(next)
        i += 2
        from = i
      } else if (next === "\n") {
        flush(i)
        piece({ type: "break" })
        i += 2
        from = i
      } else if (next === undefined && open) {
        flush(i)
        i++
        from = i
      } else i++
      continue
    }
    if (c === "`") {
      let j = i
      while (text[j] === "`") j++
      const length = j - i
      flush(i)
      const close = closerOf(length, j)
      if (close >= 0) {
        let code = text.slice(j, close).replace(/\n/g, " ")
        if (code.length > 1 && code[0] === " " && code[code.length - 1] === " " && code.trim() !== "") code = code.slice(1, -1)
        piece({ type: "code", value: code })
        i = close + length
      } else if (open) {
        // An unclosed code span while streaming is code so far.
        const code = text.slice(j)
        if (code.trim()) piece({ type: "code", value: code.replace(/\n/g, " ") })
        i = len
      } else {
        textNode(text.slice(i, j))
        i = j
      }
      from = i
      continue
    }
    if (c === "*" || c === "_" || c === "~") {
      let j = i
      while (text[j] === c) j++
      const count = j - i
      if (c === "~" && count !== 2) {
        i = j
        continue
      }
      flush(i)
      from = j
      // A run at the very end while streaming is still forming (the first * of a closing **): it waits.
      if (open && j === len) {
        i = j
        continue
      }
      const before = i > 0 ? text[i - 1] : undefined
      const after = text[j]
      const left = !isSpace(after) && (!isPunct(after) || isSpace(before) || isPunct(before))
      const right = !isSpace(before) && (!isPunct(before) || isSpace(after) || isPunct(after))
      const canOpen = c === "_" ? left && (!right || isPunct(before)) : left
      const canClose = c === "_" ? right && (!left || isPunct(after)) : right
      const node = textNode(text.slice(i, j))
      if (canOpen || canClose) delims.push({ node, char: c, count, canOpen, canClose, index: delims.length, onlyOpen: canOpen && !right })
      i = j
      continue
    }
    if (c === "[" || (c === "!" && text[i + 1] === "[")) {
      if (c === "[" && cite) {
        const token = citeAt(text, i)
        if (token === "partial" && open) {
          flush(i)
          i = len
          from = i
          continue
        }
        if (token && token !== "partial") {
          flush(i)
          // The space before a marker does not break: a marker never starts a line alone.
          const prev = last as Node | null
          if (prev && !prev.piece && !prev.wrap && prev.value.endsWith(" ")) prev.value = prev.value.trimEnd() + "\u00A0"
          piece({ type: "cite", numbers: token.numbers })
          i = token.end
          from = i
          continue
        }
      }
      flush(i)
      const image = c === "!"
      const width = image ? 2 : 1
      brackets.push({ node: textNode(text.slice(i, i + width)), image, delims: delims.length, active: true })
      i += width
      from = i
      continue
    }
    if (c === "]") {
      flush(i)
      const b = brackets.pop()
      if (!b) {
        textNode("]")
        i++
        from = i
        continue
      }
      const dest = !b.active || text[i + 1] !== "(" ? null : lastParen < i + 2 ? (open ? "partial" : null) : destinationAt(text, i + 2, next)
      if (dest && dest !== "partial") {
        emphasis(b.delims)
        if (b.image) {
          const alt = plainOf(collect(b.node.next, INLINE_DEPTH))
          while (b.node.next) removeNode(b.node.next)
          b.node.value = ""
          b.node.piece = { type: "image", src: dest.href, alt }
        } else {
          const href = safeHref(dest.href)
          if (href) wrapBetween(b.node, null, "link", href)
          b.node.value = ""
          // No link inside a link: the brackets before it are text now.
          for (const o of brackets) if (!o.image) o.active = false
        }
        i = dest.end
      } else if (dest === "partial" && open) {
        // A link still arriving shows its words, not its brackets or its half-written URL.
        b.node.value = ""
        i = len
      } else {
        textNode("]")
        i++
      }
      from = i
      continue
    }
    if (c === "<") {
      const close = next(">", i)
      if (close > i && close - i <= MAX_URL) {
        const inner = text.slice(i + 1, close)
        const href = /[\s<]/.test(inner) ? null : safeHref(inner)
        if (href) {
          flush(i)
          piece({ type: "link", href, children: [{ type: "text", value: inner.replace(/^mailto:/i, "") }] })
          i = close + 1
          from = i
          continue
        }
      }
      i++
      continue
    }
    if (c === "&") {
      const entity = entityAt(text, i, next)
      if (entity) {
        flush(i)
        textNode(entity.value)
        i = entity.end
        from = i
        continue
      }
      i++
      continue
    }
    if (c === "\n") {
      // Two spaces before a line break make it hard; `breaks` makes every line break one.
      let end = i
      while (end > from && text[end - 1] === " ") end--
      const hard = i - end >= 2
      flush(end)
      if (hard || breaks) piece({ type: "break" })
      else textNode(" ")
      i++
      while (text[i] === " ") i++
      from = i
      continue
    }
    if ((c === "h" || c === "H") && (i === 0 || isSpace(text[i - 1]) || "(*_~\"'".includes(text[i - 1]!))) {
      const lower = text.slice(i, i + 8).toLowerCase()
      if (lower.startsWith("http://") || lower.startsWith("https://")) {
        const end = bareUrlAt(text, i)
        const href = end - i > lower.indexOf("//") + 2 ? safeHref(text.slice(i, end)) : null
        // While streaming, a URL that reaches the end may not be whole yet: it is text until it is.
        if (href && !(open && end === len)) {
          flush(i)
          piece({ type: "link", href, children: [{ type: "text", value: text.slice(i, end) }] })
          i = end
          from = i
          continue
        }
      }
    }
    i++
  }
  flush(len)

  const left = emphasis(0)
  if (open) {
    // While streaming, an opener that is plainly one (** before a word) styles the words after it until it closes.
    for (let k = left.length - 1; k >= 0; k--) {
      const o = left[k]!
      if (!o.onlyOpen) continue
      const wrap = o.char === "~" ? "del" : o.count >= 2 ? "strong" : "em"
      const w = wrapBetween(o.node, null, wrap)
      if (o.char !== "~" && o.count >= 3) {
        const inner: Node = { prev: null, next: null, value: "", wrap: "em", first: w.first, last: w.last }
        w.first = inner
        w.last = inner
      }
      o.node.value = ""
    }
    for (const b of brackets) b.node.value = ""
  }
  return collect(first, INLINE_DEPTH)
}

/** The working list as pieces, merging neighbouring text. Past `depth` levels a wrapper is only its words. */
function collect(node: Node | null, depth: number): MarkdownInline[] {
  const out: MarkdownInline[] = []
  const text = (value: string) => {
    if (!value) return
    const prev = out[out.length - 1]
    if (prev?.type === "text") out[out.length - 1] = { type: "text", value: prev.value + value }
    else out.push({ type: "text", value })
  }
  for (let n = node; n; n = n.next) {
    if (n.piece) out.push(n.piece)
    else if (n.wrap && depth <= 0) text(wordsOf(n.first ?? null))
    else if (n.wrap) {
      const children = collect(n.first ?? null, depth - 1)
      if (n.wrap === "link") out.push({ type: "link", href: n.href ?? "", children })
      else if (children.length) out.push({ type: n.wrap, children })
    } else text(n.value)
  }
  return out
}

/** The words of a working list and everything wrapped in it, without recursion: its nesting may be as deep as the text is long. */
function wordsOf(node: Node | null): string {
  let s = ""
  const stack: (Node | null)[] = [node]
  while (stack.length) {
    let n = stack.pop() ?? null
    for (; n; n = n.next) {
      if (n.piece) s += plainOf([n.piece])
      else if (n.wrap) {
        stack.push(n.next)
        stack.push(n.first ?? null)
        break
      } else s += n.value
    }
  }
  return s
}

/** The words of inline pieces, without their marks. */
function plainOf(nodes: MarkdownInline[], labels: Pick<MarkdownLabels, "image"> = defaultMarkdownLabels, keepCites = true): string {
  let s = ""
  for (const n of nodes) {
    if (n.type === "text" || n.type === "code") s += n.value
    else if (n.type === "break") s += "\n"
    else if (n.type === "image") s += labels.image(n.alt)
    // A citation left out takes the space before it too: "Clear [1]." reads "Clear."
    else if (n.type === "cite") s = keepCites ? s + n.numbers.map((k) => `[${k}]`).join("") : s.trimEnd()
    else s += plainOf(n.children, labels, keepCites)
  }
  return s
}

/**
 * The words of a Markdown text without its syntax, one block per line, for reading aloud (StreamingText's
 * `format="markdown"` reads this) or a preview. A code block is `labels.spokenCode`; citations are left out with `cite`.
 */
export function markdownToText(text: string, options: { streaming?: boolean; cite?: boolean; labels?: Partial<MarkdownLabels> } = {}): string {
  const labels = { ...defaultMarkdownLabels, ...options.labels }
  const inline = (s: string, open: boolean) =>
    plainOf(parseInline(s, { open, cite: options.cite ?? false }), labels, !options.cite)
      .replace(/[ \t]+\n/g, "\n")
      .replace(/ {2,}/g, " ")
      .trim()
  const lines: string[] = []
  const walk = (blocks: MarkdownBlock[], open: boolean) => {
    blocks.forEach((b, k) => {
      const tail = open && k === blocks.length - 1
      if (b.type === "paragraph" || b.type === "heading") lines.push(inline(b.text, tail))
      else if (b.type === "code") lines.push(labels.spokenCode(b.lang || undefined))
      else if (b.type === "quote") walk(b.children, tail)
      else if (b.type === "list") b.items.forEach((item, j) => walk(item.blocks, tail && j === b.items.length - 1))
      else if (b.type === "table") for (const row of [b.head, ...b.rows]) lines.push(row.map((cell) => inline(cell, false)).join(", "))
    })
  }
  walk(parseMarkdown(text, { streaming: options.streaming }), !!options.streaming)
  return lines.filter(Boolean).join("\n")
}

// ---------- Rendering ----------

type Context = {
  cite?: (n: number) => React.ReactNode
  imageOrigins: readonly string[]
  breaks: boolean
  newTab: boolean
  labels: MarkdownLabels
  headingLevel: number
}

const linkClass =
  "rounded-2xs text-foreground underline decoration-muted-foreground underline-offset-4 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

function imageAllowed(src: string, origins: readonly string[]) {
  const href = safeHref(src)
  if (!href || href.startsWith("mailto:") || !origins.length) return null
  const origin = new URL(href).origin
  return origins.some((o) => o.replace(/\/+$/, "") === origin) ? href : null
}

function Inlines({ nodes, ctx }: { nodes: MarkdownInline[]; ctx: Context }): React.ReactNode {
  return nodes.map((n, k) => {
    switch (n.type) {
      case "text":
        return <React.Fragment key={k}>{n.value}</React.Fragment>
      case "break":
        return <br key={k} />
      case "code":
        return (
<Code key={k}>{n.value}</Code>
        )
      case "em":
        return (
          <em key={k}>
            <Inlines nodes={n.children} ctx={ctx} />
          </em>
        )
      case "strong":
        return (
          <strong key={k} className="font-medium">
            <Inlines nodes={n.children} ctx={ctx} />
          </strong>
        )
      case "del":
        return (
          <del key={k}>
            <Inlines nodes={n.children} ctx={ctx} />
          </del>
        )
      case "cite":
        return (
          <React.Fragment key={k}>
            {n.numbers.map((num, j) => (
              <React.Fragment key={j}>{ctx.cite ? ctx.cite(num) : `[${num}]`}</React.Fragment>
            ))}
          </React.Fragment>
        )
      case "link": {
        const external = ctx.newTab && !n.href.startsWith("mailto:")
        return (
          <a
            key={k}
            data-slot="markdown-link"
            href={n.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer nofollow" : "nofollow"}
            className={linkClass}
          >
            <Inlines nodes={n.children} ctx={ctx} />
            {external && <span className="sr-only"> {ctx.labels.newTab}</span>}
          </a>
        )
      }
      case "image": {
        const allowed = imageAllowed(n.src, ctx.imageOrigins)
        if (allowed)
          return (
            // A picture from an origin the product trusts; nothing is sent about the page it is on.
            <img key={k} data-slot="markdown-image" src={allowed} alt={n.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="inline-block max-w-full rounded-sm align-top" />
          )
        const href = safeHref(n.src)
        const words = (
          <>
            <FileImage aria-hidden="true" className="me-2 inline size-4 align-text-bottom text-muted-foreground" />
            {ctx.labels.image(n.alt)}
          </>
        )
        return href && !href.startsWith("mailto:") ? (
          <a key={k} data-slot="markdown-image-link" href={href} target={ctx.newTab ? "_blank" : undefined} rel="noopener noreferrer nofollow" className={linkClass}>
            {words}
            {ctx.newTab && <span className="sr-only"> {ctx.labels.newTab}</span>}
          </a>
        ) : (
          <span key={k} data-slot="markdown-image-placeholder" className="text-muted-foreground">
            {words}
          </span>
        )
      }
    }
  })
}

/** Inline text, parsed once per change of its source. */
const InlineText = React.memo(function InlineText({ text, open, ctx }: { text: string; open: boolean; ctx: Context }) {
  const nodes = React.useMemo(() => parseInline(text, { open, cite: !!ctx.cite, breaks: ctx.breaks }), [text, open, ctx.cite, ctx.breaks])
  return <Inlines nodes={nodes} ctx={ctx} />
})

// A heading's look by its place in the outline: a card title's size first, then the body's, then a surface title's.
const headingClass = ["text-lg font-medium", "text-base font-medium", "text-sm font-medium"]
const alignClass = { left: "text-left", center: "text-center", right: "text-right" } as const

type BlockProps = { block: MarkdownBlock; open: boolean; ctx: Context; tight?: boolean; listDepth?: number }

const BlockView = React.memo(
  function BlockView({ block, open, ctx, tight = false, listDepth = 0 }: BlockProps) {
    switch (block.type) {
      case "paragraph":
        return tight ? (
          <InlineText text={block.text} open={open} ctx={ctx} />
        ) : (
          <p data-slot="markdown-paragraph">
            <InlineText text={block.text} open={open} ctx={ctx} />
          </p>
        )
      case "heading": {
        const level = block.level ?? ctx.headingLevel
        const Tag = `h${level}` as "h3"
        return (
          <Tag data-slot="markdown-heading" className={cn("text-pretty not-first:mt-3", headingClass[Math.min(level - ctx.headingLevel, 2)])}>
            <InlineText text={block.text} open={open} ctx={ctx} />
          </Tag>
        )
      }
      case "rule":
        return <hr data-slot="markdown-rule" className="border-border" />
      case "code":
        return <CodeBlock code={block.code} language={block.lang || undefined} labels={ctx.labels.codeBlock} className="min-w-0" />
      case "quote":
        return (
          <blockquote data-slot="markdown-quote" className="flex min-w-0 flex-col gap-3 border-l-2 border-border pl-3 text-muted-foreground">
            <Blocks blocks={block.children} open={open} ctx={ctx} />
          </blockquote>
        )
      case "list": {
        const List = block.ordered ? "ol" : "ul"
        const marker = block.ordered ? "list-decimal" : listDepth % 2 ? "list-[circle]" : "list-disc"
        return (
          <List
            data-slot="markdown-list"
            start={block.ordered && block.from !== 1 ? block.from : undefined}
            className={cn("flex min-w-0 flex-col ps-6 marker:text-muted-foreground", block.tight ? "gap-1" : "gap-3", marker)}
          >
            {block.items.map((item, k) => (
              <ListItem key={k} item={item} open={open && k === block.items.length - 1} ctx={ctx} tight={block.tight} listDepth={listDepth} />
            ))}
          </List>
        )
      }
      case "table":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                {block.head.map((cell, k) => (
                  <TableHead key={k} className={block.align[k] ? alignClass[block.align[k]!] : undefined}>
                    <InlineText text={cell} open={false} ctx={ctx} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row, r) => (
                <TableRowView key={r} row={row} align={block.align} open={open && r === block.rows.length - 1} ctx={ctx} />
              ))}
            </TableBody>
          </Table>
        )
    }
  },
  (a, b) => a.block === b.block && a.open === b.open && a.ctx === b.ctx && a.tight === b.tight && a.listDepth === b.listDepth,
)

const TableRowView = React.memo(
  function TableRowView({ row, align, open, ctx }: { row: string[]; align: MarkdownAlign[]; open: boolean; ctx: Context }) {
    return (
      <TableRow>
        {row.map((cell, k) => (
          // A sentence in a cell wraps; a table wider than its column scrolls (the kit's Table fades the hidden side).
          <TableCell key={k} className={cn("h-auto min-w-32 py-3 align-top whitespace-normal", align[k] && alignClass[align[k]!])}>
            <InlineText text={cell} open={open && k === row.length - 1} ctx={ctx} />
          </TableCell>
        ))}
      </TableRow>
    )
  },
  (a, b) => a.row.join("\u0000") === b.row.join("\u0000") && a.open === b.open && a.ctx === b.ctx,
)

const ListItem = React.memo(
  function ListItem({ item, open, ctx, tight, listDepth }: { item: MarkdownListItem; open: boolean; ctx: Context; tight: boolean; listDepth: number }) {
    // The item stays a list-item (its marker); its blocks are spaced by margins, not by flex.
    return (
      <li data-slot="markdown-list-item" className={cn("min-w-0 ps-1", tight ? "space-y-1" : "space-y-3")}>
        {item.blocks.map((b, k) => (
          <BlockView key={k} block={b} open={open && k === item.blocks.length - 1} ctx={ctx} tight={tight && b.type === "paragraph"} listDepth={listDepth + 1} />
        ))}
      </li>
    )
  },
  (a, b) => a.item.src === b.item.src && a.open === b.open && a.ctx === b.ctx && a.tight === b.tight && a.listDepth === b.listDepth,
)

function Blocks({ blocks, open, ctx }: { blocks: MarkdownBlock[]; open: boolean; ctx: Context }) {
  return blocks.map((b, k) => <BlockView key={b.start + ":" + k} block={b} open={open && k === blocks.length - 1} ctx={ctx} />)
}

/**
 * Sets each heading's level: the first at `base`, each deeper one at most one below the heading before it, so the
 * outline never skips a level whatever the model wrote (### under # is the next level). A heading's level depends only
 * on the headings before it, so a finished one never changes as the text grows.
 */
export function setHeadingLevels(blocks: MarkdownBlock[], base: number) {
  const stack: number[] = []
  const walk = (list: MarkdownBlock[]) => {
    for (const b of list) {
      if (b.type === "heading") {
        while (stack.length && stack[stack.length - 1]! >= b.depth) stack.pop()
        b.level = Math.min(6, base + stack.length)
        stack.push(b.depth)
      } else if (b.type === "quote") walk(b.children)
      else if (b.type === "list") for (const item of b.items) walk(item.blocks)
    }
  }
  walk(blocks)
  return blocks
}

export type MarkdownProps = {
  /** The Markdown text: a model's answer, whole or as it grows. */
  text: string
  /** The text is still growing: what is still forming at its end is held back or styled so far (see above). */
  streaming?: boolean
  /** The level of the text's top headings (# and the first heading under it): 3 by default, under a page's h1 and a section's h2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** Renders a citation token ([1], [^1], [1, 2]) as a marker; without it the tokens are text. `citationMarker` from citations. */
  cite?: (n: number) => React.ReactNode
  /** Origins pictures may load from ("https://cdn.example.com"); pictures from anywhere else are a link with their alt text. None by default. */
  imageOrigins?: readonly string[]
  /** Every line break is a break (true, as a model means it), or only one after two spaces or a backslash (false, as CommonMark). */
  breaks?: boolean
  /** Open http(s) links in a new tab (true), said to screen readers; false keeps them in this one. */
  newTab?: boolean
  labels?: Partial<MarkdownLabels>
  className?: string
}

/**
 * A model's answer in Markdown as the kit's elements: headings at the surface's levels, lists, tables (the kit's Table),
 * code blocks (the kit's CodeBlock, with Copy), quotes and links. A safe subset: raw HTML is text, links are only
 * http(s) and mailto, pictures are not loaded unless their origin is allowed. Pass the growing text with `streaming` while
 * it arrives.
 */
export function Markdown({
  text,
  streaming = false,
  headingLevel = 3,
  cite,
  imageOrigins,
  breaks = true,
  newTab = true,
  labels: labelsProp,
  className,
}: MarkdownProps) {
  const [parser] = React.useState(createMarkdownParser)
  // Finished blocks come back as the same objects, so they are not drawn again (BlockView compares them).
  const blocks = React.useMemo(() => setHeadingLevels(parser.parse(text, streaming), headingLevel), [parser, text, streaming, headingLevel])
  const origins = (imageOrigins ?? []).join(" ")
  // One context object while the settings stay the same; pass a stable `cite` and `labels` to keep it so.
  const ctx = React.useMemo<Context>(
    () => ({ cite, imageOrigins: origins ? origins.split(" ") : [], breaks, newTab, labels: { ...defaultMarkdownLabels, ...labelsProp }, headingLevel }),
    [cite, origins, breaks, newTab, labelsProp, headingLevel],
  )
  return (
    <div data-slot="markdown" className={cn("flex min-w-0 flex-col gap-3 text-base break-words text-foreground", className)}>
      <Blocks blocks={blocks} open={streaming} ctx={ctx} />
    </div>
  )
}
