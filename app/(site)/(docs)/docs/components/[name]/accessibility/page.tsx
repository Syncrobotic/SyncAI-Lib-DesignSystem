import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { pageMeta } from "@/site/config"
import { getItem, items } from "@/site/catalog"
import { H2 } from "@/site/prose"
import { a11yOf } from "@/site/a11y"
import { hasA11y } from "@/site/component-tabs-data"
import { Kbd } from "@/registry/syncrobotic/ui/kbd"
import { KeyCell } from "@/site/key-cell"

export const dynamicParams = false
export const generateStaticParams = () => items.filter((i) => hasA11y(i.name)).map((i) => ({ name: i.name }))

type Props = { params: Promise<{ name: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getItem((await params).name)
  if (!item) return {}
  return pageMeta({
    title: `${item.title} accessibility`,
    description: `${item.title}: roles, WAI-ARIA pattern, keyboard and colour contrast in light and dark.`,
    path: `/docs/components/${item.name}/accessibility`,
  })
}

const ratio = (r: number) => (Number.isFinite(r) ? `${r.toFixed(1)}:1` : "—")
const linkClass = "underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"

export default async function AccessibilityPage({ params }: Props) {
  const item = getItem((await params).name)
  const a = item && a11yOf(item.name)
  if (!item || !a) notFound()

  return (
    <>
      <H2 id="roles">Roles</H2>
      <p className="max-w-3xl pb-3 text-sm text-muted-foreground">
        What a screen reader is told each part is, measured in the examples on the Overview tab.
      </p>
      {a.hidden ? (
        <p className="text-sm">
          Hidden from screen readers (<code className="rounded-xs bg-muted px-1 font-mono text-sm">aria-hidden</code>): it repeats a word, so
          write that word beside it. Status eyebrow does.
        </p>
      ) : a.roles.length ? (
        <ul aria-label="Roles" className="flex flex-wrap gap-2" data-wrap="free">
          {a.roles.map((r) => (
            <li key={r}>
              <code className="rounded-xs bg-muted px-2 py-1 font-mono text-sm">{r}</code>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">No role of its own: it is read as the text it contains.</p>
      )}
      <ul className="flex flex-col gap-2 pt-4 text-sm">
        {a.patterns.length > 0 && (
          <li>
            Follows the WAI-ARIA {a.patterns.length > 1 ? "patterns" : "pattern"}{" "}
            {a.patterns.map((p, i) => (
              <span key={p.href}>
                <a href={p.href} className={linkClass}>
                  {p.title}
                </a>
                {i < a.patterns.length - 2 ? ", " : i === a.patterns.length - 2 ? " and " : ""}
              </span>
            ))}
            .
          </li>
        )}
        {a.patternNote && <li>{a.patternNote}</li>}
        {a.live && <li>Announces changes through a live region, so a screen reader reads an update without focus moving to it.</li>}
      </ul>

      <H2 id="keyboard">Keyboard</H2>
      {a.keyboard?.length ? (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th>Keys</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {a.keyboard.map(([keys, action], i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="w-40 py-2 pr-4 pl-4 align-top sm:w-56">
                    <KeyCell keys={keys} />
                  </td>
                  <td className="py-2 pr-4 align-top leading-7 text-muted-foreground">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : a.tabStops > 0 ? (
        <p className="max-w-3xl text-sm">
          No keys of its own. <Kbd>Tab</Kbd> reaches each control in it, and each works as the browser&apos;s own button, link or field does.
        </p>
      ) : (
        <p className="max-w-3xl text-sm">Nothing in it takes focus: it is read, not operated, so it has no keys.</p>
      )}

      <H2 id="contrast">Colour contrast</H2>
      <p className="max-w-3xl pb-4 text-sm text-muted-foreground">
        Computed from the shipped theme for the colours this component uses, on page and card backgrounds; the lower of the
        two is shown. WCAG 2.2 AA.
      </p>
      <div className="overflow-hidden rounded-md border border-border bg-card text-sm">
        {/* A table from 640 px; on a phone each requirement is a block of its own, so nothing scrolls sideways. */}
        <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_6rem_5rem_5rem] gap-4 border-b border-border px-4 py-2 font-medium sm:grid">
          <span>Requirement</span>
          <span>Applies to</span>
          <span>Needs</span>
          <span>Light</span>
          <span>Dark</span>
        </div>
        <ul aria-label="Colour contrast">
          {a.contrast.map((c) => (
            <li key={c.label} className="grid gap-1 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_6rem_5rem_5rem] sm:gap-4">
              <span className="font-medium">
                {c.label}
                {/* Never a quiet number: a pair under its threshold says so in words. */}
                {!c.pass && <span className="block text-xs font-normal text-danger">Below the requirement</span>}
              </span>
              <span className="text-muted-foreground">
                {c.applies}
                <span className="block pt-1 text-xs">
                  {c.wcag.map(([label, href], i) => (
                    <span key={href}>
                      {i > 0 && " · "}
                      <a href={href} className={linkClass}>
                        WCAG {label}
                      </a>
                    </span>
                  ))}
                </span>
              </span>
              {/* On a phone the three figures share one line; from 640 px each is a column. */}
              <span className="flex flex-wrap gap-x-4 pt-1 tabular-nums sm:contents">
                <span>
                  <span className="text-muted-foreground sm:sr-only">Needs </span>
                  {c.need}
                </span>
                <span>
                  <span className="text-muted-foreground sm:sr-only">Light </span>
                  {ratio(c.light)}
                </span>
                <span>
                  <span className="text-muted-foreground sm:sr-only">Dark </span>
                  {ratio(c.dark)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
