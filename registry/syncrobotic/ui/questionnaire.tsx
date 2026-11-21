// @syncrobotic/questionnaire v0.23.0 · update: npx shadcn add @syncrobotic/questionnaire --overwrite
"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"
import { cn } from "@/lib/utils"

/**
 * A short set of questions answered in order: a pre-shift checklist, a site survey, feedback after an incident.
 * Paged shows one question at a time with a progress bar; list shows them all on one form.
 * Required questions block Next and Submit with a message under the question, never a shake.
 */
export type QuestionOption = { value: string; label: React.ReactNode; description?: React.ReactNode }
export type Question =
  | { id: string; type: "single"; title: React.ReactNode; description?: React.ReactNode; required?: boolean; options: QuestionOption[] }
  | { id: string; type: "multiple"; title: React.ReactNode; description?: React.ReactNode; required?: boolean; options: QuestionOption[]; max?: number }
  | {
      id: string
      type: "scale"
      title: React.ReactNode
      description?: React.ReactNode
      required?: boolean
      /** Inclusive range, 1–5 by default. */
      min?: number
      max?: number
      minLabel?: React.ReactNode
      maxLabel?: React.ReactNode
    }
  | { id: string; type: "text"; title: React.ReactNode; description?: React.ReactNode; required?: boolean; placeholder?: string }

export type Answers = Record<string, string | string[] | number | undefined>

export type QuestionnaireLabels = {
  /** The last page's button. */
  submit: string
  /** Under a required question left empty. */
  required: string
  /** The counter on the review page. */
  review: string
  /** The counter: "Question 2 of 5". */
  position: (n: number, total: number) => string
  /** Beside the counter: "40 %". */
  percent: (n: number) => string
  /** The progress bar's name. */
  progress: string
  /** Names the list on the review page. */
  answers: string
  /** The review page's button for each answer. */
  edit: string
  /** Read after Edit by screen readers only: ", question 2". */
  editQuestion: (n: number) => string
  back: string
  next: string
  /** The review page, for a question with no answer. */
  notAnswered: string
  /** A scale answer on the review page: "4 of 5". */
  scaleAnswer: (value: number, max: number) => string
  /** Under a multiple-choice question with `max`: "Up to 3." */
  upTo: (max: number) => string
  /** Read after a required question's title by screen readers only. */
  requiredMark: string
}

export const defaultQuestionnaireLabels: QuestionnaireLabels = {
  submit: "Submit",
  required: "Answer this question to continue.",
  review: "Review",
  position: (n, total) => `Question ${n} of ${total}`,
  percent: (n) => `${n} %`,
  progress: "Progress",
  answers: "Your answers",
  edit: "Edit",
  editQuestion: (n) => `, question ${n}`,
  back: "Back",
  next: "Next",
  notAnswered: "Not answered",
  scaleAnswer: (value, max) => `${value} of ${max}`,
  upTo: (max) => `Up to ${max}.`,
  requiredMark: " (required)",
}

const isAnswered = (q: Question, a: Answers[string]) =>
  q.type === "multiple" ? Array.isArray(a) && a.length > 0 : q.type === "text" ? typeof a === "string" && a.trim() !== "" : a !== undefined && a !== ""

