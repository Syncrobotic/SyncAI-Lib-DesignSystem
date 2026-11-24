// @syncrobotic/graph v0.32.0 · update: npx shadcn add @syncrobotic/graph --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { StatusGlyph, statusText, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"
import { scrollFadeMask, useScrollEdges } from "@/registry/syncrobotic/ui/table"

/** One box of the graph: a dataset, a label set, a training run, a step of a mission. */
export type GraphNode = {
  /** Unique across the graph; edges refer to it. */
  id: string
  /** The node's name. Plain text, because it is also the start of the node's accessible name. */
  label: string
  /** One short line under the name, in muted text: a count, a size, a version, a time. */
  meta?: string
  /** A state with its shape: calm states (active, normal, offline) stay grey, warning and danger are coloured. */
  status?: Status
  /** The state in words; without it the default word for `status` (labels.status) is used. */
  statusLabel?: string
  /** The node is a link (through `linkAs`): Enter or a click follows it, Space still selects it. */
  href?: string
  /**
   * A short tag after the name, for a fact that is a category, not a state: an access tier, "Deprecated", a version
   * channel. A neutral outline, read after the name. Plain text, a word or two.
   */
  badge?: string
}

/** A connection: `from` is an input of `to`. Data flows from left to right (or top to bottom). */
export type GraphEdge = { from: string; to: string }

export type GraphLabels = {
  /** The part of a node's name listing its inputs: "from Hall B captures and Synthetic pallets v4". */
  from: (names: string[]) => string
  /** The part listing its outputs: "to Picking detector v3.2". */
  to: (names: string[]) => string
  /** Default words per status, when a node has no statusLabel. */
  status: Record<Status, string>
  /** Read once when focus enters the graph. */
  instructions: string
  /** GraphList: the headings of a node's two rows. */
  inputs: string
  outputs: string
  /** Read while `loading`. */
  loading: string
}

/** "a", "a and b", "a, b and c"; "a; b and c" when a name has a comma of its own. Replace `from` and `to` for other languages. */
const and = (names: string[]) => {
  if (names.length < 2) return names[0] ?? ""
  const sep = names.some((n) => n.includes(",")) ? "; " : ", "
  return `${names.slice(0, -1).join(sep)} and ${names[names.length - 1]}`
}

const defaultLabels: GraphLabels = {
  from: (names) => `from ${and(names)}`,
  to: (names) => `to ${and(names)}`,
  status: { active: "Running", normal: "Done", warning: "Needs attention", danger: "Failed", offline: "Not run" },
  instructions: "Arrow keys move along the connections: forward to outputs, back to inputs, across to the next node in the same column.",
  inputs: "Inputs",
  outputs: "Outputs",
  loading: "Loading",
}

export type GraphOrientation = "horizontal" | "vertical"

// ---------------------------------------------------------------------------------------------------------------------
// Layout: a small layered (Sugiyama) layout, enough for up to about 60 nodes. Bigger graphs need a dedicated library
// (elkjs, dagre) and panning; this one has neither on purpose.
//   1. Cycles are broken (an edge that closes one is dropped, with a warning in development).
//   2. Layers by longest path from the sources; a source is then pulled next to its first output.
//   3. An edge spanning several layers gets a dummy point in each, so it is routed between boxes, never through one.
//   4. Order in each layer: barycenter sweeps down and up, keeping the order with the fewest crossings.
//   5. Position across the layers: each item moves toward the mean of its neighbours, keeping the order and the gaps
//      (the closest such placement, solved exactly by pooling adjacent violators).
// ---------------------------------------------------------------------------------------------------------------------

/** Box sizes and gaps in px. 208 × 64 fits a name and one line of meta or status; 64 between columns leaves room for curves. */
const SIZE = { width: 208, height: 64, gap: 16, layerGap: { horizontal: 64, vertical: 48 } }

export type GraphLayoutNode = { id: string; layer: number; order: number; x: number; y: number; width: number; height: number }
/** `points` alternate between gaps and columns: a curve from points[0] to [1], a straight run to [2], a curve to [3]… */
export type GraphLayoutEdge = { from: string; to: string; points: [number, number][] }
export type GraphLayout = { nodes: GraphLayoutNode[]; edges: GraphLayoutEdge[]; width: number; height: number; dropped: GraphEdge[] }

// The layout works on dense arrays indexed by node or item number (0 … n - 1, 0 … total - 1), by layer, or by a loop
// counter bounded by the array's own length, so every read below is in range. noUncheckedIndexedAccess cannot see those
// bounds; `nth` states them once, instead of a `!` on every read. Writes that read and assign in one step (`x[i] -= d`)
// carry their own `!` for the same reason.
const nth = <T,>(list: readonly T[], i: number): T => list[i] as T

