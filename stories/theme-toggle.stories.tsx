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

/** Labels in the reader's language: each icon's tooltip and spoken name, and here the choice written beside it. */
export const ThemeToggleLocalised: S = {
  render: () => {
    function T() {
      const [v, setV] = React.useState<ThemeChoice>("dark")
      const labels = { light: "淺色", system: "跟隨系統", dark: "深色" }
      return (
        <div lang="zh-Hant" className="flex w-fit items-center gap-3">
          <ThemeToggle value={v} onValueChange={setV} label="主題" labels={labels} />
          <span className="text-sm text-muted-foreground">主題：{labels[v]}</span>
        </div>
      )
    }
    return <T />
  },
}
