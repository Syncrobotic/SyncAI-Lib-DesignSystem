import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileArchive, FileImage, FileJson, FileText, FileVideo, FolderOpen } from "lucide-react"
import { Tree, type TreeNode } from "@/registry/syncrobotic/ui/tree"

const meta: Meta = { title: "Navigation/Tree" }
export default meta
type S = StoryObj

// A release, the label sets it was trained on, and where their pictures came from. A source used twice is named
// again with a marker instead of being drawn twice in full.
const lineage: TreeNode[] = [
  {
    id: "release",
    label: "Picking detector v3.2",
    href: "#release/picking-detector-v3.2",
    meta: "Release",
    children: [
      {
        id: "boxes",
        label: "Box labels v7",
        href: "#labels/box-v7",
        meta: "48,210 boxes",
        children: [
          { id: "boxes-hall-b", label: "Hall B camera captures, Oct 2026", href: "#sources/hall-b-2026-10", meta: "12,400 frames" },
          { id: "boxes-synthetic", label: "Synthetic pallets v4", href: "#sources/synthetic-pallets-v4", meta: "30,000 frames" },
        ],
      },
      {
        id: "masks",
        label: "Pallet-edge masks v2",
        href: "#labels/pallet-edge-v2",
        meta: "9,812 masks",
        children: [
          { id: "masks-hall-b", label: "Hall B camera captures, Oct 2026", href: "#sources/hall-b-2026-10", meta: "(listed above)" },
          { id: "masks-night", label: "Night-shift captures, Hall A", href: "#sources/night-hall-a", meta: "3,150 frames" },
        ],
      },
    ],
  },
]

export const TreeLineage: S = {
  render: () => <Tree label="Lineage of Picking detector v3.2" items={lineage} expandAll />,
}

const collections: TreeNode[] = [
  {
    id: "eval",
    label: "Evaluation sets",
    meta: "4",
    children: [
      { id: "eval-low-light", label: "Low light, loading docks", href: "#eval/low-light", meta: "1,200" },
      { id: "eval-occlusion", label: "Occluded pallets", href: "#eval/occlusion", meta: "860" },
      { id: "eval-reflective", label: "Reflective shrink wrap", href: "#eval/reflective", meta: "540" },
      { id: "eval-people", label: "People near forklifts", href: "#eval/people", meta: "2,310" },
    ],
  },
  {
    id: "train",
    label: "Training sets",
    meta: "2",
    children: [
      { id: "train-boxes", label: "Box labels v7", href: "#train/box-v7", meta: "48,210" },
      { id: "train-masks", label: "Pallet-edge masks v2", href: "#train/pallet-edge-v2", meta: "9,812" },
    ],
  },
  { id: "archive", label: "Archived", meta: "0", children: [] },
]

export const TreeCollapsed: S = {
  render: () => <Tree label="Collections" items={collections} />,
}

const files: TreeNode[] = [
  {
    id: "images",
    label: "images",
    icon: FolderOpen,
    meta: "3",
    children: [
      { id: "images/dock-03_0412.jpg", label: "dock-03_0412.jpg", icon: FileImage, meta: "2.4 MB" },
      { id: "images/dock-03_0413.jpg", label: "dock-03_0413.jpg", icon: FileImage, meta: "2.3 MB" },
      { id: "images/aisle-12_0090.jpg", label: "aisle-12_0090.jpg", icon: FileImage, meta: "2.6 MB" },
    ],
  },
  {
    id: "labels",
    label: "labels",
    icon: FolderOpen,
    meta: "2",
    children: [
      { id: "labels/boxes.json", label: "boxes.json", icon: FileJson, meta: "18 MB" },
      { id: "labels/pallet-edges.json", label: "pallet-edges.json", icon: FileJson, meta: "6 MB" },
    ],
  },
  { id: "video", label: "video", icon: FolderOpen, meta: "1", children: [{ id: "video/hall-b-night.mp4", label: "hall-b-night.mp4", icon: FileVideo, meta: "1.2 GB" }] },
  { id: "raw.tar.gz", label: "raw.tar.gz", icon: FileArchive, meta: "38 GB" },
  { id: "README.md", label: "README.md", icon: FileText, meta: "4 KB" },
]

function Explorer() {
  const [selected, setSelected] = React.useState("labels/boxes.json")
  return (
    <div className="flex flex-col gap-2">
      <Tree mode="select" label="Dataset files" items={files} defaultExpanded={["images", "labels"]} selectedId={selected} onSelectedChange={setSelected} />
      <p className="text-xs text-muted-foreground">
        Open: <span className="font-medium text-foreground">{selected}</span>
      </p>
    </div>
  )
}

export const TreeFileExplorer: S = { render: () => <Explorer /> }

const restricted: TreeNode[] = [
  {
    id: "captures",
    label: "captures",
    icon: FolderOpen,
    children: [
      { id: "captures/forklift-lane", label: "forklift-lane", icon: FolderOpen, meta: "1,840 files", children: [] },
      { id: "captures/faces", label: "faces", icon: FolderOpen, meta: "T2 · no access", disabled: true, children: [] },
      { id: "captures/plates", label: "number-plates", icon: FolderOpen, meta: "T2 · no access", disabled: true, children: [] },
      { id: "captures/shelves", label: "shelves", icon: FolderOpen, meta: "920 files", children: [] },
    ],
  },
  { id: "manifest.json", label: "manifest.json", icon: FileJson, meta: "12 KB" },
]

export const TreeDisabled: S = {
  render: () => <Tree mode="select" label="Capture folders" items={restricted} defaultExpanded={["captures"]} defaultSelectedId="captures/forklift-lane" />,
}

export const TreeEmpty: S = {
  render: () => <Tree label="Lineage" items={[]} empty="No sources recorded for this release yet." />,
}
