// What a source file exports, read from the file itself: for a library page with no examples (ros), the API in place
// of the whole source. The source is one click away in the Source sheet.

export type ApiEntry = {
  kind: "function" | "class" | "type" | "const"
  name: string
  /** A function's declaration up to its body, on one line: `createRosConnection(options: RosConnectionOptions): RosConnection`. */
  signature?: string
  /** The first sentence of the JSDoc above it, if it has one. */
  summary?: string
}

/** The JSDoc block that ends on the line just above `at`, as plain text, or undefined. */
function docAbove(lines: string[], at: number) {
  if (!lines[at - 1]?.trim().endsWith("*/")) return undefined
  let start = at - 1
  while (start >= 0 && !lines[start]!.trim().startsWith("/**")) start--
  if (start < 0) return undefined
  const text = lines
    .slice(start, at)
    .map((l) => l.trim().replace(/^\/\*\*\s?/, "").replace(/\*\/$/, "").replace(/^\*\s?/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
  // The first sentence: up to a full stop followed by a space and a capital, or the whole text.
  const m = text.match(/^(.*?[.:])\s(?=[A-Z`])/)
  return (m ? m[1]! : text).replace(/:$/, ".")
}

export function apiOf(source: string): ApiEntry[] {
  const lines = source.split("\n")
  const out: ApiEntry[] = []
  lines.forEach((line, i) => {
    const m = line.match(/^export (?:async )?(function|class|type|interface|const) ([A-Za-z0-9_]+)/)
    if (!m) return
    const kind = m[1] === "interface" ? "type" : (m[1] as ApiEntry["kind"])
    const entry: ApiEntry = { kind, name: m[2]!, summary: docAbove(lines, i) }
    if (kind === "function") {
      // The declaration runs to the line that opens the body.
      let j = i
      let decl = line
      while (!lines[j]!.trimEnd().endsWith("{") && j < lines.length - 1) decl += ` ${lines[++j]!.trim()}`
      entry.signature = decl
        .replace(/^export (async )?function /, "")
        .replace(/\s*\{$/, "")
        .replace(/\s+/g, " ")
        .replace(/\( /g, "(")
        .replace(/,? \)/g, ")")
    }
    out.push(entry)
  })
  return out
}
