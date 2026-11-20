// @syncrobotic/sortable v0.23.0 · update: npx shadcn add @syncrobotic/sortable --overwrite
"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

type ItemCtx = { attributes: ReturnType<typeof useSortable>["attributes"]; listeners: ReturnType<typeof useSortable>["listeners"]; isDragging: boolean }
const SortableItemContext = React.createContext<ItemCtx | null>(null)
// Whether a drag overlay follows the pointer; without one the item itself does.
const OverlayContext = React.createContext(false)
const noop = () => () => {}

export type SortableLabels = {
  /** On lifting an item: "Picked up Dock A. Position 2 of 5." */
  pickedUp: (name: string, position: number, total: number) => string
  /** On each move. */
  moved: (name: string, position: number, total: number) => string
  /** On dropping it over a place. */
  droppedAt: (name: string, position: number, total: number) => string
  /** On dropping it nowhere. */
  dropped: (name: string) => string
  /** On Escape. */
  cancelled: (name: string) => string
  /** Read when a handle takes focus: how to move with the keyboard. */
  instructions: string
}

export const defaultSortableLabels: SortableLabels = {
  pickedUp: (name, position, total) => `Picked up ${name}. Position ${position} of ${total}.`,
  moved: (name, position, total) => `${name} moved to position ${position} of ${total}.`,
  droppedAt: (name, position, total) => `${name} dropped at position ${position} of ${total}.`,
  dropped: (name) => `${name} dropped.`,
  cancelled: (name) => `Moving ${name} cancelled.`,
  instructions: "To reorder, press Space, move with the arrow keys, press Space again to drop, or Escape to cancel.",
}

/**
 * A list (or grid) people reorder by dragging a handle, by touch, or by keyboard: focus the handle, Space to lift, arrows
 * to move, Space to drop, Escape to cancel (dnd-kit). Each move is announced. Give `getLabel` so announcements name the
 * item. Order lives in your state: Sortable calls `onValueChange` with the new array.
 */
export function Sortable<T>({
  value,
  onValueChange,
  getId,
  getLabel,
  layout = "list",
  renderOverlay,
  labels,
  className,
  children,
}: {
  value: T[]
  onValueChange: (next: T[]) => void
  getId: (item: T) => UniqueIdentifier
  getLabel?: (item: T) => string
  layout?: "list" | "grid"
  /** A copy that follows the pointer while the item stays as a faded placeholder. Without it the item itself follows. */
  renderOverlay?: (item: T) => React.ReactNode
  /** What screen readers hear while an item moves, to translate it. */
  labels?: Partial<SortableLabels>
  className?: string
  children: React.ReactNode
}) {
  const l = { ...defaultSortableLabels, ...labels }
  const [active, setActive] = React.useState<UniqueIdentifier | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = value.map(getId)
  const nameOf = (id: UniqueIdentifier) => {
    const item = value.find((v) => getId(v) === id)
    return item && getLabel ? getLabel(item) : String(id)
  }
  const onDragEnd = (e: DragEndEvent) => {
    setActive(null)
    if (!e.over || e.active.id === e.over.id) return
    onValueChange(arrayMove(value, ids.indexOf(e.active.id), ids.indexOf(e.over.id)))
  }
  const activeItem = active !== null ? value.find((v) => getId(v) === active) : undefined
  // The overlay is position: fixed. Rendered in place, any transformed ancestor (an entrance animation, a sheet) becomes
  // its containing block and it drifts away from the pointer, so it lives on <body>.
  const mounted = React.useSyncExternalStore(noop, () => true, () => false)
  const overlay = (
    <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
      {activeItem !== undefined && renderOverlay ? <div className="rounded-sm shadow-float">{renderOverlay(activeItem)}</div> : null}
    </DragOverlay>
  )
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActive(e.active.id)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => l.pickedUp(nameOf(active.id), ids.indexOf(active.id) + 1, ids.length),
          onDragOver: ({ active, over }) => (over ? l.moved(nameOf(active.id), ids.indexOf(over.id) + 1, ids.length) : undefined),
          onDragEnd: ({ active, over }) => (over ? l.droppedAt(nameOf(active.id), ids.indexOf(over.id) + 1, ids.length) : l.dropped(nameOf(active.id))),
          onDragCancel: ({ active }) => l.cancelled(nameOf(active.id)),
        },
        screenReaderInstructions: { draggable: l.instructions },
      }}
    >
      <OverlayContext.Provider value={!!renderOverlay}>
        <SortableContext items={ids} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
          <ul data-slot="sortable" className={cn(layout === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "flex flex-col gap-2", className)}>
            {children}
          </ul>
        </SortableContext>
      </OverlayContext.Provider>
      {renderOverlay && mounted ? createPortal(overlay, document.body) : null}
    </DndContext>
  )
}

/** One reorderable entry. Put a SortableHandle inside it; the rest of the row stays clickable. */
export function SortableItem({ id, className, children }: { id: UniqueIdentifier; className?: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const overlay = React.useContext(OverlayContext)
  return (
    <li
      ref={setNodeRef}
      data-slot="sortable-item"
      data-dragging={isDragging || undefined}
      // The item under the pointer moves with it, untransitioned; the others glide aside.
      style={{ transform: CSS.Translate.toString(transform), transition: isDragging && !overlay ? undefined : transition }}
      className={cn(
        "relative data-[dragging]:z-10",
        // With an overlay the item stays behind as a faded placeholder; without one it is what you drag, so it lifts.
        overlay ? "data-[dragging]:opacity-40" : "data-[dragging]:rounded-sm data-[dragging]:bg-card data-[dragging]:shadow-float",
        className,
      )}
    >
      <SortableItemContext.Provider value={{ attributes, listeners, isDragging }}>{children}</SortableItemContext.Provider>
    </li>
  )
}

/** The grip people drag or focus to move the item. 44 px on touch. */
export function SortableHandle({ label, className }: { label: string; className?: string }) {
  const ctx = React.useContext(SortableItemContext)
  return (
    <button
      type="button"
      aria-label={label}
      {...ctx?.attributes}
      {...ctx?.listeners}
      className={cn(
        "press flex size-(--h-sm) shrink-0 cursor-grab touch-none items-center justify-center rounded-2xs text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing",
        className,
      )}
    >
      <GripVertical aria-hidden="true" className="size-4" />
    </button>
  )
}
