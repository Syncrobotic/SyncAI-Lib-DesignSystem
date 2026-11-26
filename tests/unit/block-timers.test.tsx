import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SignIn } from "@/registry/syncrobotic/blocks/sign-in"

// A block's sample reply is a timer; one left running fires on a page that is gone (it failed a test run once, after every
// test had passed). scripts/check-rules.mjs keeps the handle stored; this checks it is cleared.
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("a block's sample reply", () => {
  it("is cleared when the block unmounts before it answers", () => {
    vi.useFakeTimers()
    const onSignIn = vi.fn()
    const { unmount } = render(<SignIn onSignIn={onSignIn} />)
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "mei.lin@example.com" } })
    fireEvent.submit(screen.getByLabelText("Work email").closest("form")!)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    act(() => vi.runAllTimers())
    expect(onSignIn).not.toHaveBeenCalled()
  })

  it("still answers while the block is there", () => {
    vi.useFakeTimers()
    const onSignIn = vi.fn()
    render(<SignIn onSignIn={onSignIn} />)
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "mei.lin@example.com" } })
    fireEvent.submit(screen.getByLabelText("Work email").closest("form")!)
    act(() => vi.advanceTimersByTime(600))
    expect(onSignIn).toHaveBeenCalledWith("email", "mei.lin@example.com")
  })
})
