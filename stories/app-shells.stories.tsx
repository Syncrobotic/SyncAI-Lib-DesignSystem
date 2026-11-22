import type { Meta, StoryObj } from "@storybook/react-vite"
import { ConsoleOverview } from "@/registry/syncrobotic/blocks/console-overview"
import { EventLog } from "@/registry/syncrobotic/blocks/event-log"
import { ListDetail } from "@/registry/syncrobotic/blocks/list-detail"
import { DataCatalog } from "@/registry/syncrobotic/blocks/data-catalog"
import { DatasetDetail } from "@/registry/syncrobotic/blocks/dataset-detail"
import { GovernanceTodo } from "@/registry/syncrobotic/blocks/governance-todo"
import { SignIn } from "@/registry/syncrobotic/blocks/sign-in"
import { ErrorPage, LoadingPage, NoAccessPage, NotFoundPage, OfflinePage } from "@/registry/syncrobotic/blocks/status-pages"
import { RecordForm } from "@/registry/syncrobotic/blocks/record-form"
import { SettingsPage } from "@/registry/syncrobotic/blocks/settings-page"
import { UsersRoles } from "@/registry/syncrobotic/blocks/users-roles"
import { MapWorkspace } from "@/registry/syncrobotic/blocks/map-workspace"
import { TopBarShell } from "@/registry/syncrobotic/blocks/top-bar-shell"
import { sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"

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
export const SettingsScreen: S = { render: () => <SettingsPage /> }
export const RecordFormScreen: S = { render: () => <RecordForm /> }
export const UsersRolesScreen: S = { render: () => <UsersRoles /> }
export const SignInScreen: S = { render: () => <SignIn /> }
export const NotFoundScreen: S = { render: () => <NotFoundPage /> }
export const NoAccessScreen: S = { render: () => <NoAccessPage /> }
export const ErrorScreen: S = { render: () => <ErrorPage /> }
export const OfflineScreen: S = { render: () => <OfflinePage /> }
export const LoadingScreen: S = { render: () => <LoadingPage /> }

// The top-bar shell as a product mounts it: a skip link to <main> (its id is "main"; `mainId` changes it) and a logo that
// goes home ("/"), not to the first link. On a phone, following a link in the drawer closes it.
export const TopBarShellScreen: S = {
  render: () => (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <TopBarShell
        product="Fleet portal"
        home="/"
        links={[
          { label: "Robots", href: "#robots" },
          { label: "Sites", href: "#sites" },
          { label: "Reports", href: "#reports" },
        ]}
        current="#robots"
        user={sampleUser}
      >
        <div className="flex h-64 items-center justify-center rounded-md text-sm text-muted-foreground ring-1 ring-border ring-dashed">Your page</div>
      </TopBarShell>
    </>
  ),
}

// A long detail page in the top-bar shell: TabsList sticky pins the tab row under the floating bar (--shell-top) once the
// page scrolls, so another tab is one tap away from anywhere in the first.
export const TopBarShellStickyTabs: S = {
  render: () => (
    <TopBarShell
      product="DataCore"
      links={[
        { label: "Catalog", href: "#catalog" },
        { label: "Releases", href: "#releases" },
        { label: "Governance", href: "#governance" },
      ]}
      current="#catalog"
      user={sampleUser}
    >
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Night parking lot people</h1>
        <Tabs defaultValue="overview">
          <TabsList sticky aria-label="Dataset">
            {["Overview", "Browse", "Stats", "Versions", "Lineage", "Compliance"].map((t) => (
              <TabsTrigger key={t} value={t.toLowerCase()}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview" className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 48 }, (_, i) => (
              <div key={i} className="flex aspect-video items-end rounded-sm bg-muted p-2 font-mono text-xs text-muted-foreground">
                frame-{String(1024 + i * 37).padStart(6, "0")}
              </div>
            ))}
          </TabsContent>
          {["browse", "stats", "versions", "lineage", "compliance"].map((v) => (
            <TabsContent key={v} value={v} className="text-sm text-muted-foreground">
              {v}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </TopBarShell>
  ),
}