const warn = (msg: string) => {
  if (process.env.NODE_ENV !== "production") console.warn(`Graph: ${msg}`)
}

/** Smallest total squared move from `want`, keeping order and at least `sep[i]` between item i and i + 1. */
function place(want: number[], sep: number[], weight: number[]) {
  const off = [0]
  for (let i = 1; i < want.length; i++) off[i] = nth(off, i - 1) + nth(sep, i - 1)
  const blocks: { sum: number; w: number; n: number }[] = []
  want.forEach((d, i) => {
    blocks.push({ sum: (d - nth(off, i)) * nth(weight, i), w: nth(weight, i), n: 1 })
    while (blocks.length > 1) {
      const b = nth(blocks, blocks.length - 1)
      const a = nth(blocks, blocks.length - 2)
      if (a.sum / a.w <= b.sum / b.w) break
      blocks.splice(-2, 2, { sum: a.sum + b.sum, w: a.w + b.w, n: a.n + b.n })
    }
  })
  const out: number[] = []
  for (const b of blocks) for (let k = 0; k < b.n; k++) out.push(b.sum / b.w + nth(off, out.length))
  return out
}

/**
 * Lays out a directed acyclic graph in layers. Exported for tests and for anyone drawing their own; `Graph` calls it.
 * Nodes come back in reading order (layer by layer, then down the layer), the order the keyboard and screen readers use.
 */
