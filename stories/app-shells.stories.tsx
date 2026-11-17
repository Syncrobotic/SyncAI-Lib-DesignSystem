import type { Meta, StoryObj } from "@storybook/react"
import { ConsoleOverview } from "@/registry/syncrobotic/blocks/console-overview"
import { EventLog } from "@/registry/syncrobotic/blocks/event-log"
import { ListDetail } from "@/registry/syncrobotic/blocks/list-detail"
import { DataCatalog } from "@/registry/syncrobotic/blocks/data-catalog"
import { DatasetDetail } from "@/registry/syncrobotic/blocks/dataset-detail"
import { GovernanceTodo } from "@/registry/syncrobotic/blocks/governance-todo"
import { MapWorkspace } from "@/registry/syncrobotic/blocks/map-workspace"

// Whole screens for internal tools, full screen like a real page. The docs site frames them at desktop, tablet and phone widths.
const meta: Meta = { title: "App shells", parameters: { layout: "fullscreen" } }
export default meta
type S = StoryObj

export const OperationsConsole: S = { render: () => <ConsoleOverview /> }
export const RobotListAndDetail: S = { render: () => <ListDetail /> }
export const EventLogScreen: S = { render: () => <EventLog /> }
export const MapWorkspaceScreen: S = { render: () => <MapWorkspace /> }

export const DataCatalogScreen: S = { render: () => <DataCatalog /> }
export const DatasetDetailScreen: S = { render: () => <DatasetDetail /> }
export const GovernanceTodoScreen: S = { render: () => <GovernanceTodo /> }
