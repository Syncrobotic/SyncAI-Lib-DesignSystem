import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/syncrobotic/ui/hover-card"

afterEach(cleanup)

const wait = (ms: number) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })

function RobotLink() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#robots/9C44">9C44</a>
      </HoverCardTrigger>
      <HoverCardContent>
        <p>Patrol dog 9C44</p>
      </HoverCardContent>
    </HoverCard>
  )
}

describe("HoverCard", () => {
  it("keeps the trigger a plain link, to the page that has the same facts", () => {
    render(<RobotLink />)
    const link = screen.getByRole("link", { name: "9C44" })
    expect(link.getAttribute("href")).toBe("#robots/9C44")
  })

  it("opens on keyboard focus after its delay, and closes on blur", async () => {
    render(<RobotLink />)
    const link = screen.getByRole("link", { name: "9C44" })
    fireEvent.focus(link)
    await wait(200)
    expect(screen.queryByText("Patrol dog 9C44")).toBeNull()
    await wait(400)
    expect(screen.getByText("Patrol dog 9C44")).toBeTruthy()
    fireEvent.blur(link)
    await wait(400)
    expect(screen.queryByText("Patrol dog 9C44")).toBeNull()
  })

  it("closes on Esc", async () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <a href="#robots/9C44">9C44</a>
        </HoverCardTrigger>
        <HoverCardContent>
          <p>Patrol dog 9C44</p>
        </HoverCardContent>
      </HoverCard>,
    )
    expect(screen.getByText("Patrol dog 9C44")).toBeTruthy()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await wait(50)
    expect(screen.queryByText("Patrol dog 9C44")).toBeNull()
  })
})
