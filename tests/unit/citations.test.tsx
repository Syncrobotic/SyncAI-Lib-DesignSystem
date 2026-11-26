import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { citationsLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { CitationMarker, Citations, CitationSources, citationLocation, citationMarker, type CitationSource } from "@/registry/syncrobotic/ui/citations"
import { Markdown } from "@/registry/syncrobotic/ui/markdown"

afterEach(cleanup)

const sources: CitationSource[] = [
  { title: "Docking manual", url: "https://www.docs.example.com/manual/docking", snippet: "The plate must be clear of objects within 30 cm." },
  { title: "Site map, aisle 4", location: "site-maps.pdf, page 12" },
  { title: "Night shift log", url: "ftp://files.example.com/log.txt" },
]

function Answer({ text = "The plate is clear [1] and the box is outside the path [2]. See also [1].", onActiveChange }: { text?: string; onActiveChange?: (n: number | null) => void }) {
  return (
    <Citations sources={sources} onActiveChange={onActiveChange}>
      <Markdown text={text} cite={citationMarker} />
      <CitationSources />
    </Citations>
  )
}

const marker = (name: string, i = 0) => screen.getAllByRole("link", { name })[i]!
const entry = (n: number) => document.querySelectorAll<HTMLLIElement>("[data-slot=citation-source]")[n - 1]!
const lit = () => [...document.querySelectorAll("[data-active]")].map((el) => `${el.getAttribute("data-slot")}:${el.textContent?.slice(0, 1)}`)
// Keyboard focus: jsdom has no :focus-visible, so treat every focus as from the keyboard.
const matches = Element.prototype.matches
const keyboard = () =>
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, s: string) {
    return s === ":focus-visible" ? true : matches.call(this, s)
  })

describe("CitationMarker", () => {
  it("turns [1] in Markdown into links named by their source, the number shown", () => {
    render(<Answer />)
    const one = marker("Source 1: Docking manual")
    expect(one.textContent).toBe("1")
    expect(one.getAttribute("data-slot")).toBe("citation-marker")
    expect(one.getAttribute("href")).toBe(`#${entry(1).id}`)
    expect(screen.getAllByRole("link", { name: "Source 1: Docking manual" })).toHaveLength(2)
    expect(marker("Source 2: Site map, aisle 4").textContent).toBe("2")
  })

  it("is the text [N] for a number with no source, and outside Citations", () => {
    const { container } = render(<Answer text="Out of range [7]." />)
    expect(container.querySelector("[data-slot=markdown]")?.textContent).toBe("Out of range\u00A0[7].")
    cleanup()
    const plain = render(<CitationMarker n={1} />)
    expect(plain.container.textContent).toBe("[1]")
    expect(plain.container.querySelector("a")).toBeNull()
  })
})

