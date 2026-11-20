import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { TeleopPad, type TeleopCommand } from "@/registry/syncrobotic/shell/teleop-pad"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"

const meta: Meta<typeof TeleopPad> = {
  title: "Shell/Teleop pad",
  component: TeleopPad,
  args: { onCommand: fn(), onStop: fn() },
}
export default meta
type S = StoryObj<typeof TeleopPad>

/** Hold the stick and drag to drive; let go and the robot stops. Arrow keys or W A S D when it has focus. */
export const TeleopPadDefault: S = {}

/**
 * A simulated robot behind the pad: it ramps toward the commanded speed (top speed 1.2 m/s) and the pad shows what it
 * measures. The line under it is what goes out, ten times a second while held.
 */
export const TeleopPadDriving: S = { render: () => <SimulatedRobot /> }

/** A cap of 60 %: full stick sends 0.6. The rings mark the scale and the line under the pad says the limit. */
export const TeleopPadSpeedLimit: S = { args: { maxSpeed: 0.6 } }

/** The robot is on a mission: the pad says why it cannot be driven, and keeps its place so the layout does not jump. */
export const TeleopPadDisabled: S = { args: { disabled: true, disabledReason: "robot in autonomous mode" } }

/** A phone or console drive screen: the emergency stop above the pad, never inside it. Teleop screens stay dark. */
export const TeleopPadConsole: S = {
  render: () => (
    <div className="dark @container w-3xl max-w-full rounded-lg border border-border bg-background p-4 text-foreground">
      <div className="flex flex-col gap-6 @xl:flex-row @xl:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-lg font-bold">7F3A · Hall B</p>
            <p className="text-sm text-muted-foreground">Manual driving · battery 64 %</p>
          </div>
          <StopButton tag="7F3A" onStop={fn()} />
        </div>
        <SimulatedRobot className="@xl:flex-1" showCommand={false} />
      </div>
    </div>
  ),
}

function SimulatedRobot({ className, showCommand = true }: { className?: string; showCommand?: boolean }) {
  const [command, setCommand] = React.useState<TeleopCommand>({ linear: 0, angular: 0 })
  const [speed, setSpeed] = React.useState(0)
  const onCommand = (c: TeleopCommand) => {
    setCommand(c)
    // Half-way to the target every 100 ms: a robot does not jump to speed.
    setSpeed((s) => s + (Math.abs(c.linear) * 1.2 - s) * 0.5)
  }
  const sign = (n: number) => (n < 0 ? `−${Math.abs(n).toFixed(2)}` : n.toFixed(2))
  return (
    <div className={className}>
      <TeleopPad onCommand={onCommand} onStop={() => setSpeed(0)} speed={speed} labels={{ name: "Drive 7F3A" }} />
      {showCommand && (
        <p className="mt-2 text-center font-mono text-xs tabular-nums text-muted-foreground">
          linear {sign(command.linear)} · angular {sign(command.angular)}
        </p>
      )}
    </div>
  )
}
