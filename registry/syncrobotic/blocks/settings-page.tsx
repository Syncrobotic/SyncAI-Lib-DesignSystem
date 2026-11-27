// @syncrobotic/settings-page v0.53.0 · update: npx shadcn add @syncrobotic/settings-page --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { ChoiceField } from "@/registry/syncrobotic/ui/choice-field"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { Scrollspy } from "@/registry/syncrobotic/ui/scrollspy"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

export type SettingsValues = { name: string; timeZone: string }

/** A switch that applies at once. */
export type SettingsSwitch = { id: string; label: string; hint?: string; checked: boolean }

export type SettingsPageLabels = {
  sectionsNav: string
  general: string
  generalBody: string
  name: string
  nameHint: string
  nameShort: string
  timeZone: string
  notifications: string
  notificationsBody: string
  /** The toast after a switch applies. */
  switched: (label: string, on: boolean) => string
  danger: string
  dangerBody: string
  deleteTitle: string
  deleteBody: string
  deleteButton: string
  confirmTitle: (name: string) => string
  confirmBody: string
  keep: string
  confirm: string
  unsaved: string
  discard: string
  save: string
  saved: string
  /** Why fields are read-only, or Delete disabled: the permission and who grants it. */
  readOnly: string
  deleteDenied: string
  failed: string
  errors: Record<string, string>
  data?: Partial<DataStateLabels>
}

export const defaultSettingsPageLabels: SettingsPageLabels = {
  sectionsNav: "Settings sections",
  general: "General",
  generalBody: "How this site is named and which clock its schedules use.",
  name: "Site name",
  nameHint: "Shown on the island and in reports.",
  nameShort: "At least 2 characters",
  timeZone: "Time zone",
  notifications: "Notifications",
  notificationsBody: "Changes here apply at once.",
  switched: (label, on) => `${label} ${on ? "on" : "off"}`,
  danger: "Danger zone",
  dangerBody: "Cannot be undone.",
  deleteTitle: "Delete this site",
  deleteBody: "Removes its maps, routes and recordings.",
  deleteButton: "Delete site",
  confirmTitle: (name) => `Delete ${name}?`,
  confirmBody: "Its routes, maps and recordings are deleted. Robots stay in the fleet.",
  keep: "Keep site",
  confirm: "Delete site and recordings",
  unsaved: "Unsaved changes",
  discard: "Discard",
  save: "Save changes",
  saved: "Settings saved",
  readOnly: "Changing them needs the project:write permission. A project admin can grant it.",
  deleteDenied: "You need the project:delete permission. The project owner can grant it.",
  failed: "That did not save. Nothing was changed; try again.",
  errors: {},
}

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-6 gap-4 md:grid-cols-[14rem_1fr]">
      <SectionHeader id={`${id}-title`} title={title} description={description} className="self-start" />
      <div className="flex flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">{children}</div>
    </section>
  )
}

export type SettingsPageContentProps = {
  /** What the server holds; the fields start from it and the save bar compares against it. */
  values: SettingsValues
  timeZones: readonly { value: string; label: string }[]
  onSave: (values: SettingsValues) => Promise<void>
  switches?: readonly SettingsSwitch[]
  onSwitchChange?: (id: string, on: boolean) => Promise<void>
  /** Shows the danger zone. Sensitive: wrap it in your step-up; a cancelled check changes nothing. */
  onDelete?: () => Promise<void>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string; delete?: string }
  /** What scrolls (the section links follow it); default the nearest `<main>`. */
  scrollRoot?: React.RefObject<HTMLElement | null>
  labels?: Partial<SettingsPageLabels>
}

/**
 * The settings page from your values: fields collect into a save bar, switches apply through `onSwitchChange`, the
 * danger zone calls `onDelete`. A viewer without the write permission reads the values; Delete says what it needs.
 */
