import { AreaSidebar } from "@/site/sidebar-slot"

export default function ComponentsSidebar({ children }: { children: React.ReactNode }) {
  return <AreaSidebar area="components">{children}</AreaSidebar>
}