export function layoutGraph(
  nodes: { id: string }[],
  edges: GraphEdge[],
  { orientation = "horizontal" }: { orientation?: GraphOrientation } = {},
): GraphLayout {
  const horizontal = orientation === "horizontal"
  const ids: string[] = []
  const index = new Map<string, number>()
  for (const n of nodes) {
    if (index.has(n.id)) {
      warn(`two nodes have the id "${n.id}"; the second is left out.`)
      continue
    }
    index.set(n.id, ids.length)
    ids.push(n.id)
  }
  const n = ids.length
  const dropped: GraphEdge[] = []

  // Edges between known, different nodes, once each.
  const out: number[][] = ids.map(() => [])
  const seen = new Set<string>()
  for (const e of edges) {
    const a = index.get(e.from)
    const b = index.get(e.to)
    if (a === undefined || b === undefined || a === b) {
      dropped.push(e)
      warn(a === b && a !== undefined ? `"${e.from}" is connected to itself; that edge is left out.` : `an edge refers to a missing node (${e.from} → ${e.to}).`)
      continue
    }
    const k = `${a} ${b}`
    if (seen.has(k)) continue
    seen.add(k)
    nth(out, a).push(b)
  }

  // 1. Break cycles: depth first, in the order the nodes were given; an edge back to a node still open closes a cycle.
  const state = new Array<number>(n).fill(0)
  const kept: [number, number][] = []
  const visit = (u: number) => {
    state[u] = 1
    for (const v of nth(out, u)) {
      if (state[v] === 1) {
        dropped.push({ from: nth(ids, u), to: nth(ids, v) })
        warn(`the edge ${nth(ids, u)} → ${nth(ids, v)} closes a cycle; a graph flows one way, so it is left out.`)
        continue
      }
      kept.push([u, v])
      if (state[v] === 0) visit(v)
    }
    state[u] = 2
  }
  for (let u = 0; u < n; u++) if (state[u] === 0) visit(u)

  const parents: number[][] = ids.map(() => [])
  const children: number[][] = ids.map(() => [])
  for (const [a, b] of kept) {
    nth(parents, b).push(a)
    nth(children, a).push(b)
  }

  // 2. Longest-path layers, in topological order (Kahn, stable to the given order).
  const indeg = parents.map((p) => p.length)
  const queue = ids.map((_, i) => i).filter((i) => indeg[i] === 0)
  const topo: number[] = []
  while (queue.length) {
    const u = queue.shift()!
    topo.push(u)
    for (const v of nth(children, u)) if (--indeg[v]! === 0) queue.push(v)
  }
  const layer = new Array<number>(n).fill(0)
  for (const u of topo) for (const v of nth(children, u)) layer[v] = Math.max(nth(layer, v), nth(layer, u) + 1)
  // A source that only feeds a late node sits just before it, not far left with one long edge.
  for (const u of topo) {
    const outputs = nth(children, u)
    if (!nth(parents, u).length && outputs.length) layer[u] = Math.min(...outputs.map((v) => nth(layer, v))) - 1
  }

  // 3. Items: the real nodes, then a dummy point per layer an edge crosses. Chains run from an edge's source to its target.
  const itemLayer = [...layer]
  const pred: number[][] = ids.map(() => [])
  const succ: number[][] = ids.map(() => [])
  const chains: { from: number; to: number; items: number[] }[] = []
  for (const [a, b] of kept) {
    const items = [a]
    for (let l = nth(layer, a) + 1; l < nth(layer, b); l++) {
      itemLayer.push(l)
      pred.push([])
      succ.push([])
      items.push(itemLayer.length - 1)
    }
    items.push(b)
    for (let k = 0; k + 1 < items.length; k++) {
      const u = nth(items, k)
      const v = nth(items, k + 1)
      nth(succ, u).push(v)
      nth(pred, v).push(u)
    }
    chains.push({ from: a, to: b, items })
  }
  const total = itemLayer.length
  const real = (i: number) => i < n
  const layers: number[][] = []
  for (const [i, l] of itemLayer.entries()) (layers[l] ??= []).push(i)
  for (let l = 0; l < layers.length; l++) layers[l] ??= []

  // 4. Order within layers.
  const pos = new Array<number>(total).fill(0)
  const index_ = () => layers.forEach((ls) => ls.forEach((i, k) => (pos[i] = k)))
  index_()
  const crossings = () => {
    let c = 0
    for (let l = 0; l + 1 < layers.length; l++) {
      const segs: [number, number][] = []
      for (const u of nth(layers, l)) for (const v of nth(succ, u)) segs.push([nth(pos, u), nth(pos, v)])
      for (let i = 0; i < segs.length; i++) {
        const [u0, u1] = nth(segs, i)
        for (let j = i + 1; j < segs.length; j++) {
          const [v0, v1] = nth(segs, j)
          if ((u0 - v0) * (u1 - v1) < 0) c++
        }
      }
    }
    return c
  }
  const sortBy = (l: number, nbrs: number[][]) => {
    const bary = new Map(
      nth(layers, l).map((i) => {
        const m = nth(nbrs, i)
        return [i, m.length ? m.reduce((s, j) => s + nth(pos, j), 0) / m.length : nth(pos, i)]
      }),
    )
    layers[l] = [...nth(layers, l)].sort((a, b) => bary.get(a)! - bary.get(b)!)
    nth(layers, l).forEach((i, k) => (pos[i] = k))
  }
  let best = layers.map((ls) => [...ls])
  let bestCount = crossings()
  for (let sweep = 0; sweep < 8 && bestCount > 0; sweep++) {
    if (sweep % 2 === 0) for (let l = 1; l < layers.length; l++) sortBy(l, pred)
    else for (let l = layers.length - 2; l >= 0; l--) sortBy(l, succ)
    const c = crossings()
    if (c < bestCount) {
      bestCount = c
      best = layers.map((ls) => [...ls])
    }
  }
  best.forEach((ls, l) => (layers[l] = ls))
  index_()

  // 5. Position across the layers (the centre of each item).
  const cross = horizontal ? SIZE.height : SIZE.width
  const size = (i: number) => (real(i) ? cross : 0)
  const gapBetween = (a: number, b: number) => (size(a) + size(b)) / 2 + (real(a) && real(b) ? SIZE.gap : SIZE.gap / 2)
  const c = new Array<number>(total).fill(0)
  for (const ls of layers) {
    let at = 0
    ls.forEach((i, k) => {
      if (k) at += gapBetween(nth(ls, k - 1), i)
      c[i] = at
    })
    for (const i of ls) c[i]! -= at / 2
  }
  const relax = (ls: number[], nbrs: (i: number) => number[]) => {
    if (!ls.length) return
    const want = ls.map((i) => {
      const m = nbrs(i)
      return m.length ? m.reduce((s, j) => s + nth(c, j), 0) / m.length : nth(c, i)
    })
    const placed = place(
      want,
      ls.slice(1).map((i, k) => gapBetween(nth(ls, k), i)),
      ls.map((i) => (real(i) ? 1 : 0.5)),
    )
    ls.forEach((i, k) => (c[i] = nth(placed, k)))
  }
  for (let iter = 0; iter < 10; iter++) {
    if (iter % 2 === 0) for (let l = 1; l < layers.length; l++) relax(nth(layers, l), (i) => nth(pred, i))
    else for (let l = layers.length - 2; l >= 0; l--) relax(nth(layers, l), (i) => nth(succ, i))
  }
  for (const ls of layers) relax(ls, (i) => [...nth(pred, i), ...nth(succ, i)])
  let min = Infinity
  let max = -Infinity
  for (const [i, centre] of c.entries()) {
    min = Math.min(min, centre - size(i) / 2)
    max = Math.max(max, centre + size(i) / 2)
  }
  if (!total) min = max = 0
  for (const [i, centre] of c.entries()) c[i] = Math.round(centre - min)

  // Main axis: one column (or row) per layer.
  const main = horizontal ? SIZE.width : SIZE.height
  const gap = SIZE.layerGap[orientation]
  const start = (l: number) => l * (main + gap)
  const pt = (m: number, x: number): [number, number] => (horizontal ? [m, x] : [x, m])

  const laidOut: GraphLayoutNode[] = []
  layers.forEach((ls, l) =>
    ls.forEach((i) => {
      if (!real(i)) return
      const [x, y] = pt(start(l), nth(c, i) - cross / 2)
      laidOut.push({ id: nth(ids, i), layer: l, order: nth(pos, i), x, y, width: SIZE.width, height: SIZE.height })
    }),
  )
  const laidEdges: GraphLayoutEdge[] = chains.map(({ from, to, items }) => {
    const points: [number, number][] = [pt(start(nth(itemLayer, from)) + main, nth(c, from))]
    for (const d of items.slice(1, -1)) points.push(pt(start(nth(itemLayer, d)), nth(c, d)), pt(start(nth(itemLayer, d)) + main, nth(c, d)))
    points.push(pt(start(nth(itemLayer, to)), nth(c, to)))
    return { from: nth(ids, from), to: nth(ids, to), points }
  })
  const extentMain = layers.length ? start(layers.length - 1) + main : 0
  const extentCross = Math.round(max - min)
  return {
    nodes: laidOut,
    edges: laidEdges,
    width: horizontal ? extentMain : extentCross,
    height: horizontal ? extentCross : extentMain,
    dropped,
  }
}

