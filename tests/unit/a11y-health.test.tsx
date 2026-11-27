import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"
import { Alarm, AlarmList, type AlarmData } from "@/registry/syncrobotic/ui/alarm"
import { createSortedRowModel, tableFeatures, useTable } from "@tanstack/react-table"
import { DataGrid, DataGridColumnHeader, DataGridTable, dataGridFeatures, type DataGridColumnDef } from "@/registry/syncrobotic/ui/data-grid"
import { Table, TableBody, TableCaption, TableCell, TableRow } from "@/registry/syncrobotic/ui/table"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/registry/syncrobotic/ui/command"
import { SignIn } from "@/registry/syncrobotic/blocks/sign-in"
import { AuthInvite } from "@/registry/syncrobotic/blocks/auth-invite"
import { AuthTwoFactor } from "@/registry/syncrobotic/blocks/auth-2fa"
import { AuthPasskey } from "@/registry/syncrobotic/blocks/auth-passkey"
import { AppShell, SidebarUserMenu, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { TopBarShell } from "@/registry/syncrobotic/blocks/top-bar-shell"
import { ActionRailShell } from "@/registry/syncrobotic/blocks/action-rail-shell"
import { FleetTable } from "@/registry/syncrobotic/blocks/fleet-table"
import { SidebarProvider } from "@/registry/syncrobotic/ui/sidebar"
import { DropdownMenu } from "@/registry/syncrobotic/ui/dropdown-menu"

// Fake timers, Date included (vitest.config.ts lists what is faked), so a timer and the clock beside it agree.
beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("StopButton and SlideToRelease hand focus to each other", () => {
  function Slot() {
    const [stopped, setStopped] = React.useState(false)
    const t = React.useRef<ReturnType<typeof setTimeout>>(undefined)
    React.useEffect(() => () => clearTimeout(t.current), [])
    return (
      <div>
        {stopped ? (
          <SlideToRelease onRelease={() => (t.current = setTimeout(() => setStopped(false), 500))} />
        ) : (
          <StopButton onStop={() => (t.current = setTimeout(() => setStopped(true), 800))} />
        )}
      </div>
    )
  }

  it("moves focus to the release slider, says Stopped as an alert, and returns focus to the stop after release", () => {
    render(
      <>
        <button type="button">elsewhere</button>
        <Slot />
      </>,
    )
    const stop = screen.getByRole("button", { name: "Emergency stop" })
    stop.focus()
    fireEvent.pointerDown(stop, { pointerId: 1 })
    fireEvent.pointerUp(stop, { pointerId: 1 })
    act(() => vi.advanceTimersByTime(800))
    const slider = screen.getByRole("slider")
    expect(document.activeElement).toBe(slider)
    expect(screen.getByRole("alert").textContent).toBe("Stopped")

    // Hold Enter for 2 s to release; the app swaps back after 500 ms.
    fireEvent.keyDown(slider, { key: "Enter" })
    act(() => vi.advanceTimersByTime(2100))
    fireEvent.keyUp(slider, { key: "Enter" })
    act(() => vi.advanceTimersByTime(500))
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Emergency stop" }))
  })

  it("leaves focus alone when the stop did not have it", () => {
    render(
      <>
        <button type="button">elsewhere</button>
        <Slot />
      </>,
    )
    const other = screen.getByRole("button", { name: "elsewhere" })
    fireEvent.click(screen.getByRole("button", { name: "Emergency stop" }), { detail: 0 })
    other.focus()
    act(() => vi.advanceTimersByTime(800))
    expect(document.activeElement).toBe(other)
    expect(screen.queryByRole("alert")).toBeNull()
  })
})

describe("AlarmList acknowledge", () => {
  const alarm = (id: string, title: string): AlarmData => ({ id, priority: "high", title, active: true, acknowledged: false })

  it("says what was acknowledged and how many are left, and moves focus to the next alarm", () => {
    function List() {
      const [alarms, setAlarms] = React.useState([alarm("a", "Lidar fault"), alarm("b", "Battery low"), alarm("c", "Arm torque")])
      return (
        <AlarmList feedback={false} alarms={alarms} onAcknowledge={(id) => setAlarms((all) => all.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))} />
      )
    }
    render(<List />)
    const first = screen.getAllByRole("button", { name: /^Acknowledge: / })[0]
    first.focus()
    fireEvent.click(first)
    const status = document.querySelector("[data-slot=alarm-list] [role=status]")
    expect(status?.textContent).toMatch(/^Acknowledged: [A-Za-z ]+\. 2 unacknowledged\.$/)
    expect(document.activeElement?.getAttribute("data-slot")).toBe("alarm-acknowledge")
  })
})

