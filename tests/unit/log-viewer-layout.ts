import { vi } from "vitest"

// happy-dom lays nothing out, so a virtual list would see a 0 px viewport and draw no lines. These give the scroller a
// 360 px viewport, each line its 36 px, a scroll height from the virtual list's own spacer (what the browser would
// measure), and a scrollTop that is clamped and fires a scroll event as the browser's does. Shared by the log viewer's
// tests and its compiled twin.
export function layOut() {
  const grid = (el: Element) => el.getAttribute("role") === "treegrid"
  const line = (el: Element) => el.getAttribute("role") === "row" && el.hasAttribute("data-index")
  const spacerHeight = (el: Element) => parseFloat((el.querySelector(":scope > .relative") as HTMLElement | null)?.style.height ?? "0") || 0
  const scrollHeight = (el: Element) => Math.max(360, spacerHeight(el))
  const tops = new WeakMap<Element, number>()
  const setTop = (el: HTMLElement, value: number) => {
    const next = Math.max(0, Math.min(scrollHeight(el) - 360, Math.round(value)))
    if (next === (tops.get(el) ?? 0)) return
    tops.set(el, next)
    el.dispatchEvent(new Event("scroll"))
  }
  const top = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop")!
  Object.defineProperty(HTMLElement.prototype, "scrollTop", {
    configurable: true,
    get(this: HTMLElement) {
      return grid(this) ? (tops.get(this) ?? 0) : top.get!.call(this)
    },
    set(this: HTMLElement, v: number) {
      if (grid(this)) setTop(this, v)
      else top.set!.call(this, v)
    },
  })
  const scrollTo = HTMLElement.prototype.scrollTo
  HTMLElement.prototype.scrollTo = function (this: HTMLElement, a?: ScrollToOptions | number, b?: number) {
    if (!grid(this)) return (scrollTo as (o?: ScrollToOptions) => void).call(this, a as ScrollToOptions)
    setTop(this, typeof a === "number" ? (b ?? 0) : (a?.top ?? tops.get(this) ?? 0))
  } as typeof HTMLElement.prototype.scrollTo
  const spies = [
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (this: HTMLElement) {
      return grid(this) ? 360 : 0
    }),
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      return grid(this) ? 800 : 0
    }),
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return line(this) ? 36 : grid(this) ? 360 : 0
    }),
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(function (this: HTMLElement) {
      return grid(this) ? scrollHeight(this) : 0
    }),
  ]
  return () => {
    spies.forEach((s) => s.mockRestore())
    delete (HTMLElement.prototype as { scrollTop?: number }).scrollTop
    HTMLElement.prototype.scrollTo = scrollTo
  }
}
