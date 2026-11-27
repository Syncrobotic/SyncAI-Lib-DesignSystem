// Adoption scanner: which @syncrobotic items, at which versions, a codebase has installed, and how far behind it is. It
// reads each file's header (written by scripts/versions.mjs; `/* … */` in CSS) and lists the CHANGELOG.md lines that
// name a behind item in between (its registry changelog when CHANGELOG.md does not).
//
//   node scripts/adoption.mjs [dirs…]        one table per directory (default: the current one)
//   node scripts/adoption.mjs --github <org> every repo of a GitHub org, through the gh CLI (skipped without it)
//   node scripts/adoption.mjs --json         the same, as JSON
import { closeSync, openSync, readdirSync, readFileSync, readSync, statSync } from "node:fs"
import { basename, join, relative, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

// ---------- Pure logic (unit-tested in tests/unit/adoption.test.ts) ----------

// Only the fields of a registry item the scanner reads, so the tests can pass small items without files.
/** @typedef {{ name: string; type: string; meta?: { status?: string; version?: string; changelog?: import("./types.js").ChangelogEntry[] } }} Item */
/** @typedef {{ version: string; lines: string[] }} Section */
/** @typedef {{ behind: boolean; ahead: boolean; majors: number; minors: number; patches: number }} Distance */
/** @typedef {{ name: string; version: string; file: string }} Found */
/** @typedef {{ version: string; text: string | undefined; source: string }} Change */

// The header within the first lines of a file: `// @syncrobotic/<name> v<version>`, or the same in a CSS comment.
const HEADER = /^\s*(?:\/\/|\/\*)\s*@syncrobotic\/([a-z0-9][a-z0-9-]*)\s+v(\d+\.\d+\.\d+)\b/

/** @param {string} text */
export function parseHeader(text) {
  for (const line of text.replace(/^﻿/, "").split("\n").slice(0, 3)) {
    const m = HEADER.exec(line)
    if (m) return { name: m[1], version: m[2] }
  }
  return null
}

/** @param {string} v */
const parts = (v) => v.split(".").map(Number)

/**
 * -1, 0 or 1, like a sort comparator.
 * @param {string} a
 * @param {string} b
 */
export function compareVersions(a, b) {
  const [x, y] = [parts(a), parts(b)]
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1
  return 0
}

/**
 * How far `installed` is from `latest`: whole majors, minors within the same major, patches within the same minor.
 * @param {string} installed
 * @param {string} latest
 * @returns {Distance}
 */
export function distance(installed, latest) {
  const [a, b] = [parts(installed), parts(latest)]
  const cmp = compareVersions(installed, latest)
  if (cmp >= 0) return { behind: false, ahead: cmp > 0, majors: 0, minors: 0, patches: 0 }
  if (a[0] !== b[0]) return { behind: true, ahead: false, majors: b[0] - a[0], minors: 0, patches: 0 }
  if (a[1] !== b[1]) return { behind: true, ahead: false, majors: 0, minors: b[1] - a[1], patches: 0 }
  return { behind: true, ahead: false, majors: 0, minors: 0, patches: b[2] - a[2] }
}

/**
 * @param {number} n
 * @param {string} word
 */
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`
/** @param {Distance} d */
export function describeDistance(d) {
  if (d.ahead) return "ahead"
  if (!d.behind) return "current"
  if (d.majors) return `${plural(d.majors, "major")} behind`
  if (d.minors) return `${plural(d.minors, "minor")} behind`
  return `${plural(d.patches, "patch")} behind`.replace("patchs", "patches")
}

/** CHANGELOG.md as sections: "## 0.18.0 · 2026-11-19" up to the next "## " (as scripts/release-notes.mjs reads it). */
/** @param {string} text */
export function parseChangelog(text) {
  /** @type {Section[]} */
  const sections = []
  /** @type {Section | null} */
  let current = null
  for (const line of text.split("\n")) {
    if (line.startsWith("## ")) {
      const m = /^## (\d+\.\d+\.\d+)\b/.exec(line)
      current = m ? { version: m[1], lines: [] } : null // "## Unreleased" and other headings are not a version
      if (current) sections.push(current)
    } else if (current) current.lines.push(line)
  }
  return sections
}

/**
 * What changed for `name` after `from`, up to and including `to`, oldest first. For each version: the CHANGELOG.md
 * bullets that name the item in backticks (`tree`, **`tree`**); where none do, the item's own registry changelog note
 * for that version (the theme, for one, is mostly called "the theme" in CHANGELOG.md).
 * @param {{ sections: Section[]; item: Item | undefined; name: string; from: string; to: string }} args
 * @returns {Change[]}
 */
export function changesBetween({ sections, item, name, from, to }) {
  /** @param {string} v */
  const inRange = (v) => compareVersions(v, from) > 0 && compareVersions(v, to) <= 0
  const mark = "`" + name + "`"
  /** @type {Map<string, string[]>} */
  const bullets = new Map()
  for (const s of sections.filter((s) => inRange(s.version))) {
    const hits = s.lines.filter((l) => l.startsWith("- ") && l.includes(mark)).map((l) => l.slice(2).trim())
    if (hits.length) bullets.set(s.version, [...(bullets.get(s.version) ?? []), ...hits])
  }
  const notes = new Map((item?.meta?.changelog ?? []).filter((c) => inRange(c.version)).map((c) => [c.version, c.note]))
  const versions = [...new Set([...bullets.keys(), ...notes.keys()])].sort(compareVersions)
  return versions.flatMap((v) =>
    bullets.has(v)
      ? /** @type {string[]} */ (bullets.get(v)).map((text) => ({ version: v, text, source: "CHANGELOG.md" }))
      : [{ version: v, text: notes.get(v), source: "registry.json" }],
  )
}

/**
 * Items that left the registry under one name for another. A header with the old name is not "not in the registry": it
 * names the item to install instead. The old name does not install (its /r/<name>.json is a 404, on purpose).
 * @type {Record<string, { to: string; in: string; how: string }>}
 */
export const RENAMED = {
  "format-count": { to: "format-number", in: "0.40", how: "the same exports; change the imports from lib/format-count to lib/format-number" },
  "sparkline-metric-tiles": { to: "stats-cards", in: "0.40", how: "render <StatsCards stats={…} columns={3} />" },
}

/**
 * beta / stable from meta.status. A block reports as "block" whatever its status: it is copied and edited, so its
 * installed file is the product's own.
 * @param {Item | undefined} item
 */
export function statusOf(item, name = "") {
  if (!item) return name in RENAMED ? "renamed" : "unknown"
  if (item.type === "registry:block") return "block"
  if (item.meta?.status === "beta") return "beta"
  return "stable"
}

/**
 * One repo's report from the headers found in it ({ name, version, file }), against the registry and the changelog.
 * An item installed in several files at different versions is reported at its oldest, with every version listed.
 * @param {Found[]} found
 * @param {{ items: Item[] }} registry
 * @param {Section[]} sections
 */
export function report(found, registry, sections) {
  const byName = new Map(registry.items.map((i) => [i.name, i]))
  /** @type {Map<string, { name: string; versions: Set<string>; files: string[] }>} */
  const grouped = new Map()
  for (const f of found) {
    const g = grouped.get(f.name) ?? { name: f.name, versions: new Set(), files: [] }
    g.versions.add(f.version)
    g.files.push(f.file)
    grouped.set(f.name, g)
  }
  const items = [...grouped.values()]
    .map((g) => {
      const versions = [...g.versions].sort(compareVersions)
      const installed = versions[0]
      const item = byName.get(g.name)
      const latest = item?.meta?.version ?? null
      const d = latest ? distance(installed, latest) : null
      const renamed = item ? undefined : RENAMED[g.name]
      return {
        name: g.name,
        installed,
        versions,
        latest,
        status: statusOf(item, g.name),
        /** The name to install instead, when this one was renamed or folded into another item. */
        renamedTo: renamed?.to ?? null,
        behind: d?.behind ?? false,
        ahead: d?.ahead ?? false,
        majorsBehind: d?.majors ?? 0,
        minorsBehind: d?.minors ?? 0,
        patchesBehind: d?.patches ?? 0,
        // An item in the registry has a version, so `d` and `latest` are set wherever they are read below.
        state: renamed ? `renamed in ${renamed.in}: install ${renamed.to}` : !item ? "not in registry" : describeDistance(/** @type {Distance} */ (d)),
        changes: d?.behind ? changesBetween({ sections, item, name: g.name, from: installed, to: /** @type {string} */ (latest) }) : [],
        files: g.files.sort(),
      }
    })
    .sort((a, b) => Number(b.behind) - Number(a.behind) || a.name.localeCompare(b.name))
  return {
    items,
    counts: {
      items: items.length,
      behind: items.filter((i) => i.behind).length,
      current: items.filter((i) => i.latest && !i.behind && !i.ahead).length,
      beta: items.filter((i) => i.status === "beta").length,
      unknown: items.filter((i) => i.status === "unknown").length,
      renamed: items.filter((i) => i.status === "renamed").length,
    },
  }
}

/** @typedef {ReturnType<typeof report>} Report */

/**
 * Across repos: how many use each item, and how many of those are behind.
 * @param {(Report & { repo?: string })[]} repos
 */
export function summarize(repos) {
  /** @type {Map<string, { name: string; repos: number; behind: number; latest: string | null; status: string }>} */
  const use = new Map()
  for (const r of repos)
    for (const i of r.items) {
      const u = use.get(i.name) ?? { name: i.name, repos: 0, behind: 0, latest: i.latest, status: i.status }
      u.repos++
      if (i.behind) u.behind++
      use.set(i.name, u)
    }
  const items = [...use.values()].sort((a, b) => b.repos - a.repos || a.name.localeCompare(b.name))
  return {
    repos: repos.length,
    reposUsingKit: repos.filter((r) => r.items.length).length,
    items: items.length,
    installs: repos.reduce((n, r) => n + r.items.length, 0),
    behind: repos.reduce((n, r) => n + r.counts.behind, 0),
    byItem: items,
  }
}

// ---------- Reading codebases ----------

const SKIP = new Set(["node_modules", ".git", ".next", ".turbo", ".vercel", "dist", "build", "out", "coverage", "storybook-static", ".cache"])
const SOURCE = /\.(tsx?|jsx?|mjs|cjs|css|scss)$/

/** @param {string} file */
function head(file) {
  const fd = openSync(file, "r")
  try {
    const buf = Buffer.alloc(1024)
    const n = readSync(fd, buf, 0, 1024, 0)
    return buf.subarray(0, n).toString("utf8")
  } finally {
    closeSync(fd)
  }
}

/**
 * Every header under `dir`, skipping dependencies and build output. Symlinks are not followed.
 * @param {string} dir
 */
export function scanDir(dir) {
  /** @type {Found[]} */
  const found = []
  /** @param {string} d */
  const walk = (d) => {
    let entries
    try {
      entries = readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = join(d, e.name)
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) walk(p)
      } else if (e.isFile() && SOURCE.test(e.name)) {
        const h = parseHeader(head(p))
        if (h) found.push({ ...h, file: relative(dir, p) })
      }
    }
  }
  walk(dir)
  return found
}

/** @param {string[]} args */
function gh(args) {
  const r = spawnSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  // A failed spawn is a system error, which carries the errno code (ENOENT when gh is not installed).
  if (r.error) return { ok: false, missing: /** @type {NodeJS.ErrnoException} */ (r.error).code === "ENOENT", out: "", err: String(r.error.message) }
  return { ok: r.status === 0, missing: false, out: r.stdout, err: r.stderr }
}

/**
 * Every repo of `org` with a file mentioning "@syncrobotic/", through GitHub code search (default branches only; the
 * API returns at most 1000 results). Each hit's first line is read to find its header. Null when gh is missing or not
 * signed in: the scan goes on with the local directories.
 * @param {string} org
 */
export function scanGithub(org, log = console.error) {
  const auth = gh(["auth", "status"])
  if (auth.missing) {
    log(`--github ${org}: skipped, the gh CLI is not installed (https://cli.github.com).`)
    return null
  }
  if (!auth.ok) {
    log(`--github ${org}: skipped, gh is not signed in. Run \`gh auth login\` and try again.`)
    return null
  }
  const search = gh([
    "api", "-X", "GET", "search/code",
    "-f", `q="@syncrobotic/" org:${org}`,
    "-f", "per_page=100",
    "--paginate",
    "--jq", '.items[] | [.repository.full_name, .path, .sha] | @tsv',
  ])
  if (!search.ok) {
    log(`--github ${org}: code search failed: ${search.err.trim().split("\n")[0]}`)
    return null
  }
  /** @type {Map<string, Found[]>} */
  const repos = new Map()
  for (const line of search.out.split("\n").filter(Boolean)) {
    const [repo, path, sha] = line.split("\t")
    if (!SOURCE.test(path) || path.split("/").some((seg) => SKIP.has(seg))) continue
    const blob = gh(["api", `repos/${repo}/git/blobs/${sha}`, "--jq", ".content"])
    if (!blob.ok) continue
    const h = parseHeader(Buffer.from(blob.out.replace(/\s/g, ""), "base64").toString("utf8"))
    if (!h) continue
    const list = repos.get(repo) ?? []
    repos.set(repo, list)
    list.push({ ...h, file: path })
  }
  return [...repos.entries()].map(([repo, found]) => ({ repo, source: `github:${repo}`, found }))
}

