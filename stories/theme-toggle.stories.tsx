import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
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

/** One button that opens the three choices, for a top bar or a phone. Its icon is the choice. */
export const ThemeToggleMenu: S = {
  render: () => {
    function T() {
      const [v, setV] = React.useState<ThemeChoice>("system")
      return <ThemeToggle variant="menu" value={v} onValueChange={setV} />
    }
    return <T />
  },
}