export function Questionnaire({
  questions,
  mode = "paged",
  defaultAnswers = {},
  onSubmit,
  submitLabel: submitProp,
  requiredMessage: requiredProp,
  labels,
  review,
  defaultStep = 0,
  className,
}: {
  questions: Question[]
  mode?: "paged" | "list"
  defaultAnswers?: Answers
  onSubmit: (answers: Answers) => void
  /** Same as `labels.submit`, and wins over it. */
  submitLabel?: string
  /** Same as `labels.required`, and wins over it. */
  requiredMessage?: string
  /** The words it says, to translate them. */
  labels?: Partial<QuestionnaireLabels>
  /** Paged only: a last page that lists the answers, each with Edit, before Submit. */
  review?: boolean
  /** Paged only: the page to open on, from 0. The review page is questions.length. */
  defaultStep?: number
  className?: string
}) {
  const l = { ...defaultQuestionnaireLabels, ...labels }
  const submitLabel = submitProp ?? l.submit
  const requiredMessage = requiredProp ?? l.required
  const [answers, setAnswers] = React.useState<Answers>(defaultAnswers)
  const [index, setIndex] = React.useState(defaultStep)
  const [errors, setErrors] = React.useState<Record<string, boolean>>({})
  const headingRef = React.useRef<HTMLDivElement>(null)
  const set = (id: string, v: Answers[string]) => {
    setAnswers((p) => ({ ...p, [id]: v }))
    setErrors((p) => ({ ...p, [id]: false }))
  }
  const missing = (qs: Question[]) => qs.filter((q) => q.required && !isAnswered(q, answers[q.id]))
  const flag = (qs: Question[]) => {
    const m = missing(qs)
    setErrors((p) => ({ ...p, ...Object.fromEntries(m.map((q) => [q.id, true])) }))
    if (m[0]) document.getElementById(`q-${m[0].id}`)?.querySelector<HTMLElement>("button, input, textarea")?.focus()
    return m.length === 0
  }
  // Changing page: the current question leaves, then the next arrives and takes focus, so keyboard and screen reader
  // users land on it. If animations never run, the switch still happens after the safety delay.
  const [next, setNext] = React.useState<number | null>(null)
  const commit = React.useCallback(() => {
    if (next === null) return
    setIndex(next)
    setNext(null)
    requestAnimationFrame(() => headingRef.current?.focus())
  }, [next])
  React.useEffect(() => {
    if (next === null) return
    const t = window.setTimeout(commit, 400)
    return () => window.clearTimeout(t)
  }, [next, commit])
  const move = (to: number) => {
    if (next === null && to !== index) setNext(to)
  }

  const field = (q: Question) => (
    <QuestionField
      key={q.id}
      question={q}
      value={answers[q.id]}
      onChange={(v) => set(q.id, v)}
      error={errors[q.id] ? requiredMessage : undefined}
      labels={l}
    />
  )

  if (mode === "list") {
    return (
      <form
        data-slot="questionnaire"
        noValidate
        className={cn("flex flex-col gap-6", className)}
        onSubmit={(e) => {
          e.preventDefault()
          if (flag(questions)) onSubmit(answers)
        }}
      >
        {questions.map((q, i) => (
          <div key={q.id} className="flex gap-3">
            <span aria-hidden="true" className="w-6 shrink-0 text-sm text-muted-foreground tabular-nums">
              {i + 1}.
            </span>
            <div className="min-w-0 flex-1">{field(q)}</div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    )
  }

  const onReview = review && index === questions.length
  // There is no question on the review page, nor when the list is empty; both cases render without one.
  const q = questions[index]
  // One formula with the counter beside it: question 1 of 4 is 25 %, whatever comes after the questions; the review is 100 %.
  const pct = onReview ? 100 : ((index + 1) / questions.length) * 100
  return (
    <form
      data-slot="questionnaire"
      noValidate
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (onReview || (!review && index === questions.length - 1)) {
          if (!flag(questions)) {
            const first = questions.findIndex((x) => x.required && !isAnswered(x, answers[x.id]))
            if (first >= 0) move(first)
            return
          }
          onSubmit(answers)
        } else if (q && flag([q])) move(index + 1)
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{onReview ? l.review : l.position(index + 1, questions.length)}</span>
          <span>{l.percent(Math.round(pct))}</span>
        </div>
        <div
          role="progressbar"
          aria-label={l.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          className="h-1 overflow-hidden rounded-full bg-track"
        >
          <div className="h-full rounded-full bg-foreground transition-[width] duration-(--motion-base) ease-(--ease-standard)" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div
        ref={headingRef}
        tabIndex={-1}
        key={index}
        inert={next !== null || undefined}
        onAnimationEnd={(e) => e.target === e.currentTarget && commit()}
        // focus-ring: the step takes focus only so a screen reader reads it after Next; it is not a control.
        className={cn("outline-none", next === null ? "animate-appear" : "animate-disappear")}
      >
        {onReview ? (
          <ul aria-label={l.answers} className="flex flex-col">
            {questions.map((x, i) => (
              <li key={x.id} className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{x.title}</span>
                  <span className="text-sm">{formatAnswer(x, answers[x.id], l)}</span>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => move(i)}>
                  {l.edit}
                  <span className="sr-only">{l.editQuestion(i + 1)}</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          q && field(q)
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" disabled={index === 0} onClick={() => move(index - 1)}>
          {l.back}
        </Button>
        <Button type="submit">{onReview || (!review && index === questions.length - 1) ? submitLabel : l.next}</Button>
      </div>
    </form>
  )
}

function formatAnswer(q: Question, a: Answers[string], l: QuestionnaireLabels): React.ReactNode {
  if (!isAnswered(q, a)) return <span className="text-muted-foreground">{l.notAnswered}</span>
  if (q.type === "single") return q.options.find((o) => o.value === a)?.label ?? String(a)
  if (q.type === "multiple")
    return (a as string[]).map((v, i) => (
      <React.Fragment key={v}>
        {i > 0 && ", "}
        {q.options.find((o) => o.value === v)?.label ?? v}
      </React.Fragment>
    ))
  if (q.type === "scale") return l.scaleAnswer(a as number, q.max ?? 5)
  return String(a)
}

/** One question with its control. Usable on its own inside any form. */
export function QuestionField({
  question: q,
  value,
  onChange,
  error,
  labels,
}: {
  question: Question
  value: Answers[string]
  onChange: (v: Answers[string]) => void
  error?: React.ReactNode
  /** The words it says (`requiredMark`, `upTo`), to translate them. */
  labels?: Partial<QuestionnaireLabels>
}) {
  const l = { ...defaultQuestionnaireLabels, ...labels }
  const titleId = React.useId()
  const legend = (
    <span className="flex flex-col gap-1">
      <span id={titleId} className="text-base font-medium">
        {q.title}
        {q.required && <span className="sr-only">{l.requiredMark}</span>}
      </span>
      {q.description && <span className="text-sm font-normal text-muted-foreground">{q.description}</span>}
    </span>
  )
  const id = `q-${q.id}`

  if (q.type === "single")
    return (
      <div id={id}>
        <FieldSet legend={legend} error={error}>
          <RadioGroup value={(value as string) ?? ""} onValueChange={onChange} aria-required={q.required} className="gap-0 pt-1">
            {q.options.map((o) => (
              <ChoiceField key={o.value} label={o.label} description={o.description} control={<RadioGroupItem value={o.value} />} />
            ))}
          </RadioGroup>
        </FieldSet>
      </div>
    )

  if (q.type === "multiple") {
    const list = (value as string[]) ?? []
    const full = q.max !== undefined && list.length >= q.max
    return (
      <div id={id}>
        <FieldSet legend={legend} error={error} hint={q.max ? l.upTo(q.max) : undefined}>
          <div className="pt-1">
            {q.options.map((o) => {
              const on = list.includes(o.value)
              return (
                <ChoiceField
                  key={o.value}
                  label={o.label}
                  description={o.description}
                  control={
                    <Checkbox
                      checked={on}
                      disabled={!on && full}
                      onCheckedChange={(c) => onChange(c ? [...list, o.value] : list.filter((v) => v !== o.value))}
                    />
                  }
                />
              )
            })}
          </div>
        </FieldSet>
      </div>
    )
  }

  if (q.type === "scale") {
    const min = q.min ?? 1
    const max = q.max ?? 5
    const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i)
    // A long scale (0–10 is 11 buttons, 564 px) folds into rows of six when its column is narrower than one row, so
    // every number stays a 44 px target and in reach; the container, not the screen, decides.
    const long = steps.length > 6
    return (
      <div id={id} className={cn(long && "@container")}>
        <FieldSet legend={legend} error={error}>
          <RadioGroupPrimitive.Root
            value={value === undefined ? "" : String(value)}
            onValueChange={(v) => onChange(Number(v))}
            orientation="horizontal"
            aria-required={q.required}
            className={cn("gap-2 pt-2", long ? "grid grid-cols-6 @xl:flex" : "flex")}
          >
            {steps.map((n) => (
              <RadioGroupPrimitive.Item
                key={n}
                value={String(n)}
                aria-label={String(n)}
                className={cn(
                  "press grid h-(--h-md) min-w-(--h-md) flex-1 place-items-center rounded-sm bg-card text-sm font-medium tabular-nums ring-1 ring-border ring-inset",
                  "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:ring-primary",
                )}
              >
                {n}
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>
          {(q.minLabel || q.maxLabel) && (
            <div className="flex justify-between pt-2 text-xs text-muted-foreground">
              <span>{q.minLabel}</span>
              <span>{q.maxLabel}</span>
            </div>
          )}
        </FieldSet>
      </div>
    )
  }

  return (
    <div id={id}>
      <FieldSet legend={legend} error={error}>
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          aria-labelledby={titleId}
          aria-required={q.required}
          aria-invalid={error ? true : undefined}
          rows={3}
          className="mt-2"
        />
      </FieldSet>
    </div>
  )
}
