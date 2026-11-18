import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { CircleCheck } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { QuestionField, Questionnaire, type Answers, type Question } from "@/registry/syncrobotic/ui/questionnaire"

const meta: Meta = { title: "Inputs/Questionnaire" }
export default meta
type S = StoryObj

const preShift: Question[] = [
  {
    id: "area",
    type: "single",
    title: "Which area are you patrolling?",
    required: true,
    options: [
      { value: "north", label: "North gate" },
      { value: "hall-b", label: "Hall B" },
      { value: "perimeter", label: "Perimeter", description: "Outdoor, 2.4 km" },
    ],
  },
  {
    id: "checks",
    type: "multiple",
    title: "Which checks did you do?",
    description: "Tick each one you did yourself.",
    required: true,
    options: [
      { value: "battery", label: "Battery above 80 %" },
      { value: "lidar", label: "Lidar lens clean" },
      { value: "estop", label: "Emergency stop tested" },
    ],
  },
  { id: "confidence", type: "scale", title: "How ready is the robot?", min: 1, max: 5, minLabel: "Not ready", maxLabel: "Fully ready", required: true },
  { id: "notes", type: "text", title: "Anything the next shift should know?", placeholder: "Optional" },
]

function Done({ answers, onReset }: { answers: Answers; onReset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="flex items-center gap-2 text-sm font-medium">
        <CircleCheck aria-hidden="true" className="size-5" /> Checklist sent
      </span>
      <pre className="w-full overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{JSON.stringify(answers, null, 2)}</pre>
      <Button variant="outline" size="sm" onClick={onReset}>
        Start again
      </Button>
    </div>
  )
}

function Demo(props: Partial<React.ComponentProps<typeof Questionnaire>>) {
  const [sent, setSent] = React.useState<Answers>()
  const [run, setRun] = React.useState(0)
  if (sent) return <Done answers={sent} onReset={() => (setSent(undefined), setRun((r) => r + 1))} />
  return <Questionnaire key={run} questions={preShift} onSubmit={setSent} {...props} />
}

export const QuestionnairePaged: S = { render: () => <Demo submitLabel="Send checklist" /> }

export const QuestionnaireWithReview: S = { render: () => <Demo review submitLabel="Send checklist" /> }

export const QuestionnaireReviewPage: S = {
  render: () => (
    <Questionnaire
      questions={preShift}
      review
      onSubmit={() => {}}
      defaultAnswers={{ area: "hall-b", checks: ["battery", "estop"], confidence: 4 }}
      submitLabel="Send checklist"
      defaultStep={preShift.length}
    />
  ),
}

export const QuestionnaireList: S = { render: () => <Demo mode="list" submitLabel="Send checklist" /> }

export const QuestionnaireFeedback: S = {
  render: () => (
    <Demo
      mode="list"
      submitLabel="Send feedback"
      questions={[
        {
          id: "nps",
          type: "scale",
          title: "How likely are you to recommend the patrol service?",
          min: 0,
          max: 10,
          minLabel: "Not likely",
          maxLabel: "Very likely",
        },
        {
          id: "liked",
          type: "multiple",
          title: "What worked well?",
          max: 2,
          options: [
            { value: "alerts", label: "Alerts" },
            { value: "reports", label: "Reports" },
            { value: "app", label: "The app" },
            { value: "support", label: "Support" },
          ],
        },
        { id: "more", type: "text", title: "What should we improve?" },
      ]}
    />
  ),
}

export const QuestionnaireSingleQuestion: S = {
  render: function D() {
    const q: Question = {
      id: "cause",
      type: "single",
      title: "What caused the stop?",
      description: "Saved with incident #2041.", // tokens-ok: an incident number, not a colour
      options: [
        { value: "obstacle", label: "Obstacle in the path" },
        { value: "person", label: "A person stepped in front" },
        { value: "fault", label: "Robot fault" },
        { value: "other", label: "Something else" },
      ],
    }
    const [v, setV] = React.useState<Answers[string]>("obstacle")
    return <QuestionField question={q} value={v} onChange={setV} />
  },
}

export const QuestionnaireRequiredError: S = {
  render: () => (
    <QuestionField
      question={{ id: "err", type: "scale", title: "How ready is the robot?", min: 1, max: 5, minLabel: "Not ready", maxLabel: "Fully ready", required: true }}
      value={undefined}
      onChange={() => {}}
      error="Answer this question to continue."
    />
  ),
}

const incident: Question[] = [
  {
    id: "what",
    type: "text",
    title: "What happened?",
    description: "In a sentence or two.",
    required: true,
    placeholder: "The robot stopped at door 3 because…",
  },
  {
    id: "hurt",
    type: "single",
    title: "Was anyone hurt?",
    required: true,
    options: [
      { value: "no", label: "No" },
      { value: "minor", label: "Minor, first aid only" },
      { value: "yes", label: "Yes, needed care", description: "Security will call you." },
    ],
  },
  {
    id: "damage",
    type: "multiple",
    title: "What was damaged?",
    options: [
      { value: "robot", label: "The robot" },
      { value: "goods", label: "Goods or pallets" },
      { value: "building", label: "Doors, walls or racks" },
      { value: "none", label: "Nothing" },
    ],
  },
]

/** An incident report: text first, then choices. */
export const QuestionnaireIncident: S = { render: () => <Demo questions={incident} review submitLabel="Send report" /> }

/** One scale on its own page, 0 to 10. */
export const QuestionnaireScaleOnly: S = {
  render: () => (
    <Demo
      submitLabel="Send"
      questions={[
        {
          id: "nps",
          type: "scale",
          title: "How likely are you to recommend us to a colleague?",
          min: 0,
          max: 10,
          minLabel: "Not at all",
          maxLabel: "Certainly",
          required: true,
        },
      ]}
    />
  ),
}

/** Picked up where it was left: page 2 of 4, earlier answers kept. */
export const QuestionnaireResume: S = {
  render: () => <Questionnaire questions={preShift} defaultAnswers={{ area: "north" }} defaultStep={1} onSubmit={() => {}} submitLabel="Send checklist" />,
}

/** Options that need a word of explanation each. */
export const QuestionnaireDescribedOptions: S = {
  render: function D() {
    const [v, setV] = React.useState<Answers[string]>()
    return (
      <QuestionField
        question={{
          id: "mode",
          type: "single",
          title: "How should the robot handle a closed door?",
          options: [
            { value: "wait", label: "Wait", description: "Up to 2 minutes, then skip the stop." },
            { value: "ask", label: "Ask the desk", description: "Pauses until someone answers." },
            { value: "skip", label: "Skip", description: "Moves on at once and logs it." },
          ],
        }}
        value={v}
        onChange={setV}
      />
    )
  },
}

/** A free-text question with its own required check. */
export const QuestionnaireTextRequired: S = {
  render: () => (
    <QuestionField
      question={{ id: "why", type: "text", title: "Why are you stopping the patrol early?", required: true, placeholder: "e.g. Event in the hall tonight" }}
      value=""
      onChange={() => {}}
      error="Answer this question to continue."
    />
  ),
}
