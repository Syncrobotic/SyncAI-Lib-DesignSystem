import Link from "next/link"
import { site } from "./config"
import { HeaderFrame } from "./header-frame"
import { HeaderNav } from "./header-nav"
import { Logo } from "./logo"
import { headerLinks } from "./scopes"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <HeaderFrame>
      <Link href="/">
        <Logo />
      </Link>
      <HeaderNav links={headerLinks} />
      <div className="ml-auto flex items-center gap-1">
        <a href={site.repo} className="press rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
          GitHub
        </a>
        <ThemeToggle />
      </div>
    </HeaderFrame>
  )
}