/** The SVG path of a laid-out edge: curves across the gaps, straight through the columns it passes. */
function edgePath(points: [number, number][], horizontal: boolean) {
  // layoutGraph gives every edge at least two points; an edge without any simply draws nothing.
  const [first] = points
  if (!first) return ""
  let d = `M${first[0]} ${first[1]}`
  for (let k = 1; k < points.length; k++) {
    const [x0, y0] = nth(points, k - 1)
    const [x1, y1] = nth(points, k)
    if (k % 2 === 0) {
      d += ` L${x1} ${y1}`
      continue
    }
    if (horizontal) {
      const mx = (x0 + x1) / 2
      d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`
    } else {
      const my = (y0 + y1) / 2
      d += ` C${x0} ${my} ${x1} ${my} ${x1} ${y1}`
    }
  }
  return d
}

// ---------------------------------------------------------------------------------------------------------------------

const label = (n: GraphNode) => n.label
const statusWord = (n: GraphNode, labels: GraphLabels) => (n.status ? (n.statusLabel ?? labels.status[n.status]) : undefined)

/** Inputs and outputs of every node, from the edges, in the order the nodes are laid out. */
function useNeighbours(nodes: GraphNode[], layout: GraphLayout) {
  return React.useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const ins = new Map<string, string[]>()
    const outs = new Map<string, string[]>()
    const rank = new Map(layout.nodes.map((n, i) => [n.id, i]))
    for (const e of layout.edges) {
      ;(outs.get(e.from) ?? outs.set(e.from, []).get(e.from)!).push(e.to)
      ;(ins.get(e.to) ?? ins.set(e.to, []).get(e.to)!).push(e.from)
    }
    const sorted = (list?: string[]) => [...(list ?? [])].sort((a, b) => rank.get(a)! - rank.get(b)!)
    return { byId, inputs: (id: string) => sorted(ins.get(id)), outputs: (id: string) => sorted(outs.get(id)) }
  }, [nodes, layout])
}

/** A node's badge: a neutral outline tag (Badge's outline tone), at most half the box, so the name keeps room. */
const badgeTag = "inline-flex h-(--h-tag) max-w-1/2 shrink-0 items-center rounded-xs px-2 text-xs font-medium ring-1 ring-border ring-inset"

/** A node's accessible name: what the box shows, then where it comes from and where it goes. */
function accessibleName(n: GraphNode, ins: GraphNode[], outs: GraphNode[], labels: GraphLabels) {
  // In the order the box shows them (name and badge, then status, then meta), so the spoken name starts with the words on screen.
  const parts = [n.label]
  if (n.badge) parts.push(n.badge)
  const word = statusWord(n, labels)
  if (word) parts.push(word)
  if (n.meta) parts.push(n.meta)
  if (ins.length) parts.push(labels.from(ins.map(label)))
  if (outs.length) parts.push(labels.to(outs.map(label)))
  return parts.join(", ")
}

// How the graph was last used: keys or a pointer, the last one anywhere on the page, as in tree and select. Tabbing in
// previews the focused node's path at once; a click does not.
let lastInput: "key" | "pointer" = "pointer"
if (typeof document !== "undefined") {
  document.addEventListener("keydown", () => (lastInput = "key"), true)
  document.addEventListener("pointerdown", () => (lastInput = "pointer"), true)
}

export type GraphProps = {
  /** The boxes, in any order; they are laid out in columns from the edges. */
  nodes: GraphNode[]
  /** The connections, `{ from, to }` with `from` an input of `to`. An edge that would close a cycle is left out. */
  edges: GraphEdge[]
  /** Names the graph for screen readers: "Lineage of Picking detector v3.2". */
  label: string
  /** horizontal (default): inputs on the left, outputs on the right. vertical: top to bottom, for narrow, deep pipelines. */
  orientation?: GraphOrientation
  /** The selected node, controlled; null for none. Pair with onSelectedChange. */
  selectedId?: string | null
  /** The node selected at first (uncontrolled). */
  defaultSelectedId?: string
  /** Called with the node selected, or null when the selection is cleared (Esc, a click on the background, the node again). */
  onSelectedChange?: (id: string | null, node?: GraphNode) => void
  /** Shown in the frame when there are no nodes. */
  empty?: React.ReactNode
  /** Bones in the frame while the graph loads. */
  loading?: boolean
  /** Your router's link (e.g. next/link), for nodes with href. */
  linkAs?: React.ElementType
  labels?: Partial<GraphLabels>
  className?: string
}

const frame = "relative w-full rounded-md bg-background ring-1 ring-border"

/**
 * A directed acyclic graph: lineage (a dataset, the label sets it was built from, their raw captures), a training run's
 * inputs and outputs, a mission's steps. Nodes are boxes laid out in columns, inputs to the left; edges are neutral lines
 * under them. Selecting a node (or pointing at it, or moving to it with the keys) draws its upstream and downstream path
 * in the ink colour and quiets the rest. One Tab stop; the arrow keys move along the edges. Every node's name says what
 * it comes from and what it goes to, and GraphList shows the same graph as text.
 */
export function Graph({
  nodes,
  edges,
  label: name,
  orientation = "horizontal",
  selectedId: selectedProp,
  defaultSelectedId,
  onSelectedChange,
  empty = "Nothing here yet.",
  loading,
  linkAs: Link = "a",
  labels: given,
  className,
}: GraphProps) {
  const labels = { ...defaultLabels, ...given, status: { ...defaultLabels.status, ...given?.status } }
  const horizontal = orientation === "horizontal"
  const uid = React.useId()
  const layout = React.useMemo(() => layoutGraph(nodes, edges, { orientation }), [nodes, edges, orientation])
  const { byId, inputs, outputs } = useNeighbours(nodes, layout)
  const [selectedState, setSelectedState] = React.useState<string | null>(defaultSelectedId ?? null)
  const selected = selectedProp !== undefined ? selectedProp : selectedState
  const [focused, setFocused] = React.useState<string>()
  const [preview, setPreview] = React.useState<string>()
  // The moves along edges so far, so going back returns the way it came: from Dataset v3 back to the label set you
  // arrived from, not the nearest one.
  const trail = React.useRef<{ from: string; to: string; forward: boolean }[]>([])
  const root = React.useRef<HTMLDivElement>(null)
  // A graph that opens with a node selected (a failed step) scrolls that node to the middle of its frame, not the page.
  const firstSelected = React.useRef(selectedProp ?? defaultSelectedId)
  React.useEffect(() => {
    const id = firstSelected.current
    const viewport = root.current?.querySelector<HTMLElement>("[data-slot=graph-viewport]")
    const box = id ? layout.nodes.find((n) => n.id === id) : undefined
    if (!viewport || !box) return
    // The canvas is inset by its 16 px padding (p-4).
    viewport.scrollLeft = Math.max(0, box.x + 16 + box.width / 2 - viewport.clientWidth / 2)
    // Only once, when the graph first shows.
    firstSelected.current = undefined
  }, [layout])

  const setSelected = (id: string | null) => {
    if (selectedProp === undefined) setSelectedState(id)
    onSelectedChange?.(id, id ? byId.get(id) : undefined)
  }

  // The highlighted path: everything upstream and downstream of the node pointed at, else of the selected node.
  const active = preview ?? selected ?? undefined
  const path = React.useMemo(() => {
    if (!active || !byId.has(active)) return null
    const walk = (start: string, next: (id: string) => string[]) => {
      const found = new Set<string>()
      const stack = [start]
      while (stack.length) {
        for (const v of next(stack.pop()!)) {
          if (found.has(v)) continue
          found.add(v)
          stack.push(v)
        }
      }
      return found
    }
    return { up: walk(active, inputs), down: walk(active, outputs) }
  }, [active, byId, inputs, outputs])
  const onPath = (id: string) => !path || id === active || path.up.has(id) || path.down.has(id)
  const edgeOnPath = (e: GraphEdge) => !!path && (e.to === active || path.up.has(e.to) || e.from === active || path.down.has(e.from))

  if (loading) {
    return (
      <div data-slot="graph" data-loading="" role="group" aria-label={name} aria-busy="true" className={cn(frame, "overflow-hidden", className)}>
        <p role="status" className="sr-only">
          {labels.loading}
        </p>
        <div className="flex gap-8 p-4">
          {[2, 1, 2].map((count, col) => (
            <div key={col} className="flex flex-col justify-center gap-4">
              {Array.from({ length: count }, (_, k) => (
                <div key={k} style={{ width: SIZE.width, height: SIZE.height }}>
                  <Bone className="size-full rounded-xs" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!layout.nodes.length) {
    return (
      <div data-slot="graph" data-empty="" className={cn(frame, "p-4 text-sm text-muted-foreground", className)}>
        {empty}
      </div>
    )
  }

  const order = layout.nodes.map((n) => n.id)
  const tabStop = (focused && byId.has(focused) && focused) || (selected && byId.has(selected) && selected) || order[0]
  const at = new Map(layout.nodes.map((n) => [n.id, n]))
  const column = (l: number) => layout.nodes.filter((n) => n.layer === l)
  const crossCentre = (id: string) => {
    const n = at.get(id)!
    return horizontal ? n.y + n.height / 2 : n.x + n.width / 2
  }

  const element = (id: string) => root.current?.querySelector<HTMLElement>(`[data-graph-index="${order.indexOf(id)}"]`)
  const moveTo = (to: string | undefined, from?: string, forward?: boolean) => {
    if (!to) return
    const t = trail.current
    const last = t[t.length - 1]
    if (from === undefined || forward === undefined) trail.current = []
    else if (last && last.to === from && last.from === to && last.forward !== forward) t.pop()
    else t.push({ from, to, forward })
    setFocused(to)
    setPreview(to)
    const el = element(to)
    el?.focus({ preventScroll: true })
    el?.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  }
  // Of several inputs or outputs: back the way the keys came, else the one nearest across.
  const pick = (from: string, candidates: string[], forward: boolean) => {
    if (!candidates.length) return undefined
    const m = trail.current[trail.current.length - 1]
    if (m && m.to === from && m.forward !== forward && candidates.includes(m.from)) return m.from
    const here = crossCentre(from)
    return candidates.reduce((best, id) => (Math.abs(crossCentre(id) - here) < Math.abs(crossCentre(best) - here) ? id : best))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const index = (e.target as HTMLElement).closest<HTMLElement>("[data-graph-index]")?.dataset.graphIndex
    const id = index === undefined ? undefined : order[Number(index)]
    if (!id || e.altKey || e.ctrlKey || e.metaKey) return
    const node = at.get(id)!
    const siblings = column(node.layer)
    const k = siblings.findIndex((s) => s.id === id)
    const [forward, back, next, prev] = horizontal ? ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"] : ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"]
    switch (e.key) {
      case forward:
        moveTo(pick(id, outputs(id), true), id, true)
        break
      case back:
        moveTo(pick(id, inputs(id), false), id, false)
        break
      case next:
        moveTo(siblings[k + 1]?.id)
        break
      case prev:
        moveTo(siblings[k - 1]?.id)
        break
      case "Home":
        moveTo(order[0])
        break
      case "End":
        moveTo(order[order.length - 1])
        break
      case "Escape":
        // Only when there is a selection to clear, so Esc still closes a sheet the graph sits in.
        if (!selected) return
        setPreview(undefined)
        setSelected(null)
        break
      case " ":
        // A link follows on Enter; Space selects it. A button selects on both, natively.
        if (!byId.get(id)?.href) return
        setSelected(selected === id ? null : id)
        break
      default:
        return
    }
    e.preventDefault()
    e.stopPropagation()
  }

  const drawn = [...layout.edges].sort((a, b) => Number(edgeOnPath(a)) - Number(edgeOnPath(b)))
  const marker = (k: "rest" | "on" | "off") => `${uid}-arrow-${k}`.replace(/:/g, "")

  return (
    <div
      ref={root}
      data-slot="graph"
      data-orientation={orientation}
      role="group"
      aria-label={name}
      aria-describedby={`${uid}-hint`}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPreview(undefined)
      }}
      className={cn(frame, className)}
    >
      <p id={`${uid}-hint`} className="sr-only">
        {labels.instructions}
      </p>
      {/* Wider than the screen, it scrolls inside the frame and fades on the side that hides nodes; a node brought into
          view by the keys scrolls it too, so the graph stays one Tab stop. */}
      <Viewport>
        <div className="w-max p-4">
          <div
            className="relative"
            style={{ width: layout.width, height: layout.height }}
            onClick={(e) => {
              // A click on the background clears the selection (Esc does it from the keyboard).
              if (!(e.target as HTMLElement).closest("[data-graph-index]") && selected) setSelected(null)
            }}
          >
            <svg aria-hidden="true" width={layout.width} height={layout.height} className="absolute inset-0 overflow-visible">
              <defs>
                {(["rest", "on", "off"] as const).map((k) => (
                  <marker key={k} id={marker(k)} viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
                    <path d="M0 0 8 4 0 8Z" className={k === "on" ? "fill-foreground" : k === "off" ? "fill-border" : "fill-input"} />
                  </marker>
                ))}
              </defs>
              {drawn.map((e) => {
                const state = !path ? "rest" : edgeOnPath(e) ? "on" : "off"
                return (
                  <path
                    key={`${e.from} ${e.to}`}
                    data-edge={`${e.from} ${e.to}`}
                    data-state={state}
                    d={edgePath(e.points, horizontal)}
                    fill="none"
                    markerEnd={`url(#${marker(state)})`}
                    className={cn(
                      "transition-[stroke] duration-(--motion-fast) ease-(--ease-standard) motion-reduce:transition-none",
                      state === "on" ? "stroke-foreground stroke-2" : state === "off" ? "stroke-border stroke-1" : "stroke-input stroke-1",
                    )}
                  />
                )
              })}
            </svg>
            {layout.nodes.map((p, i) => {
              const n = byId.get(p.id)!
              const isSelected = selected === n.id
              const lit = !!path && onPath(n.id)
              const dim = !!path && !lit
              const word = statusWord(n, labels)
              const ins = inputs(n.id).map((x) => byId.get(x)!)
              const outs = outputs(n.id).map((x) => byId.get(x)!)
              const props = {
                "data-graph-index": i,
                "data-graph-id": n.id,
                "data-state": isSelected ? "selected" : lit ? "path" : dim ? "dimmed" : undefined,
                tabIndex: n.id === tabStop ? 0 : -1,
                "aria-label": accessibleName(n, ins, outs, labels),
                onFocus: () => {
                  setFocused(n.id)
                  if (lastInput === "key") setPreview(n.id)
                },
                onPointerEnter: () => setPreview(n.id),
                onPointerLeave: () => setPreview((p) => (p === n.id ? undefined : p)),
                style: { left: p.x, top: p.y, width: p.width, height: p.height },
                className: cn(
                  "absolute flex flex-col justify-center gap-1 rounded-xs bg-card px-3 text-left",
                  "transition-[box-shadow,color] duration-(--motion-fast) ease-(--ease-standard) motion-reduce:transition-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  // Selected: a 2 px ink edge and weight. On the path: a 1 px ink edge. Off it: muted text, the edge stays.
                  isSelected ? "ring-2 ring-foreground" : lit ? "ring-1 ring-foreground" : "ring-1 ring-border",
                  dim ? "text-muted-foreground" : "text-foreground",
                ),
              }
              const body = (
                <>
                                    {/* A long name ends in an ellipsis; the whole name is in the title and the accessible name. */}
                  {n.badge ? (
                    // The badge keeps its words and the name gives way. A space between them, so read as text they are
                    // two words; the tag is the Badge's outline tone, in the box's text colour so it dims with it.
                    <span className="flex min-w-0 items-center gap-2">
                      <span title={n.label} className={cn("min-w-0 truncate text-sm", isSelected ? "font-bold" : "font-medium")}>
                        {n.label}
                      </span>{" "}
                      <span title={n.badge} className={badgeTag}>
                        <span className="truncate">{n.badge}</span>
                      </span>
                    </span>
                  ) : (
                    <span title={n.label} className={cn("truncate text-sm", isSelected ? "font-bold" : "font-medium")}>
                      {n.label}
                    </span>
                  )}
                  {/* A space between the name and the line under it, so read as text they are two words, not one. */}
                  {(word || n.meta) && " "}
                  {(word || n.meta) && (
                    <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                      {n.status && word && (
                        <span className={cn("flex shrink-0 items-center gap-2", (n.status === "warning" || n.status === "danger") && statusText[n.status])}>
                          <StatusGlyph status={n.status} />
                          {word}
                        </span>
                      )}
                      {word && n.meta && <span aria-hidden="true">·</span>}
                      {n.meta && <span className="min-w-0 truncate tabular-nums">{n.meta}</span>}
                    </span>
                  )}
                </>
              )
              return n.href ? (
                <Link key={n.id} href={n.href} aria-current={isSelected ? "true" : undefined} {...props}>
                  {body}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(isSelected ? null : n.id)}
                  {...props}
                  className={cn("press", props.className)}
                >
                  {body}
                </button>
              )
            })}
          </div>
        </div>
      </Viewport>
    </div>
  )
}

