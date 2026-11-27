// @syncrobotic/use-step-up v0.55.0 · update: npx shadcn add @syncrobotic/use-step-up --overwrite
"use client"

import * as React from "react"

/** The codes that ask for a fresh check before the action may run. */
export const defaultStepUpCodes = ["ELEVATED_SESSION_REQUIRED", "TWO_FACTOR_SETUP_REQUIRED"] as const
/** Of those, the ones that cannot be passed until a second factor is set up. */
export const defaultStepUpSetupCodes = ["TWO_FACTOR_SETUP_REQUIRED"] as const

/** What the person types to prove it is them. */
export type StepUpProof = { method: "totp" | "password"; value: string }

/**
 * The error's machine code: `code` on the error, or `error.code` in the API's envelope (also on an error's `body` or
 * `details`). Never read from the message.
 */
export function errorCodeOf(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined
  const e = error as Record<string, unknown>
  for (const holder of [e, e.error, e.body, e.details, e.data]) {
    if (!holder || typeof holder !== "object") continue
    const h = holder as Record<string, unknown>
    if (typeof h.code === "string") return h.code
    const inner = h.error as Record<string, unknown> | undefined
    if (inner && typeof inner === "object" && typeof inner.code === "string") return inner.code
  }
  return undefined
}

/** Rejected from `run` when the person cancels the check: the action never ran. */
export class StepUpCancelledError extends Error {
  readonly code = "STEP_UP_CANCELLED"
  constructor() {
    super("Step-up cancelled")
    this.name = "StepUpCancelledError"
  }
}

export const isStepUpCancelled = (error: unknown): error is StepUpCancelledError => error instanceof StepUpCancelledError

type Pending = { action: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: unknown) => void }

/**
 * Runs a sensitive action and, when the server answers with a step-up code, holds it, opens the step-up dialog, and
 * replays it once the person is verified. Cancel rejects with StepUpCancelledError. Spread `dialog` into StepUpDialog.
 */
export function useStepUp({
  verify,
  codes = defaultStepUpCodes,
  setupCodes = defaultStepUpSetupCodes,
}: {
  /** Checks the proof with your auth server (password or TOTP); rejects with an error whose code picks the message. */
  verify: (proof: StepUpProof) => Promise<void>
  codes?: readonly string[]
  setupCodes?: readonly string[]
}) {
  const [code, setCode] = React.useState<string | null>(null)
  const pending = React.useRef<Pending | null>(null)

  const settle = (fn: (p: Pending) => void) => {
    const p = pending.current
    pending.current = null
    setCode(null)
    if (p) fn(p)
  }

  const run = <T>(action: () => Promise<T>): Promise<T> =>
    Promise.resolve().then(action).catch((error: unknown) => {
      const c = errorCodeOf(error)
      if (!c || !codes.includes(c)) throw error
      // One check at a time: a second action asking for it replaces the first, which is cancelled.
      pending.current?.reject(new StepUpCancelledError())
      return new Promise<T>((resolve, reject) => {
        pending.current = { action, resolve: resolve as (v: unknown) => void, reject }
        setCode(c)
      })
    })

  const onVerified = () =>
    settle((p) => {
      // Replayed once: should it ask again, that error goes to the caller rather than round in a loop.
      p.action().then(p.resolve, p.reject)
    })
  const onCancel = () => settle((p) => p.reject(new StepUpCancelledError()))

  return {
    run,
    /** The code that opened the check, or null while closed. */
    code,
    /** Spread into StepUpDialog. */
    dialog: {
      open: code !== null,
      setup: code !== null && setupCodes.includes(code),
      verify,
      onVerified,
      onCancel,
    },
  }
}
