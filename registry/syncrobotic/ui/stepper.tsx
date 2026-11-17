// @syncrobotic/stepper v0.9.0 · update: npx shadcn add @syncrobotic/stepper --overwrite
"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"

/**
 * Where someone is in a fixed sequence of steps (commissioning a robot, an import wizard).
 * Steps are numbered from 1. Done steps show a check, the current one is filled, an error step a cross.
 * The current step is the neutral primary, never blue: blue means a machine is working, not a person.
 */
type StepState = "done" | "current" | "upcoming" | "error"

type Ctx = {
  value: number
  orientation: "horizontal" | "vertical"
  onValueChange?: (step: number) => void
  /** Steps people may jump to by clicking. "done" lets them go back only. */
  navigable: "none" | "done" | "all"
  errors: number[]
  size: "md" | "sm"
}
const StepperCtx = React.createContext<Ctx | null>(null)
const useStepper = () => {
  const c = React.useContext(StepperCtx)
  if (!c) throw new Error("Stepper parts must be inside <Stepper>")
  return c
}
const StepCtx = React.createContext<{ step: number; state: StepState; last: boolean }>({ step: 1, state: "upcoming", last: false })

export function Stepper({
  value,
  onValueChange,
  orientation = "horizontal",
  navigable = "none",
  errors = [],
  size = "md",
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
}) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  return (
    <StepperCtx.Provider value={{ value, onValueChange, orientation, navigable, errors, size }}>
      <ol
        data-slot="stepper"
        data-orientation={orientation}
        className={cn("flex", orientation === "horizontal" ? "w-full items-start" : "flex-col", className)}
        {...props}
      >
        {items.map((child, i) => {
          const step = i + 1
          const state: StepState = errors.includes(step) ? "error" : step < value ? "done" : step === value ? "current" : "upcoming"
          return (
            <StepCtx.Provider key={child.key ?? i} value={{ step, state, last: i === items.length - 1 }}>
              {child}
            </StepCtx.Provider>
          )
        })}
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
  const { orientation, onValueChange, navigable, size, value } = useStepper()
  const { step, state, last } = React.useContext(StepCtx)
  const canJump = !disabled && !!onValueChange && state !== "current" && (navigable === "all" || (navigable === "done" && step < value))
  const vertical = orientation === "vertical"
  const label = (
    <>
      <StepIndicator state={state} step={step} size={size} />
      <span className={cn("flex min-w-0 flex-col", vertical && "pt-1")}>
        <span className={cn("text-sm", state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground", state === "error" && "text-danger")}>
          {title}
        </span>
        {(description || optional) && (
          <span className="text-xs text-muted-foreground">{description ?? (typeof optional === "string" ? optional : "Optional")}</span>
        )}
      </span>
    </>
  )
  const status = state === "done" ? "completed" : state === "error" ? "has an error" : state === "current" ? "current step" : "not started"
  return (
    <li
      data-slot="stepper-item"
      data-state={state}
      aria-current={state === "current" ? "step" : undefined}
      className={cn("relative flex min-w-0 flex-col", !vertical && "flex-1 pr-2", disabled && "opacity-50", className)}
      {...props}
    >
      {/* Connector to the next step: solid once this step is done. */}
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
                ? "top-3 right-2 left-8 h-px"
                : "top-4 right-2 left-10 h-px",
          )}
        />
      )}
      <div className="flex">
        {canJump ? (
          <button
            type="button"
            onClick={() => onValueChange?.(step)}
            className={cn(
              "flex min-w-0 rounded-sm text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "press hover:opacity-80",
              vertical ? "items-start gap-3" : "flex-col items-start gap-2",
            )}
          >
            {label}
            <span className="sr-only">, {status}</span>
          </button>
        ) : (
          <div className={cn("flex min-w-0", vertical ? "items-start gap-3" : "flex-col items-start gap-2")}>
            {label}
            <span className="sr-only">, {status}</span>
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

function StepIndicator({ state, step, size }: { state: StepState; step: number; size: "md" | "sm" }) {
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
        state === "error" && "bg-danger-subtle text-danger ring-danger",
      )}
    >
      {state === "done" ? <Check /> : state === "error" ? <X /> : step}
    </span>
  )
}

/** A thin bar of the steps for small screens: "Step 2 of 5" and the current title. */
export function StepperCompact({ value, total, title, className }: { value: number; total: number; title?: React.ReactNode; className?: string }) {
  const pct = Math.min(100, Math.max(0, (Math.min(value, total) / total) * 100))
  return (
    <div data-slot="stepper-compact" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Step {Math.min(value, total)} of {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Steps"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={Math.min(value, total)}
        className="h-1 overflow-hidden rounded-full bg-muted"
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
