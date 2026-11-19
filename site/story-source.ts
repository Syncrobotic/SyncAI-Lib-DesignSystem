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
  return withImports(file, clean(inlineHelper(file, rawStorySource(file, name))))
}

/** Where a registry file lands once installed with the shadcn CLI, so the imports in a copied example resolve. */
const installed = (from: string) =>
  from
    .replace("@/registry/syncrobotic/ui/", "@/components/ui/")
    .replace("@/registry/syncrobotic/shell/", "@/components/")
    .replace("@/registry/syncrobotic/blocks/", "@/components/")
    .replace("@/registry/syncrobotic/hooks/", "@/hooks/")
    .replace("@/registry/syncrobotic/lib/", "@/lib/")

/**
 * The example as a file you can paste and run: the imports it uses, from where the CLI installs them, and a bare JSX
 * snippet wrapped in a component. Story-only imports (Storybook's test helpers) are left out.
 */
function withImports(file: string, code: string) {
  if (!code) return code
  const src = readSource(`stories/${file}.stories.tsx`)
  const body = /^(?:export )?function /.test(code) ? code : `export function Example() {\n  return (\n${code.replace(/^/gm, "    ")}\n  )\n}`
  const lines: string[] = []
  if (/\bReact\./.test(body)) lines.push('import * as React from "react"')
  for (const m of src.matchAll(/^import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"([^"]+)"/gm)) {
    if (m[2].startsWith("@storybook")) continue
    const used = m[1]
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
      .filter((n) => {
        const local = n.replace(/^type\s+/, "").split(/\s+as\s+/).pop()!
        return new RegExp(`\\b${local}\\b`).test(body)
      })
    if (used.length) lines.push(`import { ${used.join(", ")} } from "${installed(m[2])}"`)
  }
  return lines.length ? `${lines.join("\n")}\n\n${body}` : body
}

/**
 * A story that renders one helper from its own file (`<AlarmPanel />`, usually because it keeps state)
 * shows the helper's source instead, so the code tab holds something you can copy and run.
 */
function inlineHelper(file: string, code: string) {
  const name = code.match(/^<([A-Z]\w*)[^<>]*\/>$/)?.[1]
  if (!name) return code
  const src = readSource(`stories/${file}.stories.tsx`)
  const start = src.search(new RegExp(`^(?:export )?function ${name}\\b`, "m"))
  if (start < 0) return code
  const open = src.indexOf("{", src.indexOf(")", start))
  return src.slice(start, matchClose(src, open, "{", "}") + 1).replace(/^export /, "")
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
