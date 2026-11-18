import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SearchField } from "@/registry/syncrobotic/ui/search-field"

const meta: Meta = { title: "Inputs/Search field" }
export default meta
type S = StoryObj

function Demo({ live }: { live?: boolean }) {
  const [last, setLast] = React.useState("")
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SearchField live={live} label="Search the data" placeholder="Search classes, tasks, datasets" onNavigate={(url, mode) => setLast(`${mode} ${url}`)} />
      <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
        {last || (live ? "On the results page it applies as you type." : "Press / anywhere, type, then Enter.")}
      </p>
    </div>
  )
}

export const SearchFieldInTopBar: S = { render: () => <Demo /> }
export const SearchFieldOnResultsPage: S = { render: () => <Demo live /> }
