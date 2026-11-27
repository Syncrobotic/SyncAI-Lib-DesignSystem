import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { scopePickerLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { ScopePicker, type ScopeOption } from "@/registry/syncrobotic/ui/scope-picker"

const meta: Meta = { title: "Inputs/Scope picker" }
export default meta
type S = StoryObj

const scopes: ScopeOption[] = [
  { value: "devices:read", label: "Read devices", description: "Each device's record and its last report." },
  { value: "devices:write", label: "Change devices", description: "Approve, rename and remove devices." },
  { value: "webhooks:read", label: "Read webhooks" },
  { value: "webhooks:write", label: "Change webhooks" },
  { value: "members:write", label: "Manage people", description: "Invite, remove and change roles." },
]
const resourceLabels = { devices: "Devices", webhooks: "Webhooks", members: "Members" }

function Picker(props: Partial<React.ComponentProps<typeof ScopePicker>>) {
  const [value, setValue] = React.useState<string[] | null>((props.value as string[] | null | undefined) ?? ["devices:read"])
  return (
    <div className="w-full max-w-md">
      <ScopePicker legend="What it may do" hint="A key never holds more than you do." scopes={scopes} resourceLabels={resourceLabels} {...props} value={value} onValueChange={setValue} />
    </div>
  )
}

/** Grouped by resource, bounded by what the viewer holds: Manage people is listed, disabled, with the reason. */
export const ScopePickerBounded: S = { render: () => <Picker allowedScopes={["devices:read", "devices:write", "webhooks:read", "webhooks:write"]} /> }

/** With `allowAll`, "all, including ones added later" is its own choice, offered only to a viewer who holds every scope. */
export const ScopePickerAllowAll: S = { render: () => <Picker allowAll value={null} /> }

/** Traditional Chinese labels. */
export const ScopePickerZhTw: S = {
  render: () => <Picker allowAll allowedScopes={["devices:read", "devices:write"]} labels={scopePickerLabels} legend="可以做的事" locale="zh-TW" />,
}
