// @syncrobotic/sortable v0.10.0 · update: npx shadcn add @syncrobotic/sortable --overwrite
"use client"

import * as React from "react"
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
  className,
  children,
}: {
  value: T[]
  onValueChange: (next: T[]) => void
  getId: (item: T) => UniqueIdentifier
  getLabel?: (item: T) => string
  layout?: "list" | "grid"
  /** What follows the pointer while dragging; defaults to the item itself. */
  renderOverlay?: (item: T) => React.ReactNode
  className?: string
  children: React.ReactNode
}) {
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
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActive(e.active.id)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}. Position ${ids.indexOf(active.id) + 1} of ${ids.length}.`,
          onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} moved to position ${ids.indexOf(over.id) + 1} of ${ids.length}.` : undefined),
          onDragEnd: ({ active, over }) =>
            over ? `${nameOf(active.id)} dropped at position ${ids.indexOf(over.id) + 1} of ${ids.length}.` : `${nameOf(active.id)} dropped.`,
          onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} cancelled.`,
        },
        screenReaderInstructions: { draggable: "To reorder, press Space, move with the arrow keys, press Space again to drop, or Escape to cancel." },
      }}
    >
      <SortableContext items={ids} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
        <ul data-slot="sortable" className={cn(layout === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "flex flex-col gap-2", className)}>
          {children}
        </ul>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeItem !== undefined && renderOverlay ? <div className="rounded-sm shadow-float">{renderOverlay(activeItem)}</div> : null}
      </DragOverlay>
    </DndContext>
  )
}

/** One reorderable entry. Put a SortableHandle inside it; the rest of the row stays clickable. */
export function SortableItem({ id, className, children }: { id: UniqueIdentifier; className?: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      data-slot="sortable-item"
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative data-[dragging]:z-10 data-[dragging]:opacity-40", className)}
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
