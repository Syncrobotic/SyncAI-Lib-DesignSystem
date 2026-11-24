import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Graph, GraphList, layoutGraph, type GraphEdge, type GraphNode, type GraphOrientation } from "@/registry/syncrobotic/ui/graph"

afterEach(cleanup)

// Raw captures feed two label sets (one source, two parents' worth of outputs), which make a dataset, which trains a model.
const nodes: GraphNode[] = [
  { id: "hall-b", label: "Hall B captures", meta: "12,400 frames" },
  { id: "synthetic", label: "Synthetic pallets" },
  { id: "night", label: "Night captures" },
  { id: "boxes", label: "Box labels v7", meta: "48,210 boxes" },
  { id: "masks", label: "Edge masks v2", status: "danger", statusLabel: "Failed" },
  { id: "dataset", label: "Dataset v3", href: "/datasets/v3" },
  { id: "model", label: "Picking detector" },
  { id: "unrelated", label: "Eval set" },
  { id: "report", label: "Eval report" },
]
const edges: GraphEdge[] = [
  { from: "hall-b", to: "boxes" },
  { from: "synthetic", to: "boxes" },
  { from: "hall-b", to: "masks" },
  { from: "night", to: "masks" },
  { from: "boxes", to: "dataset" },
  { from: "masks", to: "dataset" },
  { from: "dataset", to: "model" },
  { from: "unrelated", to: "report" },
  { from: "model", to: "report" },
]

/** A random DAG of n nodes: edges only from a lower index to a higher one, so it has no cycle. Seeded, so it is the same every run. */
function randomDag(n: number, seed: number) {
  let s = seed
  const rand = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
  const ns = Array.from({ length: n }, (_, i) => ({ id: `n${i}` }))
  const es: GraphEdge[] = []
  for (let b = 1; b < n; b++) {
    const k = 1 + Math.floor(rand() * 3)
    for (let j = 0; j < k; j++) {
      const a = Math.floor(rand() * b)
      if (b - a < 12) es.push({ from: `n${a}`, to: `n${b}` })
    }
  }
  return { nodes: ns, edges: es }
}

const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

function checkInvariants(ns: { id: string }[], es: GraphEdge[], orientation: GraphOrientation) {
  const layout = layoutGraph(ns, es, { orientation })
  expect(layout.nodes).toHaveLength(ns.length)
  // No two boxes overlap.
  for (let i = 0; i < layout.nodes.length; i++) for (let j = i + 1; j < layout.nodes.length; j++) expect(overlaps(layout.nodes[i], layout.nodes[j])).toBe(false)
  // Every box is inside the canvas.
  for (const n of layout.nodes) {
    expect(n.x).toBeGreaterThanOrEqual(0)
    expect(n.y).toBeGreaterThanOrEqual(0)
    expect(n.x + n.width).toBeLessThanOrEqual(layout.width)
    expect(n.y + n.height).toBeLessThanOrEqual(layout.height)
  }
  // Inputs come before what they feed along the main axis: a whole box earlier.
  const at = new Map(layout.nodes.map((n) => [n.id, n]))
  for (const e of layout.edges) {
    const a = at.get(e.from)!
    const b = at.get(e.to)!
    expect(a.layer).toBeLessThan(b.layer)
    if (orientation === "horizontal") expect(a.x + a.width).toBeLessThan(b.x)
    else expect(a.y + a.height).toBeLessThan(b.y)
  }
  // Edges are routed between boxes: no bend point of an edge lies inside a box.
  for (const e of layout.edges)
    for (const [x, y] of e.points.slice(1, -1))
      for (const n of layout.nodes) expect(x > n.x && x < n.x + n.width && y > n.y && y < n.y + n.height).toBe(false)
  return layout
}

