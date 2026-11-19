import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Tree, type TreeNode } from "@/registry/syncrobotic/ui/tree"

afterEach(cleanup)

const items: TreeNode[] = [
  {
    id: "images",
    label: "images",
    meta: "2",
    children: [
      { id: "a.jpg", label: "a.jpg" },
      { id: "b.jpg", label: "b.jpg" },
    ],
  },
  {
    id: "labels",
    label: "labels",
    children: [
      { id: "boxes.json", label: "boxes.json" },
      { id: "faces", label: "faces", disabled: true, meta: "No access" },
    ],
  },
  { id: "README.md", label: "README.md" },
  { id: "raw.tar", label: "raw.tar" },
]

// A node's name is its label, then its meta when it has one ("images 2").
const item = (label: string) => screen.getByRole("treeitem", { name: (n) => n === label || n.startsWith(`${label} `) })
const focused = () => (document.activeElement as HTMLElement).getAttribute("data-tree-id")
const key = (k: string) => fireEvent.keyDown(document.activeElement!, { key: k })

describe("Tree, list mode", () => {
  const lineage: TreeNode[] = [
    {
      id: "release",
      label: "Release v3",
      href: "/r/v3",
      children: [
        { id: "labels", label: "Box labels", href: "/l/box" },
        { id: "again", label: "Hall B", href: "/s/b", meta: "(listed above)" },
      ],
    },
  ]

  it("is a nested list, not a tree, with links in the normal Tab order", () => {
    render(<Tree label="Lineage" items={lineage} expandAll />)
    expect(screen.queryByRole("tree")).toBeNull()
    expect(screen.getByRole("list", { name: "Lineage" })).toBeTruthy()
    const links = screen.getAllByRole("link")
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/r/v3", "/l/box", "/s/b"])
    for (const l of links) expect(l.getAttribute("tabindex")).toBeNull()
    expect(screen.getByText("(listed above)")).toBeTruthy()
  })

  it("opens and closes a branch with its disclosure button", () => {
    render(<Tree label="Lineage" items={lineage} />)
    const toggle = screen.getByRole("button", { name: "Items under Release v3" })
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByRole("link", { name: "Box labels" })).toBeNull()
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    expect(toggle.getAttribute("aria-controls")).toBe(document.querySelector("[data-state=open][id]")?.id)
    expect(screen.getByRole("link", { name: "Box labels" })).toBeTruthy()
  })

  it("renders links through linkAs, and the empty text when there is nothing", () => {
    const Link = ({ href, ...p }: { href: string }) => <a data-router="" href={href} {...p} />
    const { rerender } = render(<Tree label="Lineage" items={lineage} linkAs={Link} />)
    expect(screen.getByRole("link", { name: "Release v3" }).hasAttribute("data-router")).toBe(true)
    rerender(<Tree label="Lineage" items={[]} empty="No sources yet." />)
    expect(screen.getByText("No sources yet.")).toBeTruthy()
  })

  it("follows controlled expansion", () => {
    const change = vi.fn()
    render(<Tree label="Lineage" items={lineage} expanded={[]} onExpandedChange={change} />)
    fireEvent.click(screen.getByRole("button", { name: "Items under Release v3" }))
    expect(change).toHaveBeenCalledWith(["release"])
    expect(screen.getByRole("button", { name: "Items under Release v3" }).getAttribute("aria-expanded")).toBe("false")
  })
})

