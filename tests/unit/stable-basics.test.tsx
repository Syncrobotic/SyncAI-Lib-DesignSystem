// The stable items whose behaviour no other test covers: what a product relies on when it installs them.
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cn } from "@/registry/syncrobotic/lib/utils"
import { getLastInput, trackInputModality } from "@/registry/syncrobotic/lib/input-modality"
import { InlineStatus, StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { ListGroup, ListRow } from "@/registry/syncrobotic/shell/list"
import { Toggle } from "@/registry/syncrobotic/ui/toggle"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupUnit } from "@/registry/syncrobotic/ui/input-group"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Label } from "@/registry/syncrobotic/ui/label"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup } from "@/registry/syncrobotic/ui/avatar"
import { Separator } from "@/registry/syncrobotic/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/registry/syncrobotic/ui/item"
import { ScrollArea } from "@/registry/syncrobotic/ui/scroll-area"
import { ThemeToggle } from "@/registry/syncrobotic/ui/theme-toggle"

afterEach(cleanup)

describe("cn", () => {
  it("joins conditional classes and lets the later Tailwind class win", () => {
    expect(cn("px-2", false && "hidden", ["text-sm", { "font-medium": true }])).toBe("px-2 text-sm font-medium")
    expect(cn("px-2 bg-card", "px-4")).toBe("bg-card px-4")
  })
})

describe("input-modality", () => {
  it("is pointer until a key is pressed, and follows the last input after that", () => {
    trackInputModality()
    fireEvent.pointerDown(document.body)
    expect(getLastInput()).toBe("pointer")
    fireEvent.keyDown(document.body, { key: "ArrowDown" })
    expect(getLastInput()).toBe("key")
    fireEvent.pointerDown(document.body)
    expect(getLastInput()).toBe("pointer")
  })
})

describe("StatusEyebrow and InlineStatus", () => {
  it("write the state as a word beside its glyph, offline by default", () => {
    render(
      <>
        <StatusEyebrow status="danger">Stopped</StatusEyebrow>
        <InlineStatus>Offline</InlineStatus>
      </>,
    )
    expect(screen.getByText("Stopped")).toBeTruthy()
    const inline = screen.getByText("Offline").closest("[data-slot=inline-status]")
    expect(inline).toBeTruthy()
    expect(inline?.querySelector("svg, [data-slot=status-glyph]")).toBeTruthy()
  })
})

describe("ListRow", () => {
  it("is a button only when it does something, and keeps the whole title in its name", () => {
    const onClick = vi.fn()
    render(
      <ListGroup>
        <ListRow title="Patrol dog 7F3A" meta="Dock 2" trailing="84 %" onClick={onClick} chevron />
        <ListRow title="Arm 02" />
      </ListGroup>,
    )
    const row = screen.getByRole("button", { name: /Patrol dog 7F3A/ })
    fireEvent.click(row)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByText("84 %")).toBeTruthy()
  })
})

