import type { Meta, StoryObj } from "@storybook/react"
import { Download, Users } from "lucide-react"
import { Breadcrumb, BreadcrumbLink } from "@/registry/syncrobotic/ui/breadcrumb"
import { Button } from "@/registry/syncrobotic/ui/button"
import { MetaPill, PageHeader } from "@/registry/syncrobotic/ui/page-header"

const meta: Meta = { title: "Navigation/Page header" }
export default meta
type S = StoryObj

export const PageHeaderBasic: S = {
  render: () => <PageHeader title="Catalog" description="Every dataset the team can use, with its licence tier and what it is for." />,
}

export const PageHeaderWithMeta: S = {
  render: () => (
    <PageHeader
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
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbLink href="#catalog">Catalog</BreadcrumbLink>
          <BreadcrumbLink href="#warehouse">warehouse-forklifts</BreadcrumbLink>
        </Breadcrumb>
      }
      title="warehouse-forklifts v3"
      description="Forklifts and pallets in two warehouses, day and night shifts."
      meta={
        <>
          <MetaPill>12,480 images</MetaPill>
          <MetaPill tone="warning">2 open issues</MetaPill>
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
