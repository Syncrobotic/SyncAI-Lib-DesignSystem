import type { Meta, StoryObj } from "@storybook/react"
import { FileTypeIcon, familyOf } from "@/registry/syncrobotic/ui/file-type"

const meta: Meta = { title: "Display/File type" }
export default meta
type S = StoryObj

const robotFormats = ["mcap", "bag", "db3", "pgm", "pcd", "yaml", "urdf", "onnx", "stl", "mp4", "jpg", "pdf", "csv", "zip"]

export const FileTypeRobotFormats: S = {
  render: () => (
    <div className="grid grid-cols-5 gap-3">
      {robotFormats.map((e) => (
        <div key={e} className="flex flex-col items-center gap-1">
          <FileTypeIcon name={e} size="lg" />
          <span className="text-xs text-muted-foreground">{familyOf(e)}</span>
        </div>
      ))}
    </div>
  ),
}

export const FileTypeSizes: S = {
  render: () => (
    <div className="flex items-end gap-3">
      <FileTypeIcon name="pgm" size="sm" />
      <FileTypeIcon name="pgm" size="md" />
      <FileTypeIcon name="pgm" size="lg" />
    </div>
  ),
}

export const FileTypeVariants: S = {
  render: () => (
    <div className="flex items-center gap-4">
      <FileTypeIcon name="incident.mcap" variant="tile" size="lg" />
      <FileTypeIcon name="incident.mcap" variant="icon" size="lg" />
      <FileTypeIcon name="incident.mcap" variant="label" />
    </div>
  ),
}

export const FileTypeFromName: S = {
  render: () => (
    <ul className="flex flex-col gap-2 text-sm">
      {["Hall-B.PGM", "patrol_route.geojson", ".env", "Makefile", "model.final.onnx"].map((n) => (
        <li key={n} className="flex items-center gap-3">
          <FileTypeIcon name={n} variant="icon" size="md" />
          <span className="font-mono">{n}</span>
          <span className="text-muted-foreground">→ {familyOf(n)}</span>
        </li>
      ))}
    </ul>
  ),
}

export const FileTypeCustomLabel: S = {
  render: () => (
    <div className="flex items-center gap-3">
      <FileTypeIcon name="db3" label="ROS2" size="lg" />
      <FileTypeIcon name="engine" label="TRT" size="lg" />
    </div>
  ),
}

export const FileTypeBrowser: S = {
  render: () => (
    <ul className="flex flex-col">
      {[
        ["site-maps", "folder", "12 items"],
        ["hall-b-map-v12.pgm", "", "3.2 MB"],
        ["hall-b-map-v12.yaml", "", "1 KB"],
        ["patrol-north.geojson", "", "48 KB"],
        ["detector-v4.onnx", "", "96 MB"],
      ].map(([n, kind, size]) => (
        <li key={n} className="flex min-h-(--h-md) items-center gap-3 border-b border-border py-1 text-sm last:border-b-0">
          <FileTypeIcon name={kind === "folder" ? "other" : n} size="sm" />
          <span className="flex-1 truncate font-mono">{n}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{size}</span>
        </li>
      ))}
    </ul>
  ),
}
