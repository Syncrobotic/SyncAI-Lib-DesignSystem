import type { Meta, StoryObj } from "@storybook/react"
import { BookOpen, Bot, Cpu, Map, Radio, ShieldCheck, Warehouse } from "lucide-react"
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

// Docs pages show the closed menu; the open state is a visual test ("Open" stories are skipped in the docs).
const frame = "flex min-h-80 items-start justify-center"

function Products({ defaultValue }: { defaultValue?: string }) {
  return (
    <NavigationMenu defaultValue={defaultValue}>
      <NavigationMenuList>
        <NavigationMenuItem value="robots">
          <NavigationMenuTrigger>Robots</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-full gap-1 md:w-120 md:grid-cols-2">
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
                <NavigationMenuCard href="#dock" icon={<Radio />} title="Dock" description="Charging and remote updates." />
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="solutions">
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="flex w-full flex-col gap-1 md:w-64">
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

export const NavigationMenuDefault: S = {
  render: () => (
    <div className={frame}>
      <Products />
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
              <div className="grid w-full gap-2 md:w-120 md:grid-cols-[1fr_1.4fr]">
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
