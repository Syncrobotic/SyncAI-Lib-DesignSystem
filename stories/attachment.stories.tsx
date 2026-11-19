import type { Meta, StoryObj } from "@storybook/react"
import { Paperclip, Send } from "lucide-react"
import { Attachment } from "@/registry/syncrobotic/ui/attachment"
import { Button } from "@/registry/syncrobotic/ui/button"

const meta: Meta = { title: "Display/Attachment" }
export default meta
type S = StoryObj

const noop = () => {}

export const AttachmentStates: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Attachment name="incident-7F3A.mcap" size={86 * 1024 ** 2} status="done" onDownload={noop} onRemove={noop} />
      <Attachment name="hall-b-map-v12.pgm" size={3.2 * 1024 ** 2} status="uploading" progress={68} onRemove={noop} />
      <Attachment name="route.geojson" size={48 * 1024} status="error" error="Not a valid GeoJSON file." onRetry={noop} onRemove={noop} />
      <Attachment name="handover.pdf" size={220 * 1024} status="idle" onRemove={noop} />
    </div>
  ),
}

export const AttachmentChips: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Attachment variant="chip" name="door-3.jpg" size={1.2 * 1024 ** 2} onRemove={noop} />
      <Attachment variant="chip" name="lidar-scan.pcd" status="uploading" progress={30} size={24 * 1024 ** 2} onRemove={noop} />
      <Attachment variant="chip" name="notes.txt" status="error" error="Upload failed" onRetry={noop} onRemove={noop} />
    </div>
  ),
}

export const AttachmentInComposer: S = {
  render: () => (
    // The text box has no edge of its own, so the whole composer shows focus: the ring moves to the box you type in.
    <div className="flex flex-col gap-2 rounded-lg bg-card p-2 ring-1 ring-input has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-ring">
      <div className="flex flex-wrap gap-2">
        <Attachment variant="chip" name="obstacle.jpg" size={900 * 1024} onRemove={noop} />
        <Attachment variant="chip" name="7F3A-log.mcap" size={12 * 1024 ** 2} onRemove={noop} />
      </div>
      <div className="flex items-end gap-2">
        <textarea
          aria-label="Message"
          rows={2}
          // A no-break space keeps "door 3" together when the placeholder wraps.
          placeholder={"What happened at door\u00a03?"}
          // focus-ring: the composer around it draws the ring (has-[textarea:focus-visible]).
          className="min-h-(--h-md) flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted-foreground"
        />
        <Button variant="ghost" size="icon" aria-label="Attach files">
          <Paperclip aria-hidden="true" />
        </Button>
        <Button size="icon" aria-label="Send">
          <Send aria-hidden="true" />
        </Button>
      </div>
    </div>
  ),
}

export const AttachmentImages: S = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Attachment variant="image" name="gate-north.jpg" onRemove={noop} />
      <Attachment variant="image" name="pallet-blocking.jpg" status="uploading" progress={55} onRemove={noop} />
      <Attachment variant="image" name="scan.pcd" status="error" error="Too large" onRemove={noop} />
    </div>
  ),
}

export const AttachmentReadOnly: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      {/* tokens-ok: an incident number, not a colour */}
      <span className="text-sm font-medium">Attached to incident #2041</span>
      <Attachment name="incident-2041.mcap" size={86 * 1024 ** 2} onDownload={noop} />
      <Attachment name="operator-report.pdf" size={340 * 1024} onDownload={noop} />
    </div>
  ),
}

/** Photos from an incident report: image tiles in a wrapping grid. */
export const AttachmentGallery: S = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {["door-3-left.jpg", "door-3-right.jpg", "pallet.jpg", "corridor-b4.jpg", "badge-reader.jpg"].map((n) => (
        <Attachment key={n} variant="image" name={n} onRemove={noop} />
      ))}
    </div>
  ),
}

/** A long name keeps its extension visible; the size stays on the right. */
export const AttachmentLongName: S = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Attachment name="taipei-warehouse-hall-b-night-patrol-2026-11-17-full-recording.mcap" size={1.8 * 1024 ** 3} onDownload={noop} onRemove={noop} />
      <Attachment variant="chip" name="taipei-warehouse-floor-plan-revision-12-final.pdf" size={4.1 * 1024 ** 2} onRemove={noop} />
    </div>
  ),
}
