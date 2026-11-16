import { readSource } from "./catalog"

// Turns one story into the code a developer would write, at build time, from the story file's text.
// - render stories: the JSX the render function returns
// - args stories: <Component prop="…" /> built from the meta args and the story args

function matchClose(src: string, open: number, o: string, c: string) {
  let depth = 0
  let quote: string | null = null
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (quote) {
      if (ch === "\\") i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch
    else if (ch === o) depth++
    else if (ch === c && --depth === 0) return i
  }
  return -1
}

/** Splits an object literal body on top-level commas. */
function topLevelEntries(body: string) {
  const out: string[] = []
  let depth = 0
  let quote: string | null = null
  let start = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (quote) {
      if (ch === "\\") i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch
    else if ("({[<".includes(ch)) depth++
    else if (")}]".includes(ch) || (ch === ">" && body[i - 1] !== "=")) depth = Math.max(0, depth - 1)
    else if (ch === "," && depth === 0) {
      out.push(body.slice(start, i))
      start = i + 1
    }
  }
  out.push(body.slice(start))
  return out.map((s) => s.trim()).filter(Boolean)
}

function argsOf(block: string) {
  const at = block.search(/\bargs:\s*\{/)
  if (at < 0) return new Map<string, string>()
  const open = block.indexOf("{", at)
  const body = block.slice(open + 1, matchClose(block, open, "{", "}"))
  return new Map(
    topLevelEntries(body).map((e) => {
      const i = e.indexOf(":")
      return [e.slice(0, i).trim(), e.slice(i + 1).trim()] as [string, string]
    }),
  )
}

function dedent(s: string) {
  const lines = s.replace(/^\n+|\s+$/g, "").split("\n")
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length))
  return lines.map((l) => l.slice(indent)).join("\n")
}

/** Story-only scaffolding that should not reach code people copy. */
function clean(code: string) {
  return code
    .replace(/\bfn\(\)/g, "() => {}")
    .replace(/ className="static"/g, "")
    .replace(/\bnav\("[^"]*"\)/g, "nav")
}

export function storySource(file: string, name: string) {
  return clean(rawStorySource(file, name))
}

function rawStorySource(file: string, name: string) {
  const src = readSource(`stories/${file}.stories.tsx`)
  const start = src.search(new RegExp(`^export const ${name}\\b`, "m"))
  if (start < 0) return ""
  const next = src.slice(start + 1).search(/^export const /m)
  const block = src.slice(start, next < 0 ? undefined : start + 1 + next)

  // 1. render: () => ( … )  or  render: () => <X … />
  const r = block.search(/render:\s*\(\)\s*=>\s*/)
  if (r >= 0) {
    const after = block.slice(r).replace(/^render:\s*\(\)\s*=>\s*/, "")
    if (after.startsWith("(")) return dedent(after.slice(1, matchClose(after, 0, "(", ")")))
    return dedent(after.split("\n")[0].replace(/\s*\}\s*$/, ""))
  }

  // 2. args story: <Component {...meta.args, ...story.args} />
  const metaStart = src.search(/^const meta/m)
  const metaBlock = src.slice(metaStart, src.indexOf("\n}\n", metaStart) + 2)
  const component = metaBlock.match(/component:\s*(\w+)/)?.[1]
  if (!component) return ""
  const args = new Map([...argsOf(metaBlock), ...argsOf(block)])
  let children = ""
  const props: string[] = []
  for (const [k, v] of args) {
    if (k === "className" || v === "undefined") continue
    const value = v.replace(/\bfn\(\)/g, "() => {}")
    if (k === "children") children = value
    else if (/^"[^"]*"$/.test(value)) props.push(`${k}=${value}`)
    else if (value === "true") props.push(k)
    else props.push(`${k}={${value}}`)
  }
  const open = props.length > 2 ? `<${component}\n  ${props.join("\n  ")}\n` : `<${component}${props.length ? " " + props.join(" ") : ""}`
  if (!children) return `${open}${props.length > 2 ? "/>" : " />"}`
  return `${open}${props.length > 2 ? "" : ""}>\n  ${children}\n</${component}>`
}
