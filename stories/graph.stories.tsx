import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Graph, GraphList, type GraphEdge, type GraphNode } from "@/registry/syncrobotic/ui/graph"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const meta: Meta = { title: "Display/Graph" }
export default meta
type S = StoryObj

// Under 640 px: a phone, where the list reads without scrolling sideways. The server and the first render say no.
const phoneQuery = "(max-width: 639px)"
const subscribePhone = (notify: () => void) => {
  const mq = window.matchMedia(phoneQuery)
  mq.addEventListener("change", notify)
  return () => mq.removeEventListener("change", notify)
}

/** A graph with its text view, as a chart has its table: a Graph / List switch above it. A phone starts on the list. */
function WithList({ title, nodes, edges, label, defaultSelectedId }: { title: string; nodes: GraphNode[]; edges: GraphEdge[]; label: string; defaultSelectedId?: string }) {
  const phone = React.useSyncExternalStore(subscribePhone, () => window.matchMedia(phoneQuery).matches, () => false)
  const [picked, setView] = React.useState<string | null>(null)
  const view = picked ?? (phone ? "list" : "graph")
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{title}</p>
        <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto shrink-0">
          <SegmentedControlItem value="graph">Graph</SegmentedControlItem>
          <SegmentedControlItem value="list">List</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {view === "graph" ? (
        <Graph label={label} nodes={nodes} edges={edges} defaultSelectedId={defaultSelectedId} />
      ) : (
        <GraphList label={label} nodes={nodes} edges={edges} />
      )}
    </div>
  )
}

// Where Dataset v3 came from: two label sets, both drawing on the Hall B captures. In a tree that source would be listed
// twice; here it is one box with two outputs.
const lineageNodes: GraphNode[] = [
  { id: "hall-b", label: "Hall B camera captures, Oct 2026", meta: "12,400 frames", href: "#sources/hall-b-2026-10" },
  { id: "night-a", label: "Night-shift captures, Hall A", meta: "3,150 frames", href: "#sources/night-hall-a" },
  { id: "synthetic", label: "Synthetic pallets v4", meta: "30,000 frames", href: "#sources/synthetic-pallets-v4" },
  { id: "boxes", label: "Box labels v7", meta: "48,210 boxes", href: "#labels/box-v7" },
  { id: "masks", label: "Pallet-edge masks v2", meta: "9,812 masks", href: "#labels/pallet-edge-v2" },
  { id: "dataset", label: "Dataset v3", meta: "45,550 frames", href: "#datasets/v3" },
  { id: "model", label: "Picking detector v3.2", meta: "Released 14 Nov", href: "#models/picking-detector-v3.2" },
]
const lineageEdges: GraphEdge[] = [
  { from: "hall-b", to: "boxes" },
  { from: "synthetic", to: "boxes" },
  { from: "hall-b", to: "masks" },
  { from: "night-a", to: "masks" },
  { from: "boxes", to: "dataset" },
  { from: "masks", to: "dataset" },
  { from: "dataset", to: "model" },
]

export const GraphLineage: S = {
  render: () => <WithList title="Lineage of Dataset v3" label="Lineage of Dataset v3" nodes={lineageNodes} edges={lineageEdges} />,
}

/** A node selected: its inputs and outputs, all the way up and down, in the ink colour; the rest steps back. */
export const GraphSelected: S = {
  render: () => <Graph label="Lineage of Dataset v3" nodes={lineageNodes} edges={lineageEdges} defaultSelectedId="masks" />,
}

// A training run: what went in and what came out. The run itself is busy (a filled circle, still grey).
const trainingNodes: GraphNode[] = [
  { id: "dataset", label: "Dataset v3", meta: "45,550 frames" },
  { id: "base", label: "Base model: detector v3.1", meta: "From release 3.1" },
  { id: "config", label: "Config: 40 epochs, batch 64", meta: "picking-v3.yaml" },
  { id: "run", label: "Training run 412", status: "active", statusLabel: "Running · epoch 31 of 40" },
  { id: "checkpoint", label: "Checkpoint, epoch 30", meta: "212 MB" },
  { id: "metrics", label: "Training metrics", meta: "Loss 0.184" },
  { id: "eval", label: "Evaluation: low light", status: "offline", statusLabel: "Waits for the run" },
]
const trainingEdges: GraphEdge[] = [
  { from: "dataset", to: "run" },
  { from: "base", to: "run" },
  { from: "config", to: "run" },
  { from: "run", to: "checkpoint" },
  { from: "run", to: "metrics" },
  { from: "checkpoint", to: "eval" },
]

