import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ToggleGroup, ToggleGroupItem } from "@/registry/syncrobotic/ui/toggle-group"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// Radix moves roving focus on the next tick after the key.
const press = (el: Element, key: string) =>
  act(() => {
    fireEvent.keyDown(el, { key })
    vi.runAllTimers()
  })

const items = ["Map", "Camera", "Lidar"].map((v) => (
  <ToggleGroupItem key={v} value={v.toLowerCase()}>
    {v}
  </ToggleGroupItem>
))

describe("ToggleGroup", () => {
  it("single: one radio checked at a time, reported through onValueChange", () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup type="single" aria-label="View" defaultValue="map" onValueChange={onValueChange}>
        {items}
      </ToggleGroup>,
    )
    expect(screen.getByRole("radiogroup", { name: "View" }).getAttribute("data-slot")).toBe("toggle-group")
    const map = screen.getByRole("radio", { name: "Map" })
    const camera = screen.getByRole("radio", { name: "Camera" })
    expect(map.getAttribute("aria-checked")).toBe("true")
    expect(map.getAttribute("data-slot")).toBe("toggle-group-item")
    act(() => fireEvent.click(camera))
    expect(onValueChange).toHaveBeenLastCalledWith("camera")
    expect(camera.getAttribute("aria-checked")).toBe("true")
    expect(camera.getAttribute("data-state")).toBe("on")
    expect(map.getAttribute("aria-checked")).toBe("false")
  })

  it("multiple: a toolbar of buttons with aria-pressed, any mix on", () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup type="multiple" aria-label="Layers" onValueChange={onValueChange}>
        {items}
      </ToggleGroup>,
    )
    expect(screen.getByRole("toolbar", { name: "Layers" })).toBeTruthy()
    const map = screen.getByRole("button", { name: "Map" })
    const lidar = screen.getByRole("button", { name: "Lidar" })
    act(() => fireEvent.click(map))
    act(() => fireEvent.click(lidar))
    expect(onValueChange).toHaveBeenLastCalledWith(["map", "lidar"])
    expect(map.getAttribute("aria-pressed")).toBe("true")
    expect(lidar.getAttribute("aria-pressed")).toBe("true")
    act(() => fireEvent.click(map))
    expect(map.getAttribute("aria-pressed")).toBe("false")
    expect(onValueChange).toHaveBeenLastCalledWith(["lidar"])
  })

  it("follows a controlled value", () => {
    const { rerender } = render(
      <ToggleGroup type="single" aria-label="View" value="map">
        {items}
      </ToggleGroup>,
    )
    act(() => fireEvent.click(screen.getByRole("radio", { name: "Lidar" })))
    expect(screen.getByRole("radio", { name: "Map" }).getAttribute("aria-checked")).toBe("true")
    rerender(
      <ToggleGroup type="single" aria-label="View" value="lidar">
        {items}
      </ToggleGroup>,
    )
    expect(screen.getByRole("radio", { name: "Lidar" }).getAttribute("aria-checked")).toBe("true")
  })

  it("moves focus with the arrow keys (roving tabindex), wrapping at the ends", () => {
    vi.useFakeTimers()
    render(
      <ToggleGroup type="single" aria-label="View" defaultValue="map">
        {items}
      </ToggleGroup>,
    )
    const [map, camera, lidar] = screen.getAllByRole("radio")
    // One tab stop: the group takes it and hands focus to the item that is on.
    act(() => screen.getByRole("radiogroup").focus())
    expect(document.activeElement).toBe(map)
    press(map!, "ArrowRight")
    expect(document.activeElement).toBe(camera)
    press(camera!, "End")
    expect(document.activeElement).toBe(lidar)
    press(lidar!, "ArrowRight")
    expect(document.activeElement).toBe(map)
  })

  it("lays out vertically, and Down moves focus", () => {
    vi.useFakeTimers()
    render(
      <ToggleGroup type="single" aria-label="View" orientation="vertical">
        {items}
      </ToggleGroup>,
    )
    const group = screen.getByRole("radiogroup")
    expect(group.getAttribute("data-orientation")).toBe("vertical")
    expect(group.className).toContain("flex-col")
    const [map, camera] = screen.getAllByRole("radio")
    act(() => map!.focus())
    press(map!, "ArrowDown")
    expect(document.activeElement).toBe(camera)
  })
})
