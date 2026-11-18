// @syncrobotic/stop-button v0.11.1 · update: npx shadcn add @syncrobotic/stop-button --overwrite
"use client"

import * as React from "react"
import { CircleAlert, Bluetooth, ChevronsUp, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLongPress } from "@/registry/syncrobotic/hooks/use-long-press"
import { feedback, type FeedbackName } from "@/registry/syncrobotic/lib/feedback"

export type StopButtonState =
  | "ready" //         standing, may move: one touch stops
  | "idle" //          standing but not moving: same height, pale
  | "sending" //       touch registered, waiting for the dog (≤ 1.5 s)
  | "unconfirmed" //   no reply within 1.5 s: press again (goes over Bluetooth too)
  | "bluetooth" //     Wi-Fi lost, Bluetooth only
  | "bluetooth-sent" //sent over Bluetooth; Bluetooth cannot confirm, so it says "delivered"
  | "dead" //          neither link works

const icons: Record<StopButtonState, React.ElementType> = {
  ready: Square,
  idle: Square,
  sending: Square,
  unconfirmed: CircleAlert,
  bluetooth: Bluetooth,
  "bluetooth-sent": Bluetooth,
  dead: Square,
}

/** Every string the button shows. Pass `labels` to localise. */
export type StopButtonLabels = Record<StopButtonState, string> & { holdAll: string }

export const defaultStopButtonLabels: StopButtonLabels = {
  ready: "Emergency stop",
  idle: "Stop",
  sending: "Sending…",
  unconfirmed: "Not confirmed, press again",
  bluetooth: "Emergency stop",
  "bluetooth-sent": "Delivered over Bluetooth",
  dead: "No connection",
  holdAll: "Keep holding to stop all",
}

type Props = {
  state?: StopButtonState
  /** Name tag on the right when there is more than one dog, e.g. "7F3A". */
  tag?: string
  /** Called on pointer down. Send the stop immediately; do not wait for an animation. */
  onStop: () => void
  /** Called after holding for `holdAllMs`. Omit to disable stop-all (single dog). */
  onStopAll?: () => void
  holdAllMs?: number
  labels?: Partial<StopButtonLabels>
  className?: string
}

/**
 * The app's soft e-stop. It is a remote stop, not the certified e-stop: the dog has a physical one.
 * This component is UI only — sending, waiting for the reply and falling back to Bluetooth belong
 * to the app layer, which passes the resulting `state` back in.
 */
export function StopButton({ state = "ready", tag, onStop, onStopAll, holdAllMs = 2000, labels, className }: Props) {
  const l = { ...defaultStopButtonLabels, ...labels }
  // The hand feels each step of a stop: sent at the touch, then confirmed, unconfirmed or delivered over Bluetooth.
  // When the app swaps the button for SlideToRelease on confirmation (the dock's flow), this button is gone before it
  // could say so: the app calls feedback("stopConfirmed") at that moment.
  const last = React.useRef(state)
  React.useEffect(() => {
    const was = last.current
    last.current = state
    if (was !== "sending" || state === "sending") return
    const next: Partial<Record<StopButtonState, FeedbackName>> = { idle: "stopConfirmed", unconfirmed: "stopUnconfirmed", "bluetooth-sent": "stopSent" }
    const name = next[state]
    if (name) feedback(name)
  }, [state])
  const { progress, holding, handlers } = useLongPress({
    onPress: () => {
      feedback("stopSent")
      onStop()
    },
    onLongPress: () => onStopAll?.(),
    duration: holdAllMs,
  })
  const holdingAll = Boolean(onStopAll) && holding
  const text = holdingAll ? l.holdAll : l[state]
  const Icon = holdingAll ? Square : icons[state]
  const pale = state === "idle"
  const disabled = state === "dead"

  return (
    <button
      type="button"
      disabled={disabled}
      {...(disabled ? {} : handlers)}
      className={cn(
        "relative flex h-(--h-stop) w-full touch-none select-none items-center justify-center gap-2 overflow-hidden rounded-md",
        "press",
        pale ? "bg-danger-subtle text-danger" : "bg-stop text-white",
        state === "bluetooth-sent" && "bg-stop-deep",
        disabled && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {holdingAll && (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-white/20" style={{ width: `${progress * 100}%` }} />
      )}
      <Icon aria-hidden="true" className="relative size-5" strokeWidth={2} />
      <span className="relative text-lg font-bold">{text}</span>
      {tag && !disabled && <span className="sr-only">, </span>}
      {tag && !disabled && (
        <span className={cn("relative inline-flex h-(--h-tag) items-center rounded-xs px-2 text-xs font-medium", pale ? "ring-1 ring-danger ring-inset" : "bg-stop-deep")}>
          {tag}
        </span>
      )}
    </button>
  )
}

/** Shown when the dog is lying down (charging or resting): the motors hold no force, so there is no stop. */
export function WakeButton({
  onWake,
  disabled,
  label = "Wake and stand up",
  reason = "Battery low. Charge to 25% to stand up",
}: {
  onWake: () => void
  disabled?: boolean
  label?: string
  /** Shown under the label while disabled. */
  reason?: string
}) {
  return (
    <button
      type="button"
      onClick={onWake}
      disabled={disabled}
      className={cn(
        "press flex h-(--h-stop) w-full flex-col items-center justify-center rounded-md",
        disabled ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
      )}
    >
      <span className="inline-flex items-center gap-2 text-lg font-bold">
        <ChevronsUp aria-hidden="true" className="size-5" strokeWidth={2} />
        {label}
      </span>
      {disabled && <span className="text-xs">{reason}</span>}
    </button>
  )
}
