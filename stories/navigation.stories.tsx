import type { Meta, StoryObj } from "@storybook/react"
import { Bell, Bot, Settings } from "lucide-react"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/syncrobotic/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"

const meta: Meta = { title: "Navigation" }
export default meta
type S = StoryObj

export const TabsDefault: S = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sensors">Sensors</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="admin" disabled>
          Admin
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm text-muted-foreground">
        Patrol dog 7F3A · firmware 2.4.1 · 412 h in service
      </TabsContent>
      <TabsContent value="sensors" className="text-sm text-muted-foreground">
        LiDAR, depth camera, thermal camera
      </TabsContent>
      <TabsContent value="logs" className="text-sm text-muted-foreground">
        No logs in the last 24 h
      </TabsContent>
    </Tabs>
  ),
}

export const AccordionDefault: S = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="stop">
      <AccordionItem value="stop">
        <AccordionTrigger>What does the emergency stop do?</AccordionTrigger>
        <AccordionContent>It cuts motor torque within 200 ms. The robot sits down and holds still until released.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="bt">
        <AccordionTrigger>What if Wi-Fi drops?</AccordionTrigger>
        <AccordionContent>The app falls back to Bluetooth. Stop and device status still work within about 10 m.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="release">
        <AccordionTrigger>Who can release a stop?</AccordionTrigger>
        <AccordionContent>Operators and admins. Viewers see the stop but cannot release it.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const TabsWithIconsAndCounts: S = {
  render: () => (
    <Tabs defaultValue="events">
      <TabsList>
        <TabsTrigger value="robots">
          <Bot aria-hidden="true" /> Robots
        </TabsTrigger>
        <TabsTrigger value="events">
          <Bell aria-hidden="true" /> Events <Badge tone="danger">3</Badge>
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings aria-hidden="true" /> Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="robots" className="text-sm text-muted-foreground">12 robots on this site</TabsContent>
      <TabsContent value="events" className="text-sm text-muted-foreground">3 events need review</TabsContent>
      <TabsContent value="settings" className="text-sm text-muted-foreground">Site settings</TabsContent>
    </Tabs>
  ),
}

export const AccordionMultiple: S = {
  render: () => (
    <Accordion type="multiple" defaultValue={["night", "weekend"]}>
      <AccordionItem value="night">
        <AccordionTrigger>Night patrol · 22:00–06:00</AccordionTrigger>
        <AccordionContent>Perimeter every 2 h, 4 robots.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="weekend">
        <AccordionTrigger>Weekend patrol · all day</AccordionTrigger>
        <AccordionContent>Parking lot and warehouse, 2 robots.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="holiday" disabled>
        <AccordionTrigger>Holiday schedule · not set</AccordionTrigger>
        <AccordionContent>—</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
