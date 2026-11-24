import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ErrorPage, LoadingPage, NoAccessPage, NotFoundPage, OfflinePage } from "@/registry/syncrobotic/blocks/status-pages"
import * as zh from "@/registry/syncrobotic/lib/labels-zh-tw"

afterEach(cleanup)

// Issue #323 (and #345): inside a product's frame a status page needs an h1, links out, and its words translated.
describe("status pages", () => {
  it("keeps today's output by default: a main with an h1, buttons that call back", () => {
    const onPrimary = vi.fn()
    const { container } = render(<NotFoundPage onPrimary={onPrimary} />)
    expect(container.querySelector("main")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 1, name: "This page does not exist" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Go to overview" }))
    expect(onPrimary).toHaveBeenCalledOnce()
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy()
  })

  it("inside a frame is a section, never a second main, with an h2 unless `as` says h1", () => {
    const { container, rerender } = render(<NotFoundPage fill="parent" />)
    expect(container.querySelector("main")).toBeNull()
    expect(container.querySelector("section")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 2 })).toBeTruthy()
    rerender(<NotFoundPage fill="parent" as="h1" />)
    expect(container.querySelector("main")).toBeNull()
    expect(screen.getByRole("heading", { level: 1, name: "This page does not exist" })).toBeTruthy()
  })

  it("renders `{ label, href }` as a link through linkAs, and `{ label, onClick }` as a button", () => {
    const RouterLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>(function RouterLink(p, ref) {
      return <a ref={ref} data-router="" {...p} />
    })
    const search = vi.fn()
    render(<NotFoundPage fill="parent" as="h1" primary={{ label: "Home", href: "/" }} secondary={{ label: "Find", onClick: search }} linkAs={RouterLink} />)
    const home = screen.getByRole("link", { name: "Home" })
    expect(home.getAttribute("href")).toBe("/")
    expect(home.hasAttribute("data-router")).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Find" }))
    expect(search).toHaveBeenCalledOnce()
  })

  it("is a plain anchor without linkAs, and leaves the secondary out with null", () => {
    render(<ErrorPage primary={{ label: "Status page", href: "https://status.example.com" }} secondary={null} />)
    expect(screen.getByRole("link", { name: "Status page" }).tagName).toBe("A")
    expect(screen.queryByRole("button", { name: "Copy reference" })).toBeNull()
  })

  it("says every word through labels, and the zh-TW pack covers each page", () => {
    render(
      <>
        <NotFoundPage fill="parent" labels={zh.notFoundPageLabels} />
        <NoAccessPage fill="parent" role="檢視者" labels={zh.noAccessPageLabels} />
        <ErrorPage fill="parent" labels={zh.errorPageLabels} />
        <OfflinePage fill="parent" labels={zh.offlinePageLabels} />
        <LoadingPage fill="parent" labels={zh.loadingPageLabels} />
      </>,
    )
    expect(screen.getByRole("heading", { name: "這個頁面不存在" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "前往總覽" })).toBeTruthy()
    expect(screen.getByText("你的角色（檢視者）無法開啟這個頁面，你的站台管理員可以變更。")).toBeTruthy()
    expect(screen.getByRole("button", { name: "複製參考碼" })).toBeTruthy()
    expect(screen.getByText("離線")).toBeTruthy()
    expect(screen.getByText("在線機器人")).toBeTruthy()
  })

  it("lets one label change while the rest keep their English defaults", () => {
    render(<NoAccessPage fill="parent" admin="Ana" labels={{ title: "Restricted" }} />)
    expect(screen.getByRole("heading", { name: "Restricted" })).toBeTruthy()
    expect(screen.getByText("Your role (Viewer) cannot open this page. Ana can change it.")).toBeTruthy()
  })
})