describe("linking", () => {
  it("hovering a marker highlights its source; hovering a source highlights every marker that cites it", () => {
    const changes: (number | null)[] = []
    render(<Answer onActiveChange={(n) => changes.push(n)} />)
    fireEvent.pointerEnter(marker("Source 2: Site map, aisle 4"), { pointerType: "mouse" })
    expect(lit()).toEqual(["citation-marker:2", "citation-source:2"])
    fireEvent.pointerLeave(marker("Source 2: Site map, aisle 4"), { pointerType: "mouse" })
    expect(lit()).toEqual([])
    fireEvent.pointerEnter(entry(1), { pointerType: "mouse" })
    expect(lit()).toEqual(["citation-marker:1", "citation-marker:1", "citation-source:1"])
    fireEvent.pointerLeave(entry(1), { pointerType: "mouse" })
    expect(changes).toEqual([null, 2, null, 1, null])
  })

  it("touch does not hover", () => {
    render(<Answer />)
    fireEvent.pointerEnter(marker("Source 2: Site map, aisle 4"), { pointerType: "touch" })
    expect(lit()).toEqual([])
  })

  it("keyboard focus on a marker highlights its source", () => {
    const spy = keyboard()
    render(<Answer />)
    act(() => marker("Source 1: Docking manual").focus())
    expect(lit()).toContain("citation-source:1")
    act(() => marker("Source 1: Docking manual").blur())
    expect(lit()).toEqual([])
    spy.mockRestore()
  })

  it("activating a marker moves focus to its source, which offers the way back to that marker", () => {
    render(<Answer />)
    const second = marker("Source 1: Docking manual", 1)
    fireEvent.click(second)
    expect(document.activeElement).toBe(entry(1))
    const back = screen.getByRole("button", { name: "Back to citation 1" })
    expect(entry(1).contains(back)).toBe(true)
    fireEvent.click(back)
    expect(document.activeElement).toBe(second)
    expect(screen.queryByRole("button", { name: "Back to citation 1" })).toBeNull()
  })

  it("Esc in the source returns focus to the marker and stops there", () => {
    const outer = vi.fn()
    render(
      <div onKeyDown={outer}>
        <Answer />
      </div>,
    )
    const two = marker("Source 2: Site map, aisle 4")
    fireEvent.click(two)
    expect(document.activeElement).toBe(entry(2))
    fireEvent.keyDown(entry(2), { key: "Escape" })
    expect(document.activeElement).toBe(two)
    expect(outer).not.toHaveBeenCalled()
  })

  it("Esc does nothing in a source that was not reached from a marker", () => {
    const outer = vi.fn()
    render(
      <div onKeyDown={outer}>
        <Answer />
      </div>,
    )
    fireEvent.keyDown(entry(2), { key: "Escape" })
    expect(outer).toHaveBeenCalled()
  })

  it("the way back goes when focus leaves the source", () => {
    render(
      <>
        <Answer />
        <button type="button">Elsewhere</button>
      </>,
    )
    fireEvent.click(marker("Source 1: Docking manual"))
    expect(screen.getByRole("button", { name: "Back to citation 1" })).toBeTruthy()
    act(() => screen.getByRole("button", { name: "Elsewhere" }).focus())
    expect(screen.queryByRole("button", { name: "Back to citation 1" })).toBeNull()
  })

  it("a marker's href still goes to its source without the list's script", () => {
    render(
      <Citations sources={sources}>
        <CitationMarker n={1} />
      </Citations>,
    )
    // No list on the page: the click is not prevented, so the browser follows the link.
    const link = marker("Source 1: Docking manual")
    const event = new MouseEvent("click", { bubbles: true, cancelable: true })
    link.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe("CitationSources", () => {
  it("lists every source numbered, with its title, where it is and its snippet", () => {
    render(<Answer />)
    expect(screen.getByRole("heading", { name: "Sources" }).tagName).toBe("H3")
    const items = screen.getAllByRole("listitem").filter((li) => li.getAttribute("data-slot") === "citation-source")
    expect(items.map((li) => li.querySelector("span")?.textContent)).toEqual(["1", "2", "3"])
    expect(items[0]?.textContent).toContain("docs.example.com/manual/docking")
    expect(items[0]?.textContent).toContain("The plate must be clear of objects within 30 cm.")
    expect(items[1]?.textContent).toContain("site-maps.pdf, page 12")
  })

  it("links an http(s) title in a new tab with the external-link icon, and never another scheme", () => {
    render(<Answer />)
    const link = screen.getByRole("link", { name: "Docking manual (opens in a new tab)" })
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toBe("noopener noreferrer")
    expect(link.querySelector("svg[aria-hidden=true]")).toBeTruthy()
    expect(screen.queryByRole("link", { name: /Night shift log/ })).toBeNull()
    expect(entry(3).textContent).toContain("ftp://files.example.com/log.txt")
  })

  it("takes the heading's level and a title of its own, or none", () => {
    const { rerender } = render(
      <Citations sources={sources}>
        <CitationSources as="h2" title="References" />
      </Citations>,
    )
    expect(screen.getByRole("heading", { name: "References" }).tagName).toBe("H2")
    rerender(
      <Citations sources={sources}>
        <CitationSources title={null} />
      </Citations>,
    )
    expect(screen.queryByRole("heading")).toBeNull()
    expect(screen.getByRole("region", { name: "Sources" })).toBeTruthy()
  })

  it("renders nothing without sources", () => {
    const { container } = render(
      <Citations sources={[]}>
        <CitationSources />
      </Citations>,
    )
    expect(container.innerHTML).toBe("")
  })

  it("citationLocation writes the host without www. and the path", () => {
    expect(citationLocation({ title: "a", url: "https://www.example.com/docs/a%20b" })).toBe("example.com/docs/a b")
    expect(citationLocation({ title: "a", url: "https://example.com/" })).toBe("example.com")
    expect(citationLocation({ title: "a", url: "not a url" })).toBe("not a url")
    expect(citationLocation({ title: "a", location: "p. 12", url: "https://example.com" })).toBe("p. 12")
    expect(citationLocation({ title: "a" })).toBeUndefined()
  })

  it("takes its words from labels (zh-TW)", () => {
    render(
      <Citations sources={sources} labels={citationsLabels}>
        <Markdown text="充電座淨空 [1]。" cite={citationMarker} />
        <CitationSources />
      </Citations>,
    )
    expect(screen.getByRole("link", { name: "來源 1：Docking manual" })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "來源" })).toBeTruthy()
    fireEvent.click(screen.getByRole("link", { name: "來源 1：Docking manual" }))
    expect(screen.getByRole("button", { name: "回到引用 1" })).toBeTruthy()
  })
})
