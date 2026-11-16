import type { Preview } from "@storybook/react"
import * as React from "react"
import "../styles/storybook.css"

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "外觀",
      toolbar: { icon: "contrast", items: [{ value: "dark", title: "深色" }, { value: "light", title: "淺色" }] },
    },
  },
  initialGlobals: { theme: "dark" },
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
