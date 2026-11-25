import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AnnotatedImage } from "@/registry/syncrobotic/ui/annotated-image?react-compiler"
import { fromGrounding, GroundedText, GroundedTextBody, groundedImageProps, type GroundedPin } from "@/registry/syncrobotic/ui/grounded-text?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's page that keeps the pin and
// swaps the answer as a model streams a new one) and grounded-text imported with ?react-compiler, so these check that the
// links follow hover, the pin and new data once compiled, and that annotated-image's highlight follows them.

afterEach(cleanup)

const src = "data:image/gif;base64,R0lGODlhAQABAAAAACw="
const first = "2 zebras by a tree."
const second = "1 zebra, no tree."
const marksOf = (text: string, n: number) =>
  fromGrounding(text, [{ start: 0, end: text.indexOf(","), points: Array.from({ length: n }, (_, i) => [100 + i * 50, 300] as [number, number]) }], { width: 640, height: 480 })
const lit = () => [...document.querySelectorAll<SVGGElement>("svg[aria-hidden] g[data-highlighted], svg[aria-hidden] g[data-selected]")].map((g) => g.dataset.id)

function Page() {
  const [text, setText] = React.useState(first)
  const [pin, setPin] = React.useState<GroundedPin | null>(null)
  const data = text === first ? fromGrounding(text, [{ start: 0, end: 8, points: [[100, 300], [150, 300]] }], { width: 640, height: 480 }) : marksOf(text, 1)
  return (
    <>
      <button type="button" onClick={() => setText(second)}>
        Next answer
      </button>
      <p data-testid="pin">{pin ? JSON.stringify(pin) : "none"}</p>
      <GroundedText text={text} {...data} src={src} width={640} height={480} label="Savanna" pinned={pin} onPinnedChange={setPin} />
    </>
  )
}

describe("grounded-text, compiled", () => {
  it("hover lights a span's marks, a click pins them, and a new answer replaces the links", () => {
    render(<Page />)
    const zebras = screen.getByRole("button", { name: "2 zebras" })
    fireEvent.pointerEnter(zebras, { pointerType: "mouse" })
    expect(lit()).toEqual(["g0-0", "g0-1"])
    fireEvent.pointerLeave(zebras, { pointerType: "mouse" })
    expect(lit()).toEqual([])
    fireEvent.click(zebras)
    expect(screen.getByTestId("pin").textContent).toBe('{"span":0}')
    expect(lit()).toEqual(["g0-0", "g0-1"])
    expect(zebras.getAttribute("aria-pressed")).toBe("true")

    fireEvent.click(screen.getByRole("button", { name: "Next answer" }))
    const one = screen.getByRole("button", { name: "1 zebra" })
    expect(document.getElementById(one.getAttribute("aria-describedby")!)!.textContent).toBe("1 point on the image")
    expect(lit()).toEqual(["g0-0"])
  })

  it("a mark's hover lights its span, through annotated-image's onActiveChange", () => {
    render(<Page />)
    const [mark] = screen.getAllByRole("button", { name: "2 zebras, predicted" })
    fireEvent.pointerEnter(mark, { pointerType: "mouse" })
    expect(screen.getByRole("button", { name: "2 zebras" }).dataset.active).toBe("true")
    fireEvent.pointerLeave(mark, { pointerType: "mouse" })
    expect(screen.getByRole("button", { name: "2 zebras" }).dataset.active).toBeUndefined()
  })
})

// A workspace that already shows the picture in its own panel: GroundedTextBody drives it through groundedImageProps.
function Panels() {
  const [pin, setPin] = React.useState<GroundedPin | null>(null)
  const [span, setSpan] = React.useState<number | null>(null)
  const [mark, setMark] = React.useState<string | null>(null)
  const data = fromGrounding(first, [{ start: 0, end: 8, points: [[100, 300], [150, 300]] }, { start: 14, end: 18, boxes: [[400, 100, 500, 300]] }], { width: 640, height: 480 })
  const image = groundedImageProps({ text: first, ...data, pinned: pin, onPinnedChange: setPin, activeSpan: span, activeMark: mark })
  return (
    <>
      <AnnotatedImage src={src} width={640} height={480} label="Savanna" {...image} onActiveChange={setMark} />
      <GroundedTextBody text={first} {...data} pinned={pin} onPinnedChange={setPin} activeMark={mark} onActiveChange={setSpan} />
    </>
  )
}

describe("grounded-text-body with an annotated-image of the page's own, compiled", () => {
  it("the text's hover and pin drive the picture, and the picture's hover lights the text", () => {
    render(<Panels />)
    const zebras = screen.getByRole("button", { name: "2 zebras" })
    fireEvent.pointerEnter(zebras, { pointerType: "mouse" })
    expect(lit()).toEqual(["g0-0", "g0-1"])
    fireEvent.pointerLeave(zebras, { pointerType: "mouse" })
    expect(lit()).toEqual([])
    fireEvent.click(screen.getByRole("button", { name: "tree" }))
    expect(lit()).toEqual(["g1-0"])
    const box = screen.getByRole("button", { name: "tree, predicted" })
    fireEvent.click(box)
    expect(box.getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: "tree" }).getAttribute("aria-pressed")).toBe("false")
    expect(lit()).toEqual(["g1-0"])
    const [point] = screen.getAllByRole("button", { name: "2 zebras, predicted" })
    fireEvent.pointerEnter(point, { pointerType: "mouse" })
    expect(zebras.dataset.active).toBe("true")
  })
})
