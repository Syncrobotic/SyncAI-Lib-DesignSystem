import { SiteHeader } from "@/site/site-header"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      {children}
    </>
  )
}
