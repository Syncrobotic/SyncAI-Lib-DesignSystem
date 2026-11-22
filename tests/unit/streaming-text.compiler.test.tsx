import * as React from "react"
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { StreamingText, type StreamingTextPhase } from "@/registry/syncrobotic/ui/streaming-text?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own component) and the
// component imported with ?react-compiler, so these check that once compiled it still follows a text that grows chunk by
// chunk from a parent's state, reads the latest text aloud from its timer, and moves focus when Stop leaves.

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance", "Date"] })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

describe("compiled", () => {
  it("follows chunks appended in the parent's state and reads the newest sentences", () => {
    let push: (chunk: string) => void = () => {}
    let end: (phase: StreamingTextPhase) => void = () => {}
    function Panel() {
      const [text, setText] = React.useState("")
      const [phase, setPhase] = React.useState<StreamingTextPhase>("streaming")
      push = (chunk) => setText((t) => t + chunk)
      end = setPhase
      // Labels rebuilt every render, as product code often writes them.
      return <StreamingText text={text} phase={phase} labels={{ generating: "Writing" }} onStop={() => setPhase("stopped")} />
    }
    render(<Panel />)
    for (const chunk of ["The ", "dock ", "is ", "clear. ", "A ", "box"]) act(() => push(chunk))
    expect(document.querySelector("[data-slot=streaming-text-body]")!.textContent).toBe("The dock is clear. A box")
    expect(screen.getByRole("status").textContent).toBe("Writing")
    run(5000)
    expect(document.querySelector("[data-slot=streaming-text-announcer]")!.textContent).toBe("The dock is clear.")
    act(() => push(" sits left."))
    act(() => end("done"))
    run(0)
    expect(document.querySelector("[data-slot=streaming-text-announcer]")!.textContent).toBe("A box sits left.")
    expect(screen.getByRole("status").textContent).toBe("Done")
  })

  it("moves focus to the status words when Stop leaves", () => {
    function Panel() {
      const [phase, setPhase] = React.useState<StreamingTextPhase>("streaming")
      return <StreamingText text="Mostly" phase={phase} onStop={() => setPhase("stopped")} />
    }
    render(<Panel />)
    const stop = screen.getByRole("button", { name: "Stop generating" })
    act(() => stop.focus())
    act(() => stop.click())
    expect(document.activeElement).toBe(document.querySelector("[data-slot=streaming-text-words]"))
  })
})
