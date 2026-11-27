import * as React from "react"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AllOrSomeField } from "@/registry/syncrobotic/ui/all-or-some-field"
import { ProjectSwitcher, type SwitcherProject } from "@/registry/syncrobotic/ui/project-switcher"
import { QuotaField, formatQuota } from "@/registry/syncrobotic/ui/quota-field"
import { ScopePicker, boundScopes, groupScopes, type ScopeOption } from "@/registry/syncrobotic/ui/scope-picker"

afterEach(cleanup)

const scopes: ScopeOption[] = [
  { value: "devices:read", label: "Read devices" },
  { value: "devices:write", label: "Change devices" },
  { value: "members:write", label: "Manage people" },
]

function Scopes(props: Partial<React.ComponentProps<typeof ScopePicker>> & { onChange?: (v: string[] | null) => void }) {
  const [value, setValue] = React.useState<string[] | null>((props.value as string[] | null | undefined) ?? [])
  return (
    <ScopePicker
      legend="Scopes"
      scopes={scopes}
      {...props}
      value={value}
      onValueChange={(v) => {
        setValue(v)
        props.onChange?.(v)
      }}
    />
  )
}

describe("ScopePicker", () => {
  it("lists an out-of-bound scope disabled, with the reason, and never ticks it", () => {
    const onChange = vi.fn()
    render(<Scopes allowedScopes={["devices:read", "devices:write"]} onChange={onChange} />)
    const above = screen.getByRole("checkbox", { name: /Manage people/ })
    expect(above.hasAttribute("disabled")).toBe(true)
    expect(screen.getByText("Not in your own permissions, so you cannot grant it.")).toBeTruthy()
    fireEvent.click(above)
    expect(onChange).not.toHaveBeenCalled()
  })

  it("groups by resource, and a group's box takes only what the viewer may grant", () => {
    expect(groupScopes(scopes).map((g) => g.resource)).toEqual(["devices", "members"])
    const onChange = vi.fn()
    render(<Scopes allowedScopes={["devices:read"]} onChange={onChange} />)
    fireEvent.click(screen.getByRole("checkbox", { name: "Every devices scope" }))
    expect(onChange).toHaveBeenLastCalledWith(["devices:read"])
  })

  it("keeps all-including-future apart from every box ticked, and offers it only to a viewer who holds every scope", () => {
    const onChange = vi.fn()
    render(<Scopes allowAll onChange={onChange} />)
    for (const s of scopes) fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(s.label!) }))
    expect(onChange).toHaveBeenLastCalledWith(["devices:read", "devices:write", "members:write"])
    fireEvent.click(screen.getByRole("radio", { name: /All scopes, including ones added later/ }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    cleanup()
    render(<Scopes allowAll allowedScopes={["devices:read"]} />)
    expect(screen.getByRole("radio", { name: /All scopes/ }).hasAttribute("disabled")).toBe(true)
  })

  it("boundScopes drops what the viewer may not grant; all stays all only when nothing is out of bounds", () => {
    expect(boundScopes(["devices:read", "members:write"], scopes, ["devices:read"])).toEqual(["devices:read"])
    expect(boundScopes(null, scopes)).toBeNull()
    expect(boundScopes(null, scopes, ["devices:read"])).toEqual(["devices:read"])
  })
})

function Quota({ initial, onChange, used }: { initial: number | null; onChange?: (v: number | null) => void; used?: number }) {
  const [value, setValue] = React.useState(initial)
  return (
    <QuotaField
      legend="Device seats"
      value={value}
      used={used}
      onValueChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
    />
  )
}

