import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Camera, ImagePlus, Map } from "lucide-react"
import { Attachment } from "@/registry/syncrobotic/ui/attachment"
import { FileUpload, formatBytes, type FileRejection } from "@/registry/syncrobotic/ui/file-upload"

const meta: Meta = { title: "Inputs/File upload" }
export default meta
type S = StoryObj

const reasons = { type: "is not a supported type", size: "is too large", count: "is over the file limit" }

export const FileUploadDefault: S = {
  render: function U() {
    const [files, setFiles] = React.useState<File[]>([])
    return (
      <div className="flex flex-col gap-3">
        <FileUpload onFiles={(f) => setFiles((p) => [...p, ...f])} hint="Any file up to 50 MB" maxSize={50 * 1024 ** 2} />
        {files.map((f) => (
          <Attachment key={f.name} name={f.name} size={f.size} onRemove={() => setFiles((p) => p.filter((x) => x !== f))} />
        ))}
      </div>
    )
  },
}

export const FileUploadMaps: S = {
  render: function U() {
    const [error, setError] = React.useState<string>()
    return (
      <div className="flex flex-col gap-2">
        <FileUpload
          onFiles={() => setError(undefined)}
          onReject={(r: FileRejection[]) => setError(r.map((x) => `${x.file.name} ${reasons[x.reason]}`).join(". "))}
          accept=".pgm,.yaml,.pcd"
          icon={Map}
          title="Drop a site map"
          hint=".pgm with its .yaml, or a .pcd point cloud, up to 200 MB"
          maxSize={200 * 1024 ** 2}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  },
}

export const FileUploadCompact: S = {
  render: () => <FileUpload compact onFiles={() => {}} title="Attach a log" hint=".bag or .mcap" accept=".bag,.mcap" />,
}

export const FileUploadSingleImage: S = {
  render: function U() {
    const [url, setUrl] = React.useState<string>()
    return (
      <FileUpload multiple={false} accept="image/*" onFiles={([f]) => setUrl(URL.createObjectURL(f))} className="size-40 p-0">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview
          <img src={url} alt="Site photo" className="size-full rounded-md object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus aria-hidden="true" className="size-6" />
            <span className="text-xs">Site photo</span>
          </span>
        )}
      </FileUpload>
    )
  },
}

export const FileUploadQueue: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <FileUpload onFiles={() => {}} icon={Camera} title="Add camera clips" hint="MP4 or MOV, up to 2 GB each" accept="video/*" />
      <Attachment name="north-gate-0214.mp4" size={182 * 1024 ** 2} status="done" onDownload={() => {}} onRemove={() => {}} />
      <Attachment name="hall-b-0215.mp4" size={640 * 1024 ** 2} status="uploading" progress={42} onRemove={() => {}} />
      <Attachment name="dock-0216.mov" size={2.4 * 1024 ** 3} status="error" error="Over 2 GB. Trim it or split it." onRetry={() => {}} onRemove={() => {}} />
    </div>
  ),
}

export const FileUploadDisabled: S = {
  render: () => <FileUpload disabled onFiles={() => {}} title="Uploads are paused" hint={`Storage is full (${formatBytes(512 * 1024 ** 3)})`} />,
}
