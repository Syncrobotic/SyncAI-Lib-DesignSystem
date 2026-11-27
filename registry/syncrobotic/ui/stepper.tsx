// @syncrobotic/stepper v0.53.0 · update: npx shadcn add @syncrobotic/stepper --overwrite
"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"

type StepState = "done" | "current" | "upcoming" | "error"

export type StepperLabels = {
  /** Under the title of an `optional` step (when `optional` is true rather than words of its own). */
  optional: string
  /** Read by screen readers after each step's title, by its state. */
  unavailable: string
  done: string
  error: string
  current: string
  upcoming: string
  /** StepperCompact's counter: "Step 2 of 5". */
  position: (n: number, total: number) => string
  /** StepperCompact's progress bar name. */
  progress: string
}

export const defaultStepperLabels: StepperLabels = {
  optional: "Optional",
  unavailable: "unavailable",
  done: "completed",
  error: "has an error",
  current: "current step",
  upcoming: "not started",
  position: (n, total) => `Step ${n} of ${total}`,
  progress: "Steps",
}

type Ctx = {
  value: number
  orientation: "horizontal" | "vertical"
  onValueChange?: (step: number) => void
  /** Steps people may jump to by clicking. "done" lets them go back only. */
  navigable: "none" | "done" | "all"
  errors: number[]
  size: "md" | "sm"
  labels: StepperLabels
}
const StepperCtx = React.createContext<Ctx | null>(null)
const useStepper = () => {
  const c = React.useContext(StepperCtx)
  if (!c) throw new Error("Stepper parts must be inside <Stepper>")
  return c
}
const StepCtx = React.createContext<{ step: number; state: StepState; last: boolean; count: number }>({ step: 1, state: "upcoming", last: false, count: 1 })

// Horizontal steps share the row equally. Under about 6rem a step, the labels would collide (and the current one would
// be squeezed into its share of the row), so every label goes to screen readers only and the current step's title and
// description show once, full width, under the row. The width is the stepper's own, not the screen's.
const labelRoom: Record<number, [string, string]> = {
  4: ["@sm:not-sr-only", "@sm:hidden"],
  5: ["@lg:not-sr-only", "@lg:hidden"],
  6: ["@xl:not-sr-only", "@xl:hidden"],
  7: ["@2xl:not-sr-only", "@2xl:hidden"],
}
const roomFor = (count: number) => (count <= 3 ? null : (labelRoom[count] ?? ["@3xl:not-sr-only", "@3xl:hidden"]))

/**
 * Where someone is in a fixed sequence of steps: done, current, upcoming and error steps, horizontal or vertical, with a
 * compact bar for phones. Steps are numbered from 1; the current one is neutral, never blue: blue means a machine is
 * working, not a person.
 */
export function Stepper({
  value,
  onValueChange,
  orientation = "horizontal",
  navigable = "none",
  errors = [],
  size = "md",
  labels,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"ol">, "onChange"> & {
  /** The current step, from 1. A value past the last step marks every step done. */
  value: number
  onValueChange?: (step: number) => void
  orientation?: "horizontal" | "vertical"
  navigable?: "none" | "done" | "all"
  /** Steps that failed validation. */
  errors?: number[]
  size?: "md" | "sm"
  /** The words it says, to translate them. */
  labels?: Partial<StepperLabels>
}) {
  const l = { ...defaultStepperLabels, ...labels }
  const items = React.Children.toArray(children).filter(React.isValidElement)
  const room = orientation === "horizontal" ? roomFor(items.length) : null
  const current = items[value - 1] as React.ReactElement<{ title?: React.ReactNode; description?: React.ReactNode }> | undefined
  return (
    <StepperCtx.Provider value={{ value, onValueChange, orientation, navigable, errors, size, labels: l }}>
      <ol
        data-slot="stepper"
        data-orientation={orientation}
        // Horizontal: one equal column per step (a grid, so the current step's words can take a full row under them).
        className={cn(orientation === "horizontal" ? "@container grid w-full items-start" : "flex flex-col", className)}
        {...props}
        style={orientation === "horizontal" ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, ...props.style } : props.style}
      >
        {items.map((child, i) => {
          const step = i + 1
          const state: StepState = errors.includes(step) ? "error" : step < value ? "done" : step === value ? "current" : "upcoming"
          return (
            <StepCtx.Provider key={child.key ?? i} value={{ step, state, last: i === items.length - 1, count: items.length }}>
              {child}
            </StepCtx.Provider>
          )
        })}
        {/* Narrow: the current step's words, once, under the row (the step itself keeps them for screen readers). */}
        {room && current && (
          <li aria-hidden="true" data-slot="stepper-current" className={cn("col-span-full mt-2 flex flex-col items-center gap-1 text-center", room[1])}>
            <span className="text-sm font-medium text-foreground">{current.props.title}</span>
            {current.props.description && <span className="text-xs text-muted-foreground">{current.props.description}</span>}
            {/* A failed step's cross says only that something is wrong: here it says which step and why. */}
            {errors
              .filter((step) => step !== value && items[step - 1])
              .map((step) => {
                const failed = items[step - 1] as React.ReactElement<{ title?: React.ReactNode; description?: React.ReactNode }>
                return (
                  <span key={step} data-slot="stepper-error" className="flex items-center gap-2 text-xs text-muted-foreground">
                    <X aria-hidden="true" className="size-4 shrink-0 text-danger" />
                    <span>
                      <span className="font-medium text-foreground">{failed.props.title}</span> · {failed.props.description ?? l.error}
                    </span>
                  </span>
                )
              })}
          </li>
        )}
      </ol>
    </StepperCtx.Provider>
  )
}

