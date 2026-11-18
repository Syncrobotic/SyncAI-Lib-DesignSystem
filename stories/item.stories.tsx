import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { Bell, ChevronRight, FileText, KeyRound, Map, Ellipsis, Plug, Route, Settings, ShieldCheck, Users, Wifi } from "lucide-react"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Badge, CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/registry/syncrobotic/ui/item"
import { Kbd, KbdGroup } from "@/registry/syncrobotic/ui/kbd"
import { Progress } from "@/registry/syncrobotic/ui/progress"

const meta: Meta = { title: "Display/Item" }
export default meta
type S = StoryObj

export const ItemVariants: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(["default", "outline", "muted"] as const).map((v) => (
        <Item key={v} variant={v}>
          <ItemContent>
            <ItemTitle>
              <span>Night patrol · North gate</span>
            </ItemTitle>
            <ItemDescription>Variant: {v}. Runs every night at 22:00.</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </div>
  ),
}

export const ItemWithIconAndAction: S = {
  render: () => (
    <ItemGroup>
      <div role="listitem">
        <Item variant="outline">
          <ItemMedia>
            <Bell aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              <span>Alarm notifications</span>
            </ItemTitle>
            <ItemDescription>Push to phones on call when a critical alarm opens.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline" onClick={fn()}>
              Configure
            </Button>
          </ItemActions>
        </Item>
      </div>
      <div role="listitem">
        <Item variant="outline">
          <ItemMedia>
            <Wifi aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              <span>Offline map cache</span>
            </ItemTitle>
            <ItemDescription>Keep the site map on the robot when the network drops.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" onClick={fn()}>
              Enable
            </Button>
          </ItemActions>
        </Item>
      </div>
    </ItemGroup>
  ),
}

export const ItemAsLink: S = {
  render: () => (
    <nav aria-label="Account">
      <ItemGroup className="gap-0">
        {[
          { icon: Users, label: "Team", href: "#team" },
          { icon: KeyRound, label: "API keys", href: "#keys" },
          { icon: ShieldCheck, label: "Security", href: "#security" },
        ].map(({ icon: Icon, label, href }, i) => (
          <div role="listitem" key={href}>
            {i > 0 && <ItemSeparator />}
            <Item asChild size="sm">
              <a href={href}>
                <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                <ItemContent>
                  <ItemTitle>
                    <span>{label}</span>
                  </ItemTitle>
                </ItemContent>
                <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </a>
            </Item>
          </div>
        ))}
      </ItemGroup>
    </nav>
  ),
}

export const ItemPeople: S = {
  render: () => (
    <ItemGroup>
      {[
        { name: "Mei Lin", role: "Operator, night shift", status: "On shift", tone: "neutral" as const },
        { name: "Arjun Rao", role: "Field technician", status: "Away", tone: "outline" as const },
        { name: "Sara Kim", role: "Site supervisor", status: "Off", tone: "outline" as const },
      ].map((p) => (
        <div role="listitem" key={p.name}>
          <Item>
            <ItemMedia variant="avatar">
              <Avatar className="size-10">
                <AvatarFallback>
                  {p.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                <span>{p.name}</span>
              </ItemTitle>
              <ItemDescription>{p.role}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge tone={p.tone}>{p.status}</Badge>
            </ItemActions>
          </Item>
        </div>
      ))}
    </ItemGroup>
  ),
}

export const ItemFiles: S = {
  render: () => (
    <ItemGroup>
      {[
        { name: "north-gate-route.geojson", meta: "48 KB · updated 2 h ago", state: "Live" },
        { name: "hall-b-map-v12.pgm", meta: "3.2 MB · updated yesterday", state: "Draft" },
      ].map((f) => (
        <div role="listitem" key={f.name}>
          <Item variant="outline">
            <ItemMedia>
              <FileText aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                <span className="font-mono">{f.name}</span>
                <Badge tone={f.state === "Live" ? "neutral" : "outline"}>{f.state}</Badge>
              </ItemTitle>
              <ItemDescription>{f.meta}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="ghost" onClick={fn()}>
                Open
              </Button>
            </ItemActions>
          </Item>
        </div>
      ))}
    </ItemGroup>
  ),
}

export const ItemCompactWithCounts: S = {
  render: () => (
    <nav aria-label="Inbox" className="w-60">
      <ItemGroup className="gap-0">
        {[
          { label: "All events", count: 24 },
          { label: "Unacknowledged", count: 3 },
          { label: "Muted", count: 0 },
          { label: "Archived", count: 0 },
        ].map((f) => (
          <div role="listitem" key={f.label}>
            <Item asChild size="sm">
              <a href={`#${f.label}`}>
                <ItemContent>
                  <ItemTitle>
                    <span>{f.label}</span>
                  </ItemTitle>
                </ItemContent>
                <CountBadge count={f.count} tone={f.label === "Unacknowledged" ? "danger" : "neutral"} />
              </a>
            </Item>
          </div>
        ))}
      </ItemGroup>
    </nav>
  ),
}

export const ItemShortcuts: S = {
  render: () => (
    <ItemGroup className="w-72 gap-0">
      {[
        { icon: Map, label: "Open map", keys: ["⌘", "M"] },
        { icon: Route, label: "New route", keys: ["⌘", "R"] },
        { icon: Settings, label: "Settings", keys: ["⌘", ","] },
      ].map(({ icon: Icon, label, keys }) => (
        <div role="listitem" key={label}>
          <Item size="sm">
            <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
            <ItemContent>
              <ItemTitle>
                <span>{label}</span>
              </ItemTitle>
            </ItemContent>
            <KbdGroup>
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </KbdGroup>
          </Item>
        </div>
      ))}
    </ItemGroup>
  ),
}

export const ItemWithMenu: S = {
  render: () => (
    <Item variant="outline">
      <ItemMedia>
        <Plug aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <span>Elevator bridge · Tower A</span>
          <Badge>Connected</Badge>
        </ItemTitle>
        <ItemDescription>Lets robots call lifts on floors 1 to 12.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label="Elevator bridge actions">
              <Ellipsis aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Test connection</DropdownMenuItem>
            <DropdownMenuItem>Edit floors</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>Disconnect</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  ),
}

export const ItemCard: S = {
  render: () => (
    <Item variant="outline" className="flex-wrap items-start py-3">
      <ItemHeader>
        <span className="text-xs text-muted-foreground">Mission</span>
        <Badge tone="outline">Running</Badge>
      </ItemHeader>
      <ItemContent>
        <ItemTitle>
          <span>Inventory scan · Warehouse 3</span>
        </ItemTitle>
        <ItemDescription>Two robots, aisles 1 to 24.</ItemDescription>
      </ItemContent>
      <ItemFooter>
        <span className="text-xs text-muted-foreground tabular-nums">65 %</span>
        <Progress value={65} aria-label="Mission progress" className="max-w-48" />
      </ItemFooter>
    </Item>
  ),
}
