import type { Metadata } from "next"
import { DocHeader, Pager } from "@/site/doc"
import { metaFor, neighbours } from "@/site/foundations"
import { Inline } from "@/site/prose"

export const metadata: Metadata = metaFor("principles")

const principles = [
  {
    n: "01",
    title: "Safety is a colour",
    body: "Solid red belongs to the emergency stop and nothing else. Every other destructive action uses the danger outline and text. A colour that means stop must never be spent on decoration or alerts.",
    rule: "`--stop` is the only solid red in the system.",
  },
  {
    n: "02",
    title: "One meaning per colour",
    body: "Grey and ink for every state, busy or idle. Blue for a process someone is waiting on (a progress bar, a stage running, a command being sent). Amber means attention, red means stopped or failed, green means it just worked. Brand expression lives in neutral contrast, not in hue.",
    rule: "Status colours come in pairs: `text-info` on `bg-info-subtle`.",
  },
  {
    n: "03",
    title: "Readable at a glance, anywhere",
    body: "Our interfaces are used outdoors, one-handed, in a hurry, and by people who do not see colour the same way. Status is always shape plus colour plus word, and every target is at least 44 px.",
    rule: "Text meets WCAG AA in both modes; see Accessibility.",
  },
  {
    n: "04",
    title: "One geometry",
    body: "Spacing, radius, heights and line heights all sit on a 4 px grid. Nested corners stay concentric because radius steps differ by exactly the padding between them.",
    rule: "Outer radius = inner radius + padding.",
  },
  {
    n: "05",
    title: "Calm by default",
    body: "Light is the default surface: it reads in daylight and glare, where a dark screen washes out. Dark is for control rooms and night shifts. Motion only marks a change of state and disappears under reduced motion. Nothing moves to attract attention; things change because something happened.",
    rule: "Three durations: 120, 200, 320 ms.",
  },
]

export default function PrinciplesPage() {
  return (
    <article>
      <DocHeader
        title="Principles"
        lead="Every token in this system exists to serve one of these five decisions. When a choice is unclear, these settle it."
      />
      <ol className="flex flex-col">
        {principles.map((p) => (
          <li key={p.n} className="grid gap-4 border-b border-border py-8 sm:grid-cols-[6rem_1fr]">
            <span className="font-mono text-3xl text-muted-foreground">{p.n}</span>
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-bold">{p.title}</h2>
              <p className="max-w-2xl text-muted-foreground">{p.body}</p>
              <p className="text-sm">
                <Inline text={p.rule} />
              </p>
            </div>
          </li>
        ))}
      </ol>
      <Pager {...neighbours("principles")} />
    </article>
  )
}
