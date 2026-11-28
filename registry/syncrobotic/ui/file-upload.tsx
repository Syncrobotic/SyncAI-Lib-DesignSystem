// @syncrobotic/file-upload v0.58.0 · update: npx shadcn add @syncrobotic/file-upload --overwrite
"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export type FileRejection = { file: File; reason: "type" | "size" | "count" }

/** Checks a file against an accept list ("image/*,.pgm,.bag") the way the browser's own picker does. */
export function matchesAccept(file: File, accept?: string) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  return accept.split(",").some((raw) => {
    const a = raw.trim().toLowerCase()
    if (!a) return false
    if (a.startsWith(".")) return name.endsWith(a)
    if (a.endsWith("/*")) return file.type.startsWith(a.slice(0, -1))
    return file.type === a
  })
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(1)} GB`

/**
 * A drop zone that is also a button: checks type, size and count, and says what it refused. The upload itself is yours,
 * shown with Attachment rows.
 */
export function FileUpload({
  onFiles,
  onReject,
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  disabled,
  title = "Drop files here or choose files",
  hint,
  icon: Icon = Upload,
  compact = false,
  className,
  children,
  ...rest
}: Omit<React.ComponentProps<"div">, "onDrop" | "title" | "children"> & {
  onFiles: (files: File[]) => void
  onReject?: (rejections: FileRejection[]) => void
  /** Same syntax as <input accept>: "image/*,.pgm". */
  accept?: string
  multiple?: boolean
  /** Bytes. */
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  title?: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ElementType
  /** One line, for a toolbar or a form row. */
  compact?: boolean
  className?: string
  /** Replace the default content entirely (an avatar, a cover image). */
  children?: React.ReactNode
}) {
  const input = React.useRef<HTMLInputElement>(null)
  const [over, setOver] = React.useState(false)
  const hintId = React.useId()

  const take = (list: FileList | null) => {
    if (!list || disabled) return
    const files = Array.from(list)
    const ok: File[] = []
    const rejected: FileRejection[] = []
    // One file when multiple is off: the rest are refused as "count", never dropped without a word.
    const limit = multiple ? maxFiles : 1
    for (const f of files) {
      if (!matchesAccept(f, accept)) rejected.push({ file: f, reason: "type" })
      else if (maxSize && f.size > maxSize) rejected.push({ file: f, reason: "size" })
      else if (limit && ok.length >= limit) rejected.push({ file: f, reason: "count" })
      else ok.push(f)
    }
    if (ok.length) onFiles(ok)
    if (rejected.length) onReject?.(rejected)
  }

  return (
    <div
      // Other attributes (aria-label for a zone that shows only an icon or an avatar, data-*, id) reach the zone.
      {...rest}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-describedby={hint ? hintId : undefined}
      data-slot="file-upload"
      data-over={over || undefined}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          input.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        take(e.dataTransfer.files)
      }}
      className={cn(
        "press flex cursor-pointer rounded-md border border-dashed border-input bg-card text-sm transition-colors duration-(--motion-fast) ease-(--ease-standard)",
        "hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-[over]:border-ring data-[over]:bg-accent",
        compact ? "min-h-(--h-md) items-center gap-3 px-3" : "flex-col items-center justify-center gap-3 px-6 py-8 text-center",
        disabled && "pointer-events-none bg-muted text-muted-foreground",
        className,
      )}
    >
      <input data-slot="file-upload-input"
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ""
        }}
      />
      {children ?? (
        <>
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground",
              compact ? "size-8 [&_svg]:size-4" : "size-12 [&_svg]:size-6",
            )}
          >
            <Icon aria-hidden="true" />
          </span>
          <span className={cn("flex flex-col gap-1", compact && "min-w-0")}>
            <span className="font-medium">{title}</span>
            {hint && (
              <span id={hintId} className="text-xs text-muted-foreground">
                {hint}
              </span>
            )}
          </span>
        </>
      )}
    </div>
  )
}