const tick = (ms = 10) =>
  act(async () => {
    vi.advanceTimersByTime(ms)
  })

describe("names without stray punctuation", () => {
  it("names the stop with its tag in one string, with no screen-reader-only separator", () => {
    render(<StopButton tag="All robots" onStop={() => {}} />)
    const stop = screen.getByRole("button", { name: "Emergency stop All robots" })
    expect(stop.getAttribute("aria-label")).toBe("Emergency stop All robots")
    expect(stop.querySelector(".sr-only")).toBeNull()
  })

  it("names an alarm and its buttons in one string each", () => {
    render(<Alarm priority="high" title="Lidar fault" active acknowledged={false} onAcknowledge={() => {}} onShelve={() => {}} />)
    expect(screen.getByRole("button", { name: "Acknowledge: Lidar fault" }).getAttribute("aria-label")).toBe("Acknowledge: Lidar fault")
    expect(screen.getByRole("button", { name: "Shelve: Lidar fault" }).getAttribute("aria-label")).toBe("Shelve: Lidar fault")
    expect(screen.getByRole("article").textContent).not.toContain("High: High")
    expect([...document.querySelectorAll(".sr-only")].map((n) => n.textContent)).toContain("High: ")
  })

  it("reads a low battery in the fleet's phone rows as one string", () => {
    render(<FleetTable />)
    expect(screen.getAllByText("14 %, low").length).toBeGreaterThan(0)
  })

  it("names the account button by the person, without the avatar's initials", () => {
    render(
      <SidebarProvider>
        <DropdownMenu>
          <SidebarUserMenu user={sampleUser} />
        </DropdownMenu>
      </SidebarProvider>,
    )
    expect(screen.getByRole("button", { name: "Mei Lin mei.lin@example.com, account menu" })).toBeTruthy()
  })
})

