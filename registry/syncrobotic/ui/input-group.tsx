// @syncrobotic/input-group v0.50.0 · update: npx shadcn add @syncrobotic/input-group --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * An input with things inside its edge: an icon, a unit, a clear or reveal button. A unit (InputGroupUnit) follows the
 * value it belongs to, "120 m", not the far edge of the field.
 * The group draws the field (edge, focus ring, error); the Input inside it draws nothing, so addons of any width fit
 * without guessing padding. Put the Input (or a Field's child) inside, with addons before or after it.
 */
export function InputGroup({
  className,
  children,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  onMouseDown,
  ...props
}: React.ComponentProps<"div">) {
  // A Field around the group hands it the id, description and error state; they belong to the text box inside.
  // Only the first text box gets them. The flag is a property of a local object rather than a reassigned variable, so
  // the React Compiler can see that the callback only runs during this render.
  const wiring = { given: false }
  const content = React.Children.map(children, (child) => {
    if (
      wiring.given ||
      !React.isValidElement<Record<string, unknown>>(child) ||
      typeof child.type === "string" ||
      child.type === InputGroupAddon ||
      child.type === InputGroupUnit ||
      child.type === InputGroupButton
    )
      return child
    if (!(id || describedBy || invalid)) return child
    wiring.given = true
    return React.cloneElement(child, {
      id: (child.props.id as string | undefined) ?? id,
      "aria-describedby": (child.props["aria-describedby"] as string | undefined) ?? describedBy,
      "aria-invalid": (child.props["aria-invalid"] as boolean | undefined) ?? invalid,
    })
  })
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a press on the empty field puts the caret in the input, which the keyboard reaches with Tab
    <div
      data-slot="input-group"
      className={cn(
        "flex h-(--h-md) w-full min-w-0 items-center rounded-sm bg-card ring-1 ring-input ring-inset",
        "transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
        // The focus ring belongs to the whole group, not the bare text box inside it.
        "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring",
        "has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-danger",
        // Disabled reads as a muted surface, not a faded one, so its text keeps enough contrast to be read; its edge steps back
        // to --border, so in the dark too it no longer looks like a field you can fill in.
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-muted has-[input:disabled]:text-muted-foreground has-[input:disabled]:ring-border",
        // Text sits 8 px from an addon, 12 px from a bare edge.
        "[&_[data-slot=input-group-addon]+[data-slot=input]]:pl-2 [&_[data-slot=input]:has(+[data-slot=input-group-addon])]:pr-2",
        "[&_[data-slot=input]]:h-full [&_[data-slot=input]]:rounded-none [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:ring-0 [&_[data-slot=input]]:focus-visible:outline-none",
        // A value with a unit is as wide as its text, so the unit sits right after it; the rest of the field still focuses it.
        "[&_[data-slot=input]:has(+[data-slot=input-group-unit])]:w-auto [&_[data-slot=input]:has(+[data-slot=input-group-unit])]:min-w-4 [&_[data-slot=input]:has(+[data-slot=input-group-unit])]:flex-none [&_[data-slot=input]:has(+[data-slot=input-group-unit])]:pr-0 [&_[data-slot=input]:has(+[data-slot=input-group-unit])]:[field-sizing:content]",
        "cursor-text",
        className,
      )}
      onMouseDown={(e) => {
        onMouseDown?.(e)
        // A press on the field's empty space (not on a button or the text) puts the caret in the text box.
        if (e.defaultPrevented || (e.target !== e.currentTarget && !(e.target as HTMLElement).matches("[data-slot=input-group-unit]"))) return
        const input = e.currentTarget.querySelector<HTMLInputElement>("input:not(:disabled)")
        if (!input) return
        e.preventDefault()
        input.focus()
      }}
      {...props}
    >
      {content}
    </div>
  )
}

/** A non-interactive addon: an icon or a unit. Units are text, so they read with the value ("2.0 m/s"). */
export function InputGroupAddon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-addon"
      className={cn("flex shrink-0 items-center px-3 text-sm text-muted-foreground first:pr-0 last:pl-0 [&_svg]:size-4", className)}
      {...props}
    />
  )
}

/** The unit of the value before it ("m", "%"), written right after the value and read with it. */
export function InputGroupUnit({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="input-group-unit" className={cn("flex shrink-0 items-center pr-3 pl-1 text-sm text-muted-foreground", className)} {...props} />
}

/** A button inside the edge, e.g. clear or show password. 36 px inside the 44 px field; needs an aria-label. */
export function InputGroupButton({ className, type = "button", ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="input-group-button"
      className={cn(
        "press mx-1 flex size-(--h-sm) shrink-0 items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}
