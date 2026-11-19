import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AnnotatedImage, AnnotationLegend, type Annotation } from "@/registry/syncrobotic/ui/annotated-image"

afterEach(cleanup)

const src = "data:image/gif;base64,R0lGODlhAQABAAAAACw="
const annotations: Annotation[] = [
  { id: "fork", kind: "truth", label: "forklift", shape: { type: "box", x: 300, y: 200, width: 200, height: 180 } },
  { id: "person", kind: "predicted", label: "person", score: 0.923, shape: { type: "box", x: 100, y: 150, width: 80, height: 240 } },
  { id: "spill", kind: "predicted", label: "spill", score: 0.6, shape: { type: "point", x: 400, y: 440 } },
]

function Selectable({ onChange }: { onChange?: (id: string | null) => void }) {
  const [selected, setSelected] = React.useState<string | null>(null)
  return (
    <AnnotatedImage
      src={src}
      width={640}
      height={480}
      label="Camera 2"
      annotations={annotations}
      selectedId={selected}
      onSelectedChange={(id) => {
        setSelected(id)
        onChange?.(id)
      }}
    />
  )
}

describe("AnnotatedImage", () => {
  it("is one image named by its label and a summary in reading order, with nothing focusable", () => {
    const { container } = render(<AnnotatedImage src={src} width={640} height={480} label="Camera 2" annotations={annotations} />)
    expect(screen.getByRole("img", { name: "Camera 2. 3 annotations: person, predicted, 0.92; forklift, ground truth; spill, predicted, 0.60" })).toBeTruthy()
    expect(container.querySelectorAll("[tabindex]")).toHaveLength(0)
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })

  it("names the overlays after the annotations, and says when there are none", () => {
    render(<AnnotatedImage src={src} width={640} height={480} label="Camera 2" annotations={[]} overlays={[{ src, label: "Depth" }]} />)
    expect(screen.getByRole("img", { name: "Camera 2. No annotations. Layers: Depth" })).toBeTruthy()
  })

  it("writes the class word and score on the picture, for all, only the selected one, or none", () => {
    const props = { src, width: 640, height: 480, label: "Camera 2", annotations, selectedId: "fork" }
    const { container, rerender } = render(<AnnotatedImage {...props} />)
    const words = () => [...container.querySelectorAll("span.absolute.block")].map((s) => s.textContent)
    expect(words()).toEqual(["person 0.92", "forklift", "spill 0.60"])
    rerender(<AnnotatedImage {...props} showLabels="selected" />)
    expect(words()).toEqual(["forklift"])
    rerender(<AnnotatedImage {...props} showLabels="none" />)
    expect(words()).toEqual([])
  })

  it("with onSelectedChange: a group of buttons with one Tab stop; arrows move in reading order, Enter and Space select", () => {
    const changed = vi.fn()
    render(<Selectable onChange={changed} />)
    const group = screen.getByRole("group", { name: "Camera 2" })
    const buttons = screen.getAllByRole("button")
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["person, predicted, 0.92", "forklift, ground truth", "spill, predicted, 0.60"])
    expect(group.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    expect(buttons[0].getAttribute("tabindex")).toBe("0")

    buttons[0].focus()
    fireEvent.keyDown(buttons[0], { key: "ArrowRight" })
    expect(document.activeElement).toBe(buttons[1])
    expect(buttons[1].getAttribute("tabindex")).toBe("0")
    expect(buttons[0].getAttribute("tabindex")).toBe("-1")
    fireEvent.keyDown(buttons[1], { key: "Enter" })
    expect(changed).toHaveBeenLastCalledWith("fork")
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true")

    fireEvent.keyDown(buttons[1], { key: "End" })
    expect(document.activeElement).toBe(buttons[2])
    fireEvent.keyDown(buttons[2], { key: " " })
    expect(changed).toHaveBeenLastCalledWith("spill")
    fireEvent.keyDown(buttons[2], { key: "Home" })
    expect(document.activeElement).toBe(buttons[0])
  })

  it("Esc clears the selection, and only stops the key when there was one", () => {
    const changed = vi.fn()
    const outside = vi.fn()
    render(
      <div onKeyDown={outside}>
        <Selectable onChange={changed} />
      </div>,
    )
    const [, fork] = screen.getAllByRole("button")
    fireEvent.click(fork)
    expect(changed).toHaveBeenLastCalledWith("fork")
    fireEvent.keyDown(fork, { key: "Escape" })
    expect(changed).toHaveBeenLastCalledWith(null)
    expect(fork.getAttribute("aria-pressed")).toBe("false")
    expect(outside).not.toHaveBeenCalled()
    // Nothing selected: Esc goes on, e.g. to close the dialog the picture is in.
    fireEvent.keyDown(fork, { key: "Escape" })
    expect(outside).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenCalledTimes(2)
  })

  it("lists only the kinds present in the legend, each with its word", () => {
    render(<AnnotatedImage src={src} width={640} height={480} label="Camera 2" annotations={annotations} />)
    const legend = screen.getByRole("list", { name: "Line styles" })
    expect([...legend.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["Predicted", "Ground truth"])
    cleanup()
    render(<AnnotationLegend kinds={["previous", "predicted"]} labels={{ predicted: "模型預測", previous: "上一版", legend: "線條樣式" }} />)
    expect([...screen.getByRole("list", { name: "線條樣式" }).querySelectorAll("li")].map((li) => li.textContent)).toEqual(["模型預測", "上一版"])
  })

  it("hides the annotations, words and legend when the picture fails, and says so", () => {
    const { container } = render(<AnnotatedImage src="data:image/png;base64,broken" width={640} height={480} label="Camera 2" annotations={annotations} />)
    // jsdom may already report it broken when it mounts (the server-rendered case); otherwise the error event does.
    const img = container.querySelector("img")
    if (img) fireEvent.error(img)
    expect(screen.getByText("The picture could not be loaded")).toBeTruthy()
    expect(container.querySelector("path[vector-effect]")).toBeNull()
    expect(screen.queryByRole("list")).toBeNull()
    expect(screen.queryByText("person 0.92")).toBeNull()
  })

  it("loading: a busy box at the picture's aspect ratio that says what it waits for", () => {
    const { container } = render(<AnnotatedImage loading width={640} height={480} label="Camera 2" annotations={[]} />)
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()
    expect(screen.getByRole("status").textContent).toBe("Loading picture")
    expect((container.querySelector("[style]") as HTMLElement).style.aspectRatio).toBe("640 / 480")
  })

  it("draws in the picture's pixel space with non-scaling strokes, previous faded", () => {
    const { container } = render(
      <AnnotatedImage
        src={src}
        width={640}
        height={480}
        label="Camera 2"
        annotations={[{ id: "v2", kind: "previous", label: "person", shape: { type: "box", x: 1, y: 2, width: 3, height: 4 } }]}
      />,
    )
    const svg = container.querySelector("svg[aria-hidden]")!
    expect(svg.getAttribute("viewBox")).toBe("0 0 640 480")
    for (const p of svg.querySelectorAll("path")) expect(p.getAttribute("vector-effect")).toBe("non-scaling-stroke")
    expect((svg.querySelector('[data-kind="previous"]') as SVGGElement).style.opacity).toBe("var(--annotate-fade)")
  })
})
