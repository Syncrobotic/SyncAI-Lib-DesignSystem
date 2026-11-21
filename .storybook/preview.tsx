import type { Preview } from "@storybook/react-vite"
import * as React from "react"
import "../styles/storybook.css"

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Appearance",
      toolbar: { icon: "contrast", items: [{ value: "light", title: "Light" }, { value: "dark", title: "Dark" }] },
    },
    contrast: {
      description: "Contrast",
      toolbar: { icon: "eye", items: [{ value: "default", title: "Default contrast" }, { value: "more", title: "High contrast" }] },
    },
  },
  initialGlobals: { theme: "light", contrast: "default" },
  decorators: [
    (Story, ctx) => {
      const dark = ctx.globals.theme !== "light"
      const more = ctx.globals.contrast === "more"
      React.useEffect(() => {
        document.documentElement.classList.toggle("dark", dark)
        if (more) document.documentElement.dataset.contrast = "more"
        else delete document.documentElement.dataset.contrast
      }, [dark, more])
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
