import Link from "next/link"
import { site } from "./config"
import { HeaderFrame } from "./header-frame"
import { HeaderNav } from "./header-nav"
import { Logo } from "./logo"
import { NavDrawer } from "./nav-drawer"
import { headerLinks, scopes } from "./scopes"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <HeaderFrame>
      {/* Left, where its drawer opens from: the button and the panel move the same way. */}
      <NavDrawer scopes={scopes} />
      <Link href="/">
        <Logo />
      </Link>
      <HeaderNav links={headerLinks} />
      <div className="ml-auto flex items-center gap-1">
        <a href={site.repo} className="press inline-flex h-(--h-sm) items-center rounded-sm px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
          GitHub
        </a>
        <ThemeToggle />
      </div>
    </HeaderFrame>
  )
}
