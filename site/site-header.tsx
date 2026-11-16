import Link from "next/link"
import { site } from "./config"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          <Link href="/docs/foundations" className="hover:text-foreground">Foundations</Link>
          <Link href="/docs/components/button" className="hover:text-foreground">Components</Link>
          <Link href="/blocks" className="hover:text-foreground">Blocks</Link>
          <Link href="/docs/installation" className="hover:text-foreground">Installation</Link>
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
