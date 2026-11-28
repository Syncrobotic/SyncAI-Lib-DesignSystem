import { AreaSidebar } from "@/site/sidebar-slot"

export default function BlocksSidebar({ children }: { children: React.ReactNode }) {
  return <AreaSidebar area="blocks">{children}</AreaSidebar>
}
