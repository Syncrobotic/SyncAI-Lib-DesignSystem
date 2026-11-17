import type { Meta, StoryObj } from "@storybook/react"
import { ScrollArea } from "@/registry/syncrobotic/ui/scroll-area"

const meta: Meta = { title: "Display/Scroll area" }
export default meta
type S = StoryObj

const log = Array.from({ length: 30 }, (_, i) => {
  const t = new Date(Date.UTC(2026, 10, 17, 14, 0, 0) + i * 37_000)
  const msgs = ["Waypoint reached", "Battery 64 %", "Door 3 opened", "Obstacle cleared", "Lift called · floor 4"]
  return { time: t.toISOString().slice(11, 19), msg: msgs[i % msgs.length] }
})

export const ScrollAreaVertical: S = {
  render: () => (
    <ScrollArea className="h-64 rounded-md bg-card ring-1 ring-border" aria-label="Robot log">
      <ul className="flex flex-col p-4 font-mono text-xs">
        {log.map((l) => (
          <li key={l.time} className="flex gap-3 border-b border-border py-2 last:border-b-0">
            <span className="text-muted-foreground tabular-nums">{l.time}</span>
            <span>{l.msg}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
}

export const ScrollAreaHorizontal: S = {
  render: () => (
    <ScrollArea orientation="horizontal" className="rounded-md ring-1 ring-border" aria-label="Camera snapshots">
      <div className="flex w-max gap-3 p-3">
        {Array.from({ length: 10 }, (_, i) => (
          <figure key={i} className="flex w-32 shrink-0 flex-col gap-2">
            <div className="aspect-video rounded-sm bg-muted" />
            <figcaption className="text-xs text-muted-foreground">
              Cam {i + 1} · 14:0{i}
            </figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const ScrollAreaBoth: S = {
  render: () => (
    <ScrollArea orientation="both" className="h-56 rounded-md ring-1 ring-border" aria-label="Sensor readings">
      <table className="w-max text-sm">
        <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
          <tr>
            {["Robot", "Battery", "Speed", "Temp", "Signal", "Lidar", "Odometer"].map((h) => (
              <th key={h} className="h-10 px-4 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }, (_, i) => (
            <tr key={i} className="border-t border-border tabular-nums">
              <td className="h-10 px-4 font-medium">Robot {String(i + 1).padStart(2, "0")}</td>
              <td className="px-4">{90 - i * 5} %</td>
              <td className="px-4">{(0.8 + i * 0.05).toFixed(2)} m/s</td>
              <td className="px-4">{38 + i} °C</td>
              <td className="px-4">−{60 + i} dBm</td>
              <td className="px-4">OK</td>
              <td className="px-4">{1200 + i * 37} km</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  ),
}

export const ScrollAreaFadeEdges: S = {
  render: () => (
    <ScrollArea fade className="h-64" aria-label="Release notes">
      <div className="flex flex-col gap-4 py-6 text-sm">
        {Array.from({ length: 8 }, (_, i) => (
          <section key={i} className="flex flex-col gap-1">
            <h3 className="font-bold">Firmware 4.{8 - i}.0</h3>
            <p className="text-muted-foreground">Smoother stairs, faster relocalisation after a door, and lower idle draw on the lidar.</p>
          </section>
        ))}
      </div>
    </ScrollArea>
  ),
}
