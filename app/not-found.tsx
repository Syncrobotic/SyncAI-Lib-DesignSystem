import Link from "next/link"
import { SearchX } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { SiteHeader } from "@/site/site-header"

// The kit's own 404 (the status-pages block's layout), so a wrong link lands on the site, not on Next's white default.
// The site's header stays, so a wrong link never strands you without the navigation.
export default function NotFound() {
  return (
    <>
    <SiteHeader />
    <main id="content" className="flex min-h-[calc(100dvh-var(--site-header))] items-center justify-center bg-background p-6 text-foreground">
      <div className="flex max-w-md animate-appear flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <SearchX aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col items-center gap-2">
          <p className="font-mono text-sm text-muted-foreground tabular-nums">404</p>
          <h1 className="text-2xl font-bold text-balance">This page does not exist</h1>
          <p className="text-sm text-pretty text-muted-foreground">The link may be old, or the page moved.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/docs/components">Components</Link>
          </Button>
        </div>
      </div>
    </main>
    </>
  )
}
