import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Autocomplete, type AutocompleteOption } from "@/registry/syncrobotic/ui/autocomplete"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"

const meta: Meta = { title: "Inputs/Autocomplete" }
export default meta
type S = StoryObj

const robots: AutocompleteOption[] = [
  { value: "7f3a", label: "Patrol dog 7F3A", description: "North gate", group: "Patrol dogs" },
  { value: "9c44", label: "Patrol dog 9C44", description: "Parking lot", group: "Patrol dogs" },
  { value: "1a08", label: "Patrol dog 1A08", description: "Perimeter", group: "Patrol dogs" },
  { value: "2b19", label: "Courier 2B19", description: "Hall B", group: "Couriers" },
  { value: "4d21", label: "Courier 4D21", description: "Floor 3", group: "Couriers" },
  { value: "8f15", label: "Courier 8F15", description: "Offline", group: "Couriers", disabled: true },
]
const sites = ["North gate", "Hall B", "Warehouse 3", "Parking lot", "Perimeter", "Tower A lobby", "Loading dock"].map((s) => ({ value: s, label: s }))

export const AutocompleteDefault: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>()
    return <Autocomplete options={sites} value={v} onValueChange={setV} placeholder="Search sites" aria-label="Site" />
  },
}

export const AutocompleteGroups: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>("2b19")
    return (
      <Field label="Assign to robot" hint="Offline robots cannot take tasks.">
        <Autocomplete options={robots} value={v} onValueChange={setV} placeholder="Search robots" />
      </Field>
    )
  },
}

export const AutocompleteNoTrigger: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>()
    return <Autocomplete options={sites} value={v} onValueChange={setV} showTrigger={false} placeholder="Type a site" aria-label="Site" />
  },
}

export const AutocompleteServerSearch: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>()
    const [found, setFound] = React.useState<AutocompleteOption[]>([])
    const [loading, setLoading] = React.useState(false)
    const timer = React.useRef<number | undefined>(undefined)
    return (
      <Autocomplete
        options={found}
        value={v}
        onValueChange={setV}
        filter={false}
        loading={loading}
        emptyText="Type at least 2 letters"
        placeholder="Search operators"
        aria-label="Operator"
        onQueryChange={(q) => {
          window.clearTimeout(timer.current)
          if (q.length < 2) return setFound([])
          setLoading(true)
          timer.current = window.setTimeout(() => {
            setFound(
              ["Mei Lin", "Arjun Rao", "Sara Kim", "Lin Wei", "Marco Silva"]
                .filter((n) => n.toLowerCase().includes(q.toLowerCase()))
                .map((n) => ({ value: n, label: n })),
            )
            setLoading(false)
          }, 400)
        }}
      />
    )
  },
}

export const AutocompleteSmall: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>()
    return <Autocomplete options={sites} value={v} onValueChange={setV} size="sm" placeholder="Filter by site" aria-label="Filter by site" />
  },
}

export const AutocompleteDisabled: S = {
  render: () => <Autocomplete options={sites} value="Hall B" disabled aria-label="Site" />,
}

export const AutocompleteInForm: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>()
    const [sent, setSent] = React.useState(false)
    return (
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setSent(true)
        }}
      >
        <Field label="Send robot to" error={sent && !v ? "Pick a site from the list." : undefined}>
          <Autocomplete options={sites} value={v} onValueChange={setV} placeholder="Search sites" />
        </Field>
        <Button type="submit">Send</Button>
      </form>
    )
  },
}

/** A wrong or missing pick shows its reason under the field, like any other field. */
export const AutocompleteError: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>()
    return (
      <Field label="Home dock" error="Pick a dock. The robot needs somewhere to charge.">
        <Autocomplete options={sites} value={v} onValueChange={setV} placeholder="Search docks" />
      </Field>
    )
  },
}

const many: AutocompleteOption[] = Array.from({ length: 120 }, (_, i) => {
  const id = ((i * 2654435761) >>> 0).toString(16).padStart(8, "0").slice(0, 4).toUpperCase()
  return { value: id, label: `${i % 3 ? "Courier" : "Patrol dog"} ${id}`, description: ["North gate", "Hall B", "Dock 2", "Perimeter"][i % 4] }
})

/** A hundred and twenty robots: the list scrolls and filters as you type. */
export const AutocompleteLongList: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>()
    return <Autocomplete options={many} value={v} onValueChange={setV} placeholder="Search 120 robots" aria-label="Robot" />
  },
}

/** Recent picks first, in their own group, then everything. */
export const AutocompleteRecent: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>()
    const options = [
      ...["Hall B", "North gate"].map((s) => ({ value: `r-${s}`, label: s, group: "Recent" })),
      ...sites.map((s) => ({ ...s, group: "All sites" })),
    ]
    return <Autocomplete options={options} value={v} onValueChange={setV} placeholder="Go to a site" aria-label="Site" />
  },
}

/** Required: no clear button, so it can never be left empty once picked. */
export const AutocompleteRequired: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>("Hall B")
    return (
      <Field label="Site" hint="Every robot belongs to one site.">
        <Autocomplete options={sites} value={v} onValueChange={(x) => x && setV(x)} clearable={false} />
      </Field>
    )
  },
}

/** Options with a second line: the robot and where it is now. */
export const AutocompleteDescriptions: S = {
  render: function A() {
    const [v, setV] = React.useState<string | undefined>("9c44")
    return <Autocomplete options={robots.map(({ group: _g, ...r }) => r)} value={v} onValueChange={setV} placeholder="Search robots" aria-label="Robot" />
  },
}
