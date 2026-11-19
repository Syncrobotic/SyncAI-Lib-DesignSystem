import type { Preview } from "@storybook/react"
import * as React from "react"
import "../styles/storybook.css"

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Appearance",
      toolbar: { icon: "contrast", items: [{ value: "light", title: "Light" }, { value: "dark", title: "Dark" }] },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, ctx) => {
      const dark = ctx.globals.theme !== "light"
      React.useEffect(() => {
        document.documentElement.classList.toggle("dark", dark)
      }, [dark])
      // Phone width, so components are judged at the size they ship at.
      return (
        <div className="min-h-screen bg-background p-4 font-sans text-foreground">
          <div className="mx-auto w-[390px]">
            <Story />
          </div>
        </div>
      )
    },
  ],
  parameters: { layout: "fullscreen", controls: { expanded: true } },
}
export default preview
