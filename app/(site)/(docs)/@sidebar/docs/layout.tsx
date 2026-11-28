import { AreaSidebar } from "@/site/sidebar-slot"
import { UnlessNested } from "@/site/sidebar"

// The Docs area, except under /docs/components: Components is an area of its own (its layout, nested here).
export default function DocsSidebar({ children }: { children: React.ReactNode }) {
  return (
    <UnlessNested segment="components" own={<AreaSidebar area="docs" />}>
      {children}
    </UnlessNested>
  )
}
