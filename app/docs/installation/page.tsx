import type { Metadata } from "next"
import { CodeBlock } from "@/site/code-block"
import { site } from "@/site/config"
import { H2, Inline, PageTitle } from "@/site/prose"

const description = "Install the SYNCROBOTIC theme and components into a Next.js or React project with the shadcn CLI and Tailwind CSS v4."

export const metadata: Metadata = {
  title: "Installation — shadcn registry",
  description,
  alternates: { canonical: "/docs/installation" },
  openGraph: { title: "Installation — shadcn registry", description, url: "/docs/installation" },
}

const registryConfig = `{
  "registries": {
    "@syncrobotic": {
      "url": "${site.registryUrl}/r/{name}.json",
      "headers": { "x-vercel-protection-bypass": "\${SYNCROBOTIC_REGISTRY_TOKEN}" }
    }
  }
}`

const globals = `@import "tailwindcss";
@import "../styles/syncrobotic-theme.css";`

export default function InstallationPage() {
  return (
    <article>
      <PageTitle
        eyebrow="Getting started"
        title="Installation"
        lead="Components install as source code into your project, the same way shadcn/ui does. You can read and change every line."
      />

      <H2 id="prerequisites">1. Prerequisites</H2>
      <p className="text-sm">
        <Inline text="A React or Next.js project that has run `npx shadcn init` with Tailwind CSS v4." />
      </p>

      <H2 id="registry">2. Add the registry</H2>
      <p className="pb-3 text-sm">
        <Inline text="In `components.json`. Set `SYNCROBOTIC_REGISTRY_TOKEN` in your environment to the Vercel protection bypass secret the design system maintainers give you." />
      </p>
      <CodeBlock code={registryConfig} lang="json" title="components.json" />

      <H2 id="theme">3. Install the theme</H2>
      <CodeBlock code="npx shadcn add @syncrobotic/syncrobotic-theme" lang="bash" />
      <p className="pt-4 pb-3 text-sm">
        <Inline text="Import it after Tailwind in `globals.css`, then delete the `:root`, `.dark` and `@theme inline` blocks that shadcn init generated." />
      </p>
      <CodeBlock code={globals} lang="css" title="globals.css" />
      <p className="pt-3 text-sm">
        <Inline text={'Dark is the default: put `class="dark"` on `<html>`.'} />
      </p>

      <H2 id="components">4. Add components</H2>
      <CodeBlock code="npx shadcn add @syncrobotic/dock @syncrobotic/stop-button @syncrobotic/slide-to-release @syncrobotic/island" lang="bash" />

      <H2 id="localise">5. Localise</H2>
      <p className="text-sm">
        <Inline text={'Default copy is English. Every visible and screen-reader string can be replaced through props, e.g. `<StopButton labels={{ ready: "Parada de emergencia" }} />`.'} />
      </p>

      <H2 id="notes">Notes</H2>
      <ul className="flex list-disc flex-col gap-2 pl-6 text-sm">
        <li>
          <Inline text="Installing two or more components that share `@syncrobotic/cn` prints “Circular dependency detected”. The CLI is merging shared dependencies; the result is correct." />
        </li>
        <li>The shadcn CLI fetches base colours from ui.shadcn.com during install, so the machine needs access to it.</li>
      </ul>
    </article>
  )
}