describe("Tree, select mode", () => {
  const setup = (props: Partial<React.ComponentProps<typeof Tree>> = {}) =>
    render(<Tree mode="select" label="Files" items={items} defaultExpanded={["images", "labels"]} {...props} />)

  it("has tree, treeitem and group roles with levels, sizes and positions", () => {
    setup()
    const tree = screen.getByRole("tree", { name: "Files" })
    expect(within(tree).getAllByRole("group")).toHaveLength(2)
    const images = item("images")
    expect(images.getAttribute("aria-level")).toBe("1")
    expect(images.getAttribute("aria-setsize")).toBe("4")
    expect(images.getAttribute("aria-posinset")).toBe("1")
    expect(images.getAttribute("aria-expanded")).toBe("true")
    expect(item("b.jpg").getAttribute("aria-level")).toBe("2")
    expect(item("b.jpg").getAttribute("aria-posinset")).toBe("2")
    expect(item("b.jpg").hasAttribute("aria-expanded")).toBe(false)
    expect(item("faces").getAttribute("aria-disabled")).toBe("true")
    // The name is the row's words, label then meta, so speech matches what is on screen (WCAG 2.5.3).
    const ids = item("faces").getAttribute("aria-labelledby")!.split(" ")
    expect(ids.map((id) => document.getElementById(id)!.textContent).join(" ")).toBe("faces No access")
    expect(screen.queryAllByRole("link")).toHaveLength(0)
  })

  it("is one Tab stop, on the selected node when there is one", () => {
    const { unmount } = setup()
    const stops = () => screen.getAllByRole("treeitem").filter((t) => t.tabIndex === 0)
    expect(stops().map((t) => t.dataset.treeId)).toEqual(["images"])
    unmount()
    setup({ defaultSelectedId: "boxes.json" })
    expect(stops().map((t) => t.dataset.treeId)).toEqual(["boxes.json"])
    expect(item("boxes.json").getAttribute("aria-selected")).toBe("true")
  })

  it("moves with Up, Down, Home and End, skipping disabled nodes", () => {
    setup()
    item("images").focus()
    key("ArrowDown")
    expect(focused()).toBe("a.jpg")
    key("End")
    expect(focused()).toBe("raw.tar")
    key("ArrowUp")
    expect(focused()).toBe("README.md")
    key("ArrowUp")
    expect(focused()).toBe("boxes.json") // faces is disabled
    key("Home")
    expect(focused()).toBe("images")
    // The roving stop follows focus.
    expect(item("images").tabIndex).toBe(0)
    key("ArrowDown")
    expect(item("a.jpg").tabIndex).toBe(0)
    expect(item("images").tabIndex).toBe(-1)
  })

  it("Right opens a closed branch then moves to its first child; Left closes it then moves to the parent", () => {
    render(<Tree mode="select" label="Files" items={items} />)
    item("images").focus()
    key("ArrowRight")
    expect(item("images").getAttribute("aria-expanded")).toBe("true")
    expect(focused()).toBe("images")
    key("ArrowRight")
    expect(focused()).toBe("a.jpg")
    key("ArrowLeft")
    expect(focused()).toBe("images")
    key("ArrowLeft")
    expect(item("images").getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByRole("treeitem", { name: "a.jpg" })).toBeNull()
  })

  it("selects with Enter, Space and a click, never a disabled node", () => {
    const change = vi.fn()
    setup({ onSelectedChange: change })
    item("a.jpg").focus()
    key("Enter")
    expect(change).toHaveBeenLastCalledWith("a.jpg", expect.objectContaining({ id: "a.jpg" }))
    expect(item("a.jpg").getAttribute("aria-selected")).toBe("true")
    key("ArrowDown")
    key(" ")
    expect(change).toHaveBeenLastCalledWith("b.jpg", expect.anything())
    expect(item("a.jpg").getAttribute("aria-selected")).toBe("false")
    fireEvent.click(screen.getByText("README.md"))
    expect(change).toHaveBeenLastCalledWith("README.md", expect.anything())
    fireEvent.click(screen.getByText("faces"))
    expect(change).toHaveBeenCalledTimes(3)
  })

  it("keeps a controlled selection until the parent changes it", () => {
    const change = vi.fn()
    setup({ selectedId: "a.jpg", onSelectedChange: change })
    fireEvent.click(screen.getByText("b.jpg"))
    expect(change).toHaveBeenCalledWith("b.jpg", expect.anything())
    expect(item("a.jpg").getAttribute("aria-selected")).toBe("true")
  })

  it("type-ahead moves to the next name starting with the letters, and cycles on a repeated letter", () => {
    let now = 10_000
    const clock = vi.spyOn(Date, "now").mockImplementation(() => now)
    setup()
    item("images").focus()
    key("r")
    expect(focused()).toBe("README.md")
    key("r")
    expect(focused()).toBe("raw.tar")
    key("r")
    expect(focused()).toBe("README.md")
    // A pause starts a new search; letters typed together narrow it.
    now += 1000
    key("b")
    expect(focused()).toBe("b.jpg")
    key("o")
    expect(focused()).toBe("boxes.json")
    clock.mockRestore()
  })

  it("type-ahead uses textValue when the label is not a string, and skips disabled nodes", () => {
    render(
      <Tree
        mode="select"
        label="Robots"
        items={[
          { id: "1", label: <b>AMR-07</b>, textValue: "AMR-07" },
          { id: "2", label: "Arm", disabled: true },
          { id: "3", label: "AGV-02" },
        ]}
      />,
    )
    expect(item("AMR-07")).toBeTruthy()
    item("AMR-07").focus()
    key("a")
    expect(focused()).toBe("3")
  })

  it("* opens every branch beside the focused node", () => {
    render(<Tree mode="select" label="Files" items={items} />)
    item("images").focus()
    key("*")
    expect(item("images").getAttribute("aria-expanded")).toBe("true")
    expect(item("labels").getAttribute("aria-expanded")).toBe("true")
  })

  it("expandAll opens every branch; the chevron opens and closes without selecting", () => {
    const change = vi.fn()
    const { container } = render(<Tree mode="select" label="Files" items={items} expandAll onSelectedChange={change} />)
    expect(item("labels").getAttribute("aria-expanded")).toBe("true")
    const chevron = container.querySelector<HTMLElement>('[data-tree-id="labels"] > div > span[aria-hidden]')!
    fireEvent.click(chevron)
    expect(item("labels").getAttribute("aria-expanded")).toBe("false")
    expect(change).not.toHaveBeenCalled()
  })

  it("marks keyboard use on the tree, so the ring shows only then", () => {
    setup()
    const tree = screen.getByRole("tree")
    fireEvent.pointerDown(item("images"))
    expect(tree.getAttribute("data-nav")).toBe("pointer")
    item("images").focus()
    key("ArrowDown")
    expect(tree.getAttribute("data-nav")).toBe("key")
  })
})