/** The scrolling box: wider than the screen, it scrolls inside the frame and fades on the side that still hides nodes. */
function Viewport({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const edges = useScrollEdges(ref)
  return (
    <div ref={ref} data-slot="graph-viewport" style={scrollFadeMask(edges)} className="w-full overflow-x-auto overflow-y-hidden rounded-md">
      {children}
    </div>
  )
}

export type GraphListProps = Pick<GraphProps, "nodes" | "edges" | "label" | "empty" | "loading" | "linkAs" | "labels" | "className">

/**
 * The same graph as text: every node in reading order (inputs before what they feed), with its state, meta, inputs and
 * outputs. Offer it beside every Graph (a Graph / List switch), as charts offer a table: for screen readers, for exact
 * names, and on a phone, where it reads without scrolling sideways.
 */
export function GraphList({ nodes, edges, label: name, empty = "Nothing here yet.", loading, linkAs: Link = "a", labels: given, className }: GraphListProps) {
  const labels = { ...defaultLabels, ...given, status: { ...defaultLabels.status, ...given?.status } }
  const layout = React.useMemo(() => layoutGraph(nodes, edges), [nodes, edges])
  const { byId, inputs, outputs } = useNeighbours(nodes, layout)
  const list = "flex flex-col divide-y divide-border rounded-md bg-card ring-1 ring-border"

  if (loading) {
    return (
      <div data-slot="graph-list" data-loading="" aria-busy="true" className={cn(list, className)}>
        <p role="status" className="sr-only">
          {labels.loading}
        </p>
        {[0, 1, 2].map((k) => (
          <div key={k} className="flex flex-col gap-2 px-4 py-3">
            <Bone className="h-4 w-1/3" />
            <Bone className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    )
  }
  if (!layout.nodes.length) {
    return (
      <p data-slot="graph-list" data-empty="" className={cn("rounded-md bg-card p-4 text-sm text-muted-foreground ring-1 ring-border", className)}>
        {empty}
      </p>
    )
  }

  // One name per line: names often have commas of their own ("Hall B captures, Oct 2026").
  const names = (ids: string[]) => ids.map((id) => <span key={id}>{byId.get(id)!.label}</span>)
  return (
    <ul data-slot="graph-list" aria-label={name} className={cn(list, className)}>
      {layout.nodes.map(({ id }) => {
        const n = byId.get(id)!
        const word = statusWord(n, labels)
        const ins = inputs(id)
        const outs = outputs(id)
        return (
          <li key={id} className="flex min-w-0 flex-col gap-2 px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              {n.href ? (
                <Link
                  href={n.href}
                  className="rounded-2xs text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {n.label}
                </Link>
              ) : (
                <span className="text-sm font-medium">{n.label}</span>
              )}
              {n.badge && <span className={cn(badgeTag, "max-w-full")}>{n.badge}</span>}
              {n.status && word && (
                <span
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    n.status === "warning" || n.status === "danger" ? statusText[n.status] : "text-muted-foreground",
                  )}
                >
                  <StatusGlyph status={n.status} />
                  {word}
                </span>
              )}
              {n.meta && <span className="text-xs text-muted-foreground tabular-nums">{n.meta}</span>}
            </div>
            {(ins.length > 0 || outs.length > 0) && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                {ins.length > 0 && (
                  <>
                    <dt className="min-w-16 text-muted-foreground">{labels.inputs}</dt>
                    <dd className="flex min-w-0 flex-col">{names(ins)}</dd>
                  </>
                )}
                {outs.length > 0 && (
                  <>
                    <dt className="min-w-16 text-muted-foreground">{labels.outputs}</dt>
                    <dd className="flex min-w-0 flex-col">{names(outs)}</dd>
                  </>
                )}
              </dl>
            )}
          </li>
        )
      })}
    </ul>
  )
}
