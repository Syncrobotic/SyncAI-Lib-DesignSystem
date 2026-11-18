import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { FilterForm, type Navigate } from "@/registry/syncrobotic/ui/filter-form"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { Label } from "@/registry/syncrobotic/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"

const meta: Meta = { title: "Inputs/Filter form" }
export default meta
type S = StoryObj

// The examples log where the form would go instead of leaving the page.
function Demo({ children }: { children: (go: Navigate) => React.ReactNode }) {
  const [last, setLast] = React.useState<string>("")
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {children((url, mode) => setLast(`${mode} ${url}`))}
      <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
        {last || "Change a filter: the URL it leads to appears here."}
      </p>
    </div>
  )
}

export const FilterFormSearch: S = {
  render: () => (
    <Demo>
      {(go) => (
        <FilterForm action="/catalog" onNavigate={go}>
          <Field label="Search the catalog" hint="Applies a moment after you stop typing.">
            <Input name="q" type="search" placeholder="forklift, pallet, night…" />
          </Field>
        </FilterForm>
      )}
    </Demo>
  ),
}

export const FilterFormFacets: S = {
  render: () => (
    <Demo>
      {(go) => (
        <FilterForm action="/catalog" onNavigate={go} className="flex flex-wrap items-end gap-4">
          <Field label="Tier" className="w-48">
            {/* No choice is an empty field, so "any" never reaches the URL. */}
            <Select name="tier">
              <SelectTrigger>
                <SelectValue placeholder="Any tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="T0">Commercial</SelectItem>
                <SelectItem value="T1">Non-commercial</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex min-h-(--h-md) items-center gap-3">
            <Checkbox id="ff-ready" name="ready" value="1" />
            <Label htmlFor="ff-ready">Ready to release only</Label>
          </div>
          <input type="hidden" name="page" value="3" />
        </FilterForm>
      )}
    </Demo>
  ),
}
