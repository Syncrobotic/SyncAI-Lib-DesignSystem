import type { Meta, StoryObj } from "@storybook/react"
import { BookOpen, Bot, Cpu, Joystick, Map, Menu, ShieldCheck, Warehouse } from "lucide-react"
import { ChargingDock } from "@/registry/syncrobotic/ui/robot-icons"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import {
  NavigationMenu,
  NavigationMenuCard,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/registry/syncrobotic/ui/navigation-menu"

const meta: Meta = { title: "Navigation/Navigation menu" }
export default meta
type S = StoryObj

// The docs open with one panel open (Default); the other examples start closed. "Open" stories are skipped in the docs.
// The menu starts at the frame's left edge, the way a site header places it, so a panel opens into the frame's width
// instead of running off its right edge; the frame is a container, so a panel is two columns only where they fit.
const frame = "@container flex min-h-80 items-start justify-start"

function Products({ defaultValue }: { defaultValue?: string }) {
  return (
    <NavigationMenu defaultValue={defaultValue}>
      <NavigationMenuList>
        <NavigationMenuItem value="robots">
          <NavigationMenuTrigger>Robots</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 gap-1 @xl:w-120 @xl:grid-cols-2">
              <li>
                <NavigationMenuCard href="#patrol" icon={<ShieldCheck />} title="Patrol dog" description="Four-legged security patrol, day and night." />
              </li>
              <li>
                <NavigationMenuCard href="#courier" icon={<Bot />} title="Courier" description="Indoor delivery between floors and halls." />
              </li>
              <li>
                <NavigationMenuCard href="#inspector" icon={<Cpu />} title="Inspector" description="Thermal and gauge reading on fixed routes." />
              </li>
              <li>
                <NavigationMenuCard href="#dock" icon={<ChargingDock />} title="Dock" description="Charging and remote updates." />
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="solutions">
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="flex w-64 flex-col gap-1">
              <li>
                <NavigationMenuCard href="#warehouses" icon={<Warehouse />} title="Warehouses" />
              </li>
              <li>
                <NavigationMenuCard href="#campuses" icon={<Map />} title="Campuses" />
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#docs" className={navigationMenuTriggerStyle()}>
            Docs
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

// The narrow fallback for the site header: one button, and every link of the menu in a navigation drawer.
const siteLinks = [
  ["Robots", ["Patrol dog", "Courier", "Inspector", "Dock"]],
  ["Solutions", ["Warehouses", "Campuses"]],
] as const
function SiteMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Menu" className="@xl:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>SYNCROBOTIC</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Site" className="flex flex-col gap-4">
          {siteLinks.map(([group, links]) => (
            <div key={group} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{group}</span>
              {links.map((l) => (
                <SheetClose asChild key={l}>
                  <a href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="press flex h-(--h-md) items-center rounded-sm px-3 text-sm hover:bg-accent">
                    {l}
                  </a>
                </SheetClose>
              ))}
            </div>
          ))}
          <SheetClose asChild>
            <a href="#docs" className="press flex h-(--h-md) items-center rounded-sm px-3 text-sm font-medium hover:bg-accent">
              Docs
            </a>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

/** One panel open from the start, so the example shows what the menu holds instead of a tall empty frame. */
export const NavigationMenuDefault: S = {
  render: () => (
    // Taller where the open panel stacks its four cards.
    <div className="@container flex min-h-112 items-start justify-start @xl:min-h-80">
      <Products defaultValue="robots" />
    </div>
  ),
}

export const NavigationMenuOpen: S = {
  render: () => (
    <div className={frame}>
      <Products defaultValue="robots" />
    </div>
  ),
}

export const NavigationMenuSimpleLists: S = {
  render: () => (
    <div className={frame}>
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Fleet</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="flex w-48 flex-col">
                {["Robots", "Docks", "Maps", "Routes"].map((t) => (
                  <li key={t}>
                    <NavigationMenuLink href={`#${t.toLowerCase()}`}>{t}</NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Reports</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="flex w-48 flex-col">
                {["Incidents", "Uptime", "Mileage"].map((t) => (
                  <li key={t}>
                    <NavigationMenuLink href={`#${t.toLowerCase()}`}>{t}</NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}

export const NavigationMenuLinksOnly: S = {
  render: () => (
    <div className="flex justify-start">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#overview" active className={navigationMenuTriggerStyle()}>
              Overview
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#robots" className={navigationMenuTriggerStyle()}>
              Robots
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#events" className={navigationMenuTriggerStyle()}>
              Events
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}

export const NavigationMenuFeatured: S = {
  render: () => (
    <div className={frame}>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <BookOpen aria-hidden="true" /> Learn
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-72 gap-2 @xl:w-120 @xl:grid-cols-[1fr_1.4fr]">
                <NavigationMenuLink href="#getting-started" className="justify-end bg-muted p-4">
                  <span className="text-base font-medium">Getting started</span>
                  <span className="text-xs text-muted-foreground">Commission your first robot in about an hour.</span>
                </NavigationMenuLink>
                <ul className="flex flex-col gap-1">
                  <li>
                    <NavigationMenuCard href="#maps" title="Mapping a site" description="Walk the robot once to build the map." />
                  </li>
                  <li>
                    <NavigationMenuCard href="#routes" title="Routes and schedules" description="Patrols by time of day." />
                  </li>
                  <li>
                    <NavigationMenuCard href="#alarms" title="Alarms" description="Who is told, and how fast." />
                  </li>
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#pricing" className={navigationMenuTriggerStyle()}>
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}

/** A site header: logo on the left, the menu, and the one action on the right. */
export const NavigationMenuSiteHeader: S = {
  render: () => (
    // The header is a container: where the menu does not fit (under 36rem), a Menu button opens a sheet with the same
    // links instead, and the call to action stays in view.
    <div className="@container flex min-h-80 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
        <span className="text-sm font-bold">SYNCROBOTIC</span>
        <div className="hidden @xl:flex">
          <Products />
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="press flex h-(--h-sm) shrink-0 items-center rounded-sm bg-primary px-3 text-sm font-medium whitespace-nowrap text-primary-foreground"
          >
            Talk to us
          </a>
          <SiteMenu />
        </div>
      </header>
    </div>
  ),
}

/** The current section is marked on its trigger; the current page inside the panel too. */
export const NavigationMenuActive: S = {
  render: () => (
    <div className={frame}>
      <NavigationMenu defaultValue="fleet" viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem value="fleet">
            <NavigationMenuTrigger data-active="">Fleet</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="flex w-48 flex-col">
                {["Robots", "Docks", "Maps"].map((t) => (
                  <li key={t}>
                    <NavigationMenuLink href={`#${t.toLowerCase()}`} active={t === "Robots"} aria-current={t === "Robots" ? "page" : undefined}>
                      {t}
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#reports" className={navigationMenuTriggerStyle()}>
              Reports
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}

/** Three columns of links under headings, for a docs or resources menu. */
export const NavigationMenuColumns: S = {
  render: () => (
    <div className={frame}>
      <NavigationMenu defaultValue="docs">
        <NavigationMenuList>
          <NavigationMenuItem value="docs">
            <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-80 grid-cols-3 gap-2 p-1 @xl:w-120 @xl:gap-4 @xl:p-2">
                {[
                  ["Start", ["Install", "First robot", "First map"]],
                  ["Operate", ["Patrols", "Alarms", "Handover"]],
                  ["Build", ["API", "Webhooks", "MCP"]],
                ].map(([h, links]) => (
                  <div key={h as string} className="flex flex-col gap-1">
                    <span className="px-2 text-xs font-medium text-muted-foreground @xl:px-3">{h}</span>
                    <ul className="flex flex-col">
                      {(links as string[]).map((l) => (
                        <li key={l}>
                          <NavigationMenuLink href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="px-2 py-2 @xl:px-3">
                            {l}
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}

/** A panel that ends with a link to everything, so the short list never hides the rest. */
export const NavigationMenuSeeAll: S = {
  render: () => (
    <div className={frame}>
      <NavigationMenu defaultValue="robots" viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem value="robots">
            <NavigationMenuTrigger>Robots</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="flex w-72 flex-col">
                <NavigationMenuCard href="#patrol" icon={<ShieldCheck />} title="Patrol dog" description="Security patrol, day and night." />
                <NavigationMenuCard href="#courier" icon={<Bot />} title="Courier" description="Indoor delivery." />
                <NavigationMenuLink href="#all" className="mt-1 border-t border-border pt-3 text-sm font-medium">
                  All robots →
                </NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}

/** A section not open yet: disabled, with the reason in its title. */
export const NavigationMenuDisabled: S = {
  render: () => (
    <div className="flex justify-start">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#overview" className={navigationMenuTriggerStyle()}>
              Overview
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger disabled title="Available after your first robot is paired">
              Analytics
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}

/** Cards with a muted "New" tag; tags are text, never a coloured badge. */
export const NavigationMenuWithTags: S = {
  render: () => (
    <div className={frame}>
      <NavigationMenu defaultValue="features" viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem value="features">
            <NavigationMenuTrigger>Features</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="flex w-80 flex-col">
                {[
                  { icon: <Map />, t: "Live map", d: "Every robot, door and lift in one view.", tag: "" },
                  { icon: <Joystick />, t: "Remote takeover", d: "Drive from the browser when needed.", tag: "New" },
                  { icon: <Warehouse />, t: "Multi-site", d: "One login for every building.", tag: "" },
                ].map((f) => (
                  <li key={f.t}>
                    <NavigationMenuCard
                      href={`#${f.t}`}
                      icon={f.icon}
                      title={
                        <span className="flex items-center gap-2">
                          {f.t}
                          {f.tag && <span className="rounded-xs px-1 text-xs font-normal text-muted-foreground ring-1 ring-border ring-inset">{f.tag}</span>}
                        </span>
                      }
                      description={f.d}
                    />
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}

/** Open, with the shared panel sized to the Robots content. Visual test of the panel itself. */
export const NavigationMenuLearnOpen: S = {
  render: () => (
    <div className={frame}>
      <NavigationMenu defaultValue="learn">
        <NavigationMenuList>
          <NavigationMenuItem value="learn">
            <NavigationMenuTrigger>
              <BookOpen aria-hidden="true" /> Learn
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="flex w-72 flex-col gap-1 @xl:w-80">
                <li>
                  <NavigationMenuCard href="#maps" icon={<Map />} title="Mapping a site" description="Walk the robot once to build the map." />
                </li>
                <li>
                  <NavigationMenuCard href="#cpu" icon={<Cpu />} title="Updating firmware" description="Rollouts robot by robot, with a way back." />
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
}