describe("QuotaField", () => {
  it("null is Unlimited, with no number to misread", () => {
    render(<Quota initial={null} used={3} />)
    expect(screen.getByRole("switch", { name: /Unlimited/ }).getAttribute("aria-checked")).toBe("true")
    expect(screen.queryByRole("spinbutton")).toBeNull()
    expect(screen.getByText("3 in use, no limit")).toBeTruthy()
  })

  it("0 is a limit of none, never unlimited", () => {
    render(<Quota initial={0} />)
    expect(screen.getByRole("switch", { name: /Unlimited/ }).getAttribute("aria-checked")).toBe("false")
    expect((screen.getByRole("spinbutton", { name: "Device seats: Limit" }) as HTMLInputElement).value).toBe("0")
    expect(screen.getByText("0: nothing new can be added.")).toBeTruthy()
    expect(formatQuota(0)).toBe("0")
    expect(formatQuota(null)).toBe("Unlimited")
  })

  it("the switch sends null, and turning it off brings back the last number, not 0", () => {
    const onChange = vi.fn()
    render(<Quota initial={12} onChange={onChange} />)
    const sw = screen.getByRole("switch", { name: /Unlimited/ })
    fireEvent.click(sw)
    expect(onChange).toHaveBeenLastCalledWith(null)
    fireEvent.click(sw)
    expect(onChange).toHaveBeenLastCalledWith(12)
  })

  it("a limit below what is in use warns that nothing is removed", () => {
    render(<Quota initial={5} used={7} />)
    expect(screen.getByText("7 in use, above the limit of 5. Nothing is removed; the next one is refused.")).toBeTruthy()
  })
})

describe("AllOrSomeField", () => {
  const options = [{ value: "vision" }, { value: "speech" }]
  function Modules({ initial, onChange }: { initial: string[] | null; onChange: (v: string[] | null) => void }) {
    const [value, setValue] = React.useState(initial)
    return (
      <AllOrSomeField
        legend="Modules"
        options={options}
        value={value}
        onValueChange={(v) => {
          setValue(v)
          onChange(v)
        }}
      />
    )
  }

  it("ticking every box is a list, never all-including-future", () => {
    const onChange = vi.fn()
    render(<Modules initial={[]} onChange={onChange} />)
    expect(screen.getByText("None picked: nothing is included.")).toBeTruthy()
    fireEvent.click(screen.getByRole("checkbox", { name: "vision" }))
    fireEvent.click(screen.getByRole("checkbox", { name: "speech" }))
    expect(onChange).toHaveBeenLastCalledWith(["vision", "speech"])
  })

  it("all is null, and the checklist survives a trip there and back", () => {
    const onChange = vi.fn()
    render(<Modules initial={["speech"]} onChange={onChange} />)
    fireEvent.click(screen.getByRole("radio", { name: /All, including future ones/ }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByRole("checkbox")).toBeNull()
    fireEvent.click(screen.getByRole("radio", { name: /Only these/ }))
    expect(onChange).toHaveBeenLastCalledWith(["speech"])
  })
})

describe("ProjectSwitcher", () => {
  const projects: SwitcherProject[] = [
    { id: "a", name: "Taipei DC" },
    { id: "b", name: "Hsinchu lab" },
    { id: "c", name: "Kaohsiung port" },
  ]

  it("names the current project, lists recent first, and switches through the callback", () => {
    const onSelect = vi.fn()
    render(<ProjectSwitcher projects={projects} current={projects[0]} recent={[projects[2]!]} onSelect={onSelect} onCreate={() => {}} />)
    const trigger = screen.getByRole("button", { name: "Taipei DC Project" })
    fireEvent.click(trigger)
    const list = screen.getByRole("listbox")
    const groups = within(list).getAllByRole("group")
    expect(within(groups[0]!).getByText("Kaohsiung port")).toBeTruthy()
    expect(within(list).getByText("New project")).toBeTruthy()
    fireEvent.click(within(list).getByText("Hsinchu lab"))
    expect(onSelect).toHaveBeenCalledWith(projects[1])
  })

  it("with a server search, shows the projects as given and sends the text out", () => {
    const onSearchChange = vi.fn()
    render(<ProjectSwitcher projects={[projects[1]!]} current={projects[0]} onSelect={() => {}} search="zz" onSearchChange={onSearchChange} />)
    fireEvent.click(screen.getByRole("button", { name: /Taipei DC/ }))
    // "zz" matches nothing locally; the server said Hsinchu lab, so it stays.
    expect(screen.getByText("Hsinchu lab")).toBeTruthy()
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "hsin" } })
    expect(onSearchChange).toHaveBeenCalledWith("hsin")
  })
})
