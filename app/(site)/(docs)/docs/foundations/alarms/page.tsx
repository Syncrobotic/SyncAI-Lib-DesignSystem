import type { Metadata } from "next"
import { OctagonAlert, TriangleAlert } from "lucide-react"
import { DiamondAlert } from "@/registry/syncrobotic/ui/robot-icons"
import { haptics, tones } from "@/registry/syncrobotic/lib/feedback"
import { Alarm } from "@/registry/syncrobotic/ui/alarm"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { AlarmLifecycle } from "@/site/alarm-lifecycle"
import { FeedbackDemo } from "@/site/feedback-demo"
import { Code, DocHeader, DoDont, Pager, Section, Specimen, TokenTable } from "@/site/doc"
import { Stage } from "@/site/examples"
import { metaFor, neighbours } from "@/site/foundations"
import { Rules } from "@/site/prose"

export const metadata: Metadata = metaFor("alarms")

// Which surface a message belongs on, from most to least urgent.
const surfaces = [
  { what: "Emergency stop", when: "The robot has been stopped, or must be.", lasts: "Until released with Slide to release.", component: "stop-button, island" },
  { what: "Alarm", when: "An abnormal condition an operator must act on.", lasts: "Until it clears and is acknowledged.", component: "alarm" },
  { what: "Alert", when: "A condition on this page, true for a while.", lasts: "While the condition holds. No acknowledge.", component: "alert" },
  { what: "Toast / island notice", when: "The result of what the user just did, or a minor event.", lasts: "4 s · 8 s with Undo · failures until dismissed.", component: "toast, island" },
]

const priorities = [
  { p: "Critical", icon: OctagonAlert, cls: "text-danger", act: "Now", sound: "Every 10 s until acknowledged", share: "≤ 5 %", example: "Collision risk, person in a restricted zone, robot fell" },
  { p: "High", icon: TriangleAlert, cls: "text-warning", act: "Within minutes", sound: "Plays once", share: "≈ 15 %", example: "Battery below 15 %, localisation lost, stuck for 30 s" },
  { p: "Low", icon: DiamondAlert, cls: "text-neutral", act: "When convenient", sound: "Silent", share: "≈ 80 %", example: "Cleaning due, firmware update ready, map out of date" },
]

