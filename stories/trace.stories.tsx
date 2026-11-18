import type { Meta, StoryObj } from "@storybook/react"
import { Bot, Camera, Cpu, Database, MapPin, RefreshCw, Route, Search, Wrench } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Trace, TraceCode, TraceDetail, TraceHeader, TraceItem } from "@/registry/syncrobotic/ui/trace"

const meta: Meta = { title: "Display/Trace" }
export default meta
type S = StoryObj

export const TraceDefault: S = {
  render: () => (
    <Trace>
      <TraceItem status="done" title="Load site map" meta="hall-b-v12" duration={420} />
      <TraceItem status="done" title="Plan route" meta="planner" duration={1260} />
      <TraceItem status="running" title="Drive to door 3" meta="nav" />
      <TraceItem status="pending" title="Take photo" />
      <TraceItem status="pending" title="Return to dock" />
    </Trace>
  ),
}

export const TraceFailedStep: S = {
  render: () => (
    <Trace>
      <TraceItem status="done" title="Load site map" duration={420} />
      <TraceItem status="done" title="Plan route" duration={1260} />
      <TraceItem status="error" title="Drive to door 3" description="Path blocked by a pallet at corridor B-4 for 30 s." duration={34_100} />
      <TraceItem status="skipped" title="Take photo" />
      <TraceItem status="done" title="Return to dock" duration={52_000} />
    </Trace>
  ),
}

export const TraceExpandable: S = {
  render: () => (
    <Trace>
      <TraceItem status="done" title="Plan route" meta="planner" duration={1260} defaultOpen>
        <TraceDetail label="Input">From dock 2 to door 3, avoiding zone C</TraceDetail>
        <TraceDetail label="Output">
          <TraceCode>{`{ "waypoints": 14, "length_m": 212.4, "eta_s": 168 }`}</TraceCode>
        </TraceDetail>
      </TraceItem>
      <TraceItem status="error" title="Open door 3" meta="door-api" duration={5000} description="Timed out after 5 s.">
        <TraceDetail label="Request">
          <TraceCode>POST /doors/3/open {`{ "badge": "robot-7F3A" }`}</TraceCode>
        </TraceDetail>
        <TraceDetail label="Error">
          <TraceCode tone="danger">ETIMEDOUT door-controller.local:443</TraceCode>
        </TraceDetail>
      </TraceItem>
    </Trace>
  ),
}

export const TraceNested: S = {
  render: () => (
    <Trace>
      <TraceItem status="done" title="Night patrol · North" duration={1_412_000} defaultOpen>
        <Trace density="dense">
          <TraceItem status="done" title="Gate A" duration={312_000} />
          <TraceItem status="warning" title="Gate B" description="Door left open; photo sent to security." duration={498_000} />
          <TraceItem status="done" title="Parking lot" duration={602_000} />
        </Trace>
      </TraceItem>
      <TraceItem status="running" title="Night patrol · South" />
    </Trace>
  ),
}

export const TraceAgentToolCalls: S = {
  render: () => (
    <Trace>
      <TraceItem status="done" icon={<Search />} title="search_events" meta={`{ site: "hall-b", since: "22:00" }`} duration={180} />
      <TraceItem status="done" icon={<Camera />} title="get_snapshot" meta={`{ robot: "7F3A", camera: "front" }`} duration={940} />
      <TraceItem status="done" icon={<Bot />} title="Reasoning" duration={2300} defaultOpen>
        <p className="text-sm text-muted-foreground">
          Three door events at gate B after 22:00 and the snapshot shows the door ajar. Likely the latch, not an intrusion.
        </p>
      </TraceItem>
      <TraceItem status="running" icon={<Wrench />} title="create_work_order" meta={`{ door: "B", priority: "normal" }`} />
    </Trace>
  ),
}

export const TraceWaterfall: S = {
  render: () => (
    <Trace total={4200}>
      <TraceItem status="done" title="Authenticate" start={0} duration={120} />
      <TraceItem status="done" title="Fetch fleet" start={120} duration={680} />
      <TraceItem status="done" title="Fetch maps" start={120} duration={1840} />
      <TraceItem status="warning" title="Fetch cameras" description="2 of 14 slow" start={800} duration={2900} />
      <TraceItem status="done" title="Render" start={3700} duration={500} />
    </Trace>
  ),
}

export const TraceWithHeader: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <TraceHeader title="Firmware 2.4.1 rollout" status="warning" duration={1_920_000} counts={{ done: 5, warning: 1 }}>
        <Button size="sm" variant="outline">
          <RefreshCw aria-hidden="true" /> Retry
        </Button>
      </TraceHeader>
      <Trace>
        {["7F3A", "DAA6", "9E37", "1715", "B54C"].map((id) => (
          <TraceItem key={id} status="done" icon={<Cpu />} title={`Robot ${id}`} meta="2.4.0 → 2.4.1" duration={300_000 + id.charCodeAt(0) * 400} />
        ))}
        <TraceItem
          status="warning"
          icon={<Cpu />}
          title="Robot 5384"
          meta="2.4.0 → 2.4.1"
          description="Updated, but the lidar self-test took twice as long."
          duration={384_000}
        />
      </Trace>
    </div>
  ),
}

export const TraceDense: S = {
  render: () => (
    <Trace density="dense">
      {["Boot", "Self-test", "Localize", "Load mission", "Arm"].map((t, i) => (
        <TraceItem key={t} status="done" title={t} duration={[1800, 4200, 2600, 300, 120][i]} />
      ))}
    </Trace>
  ),
}

export const TraceAuditLog: S = {
  render: () => (
    <Trace>
      <TraceItem status="done" icon={<MapPin />} title="Map edited" meta="lin@site" time="09:41" description="Zone C marked no-go." />
      <TraceItem status="done" icon={<Route />} title="Route published" meta="lin@site" time="09:44" />
      <TraceItem
        status="warning"
        icon={<Database />}
        title="Retention changed"
        meta="admin"
        time="10:02"
        description="Camera clips kept 7 days instead of 30."
      />
    </Trace>
  ),
}

export const TraceAllStatuses: S = {
  render: () => (
    <Trace>
      <TraceItem status="pending" title="Waiting" />
      <TraceItem status="running" title="Running" />
      <TraceItem status="done" title="Done" duration={1200} />
      <TraceItem status="warning" title="Warning" duration={2400} />
      <TraceItem status="error" title="Failed" duration={800} />
      <TraceItem status="skipped" title="Skipped" />
    </Trace>
  ),
}

export const TraceCI: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <TraceHeader title="Map build #312" status="error" duration={96_000} counts={{ done: 3, error: 1, skipped: 1 }} />
      <Trace>
        <TraceItem status="done" title="Checkout" duration={4000} />
        <TraceItem status="done" title="Merge scans" duration={38_000} />
        <TraceItem status="done" title="Build occupancy grid" duration={41_000} />
        <TraceItem status="error" title="Validate" duration={13_000} defaultOpen>
          <TraceCode tone="danger">{`zone "C-dock" overlaps wall at (41.2, 8.0)\n1 error, 0 warnings`}</TraceCode>
        </TraceItem>
        <TraceItem status="skipped" title="Publish" />
      </Trace>
    </div>
  ),
}

export const TraceLongDurations: S = {
  render: () => (
    <Trace>
      <TraceItem status="done" title="Charge to 80 %" duration={3_840_000} />
      <TraceItem status="done" title="Full map scan" duration={7_260_000} />
      <TraceItem status="done" title="Ping" duration={12} />
    </Trace>
  ),
}
