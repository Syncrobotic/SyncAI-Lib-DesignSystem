import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { counts, criteria, evidence, kitVersion, levels, reviewed } from "@/site/acr"
import { pageMeta, site } from "@/site/config"
import { TokenTable } from "@/site/doc"
import { H2, Inline, PageTitle, textLink } from "@/site/prose"

const description = "Accessibility Conformance Report (VPAT 2.5 INT style) for the components: every WCAG 2.2 A and AA criterion, its level and the evidence behind it."

export const metadata: Metadata = pageMeta({ title: "Accessibility conformance report", description, path: "/docs/accessibility/conformance" })

const understanding = (name: string) =>
  `https://www.w3.org/WAI/WCAG22/Understanding/${name.toLowerCase().replace(/[(),]/g, "").replace(/\s+/g, "-")}.html`

export default function ConformancePage() {
  const c = counts()
  return (
    <article>
      <PageTitle
        title="Accessibility conformance report"
        lead="Every WCAG 2.2 Level A and AA criterion, in the terms of a VPAT 2.5 INT report, filled only from evidence in the repository. What needs a person is Not evaluated, with what must be done."
      />
      <DescriptionList
        columns={2}
        items={[
          { label: "Product", value: `${site.name}, components version ${kitVersion()}` },
          { label: "Rows reviewed", value: `${reviewed.date}, against ${reviewed.version}` },
          { label: "Standard", value: "WCAG 2.2, Level A and AA (VPAT 2.5 INT, WCAG table)" },
          { label: "Evaluation", value: "Automated checks and source review. No manual assistive-technology testing has been recorded yet." },
          { label: "Summary", value: levels.map((l) => `${l} ${c[l]}`).join(" · ") },
        ]}
      />
      <p className="max-w-3xl pt-3 text-sm text-muted-foreground">
        <Inline text="The report covers the components as they ship. A product built with them conforms only as its own pages do: titles, language, navigation, content and wording are the product's. As Markdown, for a VPAT document:" />{" "}
        <a href="/docs/accessibility/conformance.md" className={textLink}>
          conformance.md
        </a>
      </p>

      <H2 id="criteria">Criteria</H2>
      <div className="overflow-hidden rounded-md border border-border bg-card text-sm">
        <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.3fr)_3rem_9rem_minmax(0,2.4fr)] gap-4 border-b border-border px-4 py-2 font-medium md:grid">
          <span>Criterion</span>
          <span>Level</span>
          <span>Conformance</span>
          <span>Remarks and evidence</span>
        </div>
        <ul aria-label="WCAG 2.2 criteria">
          {criteria.map((r) => (
            <li key={r.id} id={`sc-${r.id}`} className="grid scroll-mt-20 gap-2 border-b border-border px-4 py-3 last:border-0 md:grid-cols-[minmax(0,1.3fr)_3rem_9rem_minmax(0,2.4fr)] md:gap-4">
              <a href={understanding(r.name)} className={`${textLink} font-medium`}>
                {r.id} {r.name}
              </a>
              {/* On a phone level and conformance share a line; from 768 px each is a column. */}
              <span className="flex flex-wrap items-center gap-2 md:contents">
                <span>
                  <span className="text-muted-foreground md:sr-only">Level </span>
                  {r.level}
                </span>
                <span>
                  <Badge tone={r.conformance === "Supports" ? "neutral" : "outline"}>{r.conformance}</Badge>
                </span>
              </span>
              <span className="flex flex-col gap-1">
                <span>
                  <Inline text={r.remarks} />
                </span>
                {r.todo && (
                  <span>
                    <span className="font-medium">To do: </span>
                    <Inline text={r.todo} />
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Evidence: {r.evidence.length ? r.evidence.map((e) => evidence[e].label).join(", ") : "none in the repository"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <H2 id="evidence">Evidence</H2>
      <TokenTable head={["Source", "What it is"]} rows={Object.values(evidence).map((e) => [e.label, <Inline key="d" text={e.detail} />])} />

      <H2 id="update">Updating the report</H2>
      <p className="max-w-3xl text-base">
        <Inline text="Rows live in `site/acr.ts`, with the date and version they were reviewed against. A level other than Not evaluated must name its evidence, and `tests/unit/acr.test.ts` checks that every criterion is there once and that the source scans still hold. When a manual pass covers a criterion, record it in the matrix and move the row, citing it." />{" "}
        <Link href="/docs/accessibility/manual-testing" className={textLink}>
          Manual accessibility testing
        </Link>
      </p>
    </article>
  )
}
