import { cleanup, render, screen } from "@testing-library/react"
import { Cpu } from "lucide-react"
import { afterEach, describe, expect, it } from "vitest"
import { descriptionListLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"

afterEach(cleanup)

const dd = (label: string) => screen.getByText(label).closest("div")!.querySelector("dd")!

describe("DescriptionList items", () => {
  it("renders a plain list as before: one dt and one dd per item", () => {
    render(<DescriptionList items={[{ label: "Site", value: "North gate" }]} />)
    expect(document.querySelectorAll("dt")).toHaveLength(1)
    expect(document.querySelectorAll("dd")).toHaveLength(1)
    expect(dd("Site").textContent).toBe("North gate")
    expect(dd("Site").className).toContain("font-medium")
  })

  it("an empty value is a dash, read as Not set; 0 is a value", () => {
    render(
      <DescriptionList
        items={[
          { label: "Expected hardware", value: null },
          { label: "Notes", value: "" },
          { label: "Owner" },
          { label: "Errors", value: 0 },
        ]}
      />,
    )
    for (const l of ["Expected hardware", "Notes", "Owner"]) {
      expect(dd(l).textContent).toBe("—Not set")
      expect(dd(l).querySelector("[aria-hidden=true]")!.textContent).toBe("—")
    }
    expect(dd("Errors").textContent).toBe("0")
  })

  it("hint under the value, mono for ids, an icon before the label", () => {
    render(<DescriptionList items={[{ label: "Instance ID", value: "7f3a-9c21", mono: true, hint: "Sent by the device", icon: Cpu }]} />)
    expect(dd("Instance ID").className).toContain("font-mono")
    expect(document.querySelectorAll("dd")[1]!.textContent).toBe("Sent by the device")
    expect(document.querySelector("dt svg")!.getAttribute("aria-hidden")).toBe("true")
  })

  it("copy: a button named for the field, copying the value or the given text; none for an empty value", () => {
    render(
      <DescriptionList
        items={[
          { label: "Instance ID", value: "7f3a-9c21", copy: true },
          { label: "Key", value: <b>SHA256:ab…</b>, copy: "SHA256:abcdef" },
          { label: "Version", value: null, copy: true },
        ]}
      />,
    )
    expect(screen.getByRole("button", { name: "Copy Instance ID" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Copy Key" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Copy Version" })).toBeNull()
  })

  it("zh-TW labels", () => {
    render(<DescriptionList labels={descriptionListLabels} items={[{ label: "版本", value: null }, { label: "ID", value: "x", copy: true }]} />)
    expect(dd("版本").textContent).toBe("—未設定")
    expect(screen.getByRole("button", { name: "複製ID" })).toBeTruthy()
  })
})

describe("StatusGlyph none", () => {
  it("is a grey dashed circle, hidden from screen readers", () => {
    render(<StatusGlyph status="none" />)
    const svg = document.querySelector("svg")!
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(svg.getAttribute("class")).toContain("text-muted-foreground")
    expect(svg.querySelector("circle")!.getAttribute("stroke-dasharray")).toBeTruthy()
    expect(svg.querySelector("path")).toBeNull()
  })
})