// ---------- Output ----------

/** @param {string[][]} rows */
function table(rows) {
  const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => r[c].length)))
  return rows.map((r) => "  " + r.map((cell, c) => cell.padEnd(widths[c])).join("  ").trimEnd()).join("\n")
}

/**
 * @param {string} s
 * @param {number} [n]
 */
const clip = (s, n = 180) => (s.length > n ? s.slice(0, n - 1) + "…" : s)

/**
 * @param {(Report & { repo: string; source: string })[]} repos
 * @param {ReturnType<typeof summarize>} summary
 */
export function formatText(repos, summary) {
  /** @type {string[]} */
  const out = []
  for (const r of repos) {
    out.push(`${r.repo}  (${r.source})`)
    if (!r.items.length) {
      out.push("  No @syncrobotic items found.", "")
      continue
    }
    out.push(`  ${plural(r.counts.items, "item")}, ${r.counts.behind} behind, ${r.counts.beta} beta${r.counts.renamed ? `, ${r.counts.renamed} renamed` : ""}${r.counts.unknown ? `, ${r.counts.unknown} not in the registry` : ""}`, "")
    const rows = [["", "Item", "Installed", "Latest", "Behind", "Status"]]
    for (const i of r.items)
      rows.push([
        i.behind ? "!" : "",
        i.name,
        i.versions.length > 1 ? `${i.installed} (+${i.versions.length - 1})` : i.installed,
        i.latest ?? "—",
        i.state,
        i.status,
      ])
    out.push(table(rows))
    const moved = r.items.filter((i) => i.renamedTo)
    if (moved.length) {
      out.push("", "  Renamed (the old name no longer installs):")
      for (const i of moved) {
        const m = RENAMED[i.name]
        out.push(`  ${i.name} → ${m.to} (${m.in})   npx shadcn add @syncrobotic/${m.to}   then ${m.how}`)
      }
    }
    const late = r.items.filter((i) => i.behind)
    if (late.length) {
      out.push("", "  Changes since the installed version:")
      for (const i of late) {
        out.push(`  ${i.name} ${i.installed} → ${i.latest}   npx shadcn add @syncrobotic/${i.name} --overwrite`)
        // Each change has its text: a CHANGELOG.md bullet, or the registry note for a version that has one.
        for (const c of i.changes) out.push(`    ${c.version}  ${clip(/** @type {string} */ (c.text))}`)
        if (!i.changes.length) out.push("    (no changelog lines found)")
      }
    }
    out.push("")
  }
  out.push("Summary")
  out.push(`  ${plural(summary.repos, "repo")} scanned, ${summary.reposUsingKit} using the kit; ${plural(summary.items, "distinct item")}, ${plural(summary.installs, "install")}, ${summary.behind} behind.`)
  if (summary.byItem.length) {
    const rows = [["Item", "Repos", "Behind", "Latest", "Status"]]
    for (const u of summary.byItem) rows.push([u.name, String(u.repos), String(u.behind), u.latest ?? "—", u.status])
    out.push("", table(rows))
  }
  return out.join("\n") + "\n"
}

