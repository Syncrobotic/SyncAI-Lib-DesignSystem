import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { allOrSomeFieldLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { AllOrSomeField, type AllOrSomeOption } from "@/registry/syncrobotic/ui/all-or-some-field"

const meta: Meta = { title: "Inputs/All or some field" }
export default meta
type S = StoryObj

const modules: AllOrSomeOption[] = [
  { value: "vision", label: "Vision" },
  { value: "speech", label: "Speech" },
  { value: "search", label: "Search" },
  { value: "agents", label: "Agents" },
]

function Modules({ initial, ...props }: { initial: string[] | null } & Partial<React.ComponentProps<typeof AllOrSomeField>>) {
  const [value, setValue] = React.useState(initial)
  return (
    <div className="w-full max-w-sm">
      <AllOrSomeField legend="Licensed modules" options={modules} {...props} value={value} onValueChange={setValue} />
    </div>
  )
}

/** Only these: a fixed list that a module shipped later does not join. */
export const AllOrSomeFieldSome: S = { render: () => <Modules initial={["vision", "search"]} /> }

/** All, including future ones: `null`, not every box ticked. */
export const AllOrSomeFieldAll: S = { render: () => <Modules initial={null} /> }

/** None is legal and says what it means. */
export const AllOrSomeFieldNone: S = { render: () => <Modules initial={[]} /> }

/** Bounded by a limit above: "all" and an option disabled, each with the reason. */
export const AllOrSomeFieldBounded: S = {
  render: () => (
    <Modules
      initial={["vision"]}
      allDisabledReason="This project is licensed for some modules only, so a licence cannot cover future ones."
      options={modules.map((m) => (m.value === "agents" ? { ...m, disabled: true, reason: "This project is not licensed for it." } : m))}
    />
  ),
}

/** Traditional Chinese labels. */
export const AllOrSomeFieldZhTw: S = { render: () => <Modules initial={["vision"]} legend="授權模組" labels={allOrSomeFieldLabels} /> }
