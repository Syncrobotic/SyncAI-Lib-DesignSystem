import { blocks } from "./blocks"
import { items, readSource, storyNames } from "./catalog"
import { highlight } from "./highlight"
import { storySource } from "./story-source"

// Code a reader has to open to see (a block's Code tab, an example's Code sheet, a component's Source sheet) is not in
// the page: highlighted, a chart page's hidden listings were 900 KB of the payload every visit downloaded and hydrated.
// Each listing is a static JSON file instead (app/code/**, prerendered at build time), fetched when its panel opens
// (site/lazy-code.tsx). The page carries only its address and its line count, so the panel keeps its height while it loads.

/** What a listing's file holds: the exact text (what Copy copies) and shiki's HTML of it. */
export type CodeData = { code: string; html: string }

type Lang = "tsx" | "ts" | "css"
export const langOf = (path: string): Lang => (path.endsWith(".css") ? "css" : path.endsWith(".ts") ? "ts" : "tsx")

/** Lines as the code block draws them: shiki trims the end, one 20 px line each. */
export const lineCount = (code: string) => code.trimEnd().split("\n").length

/** Every source file a page lists behind a tab or a sheet: the blocks' files and the components' own. */
export function sourcePaths() {
  return [...new Set([...blocks.flatMap((b) => b.files.map((f) => f.path)), ...items.flatMap((i) => i.files.map((f) => f.path))])]
}

/** Every example a component page shows, as [story file, story name]. Two components can share a story file. */
export function storyKeys() {
  const out = new Map<string, { file: string; name: string }>()
  for (const i of items) if (i.examples) for (const name of storyNames(i.examples)) out.set(`${i.examples.file}/${name}`, { file: i.examples.file, name })
  return [...out.values()]
}

export const sourceUrl = (path: string) => `/code/src/${path}`
export const storyUrl = (file: string, name: string) => `/code/story/${file}/${name}`

export async function codeData(code: string, lang: Lang): Promise<CodeData> {
  return { code, html: await highlight(code, lang) }
}

/** The props a lazy listing needs for a source file: where to fetch it and how tall it is. */
export const sourceListing = (path: string) => ({ src: sourceUrl(path), title: path, lang: langOf(path), lines: lineCount(readSource(path)) })

/** The same for an example: its JSX as a developer would write it (site/story-source.ts). */
export const storyListing = (file: string, name: string, title: string) => ({ src: storyUrl(file, name), title, lang: "tsx" as const, lines: lineCount(storySource(file, name)) })