describe("DataGrid headers and sorting", () => {
  type Robot = { id: string; name: string }
  const features = tableFeatures({ ...dataGridFeatures, sortedRowModel: createSortedRowModel() })
  const columns: DataGridColumnDef<Robot, typeof features>[] = [
    { accessorKey: "name", header: ({ column }) => <DataGridColumnHeader column={column} title="Robot" />, size: 200, meta: { label: "Robot" } },
  ]
  function Grid() {
    const table = useTable({ features, data: [{ id: "b", name: "B" }, { id: "a", name: "A" }], columns, getRowId: (r) => r.id, enableColumnResizing: true })
    return (
      <DataGrid table={table}>
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  }

  it("names a column header by its title, not by its resize handle too", () => {
    render(<Grid />)
    expect(screen.getByRole("columnheader", { name: "Robot" })).toBeTruthy()
    expect(screen.getByRole("separator", { name: "Resize Robot" })).toBeTruthy()
  })

  it("says politely when the order changes, and nothing for the order it opens in", async () => {
    render(<Grid />)
    const status = document.querySelector("[data-slot=data-grid-status]")!
    expect(status.getAttribute("aria-live")).toBe("polite")
    expect(status.textContent).toBe("")
    fireEvent.pointerDown(screen.getByRole("button", { name: "Robot" }), { button: 0, pointerType: "mouse" })
    await tick()
    fireEvent.click(screen.getByRole("menuitem", { name: "Descending" }))
    await tick()
    expect(status.textContent).toBe("Sorted by Robot, descending")
  })
})

describe("Table's scrolling region", () => {
  it("is a named region: its label, else its caption, else the fallback word", () => {
    const body = (
      <TableBody>
        <TableRow>
          <TableCell>7F3A</TableCell>
        </TableRow>
      </TableBody>
    )
    const { rerender } = render(<Table label="Robots">{body}</Table>)
    expect(screen.getByRole("region", { name: "Robots" }).getAttribute("tabindex")).toBe("0")
    rerender(
      <Table>
        <TableCaption>Fleet at North gate</TableCaption>
        {body}
      </Table>,
    )
    expect(screen.getByRole("region", { name: "Fleet at North gate" })).toBeTruthy()
    rerender(<Table>{body}</Table>)
    expect(screen.getByRole("region", { name: "Table" })).toBeTruthy()
  })
})

describe("Command", () => {
  const list = (items: string[]) => (
    <CommandList>
      <CommandEmpty>Nothing</CommandEmpty>
      <CommandGroup heading="Robots">
        {items.map((i) => (
          <CommandItem key={i} value={i}>
            {i}
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  )

  it("names its text box Search by default, or after its label", () => {
    const { rerender } = render(
      <Command>
        <CommandInput placeholder="Find" />
        {list(["7F3A"])}
      </Command>,
    )
    expect(screen.getByRole("combobox", { name: "Search" })).toBeTruthy()
    rerender(
      <Command label="Find a robot">
        <CommandInput placeholder="Find" />
        {list(["7F3A"])}
      </Command>,
    )
    expect(screen.getByRole("combobox", { name: "Find a robot" })).toBeTruthy()
  })

  it("names the palette's text box after the palette", () => {
    render(
      <CommandDialog open title="Search the docs">
        <CommandInput placeholder="Find" />
        {list(["7F3A"])}
      </CommandDialog>,
    )
    expect(screen.getByRole("combobox", { name: "Search the docs" })).toBeTruthy()
  })

  it("keeps the first result as the active descendant, also after the results change", async () => {
    function Searched() {
      const [q, setQ] = React.useState("")
      const all = ["alpha", "beta", "gamma", "alps"]
      // The site search's shape: it filters itself and regroups what it finds.
      return (
        <Command shouldFilter={false}>
          <CommandInput value={q} onValueChange={setQ} placeholder="Find" />
          <CommandList>
            <CommandEmpty>Nothing</CommandEmpty>
            <CommandGroup key={q ? "found" : "all"} heading="Robots">
              {all
                .filter((a) => a.includes(q))
                .map((a) => (
                  <CommandItem key={a} value={a}>
                    {a}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      )
    }
    render(<Searched />)
    const input = screen.getByRole("combobox")
    const active = () => document.getElementById(input.getAttribute("aria-activedescendant") ?? "")?.textContent
    await tick()
    expect(active()).toBe("alpha")
    fireEvent.change(input, { target: { value: "zzz" } })
    await tick()
    expect(input.getAttribute("aria-activedescendant")).toBeNull()
    fireEvent.change(input, { target: { value: "g" } })
    await tick()
    expect(active()).toBe("gamma")
  })

  it("says how many results there are, or that nothing matches, once typing pauses", async () => {
    render(
      <Command>
        <CommandInput placeholder="Find" />
        {list(["Patrol 7F3A", "Patrol 2B10", "Dock A"])}
      </Command>,
    )
    const status = () => document.querySelector("[data-slot=command-status]")!
    expect(status().getAttribute("role")).toBe("status")
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "patrol" } })
    await tick(100)
    expect(status().textContent).toBe("")
    await tick(500)
    expect(status().textContent).toBe("2 results")
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } })
    await tick(600)
    expect(status().textContent).toBe("Nothing matches")
  })
})

describe("sign-in and auth blocks keep focus", () => {
  it("SignIn: focuses the email field on an invalid submit, and the filled status on success", async () => {
    render(<SignIn />)
    const status = screen.getByRole("status")
    expect(status.textContent).toBe("")
    fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }))
    await tick(0)
    const email = screen.getByRole("textbox", { name: "Work email" })
    expect(document.activeElement).toBe(email)
    expect(email.getAttribute("aria-invalid")).toBe("true")
    fireEvent.change(email, { target: { value: "mei@example.com" } })
    fireEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }))
    await tick(600)
    // The same element, mounted from the start, now says it.
    expect(screen.getByRole("status")).toBe(status)
    expect(status.textContent).toContain("Check your inbox")
    expect(document.activeElement).toBe(status)
    fireEvent.click(screen.getByRole("button", { name: "Use another email" }))
    await tick(0)
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Work email" }))
  })

  it("AuthInvite: focuses the name field on an invalid submit, and the status once accepted", async () => {
    render(<AuthInvite />)
    const status = screen.getByRole("status")
    fireEvent.click(screen.getByRole("button", { name: "Accept and join" }))
    await tick(0)
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Your name" }))
    fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), { target: { value: "Chen Wei" } })
    fireEvent.click(screen.getByRole("button", { name: "Accept and join" }))
    await tick(600)
    expect(status.textContent).toContain("You have joined")
    expect(document.activeElement).toBe(status)
  })

  it("AuthTwoFactor: focuses the code field on a short code, and the status once verified", async () => {
    render(<AuthTwoFactor defaultMethod="recovery" passkey={false} />)
    const status = screen.getByRole("status")
    const field = screen.getByRole("textbox", { name: "Recovery code" })
    field.blur()
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }))
    await tick(0)
    expect(document.activeElement).toBe(field)
    expect(field.getAttribute("aria-invalid")).toBe("true")
    fireEvent.change(field, { target: { value: "7KQ2-MV9T" } })
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }))
    await tick(600)
    expect(status.textContent).toContain("Verified")
    expect(document.activeElement).toBe(status)
  })

  it("AuthPasskey: focuses the code field on a short code", async () => {
    render(<AuthPasskey />)
    fireEvent.click(screen.getByRole("button", { name: "Use a code from an authenticator app" }))
    fireEvent.click(screen.getByRole("button", { name: "Sign in with code" }))
    await tick(0)
    const invalid = document.querySelector("input[aria-invalid=true]")
    expect(invalid).not.toBeNull()
    expect(document.activeElement).toBe(invalid)
  })
})