describe("layoutGraph", () => {
  it("keeps boxes apart and inputs before outputs, both ways round", () => {
    checkInvariants(nodes, edges, "horizontal")
    checkInvariants(nodes, edges, "vertical")
  })

  it("holds for random graphs up to 60 nodes", () => {
    for (const [n, seed] of [
      [12, 1],
      [30, 7],
      [45, 21],
      [60, 99],
    ]) {
      const g = randomDag(n, seed)
      checkInvariants(g.nodes, g.edges, "horizontal")
      checkInvariants(g.nodes, g.edges, "vertical")
    }
  })

  it("lays out 60 nodes quickly", () => {
    const g = randomDag(60, 5)
    const t = performance.now()
    layoutGraph(g.nodes, g.edges)
    expect(performance.now() - t).toBeLessThan(250)
  })

  it("puts every node one layer after its latest input (longest path), and a source just before its output", () => {
    const layout = layoutGraph(nodes, edges)
    const layer = Object.fromEntries(layout.nodes.map((n) => [n.id, n.layer]))
    expect(layer).toMatchObject({ "hall-b": 0, boxes: 1, masks: 1, dataset: 2, model: 3, report: 4 })
    // "Eval set" only feeds the report: it sits in the column before it, not far left.
    expect(layer.unrelated).toBe(3)
  })

  it("orders a layer to undo crossings in the input order", () => {
    // Given crossed: a feeds the second of c/d and b the first. The sweeps straighten it.
    const layout = layoutGraph([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], [
      { from: "a", to: "d" },
      { from: "b", to: "c" },
    ])
    const order = Object.fromEntries(layout.nodes.map((n) => [n.id, n.order]))
    expect(Math.sign(order.a - order.b)).toBe(Math.sign(order.d - order.c))
  })

  it("leaves out an edge that closes a cycle, a self-loop and edges to missing nodes", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const layout = layoutGraph([{ id: "a" }, { id: "b" }, { id: "c" }], [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
      { from: "c", to: "a" },
      { from: "b", to: "b" },
      { from: "a", to: "ghost" },
    ])
    expect(layout.edges.map((e) => `${e.from}>${e.to}`)).toEqual(["a>b", "b>c"])
    expect(layout.dropped).toHaveLength(3)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it("routes a long edge through a bend point in each column it crosses", () => {
    const layout = layoutGraph([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
      { from: "c", to: "d" },
      { from: "a", to: "d" },
    ])
    const long = layout.edges.find((e) => e.from === "a" && e.to === "d")!
    // Start, then in and out of two middle columns, then the end.
    expect(long.points).toHaveLength(6)
  })
})

const node = (name: string) => screen.getByRole("button", { name: (n) => n.startsWith(name) })
const focusedId = () => document.activeElement?.getAttribute("data-graph-id")
const key = (k: string) => fireEvent.keyDown(document.activeElement!, { key: k })

describe("Graph", () => {
  it("is a named group of nodes whose names say where they come from and go", () => {
    render(<Graph label="Lineage of Dataset v3" nodes={nodes} edges={edges} />)
    const group = screen.getByRole("group", { name: "Lineage of Dataset v3" })
    expect(group.getAttribute("aria-describedby")).toBeTruthy()
    // Inputs and outputs are named in the order they are drawn, top to bottom.
    expect(screen.getByRole("button", { name: "Box labels v7, 48,210 boxes, from Synthetic pallets and Hall B captures, to Dataset v3" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Hall B captures, 12,400 frames, to Box labels v7 and Edge masks v2" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Edge masks v2, Failed, from Hall B captures and Night captures, to Dataset v3" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Dataset v3, from Box labels v7 and Edge masks v2, to Picking detector" }).getAttribute("href")).toBe("/datasets/v3")
    // The edges are drawn, and hidden from screen readers: the names carry them.
    expect(group.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true")
    expect(group.querySelectorAll("path[data-edge]")).toHaveLength(edges.length)
  })

  it("draws a badge as a neutral outline tag after the name, and reads it after the name", () => {
    const tagged = nodes.map((n) => (n.id === "boxes" ? { ...n, badge: "T1" } : n.id === "dataset" ? { ...n, badge: "Deprecated" } : n))
    render(<Graph label="Lineage" nodes={tagged} edges={edges} />)
    const boxes = screen.getByRole("button", { name: "Box labels v7, T1, 48,210 boxes, from Synthetic pallets and Hall B captures, to Dataset v3" })
    const tag = within(boxes).getByText("T1").parentElement!
    expect(tag.className).toContain("ring-border")
    expect(tag.className).not.toMatch(/bg-|text-(warning|danger|info)/)
    // After the name, on the name's line, with a space between them for anything that reads the text.
    expect(boxes.firstElementChild!.textContent).toBe("Box labels v7 T1")
    expect(screen.getByRole("link", { name: "Dataset v3, Deprecated, from Box labels v7 and Edge masks v2, to Picking detector" })).toBeTruthy()
    // A node without one is drawn as before.
    expect(screen.getByRole("button", { name: /^Hall B captures, 12,400 frames/ }).firstElementChild!.textContent).toBe("Hall B captures")
  })

  it("is one Tab stop, on the first node in reading order", () => {
    render(<Graph label="Lineage" nodes={nodes} edges={edges} />)
    const stops = [...document.querySelectorAll("[data-graph-id]")].filter((el) => el.getAttribute("tabindex") === "0")
    expect(stops).toHaveLength(1)
    expect(stops[0].getAttribute("data-graph-index")).toBe("0")
  })

  it("follows the edges with the arrow keys, and goes back the way it came", () => {
    render(<Graph label="Lineage" nodes={nodes} edges={edges} />)
    node("Night captures").focus()
    key("ArrowRight")
    expect(focusedId()).toBe("masks")
    key("ArrowRight")
    expect(focusedId()).toBe("dataset")
    key("ArrowRight")
    expect(focusedId()).toBe("model")
    // Back: to the input it came from, not the nearest one.
    key("ArrowLeft")
    expect(focusedId()).toBe("dataset")
    key("ArrowLeft")
    expect(focusedId()).toBe("masks")
    key("ArrowLeft")
    expect(focusedId()).toBe("night")
    // Across the column.
    key("ArrowUp")
    expect(["hall-b", "synthetic"]).toContain(focusedId())
    key("Home")
    expect(document.activeElement?.getAttribute("data-graph-index")).toBe("0")
    key("End")
    expect(focusedId()).toBe("report")
    // The roving stop follows focus.
    expect(document.activeElement?.getAttribute("tabindex")).toBe("0")
  })

  it("in vertical orientation, ↓ and ↑ follow the edges and ← → move in the row", () => {
    render(<Graph label="Lineage" orientation="vertical" nodes={nodes} edges={edges} />)
    node("Box labels v7").focus()
    key("ArrowDown")
    expect(focusedId()).toBe("dataset")
    key("ArrowUp")
    expect(focusedId()).toBe("boxes")
    key("ArrowRight")
    expect(focusedId()).toBe("masks")
  })

  it("selects a node, highlights its path upstream and downstream and quiets the rest; Esc clears", () => {
    const onSelectedChange = vi.fn()
    const { container } = render(<Graph label="Lineage" nodes={nodes} edges={edges} onSelectedChange={onSelectedChange} />)
    const masks = node("Edge masks v2")
    fireEvent.click(masks)
    expect(masks.getAttribute("aria-pressed")).toBe("true")
    expect(onSelectedChange).toHaveBeenLastCalledWith("masks", expect.objectContaining({ id: "masks" }))
    const state = (id: string) => container.querySelector(`[data-graph-id="${id}"]`)!.getAttribute("data-state")
    expect(state("masks")).toBe("selected")
    for (const id of ["hall-b", "night", "dataset", "model", "report"]) expect(state(id)).toBe("path")
    for (const id of ["synthetic", "boxes", "unrelated"]) expect(state(id)).toBe("dimmed")
    const edge = (k: string) => container.querySelector(`path[data-edge="${k}"]`)!.getAttribute("data-state")
    expect(edge("night masks")).toBe("on")
    expect(edge("dataset model")).toBe("on")
    expect(edge("boxes dataset")).toBe("off")
    expect(edge("unrelated report")).toBe("off")
    masks.focus()
    key("Escape")
    expect(masks.getAttribute("aria-pressed")).toBe("false")
    expect(onSelectedChange).toHaveBeenLastCalledWith(null, undefined)
    expect(state("synthetic")).not.toBe("dimmed")
  })

  it("selects a link with Space and leaves Enter to follow it", () => {
    render(<Graph label="Lineage" nodes={nodes} edges={edges} />)
    const link = screen.getByRole("link", { name: (n) => n.startsWith("Dataset v3") })
    link.focus()
    const enter = fireEvent.keyDown(link, { key: "Enter" })
    expect(enter).toBe(true) // not prevented: the browser follows the link
    expect(link.getAttribute("aria-current")).toBeNull()
    key(" ")
    expect(link.getAttribute("aria-current")).toBe("true")
  })

  it("lets Esc through when nothing is selected, so a sheet around it can close", () => {
    render(<Graph label="Lineage" nodes={nodes} edges={edges} />)
    node("Night captures").focus()
    expect(fireEvent.keyDown(document.activeElement!, { key: "Escape" })).toBe(true)
  })

  it("renders links through linkAs", () => {
    const Link = ({ href, ...props }: { href: string } & React.ComponentProps<"a">) => <a data-router="" href={href} {...props} />
    render(<Graph label="Lineage" nodes={nodes} edges={edges} linkAs={Link} />)
    expect(screen.getByRole("link", { name: (n) => n.startsWith("Dataset v3") }).hasAttribute("data-router")).toBe(true)
  })

  it("says so when empty, and is busy while loading", () => {
    const { rerender, container } = render(<Graph label="Lineage" nodes={[]} edges={[]} empty="No lineage yet." />)
    expect(screen.getByText("No lineage yet.")).toBeTruthy()
    rerender(<Graph label="Lineage" nodes={[]} edges={[]} loading />)
    expect(screen.getByRole("group", { name: "Lineage" }).getAttribute("aria-busy")).toBe("true")
    expect(screen.getByRole("status").textContent).toBe("Loading")
    expect(container.querySelector("[data-graph-id]")).toBeNull()
  })

  it("separates names that have commas of their own with semicolons", () => {
    render(
      <Graph
        label="Lineage"
        nodes={[{ id: "a", label: "Hall B, Oct" }, { id: "b", label: "Night, Hall A" }, { id: "c", label: "Masks" }]}
        edges={[
          { from: "a", to: "c" },
          { from: "b", to: "c" },
        ]}
      />,
    )
    expect(screen.getByRole("button", { name: /^Masks, from (Hall B, Oct and Night, Hall A|Night, Hall A and Hall B, Oct)$/ })).toBeTruthy()
  })

  it("translates the names", () => {
    render(
      <Graph
        label="Lineage"
        nodes={nodes.slice(0, 4)}
        edges={edges.slice(0, 2)}
        labels={{ from: (n) => `來自 ${n.join("、")}`, to: (n) => `輸出至 ${n.join("、")}` }}
      />,
    )
    expect(screen.getByRole("button", { name: /^Box labels v7, 48,210 boxes, 來自 (Hall B captures、Synthetic pallets|Synthetic pallets、Hall B captures)$/ })).toBeTruthy()
  })
})

describe("GraphList", () => {
  it("lists every node in reading order with its state, inputs and outputs", () => {
    render(<GraphList label="Lineage of Dataset v3" nodes={nodes} edges={edges} />)
    const list = screen.getByRole("list", { name: "Lineage of Dataset v3" })
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(nodes.length)
    const names = items.map((li) => li.querySelector("span, a")!.textContent)
    // Inputs before what they feed.
    expect(names.indexOf("Hall B captures")).toBeLessThan(names.indexOf("Box labels v7"))
    expect(names.indexOf("Box labels v7")).toBeLessThan(names.indexOf("Dataset v3"))
    expect(names.indexOf("Dataset v3")).toBeLessThan(names.indexOf("Picking detector"))
    const masks = items.find((li) => li.textContent?.startsWith("Edge masks v2"))!
    expect(masks.textContent).toContain("Failed")
    expect(within(masks).getByText("Inputs").nextElementSibling?.children).toHaveLength(2)
    expect(within(masks).getByText("Inputs").nextElementSibling?.textContent).toBe("Hall B capturesNight captures")
    expect(within(masks).getByText("Outputs").nextElementSibling?.textContent).toBe("Dataset v3")
    expect(within(list).getByRole("link", { name: "Dataset v3" }).getAttribute("href")).toBe("/datasets/v3")
  })

  it("shows a node's badge after its name", () => {
    render(<GraphList label="Lineage" nodes={nodes.map((n) => (n.id === "boxes" ? { ...n, badge: "T1" } : n))} edges={edges} />)
    const item = screen.getAllByRole("listitem").find((li) => li.textContent?.startsWith("Box labels v7"))!
    expect(within(item).getByText("T1").previousElementSibling?.textContent).toBe("Box labels v7")
  })

  it("says so when empty", () => {
    render(<GraphList label="Lineage" nodes={[]} edges={[]} empty="No lineage yet." />)
    expect(screen.getByText("No lineage yet.")).toBeTruthy()
  })
})
