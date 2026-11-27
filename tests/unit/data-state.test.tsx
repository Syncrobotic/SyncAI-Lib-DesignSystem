import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { dataStateLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { DataState, dataStateOf } from "@/registry/syncrobotic/ui/data-state"

afterEach(cleanup)

const status = () => document.querySelector("[data-slot=data-state] > p[role=status]")!.textContent

describe("DataState", () => {
  it("shows the content when ready, and nothing else", () => {
    render(<DataState state="ready">rows</DataState>)
    expect(screen.getByText("rows")).toBeTruthy()
    expect(status()).toBe("")
  })

  it("loading: says what is coming, busy, no content", () => {
    render(
      <DataState state="loading" labels={{ loading: "Loading devices…" }}>
        rows
      </DataState>,
    )
    expect(screen.getByText("Loading devices…")).toBeTruthy()
    expect(screen.queryByText("rows")).toBeNull()
    expect(document.querySelector("[data-slot=data-state]")!.getAttribute("aria-busy")).toBe("true")
  })

  it("error: copy from the code, the code shown, the message never shown", () => {
    const retry = vi.fn()
    render(<DataState state="error" error={{ code: "RATE_LIMITED", message: "ThrottlerException: Too Many Requests" }} onRetry={retry} />)
    expect(screen.getByText(/Too many requests in a short time/)).toBeTruthy()
    expect(screen.getByText("Code: RATE_LIMITED")).toBeTruthy()
    expect(screen.queryByText(/ThrottlerException/)).toBeNull()
    expect(status()).toBe("This did not load")
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("error: an unknown code falls back to the general sentence; a product adds its own codes", () => {
    const { rerender } = render(<DataState state="error" error={{ code: "PROJECT_ARCHIVED" }} />)
    expect(screen.getByText(/Something went wrong on our side/)).toBeTruthy()
    expect(screen.queryByRole("button")).toBeNull()
    rerender(<DataState state="error" error={{ code: "PROJECT_ARCHIVED" }} labels={{ errors: { PROJECT_ARCHIVED: "This project is archived." } }} />)
    expect(screen.getByText("This project is archived.")).toBeTruthy()
    // The defaults for other codes stay.
    rerender(<DataState state="error" error={{ code: "NETWORK_ERROR" }} labels={{ errors: { PROJECT_ARCHIVED: "x" } }} />)
    expect(screen.getByText(/could not reach the server/)).toBeTruthy()
  })

  it("empty and forbidden take their own words", () => {
    const { rerender } = render(<DataState state="empty" empty={{ title: "No devices in this project", action: <button>Register a device</button> }} />)
    expect(screen.getAllByText("No devices in this project").length).toBe(2)
    expect(screen.getByRole("button", { name: "Register a device" })).toBeTruthy()
    expect(status()).toBe("No devices in this project")
    rerender(<DataState state="forbidden" forbidden={{ description: "Needs apiKeys:read." }} />)
    expect(screen.getAllByText("You do not have access to this").length).toBe(2)
    expect(screen.getByText("Needs apiKeys:read.")).toBeTruthy()
  })

  it("stale keeps the content under a notice with the time and Try again", () => {
    const retry = vi.fn()
    render(
      <DataState state="stale" updatedAt="14:02:31" onRetry={retry}>
        rows
      </DataState>,
    )
    expect(screen.getByText("rows")).toBeTruthy()
    expect(screen.getAllByText("Showing data from 14:02:31. It may be out of date.").length).toBe(2)
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("speaks Traditional Chinese through dataStateLabels", () => {
    render(<DataState state="error" error={{ code: "NETWORK_ERROR" }} onRetry={() => {}} labels={dataStateLabels} />)
    expect(screen.getAllByText("無法載入").length).toBe(2)
    expect(screen.getByText("錯誤代碼：NETWORK_ERROR")).toBeTruthy()
    expect(screen.getByRole("button", { name: "再試一次" })).toBeTruthy()
  })
})

describe("dataStateOf", () => {
  it("forbidden wins, an error with data is stale, empty only when nothing is loading", () => {
    expect(dataStateOf({ forbidden: true, error: new Error(), loading: true })).toBe("forbidden")
    expect(dataStateOf({ error: new Error(), hasData: true })).toBe("stale")
    expect(dataStateOf({ error: new Error() })).toBe("error")
    expect(dataStateOf({ loading: true })).toBe("loading")
    expect(dataStateOf({ loading: true, hasData: true })).toBe("ready")
    expect(dataStateOf({ hasData: true, empty: true })).toBe("empty")
    expect(dataStateOf({ hasData: true, stale: true })).toBe("stale")
    expect(dataStateOf({ hasData: true })).toBe("ready")
  })
})
