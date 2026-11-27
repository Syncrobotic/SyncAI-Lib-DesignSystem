// @syncrobotic/file-type v0.53.0 · update: npx shadcn add @syncrobotic/file-type --overwrite
import * as React from "react"
import { File, FileArchive, FileAudio, FileCode, FileImage, FileJson, FileSpreadsheet, FileText, FileVideo, Map as MapIcon, Box, Database } from "lucide-react"
import { cn } from "@/lib/utils"

/*
  An icon for a file from its name or extension, with robot formats (mcap, bag, pgm, pcd, onnx) and the extension
  written on it. Neutral like every icon: the label tells formats apart, not colour.
*/

type Family = "image" | "video" | "audio" | "doc" | "sheet" | "code" | "data" | "archive" | "map" | "model" | "other"

const families: Record<Family, { icon: React.ElementType; exts: string[] }> = {
  image: { icon: FileImage, exts: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "tif", "tiff", "bmp"] },
  video: { icon: FileVideo, exts: ["mp4", "mov", "mkv", "avi", "webm", "h264"] },
  audio: { icon: FileAudio, exts: ["mp3", "wav", "flac", "ogg", "m4a"] },
  doc: { icon: FileText, exts: ["pdf", "doc", "docx", "txt", "md", "rtf", "pages"] },
  sheet: { icon: FileSpreadsheet, exts: ["xls", "xlsx", "csv", "tsv", "numbers"] },
  code: { icon: FileCode, exts: ["ts", "tsx", "js", "jsx", "py", "cpp", "c", "h", "rs", "go", "sh", "launch", "urdf", "xacro"] },
  data: { icon: FileJson, exts: ["json", "yaml", "yml", "toml", "xml", "parquet", "bag", "mcap", "db3"] },
  archive: { icon: FileArchive, exts: ["zip", "tar", "gz", "tgz", "7z", "rar"] },
  map: { icon: MapIcon, exts: ["pgm", "pcd", "las", "laz", "geojson", "kml", "osm"] },
  model: { icon: Box, exts: ["stl", "obj", "fbx", "glb", "gltf", "dae", "onnx", "pt", "tflite", "engine"] },
  other: { icon: File, exts: [] },
}

const byExt = new Map<string, Family>()
for (const [f, { exts }] of Object.entries(families)) for (const e of exts) byExt.set(e, f as Family)

/** The extension of a file name, lower case: "Hall-B.PGM" → "pgm", ".env" → "env", "Makefile" → "". */
export const extensionOf = (name: string) => {
  const base = name.split(/[\\/]/).pop() ?? name
  const i = base.lastIndexOf(".")
  return i < 0 ? "" : base.slice(i + 1).toLowerCase()
}
export const familyOf = (nameOrExt: string): Family => byExt.get(nameOrExt.includes(".") ? extensionOf(nameOrExt) : nameOrExt.toLowerCase()) ?? "other"

/**
 * An icon for a file, from its name or extension, with the extension written on it: robot logs (bag, mcap), maps (pgm,
 * pcd), models (onnx, stl), images, video, documents. Neutral like every icon: the label tells formats apart, not colour.
 */
export function FileTypeIcon({
  name,
  size = "md",
  variant = "tile",
  label,
  className,
}: {
  /** A file name ("route.geojson") or a bare extension ("geojson"). */
  name: string
  size?: "sm" | "md" | "lg"
  /** `tile`: the icon on a muted tile with the extension; `icon`: the glyph only; `label`: the extension as a tag. */
  variant?: "tile" | "icon" | "label"
  /** Override the written label, e.g. "ROS 2" for db3. */
  label?: string
  className?: string
}) {
  const ext = name.includes(".") ? extensionOf(name) : name.toLowerCase()
  const Icon = families[familyOf(ext)].icon
  const text = (label ?? ext ?? "").toUpperCase().slice(0, 5)
  if (variant === "icon")
    return (
      <Icon aria-hidden="true" className={cn(size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-6", "shrink-0 text-muted-foreground", className)} />
    )
  if (variant === "label")
    return (
      <span
        className={cn("inline-flex h-(--h-tag) shrink-0 items-center rounded-xs bg-muted px-2 font-mono text-xs font-medium text-muted-foreground", className)}
      >
        {text || "FILE"}
      </span>
    )
  return (
    <span
      data-slot="file-type"
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 flex-col items-center justify-center gap-1 rounded-sm bg-muted text-muted-foreground",
        size === "sm" && "size-8 [&_svg]:size-4",
        size === "md" && "size-10 [&_svg]:size-5",
        size === "lg" && "size-14 [&_svg]:size-6",
        className,
      )}
    >
      <Icon aria-hidden="true" />
      {size === "lg" && text && <span className="font-mono text-xs leading-none font-medium">{text}</span>}
    </span>
  )
}

export { Database as FileDatabaseIcon }
