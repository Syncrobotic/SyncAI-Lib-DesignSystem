import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AuthTwoFactor, type TwoFactorResult } from "@/registry/syncrobotic/blocks/auth-2fa"
import { SettingsSessions, sampleSessions } from "@/registry/syncrobotic/blocks/settings-sessions"
import { SettingsWebhooks, sampleEndpoints } from "@/registry/syncrobotic/blocks/settings-webhooks"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const flush = () => act(async () => {})

describe("SettingsWebhooks", () => {
  it("checks the URL and the events before adding an endpoint", async () => {
    render(<SettingsWebhooks />)
    fireEvent.click(screen.getByRole("button", { name: "Add endpoint" }))
    const sheet = await screen.findByRole("dialog")
    const url = within(sheet).getByLabelText("Endpoint URL")
    fireEvent.change(url, { target: { value: "http://ops.example.com/hooks" } })
    fireEvent.click(within(sheet).getByRole("button", { name: "Add endpoint" }))
    expect(within(sheet).getByText(/Use https:\/\//)).toBeTruthy()
    expect(url.getAttribute("aria-invalid")).toBe("true")
    fireEvent.change(url, { target: { value: "https://ops.example.com/hooks/new" } })
    for (const box of within(sheet).getAllByRole("checkbox", { checked: true })) fireEvent.click(box)
    fireEvent.click(within(sheet).getByRole("button", { name: "Add endpoint" }))
    expect(within(sheet).getByText("Choose at least one event to send.")).toBeTruthy()
  })

  it("shows a new endpoint's signing secret once, with a copy button, and never again", async () => {
    render(<SettingsWebhooks />)
    fireEvent.click(screen.getByRole("button", { name: "Add endpoint" }))
    const sheet = await screen.findByRole("dialog")
    fireEvent.change(within(sheet).getByLabelText("Endpoint URL"), { target: { value: "https://ops.example.com/hooks/new" } })
    fireEvent.click(within(sheet).getByRole("button", { name: "Add endpoint" }))
    await flush()
    expect(screen.getByText(/Copy the signing secret now/)).toBeTruthy()
    expect(screen.getByText(/You will not see it again/)).toBeTruthy()
    expect(screen.getByRole("button", { name: "Copy the signing secret" })).toBeTruthy()
    // Hidden behind dots until Show is pressed.
    expect(document.body.textContent).not.toMatch(/whsec_/)
    fireEvent.click(screen.getByRole("button", { name: "Show value" }))
    expect(document.body.textContent).toMatch(/whsec_/)
    fireEvent.click(screen.getByRole("button", { name: "Done, I have copied it" }))
    expect(document.body.textContent).not.toMatch(/whsec_/)
    expect(screen.queryByRole("button", { name: "Copy the signing secret" })).toBeNull()
    // The new endpoint is chosen, with nothing delivered yet.
    expect(screen.getByRole("heading", { name: "Recent deliveries" })).toBeTruthy()
    expect(screen.getByText("No deliveries yet")).toBeTruthy()
  })

  it("marks a failing endpoint in words and opens a failed delivery to its response", () => {
    render(<SettingsWebhooks />)
    // Only the word Failing is in danger; since when and the last error are grey details beside it.
    const word = screen.getByText("Failing")
    expect(word.className).toContain("text-danger")
    expect(word.parentElement?.textContent).toBe("Failing since Today, 09:15 · Last error: 503 Service Unavailable")
    expect(word.parentElement?.className ?? "").not.toContain("text-danger")
    const failed = screen.getByRole("button", { name: /502.*failed/ })
    expect(failed.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(failed)
    expect(failed.getAttribute("aria-expanded")).toBe("true")
    expect(document.getElementById(failed.getAttribute("aria-controls")!)?.textContent).toMatch(/upstream ticketing service unavailable/)
  })

  it("rotating shows the new secret once", async () => {
    render(<SettingsWebhooks />)
    fireEvent.click(screen.getByRole("button", { name: "Rotate secret" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/both the old and the new secret/)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole("button", { name: "Rotate secret" }))
    await flush()
    expect(screen.getByText(/Copy the new signing secret now/)).toBeTruthy()
  })

  it("deletes only after the host is typed", async () => {
    render(<SettingsWebhooks />)
    fireEvent.click(screen.getByRole("button", { name: "Delete endpoint" }))
    const dialog = await screen.findByRole("alertdialog")
    const confirm = within(dialog).getByRole("button", { name: "Delete endpoint" }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    fireEvent.change(within(dialog).getByLabelText("Type ops.example.com to confirm"), { target: { value: "ops.example.com" } })
    expect(confirm.disabled).toBe(false)
    fireEvent.click(confirm)
    await flush()
    expect(screen.queryByText("https://ops.example.com/hooks/fleet-events")).toBeNull()
    expect(screen.getByRole("status").textContent).toBe("Deleted the endpoint at ops.example.com.")
  })

  it("sends a test event and lists its delivery", async () => {
    vi.useFakeTimers()
    render(<SettingsWebhooks />)
    fireEvent.click(screen.getByRole("button", { name: "Send test event" }))
    await act(async () => void vi.advanceTimersByTime(800))
    expect(screen.getByText("ping")).toBeTruthy()
    expect(screen.getByText("Test event delivered: 200 in 164 ms.")).toBeTruthy()
  })

  it("has empty, loading and error states", () => {
    const onRetry = vi.fn()
    const { rerender } = render(<SettingsWebhooks endpoints={[]} />)
    expect(screen.getByText("No webhooks yet")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add endpoint" })).toBeTruthy()
    rerender(<SettingsWebhooks key="l" endpoints={sampleEndpoints} state="loading" />)
    expect(screen.getByText("Loading webhooks…")).toBeTruthy()
    rerender(<SettingsWebhooks key="e" endpoints={sampleEndpoints} state="error" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalled()
  })
})

describe("SettingsSessions", () => {
  it("calls sessions browsers and marks this one", () => {
    render(<SettingsSessions />)
    const list = screen.getByRole("list", { name: "Signed-in browsers" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(sampleSessions.length)
    expect(within(list).getByText("This browser")).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/device/i)
    // This browser cannot be signed out from here; the others can.
    expect(screen.queryByRole("button", { name: /Sign out Chrome on macOS/ })).toBeNull()
  })

  it("signs one browser out at once", () => {
    render(<SettingsSessions />)
    fireEvent.click(screen.getByRole("button", { name: "Sign out Safari on iPhone, Taoyuan, Taiwan" }))
    expect(within(screen.getByRole("list", { name: "Signed-in browsers" })).queryByText("Safari on iPhone")).toBeNull()
    expect(screen.getByRole("status").textContent).toBe("Signed out Safari on iPhone.")
  })

  it("asks before signing out all other browsers, and keeps this one", async () => {
    render(<SettingsSessions />)
    fireEvent.click(screen.getByRole("button", { name: "Sign out all other browsers" }))
    let dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByRole("heading", { name: "Sign out of 3 browsers?" })).toBeTruthy()
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep them signed in" }))
    await flush()
    expect(within(screen.getByRole("list", { name: "Signed-in browsers" })).getAllByRole("listitem")).toHaveLength(4)

    fireEvent.click(screen.getByRole("button", { name: "Sign out all other browsers" }))
    dialog = await screen.findByRole("alertdialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Sign out 3 browsers" }))
    await flush()
    const left = within(screen.getByRole("list", { name: "Signed-in browsers" })).getAllByRole("listitem")
    expect(left).toHaveLength(1)
    expect(left[0].textContent).toContain("This browser")
    expect(screen.getByText("No other browsers are signed in.")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Sign out all other browsers" })).toBeNull()
  })

  it("forgets a remembered browser", () => {
    render(<SettingsSessions />)
    fireEvent.click(screen.getByRole("button", { name: "Forget Safari on iPhone" }))
    expect(within(screen.getByRole("list", { name: "Remembered browsers" })).getAllByRole("listitem")).toHaveLength(1)
    render(<SettingsSessions trusted={[]} />)
    expect(screen.getByText("No remembered browsers")).toBeTruthy()
  })
})

describe("AuthTwoFactor", () => {
  const code = () => screen.getByLabelText("6-digit code") as HTMLInputElement
  const type = (v: string) => fireEvent.change(code(), { target: { value: v } })
  const submit = () => fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }))

  it("asks for all six digits before checking", async () => {
    const onVerify = vi.fn()
    render(<AuthTwoFactor onVerify={onVerify} />)
    type("123")
    submit()
    await flush()
    expect(screen.getByText("Enter all 6 digits.")).toBeTruthy()
    expect(code().getAttribute("aria-invalid")).toBe("true")
    expect(onVerify).not.toHaveBeenCalled()
  })

  it("sends the code with the remember choice and signs in", async () => {
    const onVerify = vi.fn(async (): Promise<TwoFactorResult> => ({ ok: true }))
    const onSignedIn = vi.fn()
    render(<AuthTwoFactor onVerify={onVerify} onSignedIn={onSignedIn} />)
    type("123456")
    fireEvent.click(screen.getByRole("checkbox", { name: /Remember this browser for 30 days/ }))
    submit()
    await flush()
    expect(onVerify).toHaveBeenCalledWith("123456", "app", true)
    expect(onSignedIn).toHaveBeenCalled()
    expect(screen.getByRole("status").textContent).toBe("Verified. Opening Fleet console…")
  })

  it("says a wrong code in words, with the tries left, and keeps what was typed", async () => {
    render(<AuthTwoFactor onVerify={async () => ({ ok: false, reason: "wrong", attemptsLeft: 2 })} />)
    type("654321")
    submit()
    await flush()
    expect(screen.getByText(/That code did not match.*2 tries left\./)).toBeTruthy()
    expect(code().value).toBe("654321")
  })

  it("pauses after too many tries and counts down on the button", async () => {
    render(<AuthTwoFactor onVerify={async () => ({ ok: false, reason: "locked", retryAfter: 300 })} />)
    type("654321")
    submit()
    await flush()
    expect(screen.getByText(/Too many wrong codes.*try again in 5 minutes\./)).toBeTruthy()
    const button = screen.getByRole("button", { name: "Try again in 5:00" }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(code().disabled).toBe(true)
  })

  it("switches to a recovery code and checks its shape", async () => {
    const onVerify = vi.fn(async (): Promise<TwoFactorResult> => ({ ok: true }))
    render(<AuthTwoFactor onVerify={onVerify} />)
    fireEvent.click(screen.getByRole("button", { name: "Use a recovery code instead" }))
    const field = screen.getByLabelText("Recovery code")
    fireEvent.change(field, { target: { value: "7KQ2" } })
    submit()
    await flush()
    expect(screen.getByText(/8 letters and numbers, like 7KQ2-MV9T/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Use the code from your app" }))
    expect(screen.getByLabelText("6-digit code")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Use a recovery code instead" }))
    fireEvent.change(screen.getByLabelText("Recovery code"), { target: { value: "7kq2-mv9t" } })
    submit()
    await flush()
    expect(onVerify).toHaveBeenCalledWith("7KQ2-MV9T", "recovery", false)
  })

  it("offers a passkey unless the account has none, and says when this browser has none", async () => {
    const { unmount } = render(<AuthTwoFactor passkey={false} />)
    expect(screen.queryByRole("button", { name: "Use a passkey instead" })).toBeNull()
    unmount()
    render(<AuthTwoFactor onPasskey={async () => false} />)
    fireEvent.click(screen.getByRole("button", { name: "Use a passkey instead" }))
    await flush()
    expect(screen.getByText(/No passkey for Fleet console in this browser/)).toBeTruthy()
  })
})