describe("Toggle", () => {
  it("is a pressed or not pressed button", () => {
    render(<Toggle aria-label="Bold">B</Toggle>)
    const toggle = screen.getByRole("button", { name: "Bold" })
    expect(toggle.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-pressed")).toBe("true")
  })
})

describe("InputGroup", () => {
  it("hands a field's id, description and error to the text box, not to its addons", () => {
    render(
      <InputGroup id="speed" aria-describedby="speed-hint" aria-invalid>
        <InputGroupAddon>≈</InputGroupAddon>
        <Input aria-label="Speed" />
        <InputGroupUnit>m/s</InputGroupUnit>
        <InputGroupButton aria-label="Clear">×</InputGroupButton>
      </InputGroup>,
    )
    const box = screen.getByRole("textbox", { name: "Speed" })
    expect(box.id).toBe("speed")
    expect(box.getAttribute("aria-describedby")).toBe("speed-hint")
    expect(box.getAttribute("aria-invalid")).toBe("true")
    expect(screen.getByRole("button", { name: "Clear" }).getAttribute("type")).toBe("button")
  })

  it("puts the caret in the text box on a press of its empty space", () => {
    render(
      <InputGroup data-testid="group">
        <Input aria-label="Name" />
      </InputGroup>,
    )
    fireEvent.mouseDown(screen.getByTestId("group"))
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Name" }))
  })
})

describe("Label, Checkbox and RadioGroup", () => {
  it("a label names its checkbox, and a click on it ticks the box", () => {
    const onCheckedChange = vi.fn()
    render(
      <>
        <Checkbox id="terms" onCheckedChange={onCheckedChange} />
        <Label htmlFor="terms">Accept the terms</Label>
      </>,
    )
    const box = screen.getByRole("checkbox", { name: "Accept the terms" })
    expect(box.getAttribute("aria-checked")).toBe("false")
    fireEvent.click(screen.getByText("Accept the terms"))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(box.getAttribute("aria-checked")).toBe("true")
  })

  it("shows the mixed state of a parent checkbox", () => {
    render(<Checkbox aria-label="All robots" checked="indeterminate" />)
    expect(screen.getByRole("checkbox", { name: "All robots" }).getAttribute("aria-checked")).toBe("mixed")
  })

  it("a radio group selects one value", () => {
    const onValueChange = vi.fn()
    render(
      <RadioGroup aria-label="Mode" defaultValue="auto" onValueChange={onValueChange}>
        <RadioGroupItem value="auto" aria-label="Auto" />
        <RadioGroupItem value="manual" aria-label="Manual" />
      </RadioGroup>,
    )
    expect(screen.getByRole("radiogroup", { name: "Mode" })).toBeTruthy()
    expect(screen.getByRole("radio", { name: "Auto" }).getAttribute("aria-checked")).toBe("true")
    fireEvent.click(screen.getByRole("radio", { name: "Manual" }))
    expect(onValueChange).toHaveBeenCalledWith("manual")
  })
})

describe("Avatar", () => {
  it("is one named picture when labelled, and a group folds past max into +N", () => {
    render(
      <AvatarGroup max={2} label="Ana, Bo, Cy and Di">
        <Avatar aria-label="Ana">
          <AvatarFallback>AN</AvatarFallback>
          <AvatarBadge status="warning" />
        </Avatar>
        <Avatar>
          <AvatarFallback>BO</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>CY</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>DI</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    )
    expect(screen.getByRole("group", { name: "Ana, Bo, Cy and Di" })).toBeTruthy()
    expect(screen.getByRole("img", { name: "Ana" })).toBeTruthy()
    expect(screen.getByText("+2")).toBeTruthy()
    expect(screen.queryByText("CY")).toBeNull()
  })
})

describe("Separator", () => {
  it("is skipped by screen readers unless it separates sections", () => {
    const { container } = render(
      <>
        <Separator />
        <Separator decorative={false} orientation="vertical" />
      </>,
    )
    const [plain, semantic] = container.querySelectorAll("[data-slot=separator]")
    expect(plain.getAttribute("role")).toBe("none")
    expect(semantic.getAttribute("role")).toBe("separator")
    expect(semantic.getAttribute("aria-orientation")).toBe("vertical")
  })
})

describe("Alert", () => {
  it("is a status, and an alert only in the danger tone", () => {
    render(
      <>
        <Alert tone="warning">
          <AlertTitle>Battery low</AlertTitle>
          <AlertDescription>Dock within 20 minutes.</AlertDescription>
        </Alert>
        <Alert tone="danger">
          <AlertTitle>Lidar failed</AlertTitle>
        </Alert>
      </>,
    )
    expect(screen.getByRole("status").textContent).toContain("Battery low")
    expect(screen.getByRole("alert").textContent).toContain("Lidar failed")
  })
})

describe("Item", () => {
  it("draws a link row through asChild, in a list", () => {
    render(
      <ItemGroup>
        <div role="listitem">
          <Item asChild>
            <a href="/robots/7f3a">
              <ItemContent>
                <ItemTitle>Patrol dog 7F3A</ItemTitle>
              </ItemContent>
            </a>
          </Item>
        </div>
      </ItemGroup>,
    )
    expect(screen.getByRole("list")).toBeTruthy()
    const link = screen.getByRole("link", { name: "Patrol dog 7F3A" })
    expect(link.getAttribute("data-slot")).toBe("item")
  })
})

describe("ScrollArea", () => {
  it("has a viewport the keyboard can reach to scroll", () => {
    const { container } = render(
      <ScrollArea className="h-40">
        <p>Log line</p>
      </ScrollArea>,
    )
    const viewport = container.querySelector("[data-slot=scroll-area-viewport]")
    expect(viewport?.getAttribute("tabindex")).toBe("0")
    expect(viewport?.textContent).toBe("Log line")
  })
})

describe("ThemeToggle", () => {
  it("names each choice, marks the stored one, and reports a new one", () => {
    const onValueChange = vi.fn()
    render(<ThemeToggle value="dark" onValueChange={onValueChange} />)
    expect(screen.getByRole("radio", { name: "Dark" }).getAttribute("aria-checked")).toBe("true")
    fireEvent.click(screen.getByRole("radio", { name: "Light" }))
    expect(onValueChange).toHaveBeenCalledWith("light")
  })

  it("selects nothing until the choice is known", () => {
    render(<ThemeToggle onValueChange={() => {}} />)
    expect(screen.getAllByRole("radio").every((r) => r.getAttribute("aria-checked") === "false")).toBe(true)
  })
})
