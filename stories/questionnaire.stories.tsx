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
      description: "Saved with incident #2041.",
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
