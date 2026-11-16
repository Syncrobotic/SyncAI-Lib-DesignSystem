import Link from "next/link"
import { site } from "./config"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-wide" aria-label={`${site.name} home`}>
          <span aria-hidden className="size-3 rounded-[3px] bg-stop" />
          SYNCROBOTIC
          <span className="hidden font-normal text-muted-foreground sm:inline">Design System</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          <Link href="/docs/installation" className="hover:text-foreground">Installation</Link>
          <Link href="/docs/foundations" className="hover:text-foreground">Foundations</Link>
          <Link href="/docs/components/button" className="hover:text-foreground">Components</Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a href={site.repo} className="rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