export const GraphTrainingPipeline: S = {
  render: () => <WithList title="Training run 412" label="Inputs and outputs of training run 412" nodes={trainingNodes} edges={trainingEdges} />,
}

// A mission's steps, top to bottom: two robots scan in parallel, then the scans are merged.
const missionNodes: GraphNode[] = [
  { id: "plan", label: "Plan route, Aisle 12", status: "normal", statusLabel: "Done", meta: "06:02" },
  { id: "undock-1", label: "AMR-07 leaves Dock 3", status: "normal", statusLabel: "Done", meta: "06:04" },
  { id: "undock-2", label: "AMR-11 leaves Dock 3", status: "normal", statusLabel: "Done", meta: "06:05" },
  { id: "scan-a", label: "Scan shelves A–F", status: "normal", statusLabel: "Done", meta: "AMR-07 · 18 min" },
  { id: "scan-g", label: "Scan shelves G–L", status: "active", statusLabel: "Scanning", meta: "AMR-11 · shelf J" },
  { id: "merge", label: "Merge scans", status: "offline", statusLabel: "Not started" },
  { id: "report", label: "Stock report", status: "offline", statusLabel: "Not started" },
]
const missionEdges: GraphEdge[] = [
  { from: "plan", to: "undock-1" },
  { from: "plan", to: "undock-2" },
  { from: "undock-1", to: "scan-a" },
  { from: "undock-2", to: "scan-g" },
  { from: "scan-a", to: "merge" },
  { from: "scan-g", to: "merge" },
  { from: "merge", to: "report" },
]

export const GraphTopToBottom: S = {
  render: () => (
    <div className="w-full max-w-lg">
      <Graph orientation="vertical" label="Steps of mission Stock count, Aisle 12" nodes={missionNodes} edges={missionEdges} />
    </div>
  ),
}

// A step failed: it is the one coloured box. Everything after it did not run, and says so in grey.
const failedNodes: GraphNode[] = [
  { id: "captures", label: "Dock 3 captures, 18 Nov", status: "normal", statusLabel: "Imported", meta: "8,200 frames" },
  { id: "dedupe", label: "Remove near-duplicates", status: "normal", statusLabel: "Done", meta: "1,140 removed" },
  { id: "label", label: "Auto-label boxes", status: "normal", statusLabel: "Done", meta: "21,900 boxes" },
  { id: "qa", label: "Label QA", status: "danger", statusLabel: "Failed", meta: "212 boxes outside image" },
  { id: "split", label: "Split train / eval", status: "offline", statusLabel: "Not run" },
  { id: "publish", label: "Publish Dataset v4", status: "offline", statusLabel: "Not run" },
  { id: "notify", label: "Notify data team", status: "normal", statusLabel: "Sent", meta: "08:14" },
]
const failedEdges: GraphEdge[] = [
  { from: "captures", to: "dedupe" },
  { from: "dedupe", to: "label" },
  { from: "label", to: "qa" },
  { from: "qa", to: "split" },
  { from: "split", to: "publish" },
  { from: "qa", to: "notify" },
]

export const GraphNodeInError: S = {
  render: () => <WithList title="Build of Dataset v4" label="Steps of the Dataset v4 build" nodes={failedNodes} edges={failedEdges} defaultSelectedId="qa" />,
}

export const GraphEmpty: S = {
  render: () => <Graph label="Lineage of Dataset v5" nodes={[]} edges={[]} empty="No lineage recorded yet. It appears once Dataset v5 is built from a label set." />,
}

export const GraphLoading: S = {
  render: () => <Graph label="Lineage of Dataset v3" nodes={[]} edges={[]} loading />,
}

