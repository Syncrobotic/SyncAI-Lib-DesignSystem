// @syncrobotic/attachment v0.53.0 · update: npx shadcn add @syncrobotic/attachment --overwrite
"use client"

import * as React from "react"
import { CircleAlert, Download, RotateCw, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileTypeIcon } from "@/registry/syncrobotic/ui/file-type"
import { formatBytes } from "@/registry/syncrobotic/ui/file-upload"
import { Progress } from "@/registry/syncrobotic/ui/progress"

export type AttachmentStatus = "idle" | "uploading" | "done" | "error"

export type AttachmentLabels = {
  /** Under the name when the upload failed and no `error` says why. */
  uploadFailed: string
  /** The image variant's caption in the same case. */
  failed: string
  /** The progress bar's name: "Uploading report.pdf". */
  uploading: (name: string) => string
  /** How far the upload is: "40 %". */
  percent: (n: number) => string
  /** The action buttons' names, each with the file's name. */
  retry: (name: string) => string
  download: (name: string) => string
  cancel: (name: string) => string
  remove: (name: string) => string
}

export const defaultAttachmentLabels: AttachmentLabels = {
  uploadFailed: "Upload failed",
  failed: "Failed",
  uploading: (name) => `Uploading ${name}`,
  percent: (n) => `${n} %`,
  retry: (name) => `Retry ${name}`,
  download: (name) => `Download ${name}`,
  cancel: (name) => `Cancel ${name}`,
  remove: (name) => `Remove ${name}`,
}

/**
 * One file in a list, a composer or a queue: type, name, size, progress, error with Retry, Download and Remove. `chip`
 * is the compact form for a message composer; `image` shows a preview.
 */
export function Attachment({
  name,
  size,
  status = "done",
  progress,
  error,
  previewUrl,
  variant = "row",
  onRemove,
  onRetry,
  onDownload,
  leaving,
  onLeft,
  labels,
  className: classNameProp,
}: {
  name: string
  /** Bytes. */
  size?: number
  status?: AttachmentStatus
  /** 0–100 while uploading. */
  progress?: number
  error?: string
  previewUrl?: string
  variant?: "row" | "chip" | "image"
  onRemove?: () => void
  onRetry?: () => void
  onDownload?: () => void
  /** Removed from the list: plays the exit, then calls onLeft. Pair with usePresenceList. */
  leaving?: boolean
  onLeft?: () => void
  /** The words it says, to translate them. */
  labels?: Partial<AttachmentLabels>
  className?: string
}) {
  const l = { ...defaultAttachmentLabels, ...labels }
  // Every attachment arrives and leaves: appear on mount, disappear when `leaving`.
  const className = cn(leaving ? "animate-disappear" : "animate-appear", classNameProp)
  const onAnimationEnd = (e: React.AnimationEvent) => {
    if (leaving && e.target === e.currentTarget) onLeft?.()
  }
  const meta =
    status === "uploading"
      ? `${l.percent(progress ?? 0)} · ${size ? formatBytes(size) : ""}`
      : status === "error"
        ? (error ?? l.uploadFailed)
        : size
          ? formatBytes(size)
          : ""
  const actions = (
    <>
      {status === "error" && onRetry && <IconAction label={l.retry(name)} onClick={onRetry} icon={RotateCw} />}
      {status === "done" && onDownload && <IconAction label={l.download(name)} onClick={onDownload} icon={Download} />}
      {onRemove && <IconAction label={status === "uploading" ? l.cancel(name) : l.remove(name)} onClick={onRemove} icon={X} />}
    </>
  )

  if (variant === "image")
    return (
      <figure data-slot="attachment" data-status={status} onAnimationEnd={onAnimationEnd} className={cn("group relative flex w-28 flex-col gap-1", className)}>
        <div className={cn("relative aspect-square overflow-hidden rounded-sm bg-muted ring-1 ring-border", status === "error" && "ring-2 ring-danger")}>
          {previewUrl ? (
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <FileTypeIcon name={name} size="md" />
            </span>
          )}
          {status === "uploading" && (
            <span className="absolute inset-x-2 bottom-2">
              <Progress value={progress} aria-label={l.uploading(name)} className="h-1" />
            </span>
          )}
          {onRemove && (
            <span className="absolute top-1 right-1">
              <IconAction label={l.remove(name)} onClick={onRemove} icon={X} className="bg-card shadow-overlay" />
            </span>
          )}
        </div>
        <figcaption className={cn("min-w-0 truncate text-xs", status === "error" ? "text-danger" : "text-muted-foreground")}>
          {status === "error" ? (error ?? l.failed) : <FileName name={name} />}
        </figcaption>
      </figure>
    )

  if (variant === "chip")
    return (
      <span
        data-slot="attachment"
        data-status={status}
        onAnimationEnd={onAnimationEnd}
        className={cn(
          "inline-flex h-(--h-md) max-w-64 items-center gap-2 rounded-sm bg-card pr-1 pl-2 ring-1 ring-border ring-inset",
          status === "error" && "ring-danger",
          className,
        )}
      >
        <FileTypeIcon name={name} variant="icon" size="sm" />
        <span className="flex min-w-0 flex-col leading-tight">
          <FileName name={name} className="text-sm" />
          {meta && <span className={cn("truncate text-xs tabular-nums", status === "error" ? "text-danger" : "text-muted-foreground")}>{meta}</span>}
        </span>
        {actions}
      </span>
    )

  return (
    <div
      data-slot="attachment"
      data-status={status}
      onAnimationEnd={onAnimationEnd}
      className={cn(
        "flex min-h-(--h-row) items-center gap-3 rounded-sm bg-card px-3 py-2 ring-1 ring-border ring-inset",
        status === "error" && "ring-danger",
        className,
      )}
    >
      <FileTypeIcon name={name} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <FileName name={name} className="text-sm font-medium" />
        {status === "uploading" ? (
          <span className="flex items-center gap-2">
            <Progress value={progress} aria-label={l.uploading(name)} className="h-1 flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums">{l.percent(progress ?? 0)}</span>
          </span>
        ) : (
          <span className={cn("flex items-center gap-2 text-xs tabular-nums", status === "error" ? "text-danger" : "text-muted-foreground")}>
            {status === "error" && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
            {meta}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center">{actions}</div>
    </div>
  )
}

/**
 * A file name that is cut in the middle, not at the end: the extension always shows ("taipei-warehouse-…final.pdf"),
 * since it says what the file is. The whole name is in the title, for a pointer.
 */
function FileName({ name, className }: { name: string; className?: string }) {
  const dot = name.lastIndexOf(".")
  // No extension, or a name that starts with its only dot (".env"): an ordinary end cut.
  const ext = dot > 0 && name.length - dot <= 8 ? name.slice(dot) : ""
  return (
    <span title={name} className={cn("flex min-w-0", className)}>
      <span className="truncate">{ext ? name.slice(0, dot) : name}</span>
      {ext && <span className="shrink-0">{ext}</span>}
    </span>
  )
}

function IconAction({ label, onClick, icon: Icon, className }: { label: string; onClick: () => void; icon: React.ElementType; className?: string }) {
  return (
    <button data-slot="attachment-action"
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "press flex size-(--h-sm) shrink-0 items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  )
}