export function SettingsPageContent({
  values,
  timeZones,
  onSave,
  switches = [],
  onSwitchChange,
  onDelete,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  scrollRoot,
  labels,
}: SettingsPageContentProps) {
  const l = { ...defaultSettingsPageLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "project:write") : true
  const mayDelete = can ? can(permissions?.delete ?? "project:delete") : true
  const [name, setName] = React.useState(values.name)
  const [timeZone, setTimeZone] = React.useState(values.timeZone)
  // New values from the server (after a save, or a refetch) replace the fields, during the render that brings them.
  const [seen, setSeen] = React.useState(values)
  if (seen.name !== values.name || seen.timeZone !== values.timeZone) {
    setSeen(values)
    setName(values.name)
    setTimeZone(values.timeZone)
  }
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const dirty = mayWrite && (name !== values.name || timeZone !== values.timeZone)
  // The save bar leaves the way it came (disappear), after Save or Discard.
  const saveBar = usePresence(dirty)
  const nameField = React.useRef<HTMLInputElement>(null)
  // The shell's content is what scrolls; the section links follow it. Found from the page's own element when it mounts.
  const own = React.useRef<HTMLElement | null>(null)
  const say = (e: unknown) => (isStepUpCancelled(e) ? null : (l.errors[errorCodeOf(e) ?? ""] ?? l.failed))

  const sections = [
    { id: "general", label: l.general },
    ...(switches.length ? [{ id: "notifications", label: l.notifications }] : []),
    ...(onDelete ? [{ id: "danger", label: l.danger }] : []),
  ]

  const save = async () => {
    if (name.trim().length < 2) {
      setFieldError(l.nameShort)
      // A failed save takes you to the first field to fix, as a form's submit does, and its error is read with it.
      nameField.current?.focus()
      return
    }
    setFieldError(null)
    setSaveError(null)
    setSaving(true)
    try {
      await onSave({ name: name.trim(), timeZone })
      toast({ tone: "success", title: l.saved })
    } catch (e) {
      setSaveError(say(e))
    } finally {
      setSaving(false)
    }
  }

  const flip = async (s: SettingsSwitch, on: boolean) => {
    if (!onSwitchChange) return
    try {
      await onSwitchChange(s.id, on)
      // Switches apply at once (the Switch rule); say so, there is no save for them.
      toast({ tone: "success", title: l.switched(s.label, on) })
    } catch (e) {
      const said = say(e)
      if (said) toast({ tone: "danger", title: said })
    }
  }

  return (
    <>
      <div
        ref={(el) => {
          own.current = el?.closest("main") ?? null
        }}
        className="flex max-w-4xl flex-col gap-8"
      >
        {/* Where you are on the page: the section being read is marked (aria-current), so the links never pass for tabs
            with none chosen. */}
        <Scrollspy items={sections} root={scrollRoot ?? own} offset={48} title={l.sectionsNav} variant="pills" />

        <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data} className="gap-8">
          <Section id="general" title={l.general} description={l.generalBody}>
            <PermissionGate allowed={mayWrite} mode="read-only" reason={l.readOnly}>
              <div className="flex flex-col gap-4">
                <Field label={l.name} error={fieldError ?? undefined} hint={l.nameHint}>
                  <Input ref={nameField} value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label={l.timeZone}>
                  <Select value={timeZone} onValueChange={setTimeZone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeZones.map((z) => (
                        <SelectItem key={z.value} value={z.value}>
                          {z.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </PermissionGate>
          </Section>

          {switches.length > 0 && (
            <Section id="notifications" title={l.notifications} description={l.notificationsBody}>
              <PermissionGate allowed={mayWrite} mode="read-only" reason={l.readOnly}>
                <div className="flex flex-col gap-4">
                  {switches.map((s) => (
                    <ChoiceField
                      key={s.id}
                      label={s.label}
                      description={s.hint}
                      controlAt="end"
                      control={<Switch checked={s.checked} onCheckedChange={(on) => void flip(s, on)} />}
                    />
                  ))}
                </div>
              </PermissionGate>
            </Section>
          )}

          {onDelete && (
            <Section id="danger" title={l.danger} description={l.dangerBody}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{l.deleteTitle}</span>
                  <span className="text-xs text-muted-foreground">{l.deleteBody}</span>
                </div>
                <AlertDialog>
                  <PermissionGate allowed={mayDelete} mode="disabled" reason={l.deleteDenied}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">{l.deleteButton}</Button>
                    </AlertDialogTrigger>
                  </PermissionGate>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{l.confirmTitle(values.name)}</AlertDialogTitle>
                      <AlertDialogDescription>{l.confirmBody}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{l.keep}</AlertDialogCancel>
                      <AlertDialogAction
                        destructive
                        onClick={() =>
                          void onDelete().catch((e: unknown) => {
                            const said = say(e)
                            if (said) toast({ tone: "danger", title: said })
                          })
                        }
                      >
                        {l.confirm}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Section>
          )}
        </DataState>
      </div>

      {/* The save bar sticks to the bottom of the scrolling page, wherever the sidebar is. */}
      {saveBar.mounted && (
        <div
          role="region"
          aria-label={l.unsaved}
          aria-hidden={saveBar.leaving || undefined}
          onAnimationEnd={(e) => e.target === e.currentTarget && saveBar.done()}
          className={cn(
            "sticky bottom-0 -mx-6 -mb-6 mt-8 border-t border-edge bg-float shadow-float backdrop-blur-xl",
            saveBar.leaving ? "animate-disappear" : "animate-appear",
          )}
        >
          <div className="flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <span className="text-sm">{l.unsaved}</span>
            {saveError && (
              <span role="alert" className="text-sm text-danger">
                {saveError}
              </span>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setName(values.name)
                  setTimeZone(values.timeZone)
                  setFieldError(null)
                  setSaveError(null)
                }}
              >
                {l.discard}
              </Button>
              <Button loading={saving} onClick={() => void save()}>
                {l.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const sampleTimeZones = [
  { value: "Asia/Taipei", label: "Taipei (UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
]

/**
 * Settings in sections beside their explanation: switches apply at once, text fields collect into a save bar that
 * appears only when something changed, and a danger zone names the consequence. This is SettingsPageContent on sample
 * values, in a sample shell.
 */
export function SettingsPage() {
  const [values, setValues] = React.useState<SettingsValues>({ name: "North site", timeZone: "Asia/Taipei" })
  const [switches, setSwitches] = React.useState<SettingsSwitch[]>([
    { id: "n-critical", label: "Critical alarms by SMS", hint: "Every critical alarm, day and night.", checked: true },
    { id: "n-daily", label: "Daily summary email", hint: "Patrols, events and battery health at 08:00.", checked: false },
  ])
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#settings" title="Settings" user={sampleUser}>
      <SettingsPageContent
        values={values}
        timeZones={sampleTimeZones}
        onSave={async (v) => setValues(v)}
        switches={switches}
        onSwitchChange={async (id, on) => setSwitches((all) => all.map((s) => (s.id === id ? { ...s, checked: on } : s)))}
        onDelete={async () => {}}
        labels={{ deleteBody: "Removes its maps, routes and 14 days of recordings.", confirmBody: "Its 12 routes, 3 maps and 14 days of recordings are deleted. Robots stay in the fleet." }}
      />
      <Toaster />
    </AppShell>
  )
}