/** One step: a title, an optional description, and in a vertical stepper its content. */
export function StepperItem({
  title,
  description,
  optional,
  disabled,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  /** Adds "Optional" under the title. */
  optional?: boolean | string
  disabled?: boolean
}) {
  const { orientation, onValueChange, navigable, size, value, labels: l } = useStepper()
  const { step, state, last, count } = React.useContext(StepCtx)
  const canJump = !disabled && !!onValueChange && step !== value && (navigable === "all" || (navigable === "done" && step < value))
  const vertical = orientation === "vertical"
  const label = (
    <>
      <StepIndicator state={state} step={step} size={size} disabled={disabled} />
      <span
        className={cn(
          "flex min-w-0 flex-col",
          // Horizontal: centred under the dot, as wide as the step's share of the row at most, wrapping instead of colliding.
          vertical ? "pt-1" : cn("max-w-full items-center px-1 text-center break-words hyphens-auto", roomFor(count) && cn("sr-only", roomFor(count)?.[0])),
        )}
      >
        <span className={cn("text-sm", state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground", state === "error" && "text-danger")}>
          {title}
        </span>{" "}
        {(description || optional) && (
          <span className="text-xs text-muted-foreground">{description ?? (typeof optional === "string" ? optional : l.optional)}</span>
        )}
      </span>
    </>
  )
  const status = disabled ? l.unavailable : l[state]
  return (
    <li
      data-slot="stepper-item"
      data-state={state}
      // The step you are on stays the current step even when it has an error.
      aria-current={step === value ? "step" : undefined}
      // A list item takes no aria-disabled (ARIA 1.2); "unavailable" is said in the step's own words below.
      data-disabled={disabled || undefined}
      className={cn("relative flex min-w-0 flex-col", !vertical && "flex-1 items-center", className)}
      {...props}
    >
      {/* Connector to the next step: solid once this step is done. Horizontal: from this dot's centre to the next one's
          (every step is the same width), kept clear of both dots. */}
      {!last && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bg-border transition-colors duration-(--motion-base) ease-(--ease-standard)",
            state === "done" && "bg-foreground",
            vertical
              ? size === "sm"
                ? "top-8 bottom-1 left-3 w-px"
                : "top-10 bottom-1 left-4 w-px"
              : size === "sm"
                ? "top-3 -right-1/2 left-1/2 mx-4 h-px"
                : "top-4 -right-1/2 left-1/2 mx-6 h-px",
          )}
        />
      )}
      <div className={cn("flex", !vertical && "w-full justify-center")}>
        {canJump ? (
          <button data-slot="stepper-step"
            type="button"
            onClick={() => onValueChange?.(step)}
            className={cn(
              // At least a finger's height, whatever the size and orientation.
              "flex min-h-(--h-md) min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "press hover:opacity-80",
              vertical ? "items-start gap-3 text-left" : "max-w-full flex-col items-center gap-2",
            )}
          >
            {label}
            <span className="sr-only"> {status}</span>
          </button>
        ) : (
          <div className={cn("flex min-w-0", vertical ? "items-start gap-3" : "max-w-full flex-col items-center gap-2")}>
            {label}
            <span className="sr-only"> {status}</span>
          </div>
        )}
      </div>
      {vertical && children && (
        <div className="flex gap-3">
          <span aria-hidden="true" className={cn("shrink-0", size === "sm" ? "w-6" : "w-8")} />
          <div className="min-w-0 flex-1 pt-3 pb-6">
            <StepContent show={state === "current" || state === "error"}>{children}</StepContent>
          </div>
        </div>
      )}
      {vertical && !children && !last && <div className="h-6" />}
    </li>
  )
}

function StepIndicator({ state, step, size, disabled }: { state: StepState; step: number; size: "md" | "sm"; disabled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 grid shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums ring-1 ring-inset",
        "transition-colors duration-(--motion-base) ease-(--ease-standard) [&_svg]:size-4",
        size === "sm" ? "size-6" : "size-8",
        state === "done" && "bg-card text-foreground ring-foreground",
        state === "current" && "bg-primary text-primary-foreground ring-primary",
        state === "upcoming" && "bg-card text-muted-foreground ring-border",
        // Not reachable yet: a muted disc instead of a faded one, so the title and the reason stay readable.
        disabled && "bg-muted text-muted-foreground ring-transparent",
        state === "error" && "bg-danger-subtle text-danger ring-danger",
      )}
    >
      {state === "done" ? <Check /> : state === "error" ? <X /> : step}
    </span>
  )
}

/** A thin bar of the steps for small screens: "Step 2 of 5" and the current title. */
export function StepperCompact({
  value,
  total,
  title,
  labels,
  className,
}: {
  value: number
  total: number
  title?: React.ReactNode
  /** The words it says (`position`, `progress`), to translate them. */
  labels?: Partial<StepperLabels>
  className?: string
}) {
  const l = { ...defaultStepperLabels, ...labels }
  const pct = Math.min(100, Math.max(0, (Math.min(value, total) / total) * 100))
  return (
    <div data-slot="stepper-compact" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{l.position(Math.min(value, total), total)}</span>
      </div>
      <div
        role="progressbar"
        aria-label={l.progress}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={Math.min(value, total)}
        className="h-1 overflow-hidden rounded-full bg-track"
      >
        <div className="h-full rounded-full bg-foreground transition-[width] duration-(--motion-base) ease-(--ease-standard)" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// A vertical step's content: shown while the step is current (or failed), arriving and leaving with the step.
function StepContent({ show, children }: { show: boolean; children: React.ReactNode }) {
  const { mounted, leaving, done } = usePresence(show)
  if (!mounted) return null
  return (
    <div
      onAnimationEnd={(e) => e.target === e.currentTarget && done()}
      inert={leaving || undefined}
      className={leaving ? "animate-disappear" : "animate-appear"}
    >
      {children}
    </div>
  )
}
