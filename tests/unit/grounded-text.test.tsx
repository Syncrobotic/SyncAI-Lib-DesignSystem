import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { groundedTextLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { AnnotatedImage, type Annotation } from "@/registry/syncrobotic/ui/annotated-image"
import { fromGrounding, GroundedText, GroundedTextBody, groundedImageProps, type GroundedPin, type GroundedSpan } from "@/registry/syncrobotic/ui/grounded-text"

afterEach(cleanup)

const src = "data:image/gif;base64,R0lGODlhAQABAAAAACw="
const text = "There are 2 zebras and a tree."
const annotations: Annotation[] = [
  { id: "z1", kind: "predicted", label: "zebra", shape: { type: "point", x: 100, y: 300 } },
  { id: "z2", kind: "predicted", label: "zebra", shape: { type: "point", x: 200, y: 320 } },
  { id: "tree", kind: "predicted", label: "tree", shape: { type: "box", x: 500, y: 100, width: 100, height: 200 } },
]
const spans: GroundedSpan[] = [
  { start: 10, end: 18, marks: ["z1", "z2"] },
  { start: 23, end: 29, marks: ["tree"] },
]
const props = { text, spans, annotations, src, width: 640, height: 480, label: "Savanna" }

const span = (name: string) => screen.getByRole("button", { name })
const marks = () => [...document.querySelectorAll<SVGGElement>("svg[aria-hidden] g[data-kind]")]
const lit = () => marks().filter((g) => g.dataset.highlighted !== undefined || g.dataset.selected !== undefined).map((g) => g.dataset.id).sort()
const faded = () => marks().filter((g) => g.style.opacity === "var(--annotate-fade)").map((g) => g.dataset.id).sort()

describe("GroundedText", () => {
  it("renders the text with its spans as buttons named by their words and described by their marks", () => {
    const { container } = render(<GroundedText {...props} />)
    expect(container.querySelector("[data-slot=grounded-text-text]")!.textContent).toBe(text)
    const zebras = span("2 zebras")
    expect(zebras.tagName).toBe("SPAN")
    expect(zebras.getAttribute("tabindex")).toBe("0")
    expect(zebras.getAttribute("aria-pressed")).toBe("false")
    expect(document.getElementById(zebras.getAttribute("aria-describedby")!)!.textContent).toBe("2 points on the image")
    expect(document.getElementById(span("a tree").getAttribute("aria-describedby")!)!.textContent).toBe("1 box on the image")
  })

  it("describes each mark by the words that point at it", () => {
    render(<GroundedText {...props} />)
    const z1 = screen.getAllByRole("button", { name: "zebra, predicted" })[0]
    expect(z1.tagName.toLowerCase()).toBe("g")
    expect(document.getElementById(z1.getAttribute("aria-describedby")!)!.textContent).toBe("In the text: 2 zebras")
  })

  it("hovering a span highlights its marks and fades the rest; leaving clears it", () => {
    render(<GroundedText {...props} />)
    expect(lit()).toEqual([])
    expect(faded()).toEqual([])
    fireEvent.pointerEnter(span("2 zebras"), { pointerType: "mouse" })
    expect(lit()).toEqual(["z1", "z2"])
    expect(faded()).toEqual(["tree"])
    expect(span("2 zebras").dataset.active).toBe("true")
    fireEvent.pointerLeave(span("2 zebras"), { pointerType: "mouse" })
    expect(lit()).toEqual([])
  })

  it("hovering a mark highlights the spans that point at it", () => {
    render(<GroundedText {...props} />)
    fireEvent.pointerEnter(screen.getByRole("button", { name: "tree, predicted" }), { pointerType: "mouse" })
    expect(span("a tree").dataset.active).toBe("true")
    expect(span("2 zebras").dataset.active).toBeUndefined()
    expect(lit()).toEqual(["tree"])
  })

  it("a tap pins a span (touch does not hover); again, or Esc, lets go", () => {
    const changed = vi.fn()
    const outside = vi.fn()
    render(
      <div onKeyDown={outside}>
        <GroundedText {...props} onPinnedChange={changed} />
      </div>,
    )
    const zebras = span("2 zebras")
    fireEvent.pointerEnter(zebras, { pointerType: "touch" })
    expect(lit()).toEqual([])
    fireEvent.click(zebras)
    expect(changed).toHaveBeenLastCalledWith({ span: 0 })
    expect(zebras.getAttribute("aria-pressed")).toBe("true")
    expect(lit()).toEqual(["z1", "z2"])
    fireEvent.click(zebras)
    expect(changed).toHaveBeenLastCalledWith(null)
    expect(lit()).toEqual([])
    fireEvent.keyDown(zebras, { key: "Enter" })
    outside.mockClear()
    expect(zebras.getAttribute("aria-pressed")).toBe("true")
    fireEvent.keyDown(zebras, { key: "Escape" })
    expect(zebras.getAttribute("aria-pressed")).toBe("false")
    expect(outside).not.toHaveBeenCalled()
    fireEvent.keyDown(zebras, { key: "Escape" })
    expect(outside).toHaveBeenCalledTimes(1)
  })

  it("clicking a mark pins it: selected with handles, its spans lit", () => {
    render(<GroundedText {...props} />)
    const tree = screen.getByRole("button", { name: "tree, predicted" })
    fireEvent.click(tree)
    expect(tree.getAttribute("aria-pressed")).toBe("true")
    expect(span("a tree").dataset.active).toBe("true")
    expect(faded()).toEqual(["z1", "z2"])
    fireEvent.click(tree)
    expect(tree.getAttribute("aria-pressed")).toBe("false")
    expect(span("a tree").dataset.active).toBeUndefined()
  })

  it("clamps spans to the text, starts an overlapping span where the one before ends, and leaves a span with no marks as text", () => {
    const { container } = render(
      <GroundedText
        {...props}
        spans={[
          { start: 23, end: 99, marks: ["tree"] },
          { start: 0, end: 5, marks: ["missing"] },
          { start: 10, end: 18, marks: ["z1"] },
          { start: 14, end: 24, marks: ["z2"] },
        ]}
      />,
    )
    expect(screen.getAllByRole("button").filter((b) => b.tagName === "SPAN").map((b) => b.textContent)).toEqual(["2 zebras", " and a", " tree."])
    expect(container.querySelector("[data-slot=grounded-text-text]")!.textContent).toBe(text)
  })

  it("controlled: follows `pinned`", () => {
    const { rerender } = render(<GroundedText {...props} pinned={{ mark: "z2" }} />)
    expect(span("2 zebras").dataset.active).toBe("true")
    expect(lit()).toEqual(["z2"])
    rerender(<GroundedText {...props} pinned={null} />)
    expect(lit()).toEqual([])
  })

  it("speaks zh-TW from labels", () => {
    render(<GroundedText {...props} labels={groundedTextLabels} />)
    expect(document.getElementById(span("2 zebras").getAttribute("aria-describedby")!)!.textContent).toBe("圖上 2 個點")
    expect(groundedTextLabels.marks({ points: 1, boxes: 2, shapes: 0 })).toBe("圖上 2 個框和 1 個點")
  })
})

describe("fromGrounding", () => {
  it("reads offsets and scales points and boxes to the picture's pixels", () => {
    const { annotations: a, spans: s } = fromGrounding(
      "8 zebras by a tree",
      [
        { start_idx: 0, end_idx: 8, points: [[500, 500], { x: 250, y: 1000 }] },
        { start: 14, end: 18, boxes: [[900, 100, 800, 500]], label: "acacia" },
      ],
      { width: 640, height: 480, scale: 1000 },
    )
    expect(s).toEqual([
      { start: 0, end: 8, marks: ["g0-0", "g0-1"] },
      { start: 14, end: 18, marks: ["g1-0"] },
    ])
    expect(a.map((x) => [x.id, x.label, x.shape])).toEqual([
      ["g0-0", "8 zebras", { type: "point", x: 320, y: 240 }],
      ["g0-1", "8 zebras", { type: "point", x: 160, y: 480 }],
      ["g1-0", "acacia", { type: "box", x: 512, y: 48, width: 64, height: 192 }],
    ])
    expect(a.every((x) => x.kind === "predicted")).toBe(true)
  })

  it("keeps pixels when there is no scale", () => {
    const { annotations: a } = fromGrounding("a", [{ start: 0, end: 1, points: [[10, 20]] }], { width: 640, height: 480, kind: "truth" })
    expect(a[0]).toMatchObject({ kind: "truth", shape: { type: "point", x: 10, y: 20 } })
  })
})


function TwoPanels({ onSpan }: { onSpan?: (span: number | null) => void }) {
  const [pinned, setPinned] = React.useState<GroundedPin | null>(null)
  const [span, setSpan] = React.useState<number | null>(null)
  const [mark, setMark] = React.useState<string | null>(null)
  const picture = React.useRef<HTMLDivElement>(null)
  const image = groundedImageProps({ text, spans, annotations, pinned, onPinnedChange: setPinned, activeSpan: span, activeMark: mark })
  return (
    <>
      <div ref={picture} data-testid="picture" style={{ overflowY: "auto" }}>
        <AnnotatedImage src={src} width={640} height={480} label="Savanna" {...image} onActiveChange={setMark} />
      </div>
      <GroundedTextBody
        text={text}
        spans={spans}
        annotations={annotations}
        pinned={pinned}
        onPinnedChange={setPinned}
        activeMark={mark}
        onActiveChange={(s) => {
          setSpan(s)
          onSpan?.(s)
        }}
        picture={picture}
      />
    </>
  )
}

describe("GroundedTextBody", () => {
  const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 100, width: 100, height: bottom - top, x: 0, y: top, toJSON: () => ({}) }) as DOMRect
  const matchMedia = window.matchMedia
  const scrollBy = window.scrollBy
  afterEach(() => {
    window.matchMedia = matchMedia
    window.scrollBy = scrollBy
    vi.restoreAllMocks()
  })
  // Marks are redrawn as they light up, so their boxes are given by element, not set on the nodes found at first.
  const layout = (of: (el: Element) => DOMRect | undefined) =>
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return of(this) ?? rect(0, 0)
    })

  it("renders only the text, its spans described by their marks", () => {
    const { container } = render(<GroundedTextBody text={text} spans={spans} annotations={annotations} />)
    expect(container.querySelector("[data-slot=grounded-text-body]")).not.toBeNull()
    expect(container.querySelector("svg")).toBeNull()
    expect(container.querySelector("[data-slot=grounded-text-text]")!.textContent).toBe(text)
    expect(span("2 zebras").dataset.slot).toBe("grounded-text-span")
    expect(document.getElementById(span("2 zebras").getAttribute("aria-describedby")!)!.textContent).toBe("2 points on the image")
  })

  it("drives an annotated-image in another panel: hover reports the span and lights its marks; a mark lights its span", () => {
    const onSpan = vi.fn()
    render(<TwoPanels onSpan={onSpan} />)
    expect(document.querySelectorAll("[data-slot=annotated-image]")).toHaveLength(1)
    fireEvent.pointerEnter(span("2 zebras"), { pointerType: "mouse" })
    expect(onSpan).toHaveBeenLastCalledWith(0)
    expect(lit()).toEqual(["z1", "z2"])
    expect(faded()).toEqual(["tree"])
    fireEvent.pointerLeave(span("2 zebras"), { pointerType: "mouse" })
    expect(onSpan).toHaveBeenLastCalledWith(null)
    expect(lit()).toEqual([])
    const tree = screen.getByRole("button", { name: "tree, predicted" })
    expect(document.getElementById(tree.getAttribute("aria-describedby")!)!.textContent).toBe("In the text: a tree")
    fireEvent.pointerEnter(tree, { pointerType: "mouse" })
    expect(span("a tree").dataset.active).toBe("true")
    fireEvent.pointerLeave(tree, { pointerType: "mouse" })
    fireEvent.click(tree)
    expect(tree.getAttribute("aria-pressed")).toBe("true")
    expect(span("a tree").getAttribute("aria-pressed")).toBe("false")
    expect(span("a tree").dataset.active).toBe("true")
  })

  it("a pin scrolls the marks into the picture's panel, instantly under reduced motion; a hover never scrolls", () => {
    render(<TwoPanels />)
    const panel = screen.getByTestId("picture")
    Object.defineProperty(panel, "scrollHeight", { value: 900 })
    Object.defineProperty(panel, "clientHeight", { value: 300 })
    panel.scrollBy = vi.fn()
    layout((el) => (el === panel ? rect(100, 400) : el.matches("g[data-id=tree]") ? rect(150, 250) : el.matches("g[data-id]") ? rect(-60, -50) : undefined))
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    fireEvent.pointerEnter(span("2 zebras"), { pointerType: "mouse" })
    fireEvent.pointerLeave(span("2 zebras"), { pointerType: "mouse" })
    expect(panel.scrollBy).not.toHaveBeenCalled()
    fireEvent.click(span("a tree"))
    expect(panel.scrollBy).not.toHaveBeenCalled()
    fireEvent.click(span("2 zebras"))
    expect(panel.scrollBy).toHaveBeenCalledWith({ top: -160, behavior: "smooth" })
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    fireEvent.keyDown(span("2 zebras"), { key: "Enter" })
    fireEvent.keyDown(span("2 zebras"), { key: "Enter" })
    expect(panel.scrollBy).toHaveBeenCalledTimes(2)
    expect(panel.scrollBy).toHaveBeenLastCalledWith({ top: -160, behavior: "auto" })
  })

  it("when the text scrolls with the picture, never scrolls the pinned span out of view", () => {
    window.scrollBy = vi.fn()
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true })
    render(<GroundedText {...props} />)
    layout((el) => (el.matches("g[data-id]") ? rect(-500, -490) : el.textContent === "2 zebras" ? rect(600, 620) : undefined))
    fireEvent.click(span("2 zebras"))
    expect(window.scrollBy).toHaveBeenCalledWith({ top: -180, behavior: "auto" })
  })
})
