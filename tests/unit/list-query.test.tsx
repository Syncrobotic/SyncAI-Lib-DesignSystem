import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { historyAdapter, memoryAdapter, useListQuery } from "@/registry/syncrobotic/hooks/use-list-query"
import { clampPage, pageCount, pageRange, parseListQuery, serializeListQuery } from "@/registry/syncrobotic/lib/list-query"

afterEach(cleanup)

describe("parseListQuery", () => {
  it("reads the five fields, with page 1 and limit 20 when absent", () => {
    expect(parseListQuery("")).toEqual({ page: 1, limit: 20 })
    expect(parseListQuery("?page=3&limit=50&sortBy=name&order=desc&search=%20gate%20")).toEqual({ page: 3, limit: 50, sortBy: "name", order: "desc", search: "gate" })
  })

  it("falls back to the defaults on anything malformed, so a bad link still opens a page", () => {
    expect(parseListQuery("page=0&limit=-5&order=sideways&search=")).toEqual({ page: 1, limit: 20 })
    expect(parseListQuery("page=2.5&limit=abc")).toEqual({ page: 1, limit: 20 })
    expect(parseListQuery("limit=500")).toEqual({ page: 1, limit: 20 })
    expect(parseListQuery("limit=500", { maxLimit: 1000 }).limit).toBe(500)
  })

  it("keeps only sortable columns and takes defaults from the options", () => {
    expect(parseListQuery("sortBy=secret", { sortable: ["name"] }).sortBy).toBeUndefined()
    expect(parseListQuery("", { defaults: { limit: 10, sortBy: "name", order: "asc" } })).toEqual({ page: 1, limit: 10, sortBy: "name", order: "asc" })
  })

  it("reads a framework's searchParams object and renamed keys", () => {
    expect(parseListQuery({ q: "dock", page: ["2", "9"], other: undefined }, { keys: { search: "q" } })).toEqual({ page: 2, limit: 20, search: "dock" })
  })
})

describe("serializeListQuery", () => {
  it("leaves defaults out and keeps the other keys of the base", () => {
    expect(serializeListQuery({ page: 1, limit: 20 }).toString()).toBe("")
    expect(serializeListQuery({ page: 2, limit: 20, search: "gate" }, { base: "status=online&page=7" }).toString()).toBe("status=online&page=2&search=gate")
  })

  it("writes order only with a sortBy, and every field when complete", () => {
    expect(serializeListQuery({ page: 1, limit: 20, order: "desc" }).toString()).toBe("")
    expect(serializeListQuery({ page: 1, limit: 20, sortBy: "name", order: "desc" }).toString()).toBe("sortBy=name&order=desc")
    expect(serializeListQuery({ page: 1, limit: 20 }, { complete: true }).toString()).toBe("page=1&limit=20")
  })

  it("round-trips through parse with renamed keys", () => {
    const options = { keys: { search: "q" } }
    const q = { page: 4, limit: 50, sortBy: "lastSeenAt", order: "desc" as const, search: "line 2" }
    expect(parseListQuery(serializeListQuery(q, options), options)).toEqual(q)
  })
})

describe("page arithmetic", () => {
  it("counts pages from the total, never fewer than one", () => {
    expect(pageCount(0, 20)).toBe(1)
    expect(pageCount(41, 20)).toBe(3)
  })
  it("says which rows a page shows", () => {
    expect(pageRange({ page: 2, limit: 20 }, 135)).toEqual({ from: 21, to: 40 })
    expect(pageRange({ page: 7, limit: 20 }, 135)).toEqual({ from: 121, to: 135 })
    expect(pageRange({ page: 1, limit: 20 }, 0)).toEqual({ from: 0, to: 0 })
  })
  it("moves a page past the end back onto the last one", () => {
    expect(clampPage({ page: 9, limit: 20 }, 41)).toEqual({ page: 3, limit: 20 })
    const q = { page: 2, limit: 20 }
    expect(clampPage(q, 41)).toBe(q)
  })
})

describe("useListQuery", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("reads the query from the adapter", () => {
    const adapter = memoryAdapter("?page=2&sortBy=name")
    const { result } = renderHook(() => useListQuery({ adapter }))
    expect(result.current.query).toEqual({ page: 2, limit: 20, sortBy: "name" })
  })

  it("shows the typed text at once and writes it when typing pauses, back on page 1", () => {
    const adapter = memoryAdapter("page=3&status=online")
    const { result } = renderHook(() => useListQuery({ adapter }))
    act(() => result.current.setSearch("ga"))
    act(() => result.current.setSearch("gate"))
    expect(result.current.search).toBe("gate")
    expect(adapter.current()).toBe("page=3&status=online")
    act(() => void vi.advanceTimersByTime(300))
    expect(adapter.current()).toBe("status=online&search=gate")
    expect(result.current.query).toEqual({ page: 1, limit: 20, search: "gate" })
  })

  it("clears at once, without waiting", () => {
    const adapter = memoryAdapter("search=gate&page=2")
    const { result } = renderHook(() => useListQuery({ adapter }))
    expect(result.current.search).toBe("gate")
    act(() => result.current.setSearch(""))
    expect(adapter.current()).toBe("")
  })

  it("sorts ascending, flips on the same column, and goes back to page 1", () => {
    const adapter = memoryAdapter("page=4")
    const { result } = renderHook(() => useListQuery({ adapter }))
    act(() => result.current.setSort("name"))
    expect(adapter.current()).toBe("sortBy=name&order=asc")
    act(() => result.current.setSort("name"))
    expect(result.current.query).toMatchObject({ sortBy: "name", order: "desc", page: 1 })
    act(() => result.current.setPage(3))
    expect(result.current.query.page).toBe(3)
    act(() => result.current.setLimit(50))
    expect(result.current.query).toMatchObject({ page: 1, limit: 50 })
  })

  it("keeps another key beside the query, and a change of it resets the page", () => {
    const adapter = memoryAdapter("page=5")
    const { result } = renderHook(() => useListQuery({ adapter }))
    act(() => result.current.setParam("status", "offline"))
    expect(result.current.param("status")).toBe("offline")
    expect(result.current.query.page).toBe(1)
    act(() => result.current.setParam("status", null))
    expect(adapter.current()).toBe("")
  })

  it("takes a search the URL changes from outside (Back) into the box", () => {
    const adapter = memoryAdapter("search=gate")
    const { result } = renderHook(() => useListQuery({ adapter }))
    act(() => adapter.write("search=dock", "replace"))
    expect(result.current.search).toBe("dock")
    act(() => adapter.write("", "replace"))
    expect(result.current.search).toBe("")
  })

  it("resets every field and keeps other keys", () => {
    const adapter = memoryAdapter("page=2&limit=50&sortBy=name&order=desc&search=x&status=online")
    const { result } = renderHook(() => useListQuery({ adapter }))
    act(() => result.current.reset())
    expect(adapter.current()).toBe("status=online")
    expect(result.current.search).toBe("")
  })

  it("writes the browser's URL by default, keeping the path and hash", () => {
    window.history.replaceState(null, "", "/devices?status=online#list")
    const { result } = renderHook(() => useListQuery())
    act(() => result.current.setPage(2))
    expect(window.location.pathname + window.location.search + window.location.hash).toBe("/devices?status=online&page=2#list")
    expect(result.current.query.page).toBe(2)
    expect(historyAdapter.readOnServer?.()).toBe("")
    window.history.replaceState(null, "", "/")
  })
})
