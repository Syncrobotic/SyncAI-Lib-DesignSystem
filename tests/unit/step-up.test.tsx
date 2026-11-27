import * as React from "react"
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { errorCodeOf, isStepUpCancelled, StepUpCancelledError, type StepUpProof, useStepUp } from "@/registry/syncrobotic/hooks/use-step-up"
import { stepUpDialogLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { StepUpDialog } from "@/registry/syncrobotic/ui/step-up-dialog"

afterEach(cleanup)

const refused = (code: string) => ({ statusCode: 403, message: "Forbidden", error: { code, message: "Elevation required" } })

describe("errorCodeOf", () => {
  it("reads the code, or the envelope's error.code, never the message", () => {
    expect(errorCodeOf({ code: "A" })).toBe("A")
    expect(errorCodeOf(refused("ELEVATED_SESSION_REQUIRED"))).toBe("ELEVATED_SESSION_REQUIRED")
    expect(errorCodeOf({ body: { error: { code: "B" } } })).toBe("B")
    expect(errorCodeOf({ details: { code: "C" } })).toBe("C")
    expect(errorCodeOf(new Error("ELEVATED_SESSION_REQUIRED"))).toBeUndefined()
    expect(errorCodeOf(null)).toBeUndefined()
  })
})

describe("useStepUp", () => {
  const verify = vi.fn(async (_: StepUpProof) => {})

  it("passes results and other errors straight through", async () => {
    const { result } = renderHook(() => useStepUp({ verify }))
    await expect(result.current.run(async () => 7)).resolves.toBe(7)
    await expect(result.current.run(async () => Promise.reject(refused("LAST_OWNER")))).rejects.toMatchObject({ error: { code: "LAST_OWNER" } })
    expect(result.current.dialog.open).toBe(false)
  })

  it("holds the action on a step-up code and replays it once verified", async () => {
    let elevated = false
    const action = vi.fn(async () => {
      if (!elevated) throw refused("ELEVATED_SESSION_REQUIRED")
      return "revoked"
    })
    const { result } = renderHook(() => useStepUp({ verify }))
    let done!: Promise<string>
    await act(async () => {
      done = result.current.run(action)
    })
    expect(result.current.dialog).toMatchObject({ open: true, setup: false })
    expect(result.current.code).toBe("ELEVATED_SESSION_REQUIRED")
    elevated = true
    await act(async () => result.current.dialog.onVerified())
    await expect(done).resolves.toBe("revoked")
    expect(action).toHaveBeenCalledTimes(2)
    expect(result.current.dialog.open).toBe(false)
  })

  it("rejects with StepUpCancelledError on cancel, and the action never runs again", async () => {
    const action = vi.fn(async () => Promise.reject(refused("TWO_FACTOR_SETUP_REQUIRED")))
    const { result } = renderHook(() => useStepUp({ verify }))
    let done!: Promise<unknown>
    await act(async () => {
      done = result.current.run(action)
    })
    expect(result.current.dialog.setup).toBe(true)
    act(() => result.current.dialog.onCancel())
    const error = await done.catch((e: unknown) => e)
    expect(isStepUpCancelled(error)).toBe(true)
    expect(error).toBeInstanceOf(StepUpCancelledError)
    expect(action).toHaveBeenCalledOnce()
  })

  it("takes its codes from options", async () => {
    const { result } = renderHook(() => useStepUp({ verify, codes: ["SUDO"] }))
    await act(async () => {
      void result.current.run(async () => Promise.reject({ code: "SUDO" }))
    })
    expect(result.current.dialog.open).toBe(true)
    await expect(result.current.run(async () => Promise.reject(refused("ELEVATED_SESSION_REQUIRED")))).rejects.toBeTruthy()
  })
})

function Harness({ verify, ...props }: { verify: (p: StepUpProof) => Promise<void> } & Partial<React.ComponentProps<typeof StepUpDialog>>) {
  const [open, setOpen] = React.useState(true)
  return (
    <>
      <p data-testid="open">{String(open)}</p>
      <StepUpDialog open={open} verify={verify} onVerified={() => setOpen(false)} onCancel={() => setOpen(false)} {...props} />
    </>
  )
}

const code = () => screen.getByRole("textbox", { name: "6-digit code" }) as HTMLInputElement
const typeCode = (value: string) => act(() => void fireEvent.change(code(), { target: { value } }))

describe("StepUpDialog", () => {
  it("opens with focus in the code field and verifies on the sixth digit, once", async () => {
    const verify = vi.fn(async () => {})
    const onVerified = vi.fn()
    render(<Harness verify={verify} onVerified={onVerified} />)
    await waitFor(() => expect(document.activeElement).toBe(code()))
    // The sixth digit sends it; an Enter right behind it must not send the code again.
    act(() => {
      fireEvent.change(code(), { target: { value: "123456" } })
      fireEvent.submit(code().closest("form")!)
    })
    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce())
    expect(verify).toHaveBeenCalledOnce()
    expect(verify).toHaveBeenCalledWith({ method: "totp", value: "123456" })
  })

  it("on a refusal says why from its code, clears the field and focuses it", async () => {
    const verify = vi.fn(async () => Promise.reject({ error: { code: "INVALID_CODE", message: "bad" } }))
    render(<Harness verify={verify} />)
    await typeCode("111111")
    const alert = await screen.findByRole("alert")
    expect(alert.textContent).toMatch(/That code is not right/)
    expect(code().value).toBe("")
    expect(code().getAttribute("aria-invalid")).toBe("true")
    expect(code().getAttribute("aria-describedby")).toBe(alert.id)
    expect(document.activeElement).toBe(code())
    expect(screen.getByTestId("open").textContent).toBe("true")
  })

  it("an unknown failure code gets the general message", async () => {
    render(<Harness verify={async () => Promise.reject(new Error("boom"))} />)
    await typeCode("111111")
    expect((await screen.findByRole("alert")).textContent).toBe("That did not work. Try again.")
  })

  it("offers the password, and switches between the methods", async () => {
    const verify = vi.fn(async () => {})
    render(<Harness verify={verify} methods={["totp", "password"]} />)
    fireEvent.click(screen.getByRole("button", { name: "Use your password instead" }))
    const password = screen.getByLabelText("Password") as HTMLInputElement
    expect(password.type).toBe("password")
    fireEvent.change(password, { target: { value: "correct horse" } })
    fireEvent.click(screen.getByRole("button", { name: "Verify" }))
    await waitFor(() => expect(verify).toHaveBeenCalledWith({ method: "password", value: "correct horse" }))
    expect(screen.getByTestId("open").textContent).toBe("false")
  })

  it("returns focus to the control that started the action when it closes", async () => {
    function Opener() {
      const [open, setOpen] = React.useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Revoke key</button>
          <StepUpDialog open={open} verify={async () => {}} onVerified={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </>
      )
    }
    render(<Opener />)
    const trigger = screen.getByRole("button", { name: "Revoke key" })
    trigger.focus()
    fireEvent.click(trigger)
    await waitFor(() => expect(document.activeElement).toBe(code()))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it("Cancel and Esc cancel", () => {
    const onCancel = vi.fn()
    render(<StepUpDialog open verify={async () => {}} onVerified={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it("setup: no field, offers the setup and cancels the action", () => {
    const onCancel = vi.fn()
    const onSetup = vi.fn()
    render(<StepUpDialog open setup verify={async () => {}} onVerified={() => {}} onCancel={onCancel} onSetup={onSetup} />)
    expect(screen.getByRole("dialog", { name: "Turn on two-step verification" })).toBeTruthy()
    expect(screen.queryByRole("textbox")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Set up two-step verification" }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onSetup).toHaveBeenCalledOnce()
  })

  it("speaks Traditional Chinese through stepUpDialogLabels", () => {
    render(<StepUpDialog open verify={async () => {}} onVerified={() => {}} onCancel={() => {}} labels={stepUpDialogLabels} />)
    expect(screen.getByRole("dialog", { name: "確認是你本人" })).toBeTruthy()
    expect(screen.getByRole("textbox", { name: "6 位數驗證碼" })).toBeTruthy()
  })
})
