import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ThemeToggle, type ThemeChoice } from "@/registry/syncrobotic/ui/theme-toggle"

const meta: Meta = { title: "Actions/Theme toggle" }
export default meta
type S = StoryObj

export const ThemeToggleBasic: S = {
  render: () => {
    function T() {
      const [v, setV] = React.useState<ThemeChoice>("system")
      return <ThemeToggle value={v} onValueChange={setV} />
    }
    return <T />
  },
}

/** Before the stored choice is known (first render on the server): nothing is selected, nothing jumps later. */
export const ThemeToggleUnknown: S = { render: () => <ThemeToggle value={undefined} onValueChange={() => {}} /> }

export const ThemeToggleLocalised: S = {
  render: () => {
    function T() {
      const [v, setV] = React.useState<ThemeChoice>("dark")
      return <ThemeToggle value={v} onValueChange={setV} label="主題" labels={{ light: "淺色", system: "跟隨系統", dark: "深色" }} />
    }
    return <T />
  },
}
