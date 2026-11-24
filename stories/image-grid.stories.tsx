import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ImageGrid, type ImageGridItem } from "@/registry/syncrobotic/ui/image-grid"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/registry/syncrobotic/ui/sheet"
import { brokenPhoto, placeholderPhoto } from "./placeholder-photos"

const meta: Meta = { title: "Display/Image grid" }
export default meta
type S = StoryObj

const frames = (n: number, prefix = "aisle"): ImageGridItem[] =>
  Array.from({ length: n }, (_, i) => {
    const name = `${prefix}-${String(i + 1).padStart(4, "0")}.jpg`
    return {
      id: name,
      src: placeholderPhoto(i, name.replace(".jpg", "")),
      alt: `Warehouse aisle, frame ${i + 1}`,
      name,
      caption: `Hall B · camera 2 · 14:${String(10 + i).padStart(2, "0")} · ${1 + (i % 4)} labels`,
    }
  })

/** A dataset's pictures: a tile opens the lightbox, where ← and → move and Esc closes. */
export const ImageGridDataset: S = {
  render: () => <ImageGrid label="Images in Forklift aisles v3" items={frames(8)} />,
}

function OpenInSheet() {
  const items = frames(8)
  const [open, setOpen] = React.useState<ImageGridItem | null>(null)
  // The tile that opened the sheet: focus goes back to it when the sheet closes.
  const opener = React.useRef<HTMLElement | null>(null)
  return (
    <>
      <ImageGrid
        label="Images in Forklift aisles v3"
        items={items}
        onOpen={(item) => {
          opener.current = document.activeElement as HTMLElement | null
          setOpen(item)
        }}
      />
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent
          side="right"
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            opener.current?.focus()
          }}
        >
          <SheetHeader>
            <SheetTitle>{open?.name}</SheetTitle>
            <SheetDescription>{open?.caption}</SheetDescription>
          </SheetHeader>
          {open && <img src={open.src} alt={open.alt} className="w-full rounded-sm" />}
        </SheetContent>
      </Sheet>
    </>
  )
}

/** `onOpen`: a tile opens the app's own Sheet with the picture's details instead of the lightbox; closing it returns focus to the tile. */
export const ImageGridOpenInSheet: S = { render: () => <OpenInSheet /> }

function PickOne() {
  const items = frames(6)
  const [cover, setCover] = React.useState<string[]>([items[2].id])
  return (
    <div className="flex flex-col gap-3">
      <ImageGrid label="Choose the cover picture" items={items} selection="single" selected={cover} onSelectedChange={setCover} />
      <p className="text-sm text-muted-foreground">Cover: {cover[0] ?? "none"}</p>
    </div>
  )
}

/** Pick one: the cover of a dataset. A tile is picked; the corner button still opens the lightbox. */
export const ImageGridPickOne: S = { render: () => <PickOne /> }

function PickMany() {
  const items = frames(12)
  const [picked, setPicked] = React.useState<string[]>([items[1].id, items[4].id, items[5].id])
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium tabular-nums">{picked.length} selected</p>
        <Button variant="ghost" size="sm" onClick={() => setPicked([])} disabled={picked.length === 0}>
          Clear
        </Button>
      </div>
      <ImageGrid label="Pictures to label" items={items} size="sm" aspect="square" selection="multiple" selected={picked} onSelectedChange={setPicked} />
    </div>
  )
}

/** Pick many: the frames to send for labelling. Each tile is a toggle (aria-pressed). */
export const ImageGridPickMany: S = { render: () => <PickMany /> }

/** Just uploaded: one row that scrolls sideways and snaps to each picture. */
export const ImageGridStripAfterUpload: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">6 pictures uploaded</p>
      <ImageGrid label="Uploaded pictures" layout="strip" items={frames(6, "upload")} />
    </div>
  ),
}

/** Pictures the viewer must ask to see stay unloaded behind RestrictedPreview; revealing one keeps focus on it. */
export const ImageGridHidden: S = {
  render: () => (
    <ImageGrid
      label="Images in Hall B, people"
      items={frames(6, "hall-b").map((item, i) => (i % 3 === 1 ? { ...item, restricted: true, reason: "T2 · faces" } : item))}
    />
  ),
}

/** Loading: tiles of the same shape breathe until the pictures arrive. */
export const ImageGridLoading: S = {
  render: () => <ImageGrid label="Images in Forklift aisles v3" items={[]} loading loadingCount={6} />,
}

/** A picture that will not load shows its file name, in the tile's shape, so the rest of the grid does not move. */
export const ImageGridBroken: S = {
  render: () => (
    <ImageGrid
      label="Images in Night patrol v1"
      items={frames(6, "night").map((item, i) => (i === 1 || i === 4 ? { ...item, src: brokenPhoto } : item))}
    />
  ),
}
