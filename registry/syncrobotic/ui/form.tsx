// @syncrobotic/form v0.20.0 · update: npx shadcn add @syncrobotic/form --overwrite
"use client"

import * as React from "react"
import {
  FormProvider,
  useController,
  useFormContext,
  useFormState,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type SubmitHandler,
  type UseControllerProps,
  type UseFormReturn,
} from "react-hook-form"
import { CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Button, type ButtonProps } from "@/registry/syncrobotic/ui/button"
import { FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Field } from "@/registry/syncrobotic/ui/field"

/**
 * A form run by React Hook Form, drawn with the kit's Field. Validation waits for the first submit, then follows each
 * change (React Hook Form's defaults: mode "onSubmit", reValidateMode "onChange"), so nobody is told off while typing a
 * first answer. A submit with errors moves focus to the first field in error, in the order of the page, whatever the
 * control (a Select's trigger, a group's first choice). The browser's own bubbles are off (noValidate): errors are the
 * kit's, under each field, in words with an icon.
 *
 *   const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues })
 *   <Form form={form} onSubmit={save}>
 *     <FormField name="name" label="Mission name" render={({ field }) => <Input {...field} />} />
 *     <FormSubmit>Create mission</FormSubmit>
 *   </Form>
 */
export function Form<T extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
  ...props
}: {
  /** What useForm returned. */
  form: UseFormReturn<T>
  /** Called with valid values. Await the save: the submit button shows its spinner until it settles. */
  onSubmit: SubmitHandler<T>
} & Omit<React.ComponentProps<"form">, "onSubmit">) {
  const ref = React.useRef<HTMLFormElement>(null)
  // After a failed submit, focus the first field in error on the page. Done from the DOM, because a control without a
  // focusable ref of its own (a Select, a group) would otherwise be skipped. Each field learns of its error in a render
  // of its own, after this callback, so it looks again on the next frames until the first error is drawn.
  const focusFirstError = React.useCallback(() => {
    let frames = 0
    const look = () => {
      const first = ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      if (!first) {
        if (++frames < 10) requestAnimationFrame(look)
        return
      }
      // A group (fieldset) or a wrapper is not focusable itself: its first enabled control is.
      const focusable = "input:not(:disabled), button:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex='0']"
      const target = first.matches(focusable) ? first : first.querySelector<HTMLElement>(focusable)
      target?.focus()
    }
    requestAnimationFrame(look)
  }, [])
  return (
    <FormProvider {...form}>
      <form
        ref={ref}
        data-slot="form"
        noValidate
        onSubmit={form.handleSubmit(onSubmit, focusFirstError)}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  )
}

type RenderProps<T extends FieldValues, N extends FieldPath<T>> = { field: ControllerRenderProps<T, N>; fieldState: ControllerFieldState }

/**
 * One field: Field's label, hint and error, with the value kept by React Hook Form. `render` gets `field` (value,
 * onChange, onBlur, name, ref) to spread on the control, or to map: `checked={field.value} onCheckedChange={field.onChange}`
 * for a checkbox or switch, `value` / `onValueChange` for a Select. The error comes from the field's state; Field wires
 * aria-invalid and aria-describedby onto the control.
 */
export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  name,
  label,
  hint,
  className,
  render,
  ...controller
}: {
  name: N
  label: React.ReactNode
  /** One line under the control; an error takes its place while there is one. */
  hint?: React.ReactNode
  className?: string
  render: (props: RenderProps<T, N>) => React.ReactElement
} & Omit<UseControllerProps<T, N>, "name" | "control">) {
  const { control } = useFormContext<T>()
  const { field, fieldState } = useController<T, N>({ name, control, ...controller })
  return (
    <Field label={label} hint={hint} error={fieldState.error?.message} className={className}>
      {render({ field, fieldState })}
    </Field>
  )
}

/**
 * A question answered with a group of choices (radios, checkboxes, switches): FieldSet's legend, hint and error, with
 * the value kept by React Hook Form. Put ChoiceFields inside, wired from `field`.
 */
export function FormFieldSet<T extends FieldValues, N extends FieldPath<T>>({
  name,
  legend,
  hint,
  className,
  render,
  ...controller
}: {
  name: N
  legend: React.ReactNode
  hint?: React.ReactNode
  className?: string
  render: (props: RenderProps<T, N>) => React.ReactNode
} & Omit<UseControllerProps<T, N>, "name" | "control">) {
  const { control } = useFormContext<T>()
  const { field, fieldState } = useController<T, N>({ name, control, ...controller })
  return (
    <FieldSet legend={legend} hint={hint} error={fieldState.error?.message} className={className}>
      {render({ field, fieldState })}
    </FieldSet>
  )
}

/**
 * What went wrong with the whole form, not one field: a save the server refused, a lost connection. Set it with
 * `form.setError("root.server", { message })`; it shows at the top of the form, read out as an alert. An error that
 * belongs to one field (a name already taken) goes on that field instead: `form.setError("name", { message })`.
 */
export function FormMessage({ className }: { className?: string }) {
  const { errors } = useFormState()
  const root = errors.root as Record<string, { message?: string }> | undefined
  const messages = root ? Object.values(root).flatMap((e) => (e && typeof e === "object" && e.message ? [e.message] : [])) : []
  if (!messages.length) return null
  return (
    <Alert tone="danger" data-slot="form-message" className={className}>
      <CircleAlert aria-hidden="true" />
      <AlertTitle className="flex flex-col gap-1">
        {messages.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </AlertTitle>
    </Alert>
  )
}

/**
 * The form's submit button. Name the result ("Create mission"), not the mechanism ("Submit"). It shows its spinner
 * while onSubmit is awaited, and blocks a second press without looking disabled.
 */
export function FormSubmit({ children, loading, ...props }: Omit<ButtonProps, "type">) {
  const { isSubmitting } = useFormState()
  return (
    <Button {...props} type="submit" data-slot="form-submit" loading={isSubmitting || loading}>
      {children}
    </Button>
  )
}