export default function AlarmsPage() {
  return (
    <article>
      <DocHeader
        title="Alarms"
        lead="An operator watching twenty robots can act on only a few things at once. Alarms decide which, and how loudly. The rules follow ISA-18.2 and IEC 62682, the standards for industrial alarm management."
      />

      <Section id="surfaces" title="Which surface" lead="Ask two questions: must someone act, and is it about the robot or about this page?">
        <TokenTable
          head={["Surface", "Use when", "Lasts", "Component"]}
          rows={surfaces.map((s) => [
            <span key="w" className="font-medium whitespace-nowrap">
              {s.what}
            </span>,
            s.when,
            <span key="l" className="text-muted-foreground">
              {s.lasts}
            </span>,
            <Code key="c">{s.component}</Code>,
          ])}
        />
      </Section>

      <Section id="priority" title="Three priorities" lead="Each has its own shape, colour and word, so priority reads without colour vision. Solid red stays reserved for the emergency stop.">
        <TokenTable
          head={["Priority", "Act", "Sound and haptics", "Share of alarms", "Examples"]}
          rows={priorities.map((x) => [
            <span key="p" className={`flex items-center gap-2 font-medium whitespace-nowrap ${x.cls}`}>
              <x.icon aria-hidden className="size-4" /> {x.p}
            </span>,
            x.act,
            x.sound,
            <span key="s" className="tabular-nums">
              {x.share}
            </span>,
            <span key="e" className="text-muted-foreground">
              {x.example}
            </span>,
          ])}
        />
        <p className="text-sm text-muted-foreground">
          The shares are the ISA-18.2 guide. If a third of your alarms are critical, the priorities have stopped meaning anything: review them.
        </p>
      </Section>

      <Section id="lifecycle" title="Lifecycle" lead="Acknowledging and clearing are different events. An alarm leaves the list only when both have happened.">
        <Specimen>
          <AlarmLifecycle />
        </Specimen>
        <TokenTable
          head={["State", "Who sets it", "In the list"]}
          rows={[
            ["Shelved", "An operator, for a set time (not critical alarms)", "Out of the live list into “Shelved”, silent, with Unshelve. Returns when the time is up."],
            ["Suppressed by design", "The app's logic: the condition does not apply now, e.g. a docked robot is not moving", "Counted under the list"],
            ["Out of service", "An authorised person, for maintenance", "Counted under the list"],
            ["Flood", "The list: over 10 alarms per operator raised in 10 minutes (ISA-18.2). A design fault to fix at the source, not a load to carry", "Named in a banner; critical and high stay in view, low alarms fold into one row; screen readers hear one count"],
            ["Not known", "The app: the alarms are still loading, or could not be loaded or updated", "Placeholder rows while loading, never “No active alarms”. On a failure, a danger-tint banner says the list may be out of date (or that alarms may be missing), when it last updated, and offers Try again; alarms already loaded stay"],
          ]}
        />
      </Section>

      <Section
        id="touch-and-sound"
        title="Touch and sound"
        lead="Gloves, wind and machine noise: the screen alone cannot tell an operator that a stop went out or a critical alarm came in. Each safety moment has one fixed pattern from `@syncrobotic/feedback`, so the hand learns it like the eye learns a colour. Both the phone's island and the dashboard's list signal; a critical alarm sounds again every 10 s until someone acknowledges it, and shelved, suppressed and out-of-service alarms stay silent. Touch works where the browser can vibrate (Android, not iOS); sound only after the first tap on the page. Neither ever replaces what the screen shows."
      >
        <TokenTable
          head={["Moment", "Vibration (ms on, off, on…)", "Tone"]}
          rows={(Object.keys(haptics) as (keyof typeof haptics)[]).map((k) => {
            const t = (tones as Partial<Record<string, { hz: number; pulse: number; starts: readonly number[] }>>)[k]
            return [
              <Code key="k">{k}</Code>,
              <span key="v" className="font-mono text-xs tabular-nums">
                {haptics[k].join(", ")}
              </span>,
              t ? `${t.starts.length} pulses of ${t.pulse} ms at ${t.hz} Hz` : "None",
            ]
          })}
        />
        <Specimen>
          <FeedbackDemo />
        </Specimen>
      </Section>

      <Section id="rules" title="Rules">
        <Rules
          rules={[
            "No action, no alarm. If the operator cannot do anything about it, log it as an event.",
            "One alarm per root cause. When a robot goes offline, raise “offline”, not also “camera lost” and “lidar lost”.",
            "The title says what happened and where (“Collision risk · Hall B”); the source names the robot; the action says what to do (“Open camera”).",
            "Never auto-dismiss an alarm and never send one as a toast.",
            "No blinking and no tinted rows. Colour is only on the glyph and the priority word. Unacknowledged is a bold title and a solid bar; cleared but not acknowledged keeps the bold with a dashed bar; acknowledged is regular and grey and says when. Sound does the interrupting.",
            "Time first, in tabular figures, so order and age read down the column.",
            "“Acknowledge all” is the app's choice (onAcknowledgeAll) and never takes a critical alarm: each critical alarm is read and acknowledged on its own row. It takes only the other alarms in view, never shelved, suppressed or out-of-service ones, and says how many it acknowledged.",
            "New critical alarms are announced to screen readers assertively, others politely. `AlarmList` does this for you.",
            "In the control app the island shows the most urgent unacknowledged alarm (`IslandAlarm`), above any notice, and its edge takes the alarm's colour. The dashboard shows the full `AlarmList`. Both read the same data.",
          ]}
        />
        <DoDont
          good={{
            visual: (
              <div className="w-72">
                <Alarm priority="critical" title="Collision risk · Hall B" source="Patrol dog 7F3A" time="14:02" active acknowledged={false} />
              </div>
            ),
            text: "Priority as shape, colour and word; where it happened in the title.",
          }}
          bad={{
            visual: (
              <div className="w-72">
                <Alert tone="danger">
                  <OctagonAlert aria-hidden />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Something went wrong with a robot.</AlertDescription>
                </Alert>
              </div>
            ),
            text: "A page alert for a robot condition: no priority, no source, nothing to acknowledge.",
          }}
        />
      </Section>

      <Section id="toast" title="Toast" lead="Feedback on what the user just did. Same timings as the island's notices in the control app.">
        <Stage file="feedback" name="ToastTones" />
      </Section>

      <Pager {...neighbours("alarms")} />
    </article>
  )
}
