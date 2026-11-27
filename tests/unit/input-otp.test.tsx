import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS } from "@/registry/syncrobotic/ui/input-otp"

afterEach(cleanup)

type CodeProps = { value?: string; defaultValue?: string; onChange?: (v: string) => void; onComplete?: (v: string) => void }

function Code(props: CodeProps) {
  return (
    <InputOTP aria-label="Pairing code" maxLength={4} pattern={REGEXP_ONLY_DIGITS} {...props}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  )
}

const slots = () => Array.from(document.querySelectorAll("[data-slot=input-otp-slot]")).map((s) => s.textContent)
const type = (value: string) => act(() => void fireEvent.change(screen.getByRole("textbox"), { target: { value } }))

describe("InputOTP", () => {
  it("is one labelled textbox for one-time codes, with maxLength", () => {
    render(<Code />)
    const input = screen.getByRole("textbox", { name: "Pairing code" })
    expect(input.getAttribute("autocomplete")).toBe("one-time-code")
    expect(input.getAttribute("maxlength")).toBe("4")
    expect(input.getAttribute("data-slot")).toBe("input-otp")
    expect(screen.getByRole("separator")).toBeTruthy()
  })

  it("fills one slot per character and reports onChange and onComplete when uncontrolled", () => {
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(<Code defaultValue="1" onChange={onChange} onComplete={onComplete} />)
    expect(slots()).toEqual(["1", "", "", ""])
    type("12")
    expect(onChange).toHaveBeenLastCalledWith("12")
    expect(slots()).toEqual(["1", "2", "", ""])
    type("1234")
    expect(slots()).toEqual(["1", "2", "3", "4"])
    expect(onComplete).toHaveBeenCalledWith("1234")
  })

  it("rejects characters outside the pattern", () => {
    const onChange = vi.fn()
    render(<Code onChange={onChange} />)
    type("1a")
    expect(onChange).not.toHaveBeenCalled()
    expect(slots()).toEqual(["", "", "", ""])
  })

  it("follows a controlled value", () => {
    const onChange = vi.fn()
    const { rerender } = render(<Code value="12" onChange={onChange} />)
    type("123")
    expect(onChange).toHaveBeenLastCalledWith("123")
    expect(slots()).toEqual(["1", "2", "", ""])
    rerender(<Code value="123" onChange={onChange} />)
    expect(slots()).toEqual(["1", "2", "3", ""])
  })

  it("ignores a key that would only swap the last character of a full code", () => {
    const onChange = vi.fn()
    render(<Code defaultValue="1234" onChange={onChange} />)
    type("1235")
    expect(onChange).not.toHaveBeenCalled()
    expect(slots()).toEqual(["1", "2", "3", "4"])
    type("123")
    expect(onChange).toHaveBeenLastCalledWith("123")
  })
})
