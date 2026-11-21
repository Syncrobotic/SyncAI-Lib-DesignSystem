import { act, cleanup, render, renderHook, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useDebouncedCallback } from "@/registry/syncrobotic/hooks/use-debounce"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { ListDetail } from "@/registry/syncrobotic/blocks/list-detail"
import { NotificationCenter, sampleNotifications, sampleNow } from "@/registry/syncrobotic/blocks/notification-center"
import { Autocomplete } from "@/registry/syncrobotic/ui/autocomplete"
import { CameraFeed } from "@/registry/syncrobotic/ui/camera-feed"
import { FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Field } from "@/registry/syncrobotic/ui/field"
import { MediaPlayer } from "@/registry/syncrobotic/ui/media-player"
import { RouteProgress } from "@/registry/syncrobotic/ui/route-progress"
import { TimeInput } from "@/registry/syncrobotic/ui/time-picker"

// These pin the behaviour of components whose "remember the last value" refs and prop-to-state effects became state set
// during render, so the React Compiler can keep them. Each change now lands in the render that brings it.

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe("the last note stays while its line closes", () => {
  it("Field keeps a fixed error's words, faded and hidden, and shows a new one at once", () => {
    const { rerender, container } = render(
      <Field label="Name" error="Required">
        <input />
      </Field>,
    )
    expect(screen.getByText("Required")).toBeTruthy()
    rerender(
      <Field label="Name">
        <input />
      </Field>,
    )
    const note = screen.getByText("Required").closest("p")!
    expect(note.className).toContain("opacity-0")
    expect(note.closest("[aria-hidden]")?.getAttribute("aria-hidden")).toBe("true")
    expect(container.querySelector("input")!.getAttribute("aria-describedby")).toBeNull()
    rerender(
      <Field label="Name" hint="As on the badge">
        <input />
      </Field>,
    )
    expect(screen.queryByText("Required")).toBeNull()
    expect(screen.getByText("As on the badge").closest("p")!.className).not.toContain("opacity-0")
  })

  it("FieldSet does the same", () => {
    const { rerender } = render(
      <FieldSet legend="Alerts" error="Pick one">
        <span />
      </FieldSet>,
    )
    rerender(
      <FieldSet legend="Alerts">
        <span />
      </FieldSet>,
    )
    expect(screen.getByText("Pick one").closest("p")!.className).toContain("opacity-0")
  })
})

describe("usePresence", () => {
  it("is leaving once hidden, done unmounts it, and showing again mounts it in that render", () => {
    const { result, rerender } = renderHook(({ show }) => usePresence(show), { initialProps: { show: true } })
    expect(result.current).toMatchObject({ mounted: true, leaving: false })
    rerender({ show: false })
    expect(result.current).toMatchObject({ mounted: true, leaving: true })
    act(() => void result.current.done())
    expect(result.current).toMatchObject({ mounted: false, leaving: false })
    rerender({ show: true })
    expect(result.current).toMatchObject({ mounted: true, leaving: false })
  })
})

describe("RouteProgress", () => {
  it("appears after the delay and leaves in the same render the page comes in", () => {
    vi.useFakeTimers()
    const { rerender } = render(<RouteProgress active delay={300} />)
    expect(screen.queryByRole("progressbar")).toBeNull()
    act(() => void vi.advanceTimersByTime(300))
    expect(screen.getByRole("progressbar")).toBeTruthy()
    rerender(<RouteProgress active={false} delay={300} />)
    expect(screen.queryByRole("progressbar")).toBeNull()
  })
})

describe("useDebouncedCallback", () => {
  it("a new delay gives a new function and drops the call the old one was holding", () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const { result, rerender } = renderHook(({ delay }) => useDebouncedCallback(fn, delay), { initialProps: { delay: 300 } })
    const first = result.current
    act(() => result.current("x"))
    rerender({ delay: 500 })
    expect(result.current).not.toBe(first)
    act(() => void vi.advanceTimersByTime(1000))
    expect(fn).not.toHaveBeenCalled()
    act(() => result.current("y"))
    act(() => void vi.advanceTimersByTime(500))
    expect(fn).toHaveBeenCalledWith("y")
  })
})

describe("props that reset local state", () => {
  const robots = [
    { value: "a", label: "Atlas" },
    { value: "b", label: "Bolt" },
  ]

  it("Autocomplete writes a new selection's label into the field", () => {
    const { rerender } = render(<Autocomplete aria-label="Robot" options={robots} value="a" />)
    const input = screen.getByRole("combobox") as HTMLInputElement
    expect(input.value).toBe("Atlas")
    rerender(<Autocomplete aria-label="Robot" options={robots} value="b" />)
    expect(input.value).toBe("Bolt")
  })

  it("TimeInput rewrites its text for a new value or clock", () => {
    const { rerender, container } = render(<TimeInput aria-label="Start" value="14:30" />)
    const input = container.querySelector("input")!
    expect(input.value).toBe("14:30")
    rerender(<TimeInput aria-label="Start" value="09:05" />)
    expect(input.value).toBe("09:05")
    rerender(<TimeInput aria-label="Start" value="09:05" hour12 />)
    expect(input.value).not.toBe("09:05")
    expect(input.value).toMatch(/9:05/)
  })

  it("CameraFeed starts over on a new source: connecting until its first frame", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
    const { rerender, container } = render(<CameraFeed label="Front camera" src="/a.webm" />)
    const root = screen.getByRole("region", { name: "Front camera" })
    act(() => void container.querySelector("video")!.dispatchEvent(new Event("timeupdate")))
    expect(root.getAttribute("data-state")).toBe("live")
    rerender(<CameraFeed label="Front camera" src="/b.webm" />)
    expect(root.getAttribute("data-state")).toBe("connecting")
  })

  it("MediaPlayer takes a duration hint that arrives later, and only while the length is unknown", () => {
    const { rerender, container } = render(<MediaPlayer label="Clip" src="/clip.webm" />)
    const total = () => container.querySelector("[data-slot=media-player-total]")!.textContent
    expect(total()).toBe("–:––")
    rerender(<MediaPlayer label="Clip" src="/clip.webm" duration={90} />)
    expect(total()).toBe("1:30")
    rerender(<MediaPlayer label="Clip" src="/clip.webm" duration={60} />)
    expect(total()).toBe("1:30")
  })

  it("NotificationCenter replaces its list when the product passes a new one", () => {
    const { rerender } = render(<NotificationCenter now={sampleNow} notifications={sampleNotifications} />)
    expect(screen.getByRole("button", { name: /Notifications, 3 unread/ })).toBeTruthy()
    rerender(<NotificationCenter now={sampleNow} notifications={sampleNotifications.map((n) => ({ ...n, read: true }))} />)
    expect(screen.getByRole("button", { name: "Notifications" })).toBeTruthy()
  })
})

describe("ListDetail", () => {
  const screenWidth = (wide: boolean) =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) => ({ matches: wide && q.includes("min-width"), media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    )

  it("opens on the first robot on a wide screen", () => {
    screenWidth(true)
    render(<ListDetail />)
    const detail = screen.getByRole("region", { name: "Robot detail" })
    expect(within(detail).getByRole("heading", { level: 2 })).toBeTruthy()
  })

  it("starts on the list on a phone", () => {
    screenWidth(false)
    render(<ListDetail />)
    const detail = screen.getByRole("region", { name: "Robot detail" })
    expect(within(detail).queryByRole("heading", { level: 2 })).toBeNull()
  })
})
