import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Camera, ImagePlus, Map } from "lucide-react"
import { usePresenceList } from "@/registry/syncrobotic/hooks/use-presence"
import { Attachment } from "@/registry/syncrobotic/ui/attachment"
import { FileTypeIcon } from "@/registry/syncrobotic/ui/file-type"
import { FileUpload, formatBytes, type FileRejection } from "@/registry/syncrobotic/ui/file-upload"

const meta: Meta = { title: "Inputs/File upload" }
export default meta
type S = StoryObj

const reasons = { type: "is not a supported type", size: "is too large", count: "is over the file limit" }

export const FileUploadDefault: S = {
  render: function U() {
    const [files, setFiles] = React.useState<File[]>([])
    // Removed files fade out where they were instead of vanishing.
    const { rendered, done } = usePresenceList(files, (f) => f.name)
    return (
      <div className="flex flex-col gap-3">
        <FileUpload
          onFiles={(f) => setFiles((p) => [...p, ...f.filter((n) => !p.some((x) => x.name === n.name))])}
          hint="Any file up to 50 MB"
          maxSize={50 * 1024 ** 2}
        />
        {rendered.map(({ item: f, leaving }) => (
          <Attachment
            key={f.name}
            name={f.name}
            size={f.size}
            leaving={leaving}
            onLeft={() => done(f.name)}
            onRemove={() => setFiles((p) => p.filter((x) => x !== f))}
          />
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

/** A round avatar: the whole circle is the drop target. */
export const FileUploadAvatar: S = {
  render: function A() {
    const [url, setUrl] = React.useState<string>()
    return (
      <div className="flex items-center gap-4">
        <FileUpload
          multiple={false}
          accept="image/*"
          onFiles={([f]) => setUrl(URL.createObjectURL(f))}
          className="size-20 rounded-full p-0"
          aria-label="Robot photo"
        >
          {url ? (
            <img src={url} alt="" className="size-full rounded-full object-cover" />
          ) : (
            <ImagePlus aria-hidden="true" className="size-6 text-muted-foreground" />
          )}
          <span className="sr-only">Upload robot photo</span>
        </FileUpload>
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Robot photo</span>
          <span className="text-xs text-muted-foreground">Square, at least 256 px</span>
        </div>
      </div>
    )
  },
}

/** Up to three files: the count is in the hint, and a fourth is refused by name. */
export const FileUploadMaxFiles: S = {
  render: function M() {
    const [files, setFiles] = React.useState<File[]>([])
    const [error, setError] = React.useState<string>()
    return (
      <div className="flex flex-col gap-2">
        <FileUpload
          maxFiles={3 - files.length}
          disabled={files.length >= 3}
          onFiles={(f) => (setFiles((p) => [...p, ...f]), setError(undefined))}
          onReject={(r) => setError(r.map((x) => `${x.file.name} ${reasons[x.reason]}`).join(". "))}
          title={files.length >= 3 ? "Three files added" : "Add up to 3 files"}
          hint={`${files.length} of 3`}
          compact
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {files.map((f) => (
          <Attachment key={f.name} name={f.name} size={f.size} onRemove={() => setFiles((p) => p.filter((x) => x !== f))} />
        ))}
      </div>
    )
  },
}

/** Upload with progress: each file appears at once and fills as it uploads. */
export const FileUploadWithProgress: S = {
  render: function P() {
    const [items, setItems] = React.useState<{ name: string; size: number; progress: number }[]>([
      { name: "hall-b-map-v13.pgm", size: 3.4 * 1024 ** 2, progress: 64 },
    ])
    return (
      <div className="flex flex-col gap-2">
        <FileUpload
          onFiles={(f) => setItems((p) => [...p, ...f.map((x) => ({ name: x.name, size: x.size, progress: 0 }))])}
          icon={Map}
          title="Drop maps here"
          hint=".pgm and .yaml"
        />
        {items.map((it) => (
          <Attachment
            key={it.name}
            name={it.name}
            size={it.size}
            status={it.progress < 100 ? "uploading" : "done"}
            progress={it.progress}
            onRemove={() => setItems((p) => p.filter((x) => x !== it))}
          />
        ))}
      </div>
    )
  },
}

/** Inside a form, under a label: the compact row, so the form stays short. */
export const FileUploadInForm: S = {
  render: () => (
    <form className="flex max-w-sm flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Incident summary
        <textarea
          rows={3}
          className="rounded-sm bg-card px-3 py-2 text-base font-normal ring-1 ring-input ring-inset"
          defaultValue="Pallet blocked corridor B-4 for 6 minutes."
        />
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Evidence</span>
        <FileUpload compact onFiles={() => {}} title="Attach photos or logs" hint="Up to 20 MB each" maxSize={20 * 1024 ** 2} />
      </div>
    </form>
  ),
}

/** Says which formats it takes with their icons, for a drop zone people use once a month. */
export const FileUploadFormats: S = {
  render: () => (
    <FileUpload onFiles={() => {}} accept=".mcap,.bag,.db3" title="Drop a robot log" hint="Up to 2 GB" maxSize={2 * 1024 ** 3}>
      <span className="flex flex-col items-center gap-3">
        <span className="flex gap-2">
          {["mcap", "bag", "db3"].map((e) => (
            <FileTypeIcon key={e} name={e} size="md" />
          ))}
        </span>
        <span className="text-sm font-medium">Drop a robot log</span>
        <span className="text-xs text-muted-foreground">.mcap, .bag (ROS 1) or .db3 (ROS 2), up to {formatBytes(2 * 1024 ** 3)}</span>
      </span>
    </FileUpload>
  ),
}

/** Refused files: each says its name and why, under the zone, and the zone stays ready. */
export const FileUploadRejected: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <FileUpload onFiles={() => {}} accept=".pgm,.yaml" title="Drop a site map" hint=".pgm with its .yaml, up to 200 MB" icon={Map} />
      <ul className="flex flex-col gap-1 text-xs text-danger">
        <li>floor-plan.pdf is not a supported type.</li>
        <li>full-scan.pgm is too large (412 MB, limit 200 MB).</li>
      </ul>
    </div>
  ),
}
