"use client"

import * as React from "react"
import { AlertCircle, Bluetooth, ChevronsUp, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLongPress } from "@/registry/syncrobotic/hooks/use-long-press"

export type StopButtonState =
  | "ready" //         standing, may move: one touch stops
  | "idle" //          standing but not moving: same height, pale
  | "sending" //       touch registered, waiting for the dog (≤ 1.5 s)
  | "unconfirmed" //   no reply within 1.5 s: press again (goes over Bluetooth too)
  | "bluetooth" //     Wi-Fi lost, Bluetooth only
  | "bluetooth-sent" //sent over Bluetooth; Bluetooth cannot confirm, so it says "delivered"
  | "dead" //          neither link works

const copy: Record<StopButtonState, { text: string; icon: React.ElementType }> = {
  ready: { text: "緊急停止", icon: Square },
  idle: { text: "停止", icon: Square },
  sending: { text: "送出中…", icon: Square },
  unconfirmed: { text: "未確認，再按一次", icon: AlertCircle },
  bluetooth: { text: "緊急停止", icon: Bluetooth },
  "bluetooth-sent": { text: "已經由藍牙送達", icon: Bluetooth },
  dead: { text: "無法連線", icon: Square },
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
  className?: string
}

/**
 * The app's soft e-stop. It is a remote stop, not the certified e-stop: the dog has a physical one.
 * This component is UI only — sending, waiting for the reply and falling back to Bluetooth belong
 * to the app layer, which passes the resulting `state` back in.
 */
export function StopButton({ state = "ready", tag, onStop, onStopAll, holdAllMs = 2000, className }: Props) {
  const { progress, holding, handlers } = useLongPress({
    onPress: onStop,
    onLongPress: () => onStopAll?.(),
    duration: holdAllMs,
  })
  const holdingAll = Boolean(onStopAll) && holding
  const { text, icon: Icon } = holdingAll ? { text: "繼續按住，停止全部", icon: Square } : copy[state]
  const pale = state === "idle"
  const disabled = state === "dead"

  return (
    <button
      type="button"
      aria-label={tag ? `${text}，${tag}` : text}
      disabled={disabled}
      {...(disabled ? {} : onStopAll ? handlers : { onPointerDown: () => onStop() })}
      className={cn(
        "relative flex h-(--h-stop) w-full touch-none select-none items-center justify-center gap-2 overflow-hidden rounded-md",
        "transition-colors duration-(--motion-fast)",
        pale ? "bg-danger-subtle text-danger" : "bg-stop text-white",
        state === "bluetooth-sent" && "bg-stop-deep",
        disabled && "bg-disabled text-white",
        className,
      )}
    >
      {holdingAll && (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-white/20" style={{ width: `${progress * 100}%` }} />
      )}
      <Icon aria-hidden="true" className="relative size-5" strokeWidth={2} />
      <span className="relative text-lg font-bold">{text}</span>
      {tag && !disabled && (
        <span className={cn("relative inline-flex h-(--h-tag) items-center rounded-xs px-2 text-xs font-medium", pale ? "bg-danger/15" : "bg-white/20")}>
          {tag}
        </span>
      )}
    </button>
  )
}

/** Shown when the dog is lying down (charging or resting): the motors hold no force, so there is no stop. */
export function WakeButton({ onWake, disabled, reason = "電量不足，充到 25% 才能站起來" }: { onWake: () => void; disabled?: boolean; reason?: string }) {
  return (
    <button
      type="button"
      onClick={onWake}
      disabled={disabled}
      className={cn(
        "flex h-(--h-stop) w-full flex-col items-center justify-center rounded-md",
        disabled ? "bg-muted text-disabled" : "bg-primary text-primary-foreground",
      )}
    >
      <span className="inline-flex items-center gap-2 text-lg font-bold">
        <ChevronsUp aria-hidden="true" className="size-5" strokeWidth={2} />
        喚醒並站起來
      </span>
      {disabled && <span className="text-xs">{reason}</span>}
    </button>
  )
}
