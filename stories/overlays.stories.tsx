import type { Meta, StoryObj } from "@storybook/react"
import { Copy, Ellipsis, Info, Pencil, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/syncrobotic/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/syncrobotic/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

// Each overlay has a closed story (click to open; used on the docs site) and an *Open story for visual tests.
const meta: Meta = { title: "Overlays", parameters: { layout: "fullscreen" } }
export default meta
type S = StoryObj

const RenameDialog = ({ open }: { open?: boolean }) => (
  <Dialog defaultOpen={open}>
    <DialogTrigger asChild>
      <Button variant="secondary">Rename robot</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename robot</DialogTitle>
        <DialogDescription>The new name shows on the island and in event logs.</DialogDescription>
      </DialogHeader>
      <Field label="Name">
        <Input defaultValue="Patrol dog 7F3A" />
      </Field>
      <DialogFooter>
        <Button>Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
export const DialogDefault: S = { render: () => <RenameDialog /> }
export const DialogOpen: S = { render: () => <RenameDialog open /> }

const DeleteConfirm = ({ open }: { open?: boolean }) => (
  <AlertDialog defaultOpen={open}>
    <AlertDialogTrigger asChild>
      <Button variant="destructive">Delete video</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete 38 GB of video?</AlertDialogTitle>
        <AlertDialogDescription>Footage from 11/01 to 11/14 is removed from the robot and the cloud. This cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep video</AlertDialogCancel>
        <AlertDialogAction destructive>Delete 38 GB</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
export const AlertDialogDefault: S = { render: () => <DeleteConfirm /> }
export const AlertDialogOpen: S = { render: () => <DeleteConfirm open /> }

const FilterSheet = ({ open }: { open?: boolean }) => (
  <Sheet defaultOpen={open}>
    <SheetTrigger asChild>
      <Button variant="secondary">Filter events</Button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Filter events</SheetTitle>
        <SheetDescription>Showing 24 events from the last 7 days.</SheetDescription>
      </SheetHeader>
      <Field label="Robot">
        <Input placeholder="All robots" />
      </Field>
      <SheetFooter>
        <Button>Show 24 events</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
)
export const SheetDefault: S = { render: () => <FilterSheet /> }
export const SheetOpen: S = { render: () => <FilterSheet open /> }

const InfoPopover = ({ open }: { open?: boolean }) => (
  <Popover defaultOpen={open}>
    <PopoverTrigger asChild>
      <Button variant="outline">
        <Info aria-hidden="true" /> Signal
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <p className="font-medium">Wi-Fi −61 dBm</p>
      <p className="text-muted-foreground">Good. Video streams at 1080p. Below −75 dBm the app drops to 480p.</p>
    </PopoverContent>
  </Popover>
)
export const PopoverDefault: S = { render: () => <InfoPopover /> }
export const PopoverOpen: S = { render: () => <InfoPopover open /> }

const CopyTooltip = ({ open }: { open?: boolean }) => (
  <Tooltip defaultOpen={open}>
    <TooltipTrigger asChild>
      <Button variant="outline" size="icon" aria-label="Copy serial number">
        <Copy aria-hidden="true" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Copy serial number</TooltipContent>
  </Tooltip>
)
export const TooltipDefault: S = { render: () => <CopyTooltip /> }
export const TooltipOpen: S = { render: () => <CopyTooltip open /> }

const RowMenu = ({ open }: { open?: boolean }) => (
  <DropdownMenu defaultOpen={open} modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="More actions">
        <Ellipsis aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuLabel>Route · Perimeter</DropdownMenuLabel>
      <DropdownMenuItem>
        <Pencil aria-hidden="true" /> Rename
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Copy aria-hidden="true" /> Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive>
        <Trash2 aria-hidden="true" /> Delete route
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)
export const DropdownMenuDefault: S = { render: () => <RowMenu /> }
export const DropdownMenuOpen: S = { render: () => <RowMenu open /> }