// About forty nodes: captures from six places, cleaned, labelled, built into datasets, trained, evaluated and released.
const sites = ["Hall A day", "Hall A night", "Hall B", "Dock 3", "Yard", "Synthetic"]
const largeNodes: GraphNode[] = [
  ...sites.map((s, i) => ({ id: `raw-${i}`, label: `${s} captures`, meta: `${[12, 3, 14, 8, 5, 30][i]},${["400", "150", "020", "200", "610", "000"][i]} frames` })),
  ...sites.map((s, i) => ({ id: `clean-${i}`, label: `Cleaned: ${s}`, meta: `${[4, 2, 6, 3, 7, 0][i]}% removed` })),
  { id: "lab-boxes", label: "Box labels v7", meta: "48,210 boxes" },
  { id: "lab-masks", label: "Pallet-edge masks v2", meta: "9,812 masks" },
  { id: "lab-people", label: "People labels v3", meta: "6,430 boxes" },
  { id: "lab-forks", label: "Fork-tip keypoints v1", meta: "2,880 points" },
  { id: "lab-night", label: "Night boxes v2", meta: "3,020 boxes" },
  { id: "ds-pick", label: "Dataset: picking v3", meta: "45,550 frames" },
  { id: "ds-safety", label: "Dataset: safety v2", meta: "19,300 frames" },
  { id: "ds-forks", label: "Dataset: forks v1", meta: "8,200 frames" },
  { id: "base", label: "Base model: detector v3.1" },
  { id: "run-410", label: "Training run 410", status: "normal", statusLabel: "Done" },
  { id: "run-411", label: "Training run 411", status: "normal", statusLabel: "Done" },
  { id: "run-412", label: "Training run 412", status: "active", statusLabel: "Running" },
  { id: "run-413", label: "Training run 413", status: "danger", statusLabel: "Failed", meta: "Out of GPU memory" },
  { id: "m-pick", label: "Picking detector v3.2" },
  { id: "m-safety", label: "People detector v2.0" },
  { id: "m-forks", label: "Fork-tip model v1.0", status: "offline", statusLabel: "Not built" },
  { id: "m-night", label: "Night detector v1.1", status: "offline", statusLabel: "Not built" },
  { id: "eval-low", label: "Eval set: low light" },
  { id: "eval-occ", label: "Eval set: occlusion" },
  { id: "eval-people", label: "Eval set: people near forklifts" },
  { id: "ev-pick", label: "Evaluation: picking v3.2", meta: "mAP 0.81" },
  { id: "ev-safety", label: "Evaluation: people v2.0", status: "warning", statusLabel: "Below target", meta: "Recall 0.88" },
  { id: "rel-3-2", label: "Release 3.2", meta: "14 Nov" },
  { id: "rel-3-3", label: "Release 3.3", status: "offline", statusLabel: "Blocked" },
]
const largeEdges: GraphEdge[] = [
  ...sites.map((_, i) => ({ from: `raw-${i}`, to: `clean-${i}` })),
  { from: "clean-0", to: "lab-boxes" },
  { from: "clean-2", to: "lab-boxes" },
  { from: "clean-5", to: "lab-boxes" },
  { from: "clean-2", to: "lab-masks" },
  { from: "clean-3", to: "lab-masks" },
  { from: "clean-0", to: "lab-people" },
  { from: "clean-4", to: "lab-people" },
  { from: "clean-3", to: "lab-forks" },
  { from: "clean-1", to: "lab-night" },
  { from: "lab-boxes", to: "ds-pick" },
  { from: "lab-masks", to: "ds-pick" },
  { from: "lab-night", to: "ds-pick" },
  { from: "lab-people", to: "ds-safety" },
  { from: "lab-night", to: "ds-safety" },
  { from: "lab-forks", to: "ds-forks" },
  { from: "ds-pick", to: "run-410" },
  { from: "ds-safety", to: "run-411" },
  { from: "ds-forks", to: "run-412" },
  { from: "ds-pick", to: "run-413" },
  { from: "base", to: "run-410" },
  { from: "base", to: "run-411" },
  { from: "base", to: "run-413" },
  { from: "run-410", to: "m-pick" },
  { from: "run-411", to: "m-safety" },
  { from: "run-412", to: "m-forks" },
  { from: "run-413", to: "m-night" },
  { from: "m-pick", to: "ev-pick" },
  { from: "eval-low", to: "ev-pick" },
  { from: "eval-occ", to: "ev-pick" },
  { from: "m-safety", to: "ev-safety" },
  { from: "eval-people", to: "ev-safety" },
  { from: "eval-low", to: "ev-safety" },
  { from: "ev-pick", to: "rel-3-2" },
  { from: "m-pick", to: "rel-3-2" },
  { from: "ev-safety", to: "rel-3-3" },
  { from: "m-safety", to: "rel-3-3" },
]

/** The size this layout is for: about forty nodes. Past sixty, use a dedicated graph library with panning. */
export const GraphLarge: S = {
  render: () => <WithList title="Picking and safety models, end to end" label="Lineage of the picking and safety models" nodes={largeNodes} edges={largeEdges} />,
}
