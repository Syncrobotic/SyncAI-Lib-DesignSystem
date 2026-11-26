// Registry end-to-end consumer: a Server Component page using installed components, as a team would write it.
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { ListGroup, ListRow } from "@/components/list"
import { StatusEyebrow } from "@/components/status-eyebrow"
import { Bone } from "@/components/skeleton"
import { StatsCards } from "@/components/stats-cards"
import { FleetTable } from "@/components/fleet-table"
import { RobotStatusCard } from "@/components/robot-status-card"
import { MarketingHero } from "@/components/marketing-hero"
import { Island } from "@/components/island"

export default function Page() {
  return (
    <main>
      <MarketingHero />
      <StatsCards />
      <FleetTable />
      <RobotStatusCard />
      <Island name="7F3A" status="active" />
      <Card><CardHeader><CardTitle>Card</CardTitle></CardHeader><Badge tone="outline">Info</Badge><Button>Go</Button><Button asChild><a href="#x">Link</a></Button></Card>
      <Alert tone="warning"><AlertTitle>Alert</AlertTitle></Alert>
      <Table><TableBody><TableRow><TableCell>1</TableCell></TableRow></TableBody></Table>
      <EmptyState title="Empty" /><Separator /><Progress value={40} />
      <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
      <Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList><TabsContent value="a">A</TabsContent></Tabs>
      <Field label="Name"><Input /></Field>
      <ListGroup><ListRow title="Row" /></ListGroup>
      <StatusEyebrow status="normal">OK</StatusEyebrow><Bone />
    </main>
  )
}
