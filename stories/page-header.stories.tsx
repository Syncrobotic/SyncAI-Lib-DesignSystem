import type { Meta, StoryObj } from "@storybook/react-vite"
import { Download, Users } from "lucide-react"
import { Breadcrumb, BreadcrumbLink } from "@/registry/syncrobotic/ui/breadcrumb"
import { Button } from "@/registry/syncrobotic/ui/button"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { MetaPill, PageHeader } from "@/registry/syncrobotic/ui/page-header"

const meta: Meta = { title: "Navigation/Page header" }
export default meta
type S = StoryObj

export const PageHeaderBasic: S = {
  render: () => <PageHeader as="h2" title="Catalog" description="Every dataset the team can use, with its licence tier and what it is for." />,
}

export const PageHeaderWithMeta: S = {
  render: () => (
    <PageHeader
      as="h2"
      title="Catalog"
      description="Every dataset the team can use, with its licence tier and what it is for."
      meta={
        <>
          <MetaPill>128 datasets</MetaPill>
          <MetaPill icon={<Users aria-hidden="true" />}>Owner: Data team</MetaPill>
          <MetaPill>Updated 2 h ago</MetaPill>
        </>
      }
    />
  ),
}

export const PageHeaderDetail: S = {
  render: () => (
    <PageHeader
      as="h2"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbLink href="#catalog">Catalog</BreadcrumbLink>
          <BreadcrumbLink href="#warehouse">warehouse-forklifts</BreadcrumbLink>
        </Breadcrumb>
      }
      title="warehouse-forklifts v3"
      description="Forklifts and pallets in two warehouses, day and night shifts."
      status={<InlineStatus status="warning">Needs review</InlineStatus>}
      meta={
        <>
          <MetaPill>12,480 images</MetaPill>
          <MetaPill>2 open issues</MetaPill>
          <MetaPill>Released 14 Nov</MetaPill>
        </>
      }
      actions={
        <Button variant="secondary">
          <Download aria-hidden="true" />
          How to get it
        </Button>
      }
    />
  ),
}

/** A fact that leads somewhere is a link (`href`): underlined, the same height on screen, with a 36 px target (44 on touch). */
export const PageHeaderMetaLinks: S = {
  render: () => (
    <PageHeader
      as="h2"
      title="warehouse-forklifts"
      description="A collection of forklift and pallet pictures from two warehouses."
      meta={
        <>
          <MetaPill>12,480 images</MetaPill>
          <MetaPill href="#compliance">
            2 compliance items open
          </MetaPill>
          <MetaPill href="#releases">Used by 3 releases</MetaPill>
        </>
      }
    />
  ),
}

/**
 * A robot's page: its state beside the name as one InlineStatus (grey while it is fine, coloured only when it needs
 * someone), then its badges, then the facts. A state never goes in a meta pill or a badge.
 */
export const PageHeaderWithStatus: S = {
  render: () => (
    <PageHeader
      as="h2"
      title="Patrol dog 7F3A"
      description="Night patrol of the north fence and the loading bays."
      status={<InlineStatus status="active">Patrolling</InlineStatus>}
      badges={
        <>
          <Badge tone="outline">Production</Badge>
          <Badge>Firmware 4.8</Badge>
        </>
      }
      meta={
        <>
          <MetaPill>Hall B</MetaPill>
          <MetaPill>Last seen 2 min ago</MetaPill>
        </>
      }
    />
  ),
}
