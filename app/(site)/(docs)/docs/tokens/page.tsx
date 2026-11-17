import type { Metadata } from "next"
import { CodeBlock } from "@/site/code-block"
import { pageMeta, site } from "@/site/config"
import { TokenTable } from "@/site/doc"
import { H2, Inline, PageTitle } from "@/site/prose"

const description = "The SYNCROBOTIC tokens as W3C Design Tokens (DTCG JSON) for Figma, Tokens Studio, Style Dictionary and native apps."

export const metadata: Metadata = pageMeta({ title: "Design tokens — DTCG JSON", description, path: "/docs/tokens" })

const files = [
  { file: "core.tokens.json", holds: "Radius, spacing, heights, type, motion. The same in every mode." },
  { file: "color.light.tokens.json", holds: "Colour and shadow, light mode." },
  { file: "color.dark.tokens.json", holds: "Colour and shadow, dark mode. Same names as light, so tools treat the two as modes." },
]

const styleDictionary = `// style-dictionary.config.mjs — e.g. Swift and Android resources for a native control app
export default {
  source: ["tokens/core.tokens.json", "tokens/color.dark.tokens.json"],
  platforms: {
    ios: { transformGroup: "ios-swift", buildPath: "ios/", files: [{ destination: "Tokens.swift", format: "ios-swift/class.swift" }] },
    android: { transformGroup: "android", buildPath: "android/", files: [{ destination: "tokens.xml", format: "android/resources" }] },
  },
}`

export default function TokensPage() {
  const base = `${site.registryUrl}/tokens`
  return (
    <article>
      <PageTitle
        eyebrow="Getting started"
        title="Design tokens"
        lead="The theme in a format any tool can read. Generated from syncrobotic-theme.css on every change, so design files, native apps and the web read the same values."
      />

      <H2 id="files">Files</H2>
      <TokenTable
        head={["File", "Holds"]}
        rows={files.map((f) => [
          <a key="f" href={`/tokens/${f.file}`} className="font-mono text-sm text-info underline-offset-4 hover:underline">
            {f.file}
          </a>,
          <span key="h" className="text-muted-foreground">
            {f.holds}
          </span>,
        ])}
      />
      <p className="pt-3 text-sm text-muted-foreground">
        {/* tokens-ok: shows the file format, not a colour in use */}
        <Inline text="Format: DTCG with string values (`#09090b`, `16px`, `200ms`), the form Tokens Studio and Style Dictionary 4 read. Colours that reference another token stay references (`{color.foreground}`)." />
      </p>

      <H2 id="figma">Figma</H2>
      <ol className="flex list-decimal flex-col gap-2 pl-6 text-sm">
        <li>
          <Inline text="Install the Tokens Studio plugin and add a URL sync source for each file, e.g." />
          <code className="mt-1 block font-mono text-xs break-all text-muted-foreground">{base}/core.tokens.json</code>
        </li>
        <li>
          <Inline text="Make two themes: Light (core + color.light) and Dark (core + color.dark)." />
        </li>
        <li>
          <Inline text="Export them to Figma variables, one collection with Light and Dark as modes. Component styles then bind to the variables, not to hex values." />
        </li>
        <li>
          <Inline text="When the theme changes, CI regenerates the files; pull in Tokens Studio to update the variables. Never edit tokens in Figma: change the CSS and let it flow." />
        </li>
      </ol>

      <H2 id="native">Native apps</H2>
      <p className="pb-3 text-sm">
        <Inline text="Copy the files into the app repo, or fetch them in its build, and generate platform code with Style Dictionary." />
      </p>
      <CodeBlock code={styleDictionary} lang="ts" title="style-dictionary.config.mjs" />

      <H2 id="ci">Kept in step</H2>
      <p className="text-sm">
        <Inline text="`npm run tokens` regenerates the files. CI runs the check and fails when the JSON no longer matches the CSS." />
      </p>
    </article>
  )
}
