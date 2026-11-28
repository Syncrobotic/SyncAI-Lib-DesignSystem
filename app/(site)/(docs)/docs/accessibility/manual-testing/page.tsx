import type { Metadata } from "next"
import Link from "next/link"
import { assistiveTech, matrixNames, results } from "@/site/a11y-manual"
import { getItem } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { TokenTable } from "@/site/doc"
import { ManualMatrix } from "@/site/manual-matrix"
import { H2, Inline, PageTitle, textLink } from "@/site/prose"

const description = "The manual screen-reader and keyboard test matrix for every stable component: which assistive technology to test with, the tasks to run and the results recorded."

export const metadata: Metadata = pageMeta({ title: "Manual accessibility testing", description, path: "/docs/accessibility/manual-testing" })

const example = `{
  "component": "checkbox",
  "at": "nvda-firefox",
  "status": "pass",
  "tester": "Your name",
  "date": "2026-12-01",
  "version": "0.58.0",
  "atVersion": "NVDA 2025.3 · Firefox 146 · Windows 11",
  "notes": "Optional: what was heard when it differed, and the issue link for a fail"
}`

const steps = [
  "Pick a column and write down the versions: screen reader, browser, OS. Use default settings (verbosity, punctuation) so results compare.",
  "Open the component's page in that browser. Its examples are what the tasks refer to; the version beside its title is the one you test.",
  "Run each task in order and compare what you hear with Expect. A different word for the same role is fine (“toggle button”, “button, pressed”); a missing name, role, state or announcement is a fail.",
  "Copy what was said into notes when it differs (NVDA's speech viewer, VoiceOver's caption panel). File an issue for each fail and link it.",
  "Add one entry per component and column to `site/a11y-manual.json` and open a pull request. The newest entry for a cell is shown.",
  "A result holds for the version tested. Test again when the component's changelog changes its markup, roles or keys.",
]

export default function ManualTestingPage() {
  const columns = assistiveTech.map((t) => ({ id: t.id, label: t.touch || t.id === "keyboard" ? `${t.reader} · ${t.os}` : `${t.reader} · ${t.browser}` }))
  const groups = [...new Set(matrixNames().map((n) => getItem(n)!.group))]
  return (
    <article>
      <PageTitle
        title="Manual accessibility testing"
        lead="Automated checks say what the markup is. Only a person with a screen reader can say what is heard. This matrix lists, for every stable component, the tasks to run with each assistive technology and the results recorded."
      />
      <p className="max-w-3xl text-base">
        <Inline
          text={`${results.length ? `${results.length} results are recorded.` : "No manual pass has been recorded yet: every cell is Not tested."} What is checked automatically, and which WCAG criteria still need a person, is in the conformance report.`}
        />{" "}
        <Link href="/docs/accessibility/conformance" className={textLink}>
          Accessibility conformance report
        </Link>
      </p>

      <H2 id="combinations">Combinations</H2>
      <p className="max-w-3xl pb-3 text-sm text-muted-foreground">
        <Inline text="A full pass covers every column. A release-sized pass covers at least the keyboard, one Windows reader, VoiceOver on macOS and one touch reader." />
      </p>
      <TokenTable head={["Assistive technology", "Browser", "OS", "How to run the tasks"]} rows={assistiveTech.map((t) => [t.reader, t.browser, t.os, t.how])} />

      <H2 id="how">How to run a manual pass</H2>
      <ol className="flex max-w-3xl list-decimal flex-col gap-2 pl-6 text-base">
        {steps.map((s) => (
          <li key={s}>
            <Inline text={s} />
          </li>
        ))}
      </ol>
      <div className="max-w-3xl pt-4">
        <CodeBlock code={example} lang="json" title="site/a11y-manual.json · one entry in results" />
      </div>
      <p className="max-w-3xl pt-3 text-sm text-muted-foreground">
        <Inline text={`\`at\` is a column id: ${assistiveTech.map((t) => `\`${t.id}\``).join(", ")}. Tasks come from each component's measured roles, Tab stops, live regions and keyboard table, so they change with the component.`} />
      </p>

      <H2 id="matrix">Matrix</H2>
      <ManualMatrix columns={columns} groups={groups} />
    </article>
  )
}