describe("shell skip links", () => {
  const first = () => document.querySelector<HTMLElement>("a, button, input, [tabindex]:not([tabindex='-1'])")

  it("AppShell: the first Tab stop skips to main", () => {
    render(
      <AppShell product="Fleet console" nav={sampleNav} title="Overview">
        page
      </AppShell>,
    )
    const skip = screen.getByRole("link", { name: "Skip to content" })
    expect(first()).toBe(skip)
    fireEvent.click(skip)
    expect(document.activeElement).toBe(screen.getByRole("main"))
  })

  it("TopBarShell: the first Tab stop skips to main", () => {
    render(
      <TopBarShell product="Fleet portal" links={[{ label: "Robots", href: "#robots" }]}>
        page
      </TopBarShell>,
    )
    const skip = screen.getByRole("link", { name: "Skip to content" })
    expect(first()).toBe(skip)
    fireEvent.click(skip)
    expect(document.activeElement).toBe(screen.getByRole("main"))
  })

  it("ActionRailShell: the first Tab stop skips to main", () => {
    render(
      <ActionRailShell title="Review" onBack={() => {}} step={{ title: "Review labels" }} primary={{ label: "Start" }}>
        page
      </ActionRailShell>,
    )
    const skip = screen.getByRole("link", { name: "Skip to content" })
    expect(first()).toBe(skip)
    fireEvent.click(skip)
    expect(document.activeElement).toBe(screen.getByRole("main"))
  })
})
