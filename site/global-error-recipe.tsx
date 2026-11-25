import Link from "next/link"
import { readSource } from "./catalog"
import { CodeBlock } from "./code-block"
import { H2, Inline, Rules } from "./prose"
import { installed } from "./story-source"

// The files are real modules (site/snippets/), so the typecheck covers them; the page shows them with the imports a
// product has once the CLI installed the block.
const show = (path: string) =>
  readSource(path)
    .split("\n")
    .map((line) => (line.startsWith("import") ? installed(line) : line))
    .join("\n")

const linkCls = "underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"

function P({ text }: { text: string }) {
  return (
    <p className="max-w-3xl pb-3 text-base">
      <Inline text={text} />
    </p>
  )
}

/** The status-pages recipe for Next.js: a root layout that throws, caught by app/global-error.tsx. */
export function GlobalErrorRecipe() {
  return (
    <section aria-labelledby="nextjs">
      <H2 id="nextjs">In Next.js: errors in the root layout</H2>
      <P text="An `error.tsx` is an error boundary inside the layout of its segment, so it catches what the page and the layouts below it throw, never its own layout. The root layout has no layout above it: when it throws (a session read, a config fetch), only `app/global-error.tsx` catches it. Without one, people see Next.js's own default page, in English, outside your theme." />
      <P text="`global-error.tsx` replaces the root layout while it shows, so it renders its own `<html>` and `<body>` and brings everything the layout gave every page: the font, `globals.css` and the theme. Put the theme script in a file of its own and render it in both." />
      <div className="flex flex-col gap-4">
        <CodeBlock code={show("site/snippets/theme-script.ts")} lang="ts" title="app/theme-script.ts" />
        <CodeBlock code={show("site/snippets/global-error.tsx")} lang="tsx" title="app/global-error.tsx" />
      </div>
      <div className="pt-4">
        <Rules
          rules={[
            "The root layout renders the same script: `<script dangerouslySetInnerHTML={{ __html: themeScript }} />`, first in `<body>`, with `import { themeScript } from \"./theme-script\"`.",
            "It is a Client Component, so it cannot export `metadata`; React's `<title>` names the tab.",
            "`retry()` fetches and renders the page again. Older Next.js versions pass only `reset`, which renders again without fetching: call that instead.",
            "The way out is a plain link, not `next/link`: a full load starts the app again from a fresh root layout.",
            "Write your own words in it: it is outside the layout, so a locale or a provider the layout set up is not there. If your app wraps pages in a ThemeProvider, wrap the StatusPage in it here too.",
            "In development the error overlay shows first; check the page itself with `next build` and `next start`.",
            "Keep `error.tsx` files for the rest. One beside the pages inside the app shell's layout (`app/(app)/error.tsx`) renders inside the shell, so the navigation stays: ErrorPage with `fill=\"parent\"`. `app/error.tsx` catches what that layout throws, inside the root layout.",
          ]}
        />
      </div>
      <p className="max-w-3xl pt-4 text-base">
        <Link href="/docs/nextjs" className={linkCls}>
          The Next.js guide
        </Link>{" "}
        <Inline text="has the root layout, the theme without a flash and the theme switch this recipe follows." />
      </p>
    </section>
  )
}
