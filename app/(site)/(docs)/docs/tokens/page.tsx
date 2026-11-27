import type { Metadata } from "next"
import { startNeighbours } from "@/site/foundations"
import { readSource } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta, site } from "@/site/config"
import { TokenTable, Pager } from "@/site/doc"
import { H2, Inline, PageTitle } from "@/site/prose"

const description = "The SYNCROBOTIC tokens as W3C Design Tokens (DTCG JSON) for Figma, Tokens Studio, Style Dictionary and native apps."

export const metadata: Metadata = pageMeta({ title: "Design tokens — DTCG JSON", description, path: "/docs/tokens" })

const files = [
  { file: "core.tokens.json", holds: "Radius, spacing, heights, type, motion. The same in every mode." },
  { file: "color.light.tokens.json", holds: "Colour and shadow, light mode." },
  { file: "color.dark.tokens.json", holds: "Colour and shadow, dark mode. Same names as light, so tools treat the files as modes." },
  { file: "color.light-hc.tokens.json", holds: "Light mode in high contrast (data-contrast=\"more\"): 7:1 text, 3:1 edges." },
  { file: "color.dark-hc.tokens.json", holds: "Dark mode in high contrast." },
]

const styleDictionary = `// style-dictionary.config.mjs — e.g. Swift and Android resources for a native control app
export default {
  source: ["tokens/core.tokens.json", "tokens/color.dark.tokens.json"],
  platforms: {
    ios: { transformGroup: "ios-swift", buildPath: "ios/", files: [{ destination: "Tokens.swift", format: "ios-swift/class.swift" }] },
    android: { transformGroup: "android", buildPath: "android/", files: [{ destination: "tokens.xml", format: "android/resources" }] },
  },
}`

/** The brand layer: what a product may swap, what each value must reach. scripts/brand.mjs checks the same numbers. */
const brand = [
  ["`--brand-primary`", "`--primary`", "Primary buttons, a switch that is on, a selected edge", "3:1 on `--background`, `--card` and `--popover`"],
  ["`--brand-primary-foreground`", "`--primary-foreground`", "Words and icons on primary", "4.5:1 on the brand primary"],
  ["`--brand-ring`", "`--ring`", "The focus ring (the ink by default)", "3:1 on `--background`, `--card` and `--popover`"],
  ["`--brand-chart-1`", "`--chart-1`", "The one series that matters; annotations' predicted box in light", "3:1 on `--card`; ΔE 15 from `--chart-2` and `--chart-3`, also colour-blind"],
  ["`--brand-chart-1-foreground`", "`--chart-1-foreground`", "A value written on the accent", "4.5:1 on the brand chart-1"],
]

export default function TokensPage() {
  const base = `${site.registryUrl}/tokens`
  return (
    <article>
      <PageTitle
        title="Design tokens"
        lead="The theme in a format any tool can read. Generated from syncrobotic-theme.css on every change, so design files, native apps and the web read the same values."
      />

      <H2 id="files">Files</H2>
      <TokenTable
        head={["File", "Holds"]}
        rows={files.map((f) => [
          <a key="f" href={`/tokens/${f.file}`} className="inline-flex min-h-(--h-sm) items-center font-mono text-sm text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
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
          <Inline text="Make two themes: Light (core + color.light) and Dark (core + color.dark), and two more for high contrast if the product goes outdoors (color.light-hc, color.dark-hc)." />
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

      <H2 id="brand">Brand layer</H2>
      <p className="max-w-3xl pb-3 text-base">
        <Inline text="Five tokens carry a product's brand; every other token is semantic and fixed: status, surfaces, text, borders, disabled and the stop mean the same in every product. Set the brand inputs on `:root` after the theme: `--brand-<token>` for light, `--brand-<token>-dark` for dark. One left unset keeps the kit's value, so a product without a brand renders exactly as the kit. High contrast keeps the kit's ink: a brand colour rarely reaches 7:1." />
      </p>
      <TokenTable head={["Set", "Feeds", "Where it shows", "Must reach, in light and dark"]} rows={brand.map((r) => r.map((c) => <Inline key={c} text={c} />))} />
      <div className="pt-4">
        <CodeBlock code={readSource("site/snippets/brand-portal.css")} lang="css" title="globals.css: the LocalMind Portal's purple" />
      </div>
      <p className="max-w-3xl pt-3 text-sm text-muted-foreground">
        <Inline text="The Portal's purple fails in dark as it ships (2.7:1 on the dark page), so the example takes a lighter step there, with ink on it. Check a brand file before shipping it: `node scripts/brand.mjs globals.css` in a checkout of this repository lists every pair below its contrast and any semantic token it sets. Components never read `--brand-*` and never write a brand colour as text (`lint:tokens`): a brand promises 3:1 on a surface, not the 4.5:1 words need. The DTCG files hold the kit's own values." />
      </p>

      <H2 id="ci">Kept in step</H2>
      <p className="text-sm">
        <Inline text="`npm run tokens` regenerates the files. CI runs the check and fails when the JSON no longer matches the CSS." />
      </p>
      <Pager {...startNeighbours("/docs/tokens")} />
    </article>
  )
}
