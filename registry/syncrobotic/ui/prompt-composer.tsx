// @syncrobotic/prompt-composer v0.51.0 · update: npx shadcn add @syncrobotic/prompt-composer --overwrite
"use client"

import * as React from "react"
import { CircleAlert, CircleStop, Paperclip, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { Attachment, type AttachmentLabels } from "@/registry/syncrobotic/ui/attachment"
import { Button } from "@/registry/syncrobotic/ui/button"
import { type FileRejection, matchesAccept } from "@/registry/syncrobotic/ui/file-upload"

/*
  A <form> around a text box that grows up to `maxRows`. Enter sends, Shift+Enter adds a line; Enter that ends an input
  method's composition (isComposing, or keyCode 229 in Safari) only commits it. Send becomes Stop in place, so it never
  moves under a finger and keeps focus; when it cannot send it stays focusable and says why. Files go in a tray of
  Attachment chips, checked like FileUpload. No fixed positioning: to stay above the on-screen keyboard, end a 100dvh
  flex column with it (see the docs page).
*/

export type PromptComposerLabels = {
  /** The text box's name. */
  label: string
  placeholder: string
  send: string
  /** Send's name while the answer streams. */
  stop: string
  attach: string
  /** The tray's name. */
  files: string
  /** Read after the text box's name: how Enter works. */
  keyboard: string
  /** Why Send did nothing: nothing written and no file. */
  empty: string
  /** Why Send did nothing while the answer streams. */
  streaming: string
  /** Under the limit: "120 / 4,000". */
  count: (length: number, max: number, locale: string | undefined) => string
  /** Over it, with the danger glyph: "120 characters over the 4,000 limit". */
  overLimit: (over: number, max: number, locale: string | undefined) => string
  /** A refused file, by name and reason. */
  rejected: (rejection: FileRejection, locale: string | undefined) => string
  /** The chips' words (Remove report.pdf). */
  attachment?: Partial<AttachmentLabels>
}

export const defaultPromptComposerLabels: PromptComposerLabels = {
  label: "Message",
  placeholder: "Write a message",
  send: "Send",
  stop: "Stop generating",
  attach: "Attach files",
  files: "Attached files",
  keyboard: "Enter sends, Shift+Enter starts a new line",
  empty: "Write a message or attach a file to send",
  streaming: "Wait for the answer to finish, or stop it",
  count: (length, max, locale) => `${formatCount(length, { locale })} / ${formatCount(max, { locale })}`,
  overLimit: (over, max, locale) => `${formatCount(over, { locale })} ${over === 1 ? "character" : "characters"} over the ${formatCount(max, { locale })} limit`,
  rejected: ({ file, reason }) =>
    reason === "type" ? `${file.name}: not a type this accepts` : reason === "size" ? `${file.name}: too large` : `${file.name}: too many files`,
}

/** True for the key press that only ends an input method's composition: it commits characters and must not send. */
export function isComposingEnter(e: Pick<KeyboardEvent, "isComposing" | "keyCode">) {
  return e.isComposing || e.keyCode === 229
}

type Entry = { key: number; file: File }

/**
 * A message box for a model: grows with the text, Enter sends, Shift+Enter adds a line, files go in a tray, and Send
 * becomes Stop while the answer streams. Return false from `onSubmit(text, files)` to keep the draft.
 */
export function PromptComposer({
  onSubmit,
  onStop,
  streaming = false,
  disabled = false,
  disabledReason,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  allowFiles = false,
  defaultFiles,
  accept,
  maxSize,
  maxFiles,
  onFilesChange,
  onReject,
  maxLength,
  maxRows = 8,
  toolbar,
  name,
  autoFocus,
  locale,
  labels,
  className,
}: {
  /** Called with the trimmed text and the attached files. Return false to keep them in the box (it is cleared otherwise). */
  onSubmit: (text: string, files: File[]) => void | boolean
  /** Shows Stop in Send's place while `streaming`. Abort the request in it. */
  onStop?: () => void
  /** An answer is streaming: Send becomes Stop, and Enter does not send. */
  streaming?: boolean
  /** Nothing can be sent (offline, no access): say why in `disabledReason`. */
  disabled?: boolean
  /** Why it is disabled, shown under the box. */
  disabledReason?: string
  /** The text (controlled). */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Shows the attach button and takes pasted and dropped files. */
  allowFiles?: boolean
  /** Files in the tray at first: a frame the page attaches for the person. */
  defaultFiles?: File[]
  /** Same syntax as <input accept>: "image/*,.pdf". */
  accept?: string
  /** Bytes, per file. */
  maxSize?: number
  maxFiles?: number
  /** Called with the files in the tray whenever it changes. */
  onFilesChange?: (files: File[]) => void
  /** Called with the files refused, by type, size or count. They are also named under the box. */
  onReject?: (rejections: FileRejection[]) => void
  /** A limit on the text, in characters: shows the count, and Send says why it waits once it is passed. */
  maxLength?: number
  /** How many lines the box grows to before it scrolls. Default 8. */
  maxRows?: number
  /** More controls beside the attach button: a model select, a context chip. A Select here loses its ring and fill (the box is the edge). */
  toolbar?: React.ReactNode
  /** The text box's name, for the form's data. */
  name?: string
  autoFocus?: boolean
  /** Formats the counts. */
  locale?: string
  labels?: Partial<PromptComposerLabels>
  className?: string
}) {
  const l = { ...defaultPromptComposerLabels, ...labels }
  const id = React.useId()
  const area = React.useRef<HTMLTextAreaElement>(null)
  const picker = React.useRef<HTMLInputElement>(null)
  const composing = React.useRef(false)
  const nextKey = React.useRef(0)

  const [ownValue, setOwnValue] = React.useState(defaultValue)
  const value = valueProp ?? ownValue
  const setValue = (v: string) => {
    if (valueProp === undefined) setOwnValue(v)
    onValueChange?.(v)
  }
  const [entries, setEntries] = React.useState<Entry[]>(() => (defaultFiles ?? []).map((file, key) => ({ key: -1 - key, file })))
  const [rejections, setRejections] = React.useState<FileRejection[]>([])
  // Why the last press of Send (or Enter) did nothing; cleared by the next edit.
  const [refused, setRefused] = React.useState<"empty" | "streaming" | null>(null)
  const [over, setOver] = React.useState(false)

  const length = Array.from(value).length
  const tooLong = maxLength !== undefined && length > maxLength
  const empty = value.trim() === "" && entries.length === 0
  const canStop = streaming && !!onStop
  const blocked = disabled || empty || tooLong || streaming

  // ---------- Growing with the text ----------
  React.useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    const cs = window.getComputedStyle(el)
    const line = parseFloat(cs.lineHeight) || 24
    const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
    const max = line * maxRows + pad
    el.style.height = "auto"
    const full = el.scrollHeight
    el.style.height = `${Math.min(full, max)}px`
    el.style.overflowY = full > max ? "auto" : "hidden"
  }, [value, maxRows])

  // ---------- Files ----------
  const setFiles = (next: Entry[]) => {
    setEntries(next)
    onFilesChange?.(next.map((e) => e.file))
  }
  const take = (list: FileList | File[] | null) => {
    if (!list || !allowFiles || disabled) return
    const ok: Entry[] = []
    const no: FileRejection[] = []
    for (const file of Array.from(list)) {
      if (!matchesAccept(file, accept)) no.push({ file, reason: "type" })
      else if (maxSize && file.size > maxSize) no.push({ file, reason: "size" })
      else if (maxFiles && entries.length + ok.length >= maxFiles) no.push({ file, reason: "count" })
      else ok.push({ key: nextKey.current++, file })
    }
    setRejections(no)
    if (no.length) onReject?.(no)
    if (ok.length) {
      setFiles([...entries, ...ok])
      setRefused(null)
    }
  }
  const remove = (key: number) => {
    setFiles(entries.filter((e) => e.key !== key))
    // The chip's button leaves with it: focus goes back to the text, never to the page.
    area.current?.focus()
  }

  // ---------- Sending ----------
  const send = () => {
    if (disabled || tooLong) return
    if (streaming) return setRefused("streaming")
    if (empty) return setRefused("empty")
    const kept = onSubmit(value.trim(), entries.map((e) => e.file))
    if (kept === false) return
    setValue("")
    setFiles([])
    setRejections([])
    setRefused(null)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return
    // The Enter that ends a composition commits the characters; it never sends.
    if (composing.current || isComposingEnter(e.nativeEvent)) return
    e.preventDefault()
    send()
  }

  // ---------- What it says under the box ----------
  const reasonId = `${id}-reason`
  const countId = `${id}-count`
  const keysId = `${id}-keys`
  const reason = disabled ? disabledReason : refused === "streaming" && streaming ? l.streaming : refused === "empty" && empty ? l.empty : undefined
  const sendReason = disabled ? disabledReason : streaming ? l.streaming : empty ? l.empty : tooLong ? l.overLimit(length - maxLength!, maxLength!, locale) : undefined

  return (
    <form
      data-slot="prompt-composer"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
      className={cn("flex w-full min-w-0 flex-col", className)}
    >
      <div
        data-slot="prompt-composer-box"
        data-disabled={disabled || undefined}
        onDragOver={(e) => {
          if (!allowFiles || disabled || !Array.from(e.dataTransfer.types).includes("Files")) return
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!allowFiles || disabled) return
          e.preventDefault()
          setOver(false)
          take(e.dataTransfer.files)
        }}
        className={cn(
          // Concentric: 20 = the 12 px buttons and chips + 8 px in.
          "flex min-w-0 flex-col gap-2 rounded-lg bg-card p-2 ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
          "has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring",
          over && "ring-2 ring-ring",
          tooLong && "ring-2 ring-danger",
          disabled && "bg-muted ring-border",
        )}
      >
        {entries.length > 0 && (
          <ul aria-label={l.files} data-slot="prompt-composer-files" className="flex flex-wrap gap-2">
            {entries.map((e) => (
              <li key={e.key} className="flex min-w-0">
                <Attachment variant="chip" name={e.file.name} size={e.file.size} labels={l.attachment} onRemove={() => remove(e.key)} />
              </li>
            ))}
          </ul>
        )}
        {/* focus-ring: the box around the text draws the ring (has-[textarea:focus-visible]). */}
        <textarea
          ref={area}
          data-slot="prompt-composer-input"
          name={name}
          rows={1}
          value={value}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- passed through from the consumer's autoFocus prop, off by default
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={l.placeholder}
          aria-label={l.label}
          aria-invalid={tooLong || undefined}
          aria-describedby={[keysId, reason && reasonId, maxLength !== undefined && countId].filter(Boolean).join(" ")}
          enterKeyHint="send"
          onChange={(e) => {
            setValue(e.target.value)
            setRefused(null)
          }}
          onKeyDown={onKeyDown}
          onCompositionStart={() => (composing.current = true)}
          onCompositionEnd={() => (composing.current = false)}
          onPaste={(e) => {
            if (allowFiles && e.clipboardData.files.length > 0) take(e.clipboardData.files)
          }}
          className="block min-h-(--h-md) w-full resize-none bg-transparent px-2 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground"
        />
        <span id={keysId} className="sr-only">
          {l.keyboard}
        </span>
        {/* The box is the one edge: a select put in the toolbar (a model, a mode) drops its own ring and fill and reads as
            a quiet button, like Attach beside it, with the hover fill to show it can be pressed. */}
        <div
          data-slot="prompt-composer-toolbar"
          className="flex min-w-0 items-center gap-2 [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:ring-0 [&_[data-slot=select-trigger]:hover]:bg-accent"
        >
          {allowFiles && (
            <>
              <Button
                data-slot="prompt-composer-attach"
                type="button"
                variant="ghost"
                size="icon"
                aria-label={l.attach}
                disabled={disabled}
                onClick={() => picker.current?.click()}
                className="text-muted-foreground hover:text-foreground"
              >
                <Paperclip aria-hidden="true" />
              </Button>
              <input
                ref={picker}
                data-slot="prompt-composer-picker"
                type="file"
                hidden
                multiple={maxFiles !== 1}
                accept={accept}
                tabIndex={-1}
                onChange={(e) => {
                  take(e.target.files)
                  e.target.value = ""
                }}
              />
            </>
          )}
          {toolbar}
          {/* One button for Send and Stop: it keeps its place, its size and focus when the answer starts or ends. */}
          <Button
            data-slot="prompt-composer-send"
            type={canStop ? "button" : "submit"}
            size="icon"
            disabled={disabled}
            aria-label={canStop ? l.stop : l.send}
            aria-disabled={(!canStop && blocked && !disabled) || undefined}
            aria-describedby={!canStop && sendReason && !disabled ? `${id}-send-reason` : undefined}
            onClick={
              canStop
                ? (e) => {
                    e.preventDefault()
                    onStop!()
                  }
                : undefined
            }
            className="ml-auto aria-disabled:bg-muted aria-disabled:text-muted-foreground aria-disabled:hover:bg-muted"
          >
            {canStop ? <CircleStop aria-hidden="true" /> : <Send aria-hidden="true" />}
          </Button>
          {!canStop && sendReason && !disabled && (
            <span id={`${id}-send-reason`} className="sr-only">
              {sendReason}
            </span>
          )}
        </div>
      </div>

      {/* Always present, so a reason that appears is said once (role=status); it takes room only when it has words. */}
      <div
        data-slot="prompt-composer-hint"
        className={cn("flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1 px-2 text-xs", (reason || rejections.length > 0 || maxLength !== undefined) && "pt-2")}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p id={reasonId} role="status" className="text-muted-foreground">
            {reason}
          </p>
          {rejections.map((r, i) => (
            <p key={i} className="flex items-center gap-2 text-danger">
              <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
              {l.rejected(r, locale)}
            </p>
          ))}
        </div>
        {maxLength !== undefined && (
          <p id={countId} className={cn("ml-auto flex items-center gap-2 tabular-nums", tooLong ? "font-medium text-danger" : "text-muted-foreground")}>
            {tooLong && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
            {tooLong ? l.overLimit(length - maxLength, maxLength, locale) : l.count(length, maxLength, locale)}
          </p>
        )}
      </div>
    </form>
  )
}