// ---------- CLI ----------

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {{ dirs: string[]; orgs: string[]; json: boolean; help: boolean }} */
  const opts = { dirs: [], orgs: [], json: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--json") opts.json = true
    else if (a === "--help" || a === "-h") opts.help = true
    else if (a === "--github") {
      const org = argv[++i]
      if (!org || org.startsWith("-")) throw new Error("--github needs an organisation name, e.g. --github Syncrobotic")
      opts.orgs.push(org)
    } else if (a.startsWith("--github=")) opts.orgs.push(a.slice(9))
    else if (a.startsWith("-")) throw new Error(`Unknown option ${a}`)
    else opts.dirs.push(a)
  }
  if (!opts.dirs.length && !opts.orgs.length) opts.dirs.push(".")
  return opts
}

const usage = `Usage: node scripts/adoption.mjs [dir …] [--github <org>] [--json]

Reports the @syncrobotic items each codebase has installed (from the header line of every installed file), the
latest version in this repo's registry.json, how far behind each is, and the CHANGELOG.md lines in between.
  dir             a local checkout to scan (default: the current directory); several make one table each
  --github <org>  also scan every repo of a GitHub organisation with the gh CLI (skipped if gh is missing or signed out)
  --json          print JSON instead of tables`

function main() {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (e) {
    // parseArgs throws only its own Errors.
    console.error(`${/** @type {Error} */ (e).message}\n\n${usage}`)
    process.exit(2)
  }
  if (opts.help) {
    console.log(usage)
    return
  }
  /** @type {{ items: Item[] }} */
  const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"))
  const sections = parseChangelog(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8"))

  /** @type {{ repo: string; source: string; found: Found[] }[]} */
  const sources = []
  for (const d of opts.dirs) {
    const abs = resolve(d)
    try {
      if (!statSync(abs).isDirectory()) throw new Error()
    } catch {
      console.error(`${d}: not a directory`)
      process.exit(2)
    }
    sources.push({ repo: basename(abs), source: abs, found: scanDir(abs) })
  }
  for (const org of opts.orgs) sources.push(...(scanGithub(org) ?? []))

  const repos = sources.map((s) => ({ repo: s.repo, source: s.source, ...report(s.found, registry, sections) }))
  const summary = summarize(repos)
  if (opts.json) console.log(JSON.stringify({ repos, summary }, null, 2))
  else process.stdout.write(formatText(repos, summary))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main()
