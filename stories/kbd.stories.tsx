import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Save, Search } from "lucide-react"
import { useHotkeys } from "@/registry/syncrobotic/hooks/use-hotkeys"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Kbd, KbdGroup, useModKey } from "@/registry/syncrobotic/ui/kbd"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

const meta: Meta = { title: "Display/Kbd" }
export default meta
type S = StoryObj

export const KbdKeys: S = {
  render: () => (
    <div className="flex w-fit flex-wrap items-center gap-2">
      <Kbd>Esc</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Space</Kbd>
      <Kbd>⌘</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>Tab</Kbd>
    </div>
  ),
}

export const KbdChord: S = {
  render: () => (
    <p className="text-sm text-muted-foreground">
      Open the command palette with{" "}
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>{" "}
      or{" "}
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </p>
  ),
}

export const KbdArrows: S = {
  render: () => (
    <div role="group" className="flex flex-col items-center gap-1" aria-label="Drive with the arrow keys">
      <Kbd>
        <ArrowUp aria-hidden="true" />
        <span className="sr-only">Forward</span>
      </Kbd>
      <div className="flex gap-1">
        <Kbd>
          <ArrowLeft aria-hidden="true" />
          <span className="sr-only">Left</span>
        </Kbd>
        <Kbd>
          <ArrowDown aria-hidden="true" />
          <span className="sr-only">Back</span>
        </Kbd>
        <Kbd>
          <ArrowRight aria-hidden="true" />
          <span className="sr-only">Right</span>
        </Kbd>
      </div>
    </div>
  ),
}

export const KbdInInput: S = {
  render: function Demo() {
    const mod = useModKey()
    return (
      <InputGroup>
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <Input type="search" aria-label="Search robots" placeholder="Search robots" />
        <InputGroupAddon>
          <KbdGroup>
            <Kbd>{mod}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </InputGroupAddon>
      </InputGroup>
    )
  },
}

function SaveWithTooltip({ open }: { open?: boolean }) {
  const mod = useModKey()
  return (
    <TooltipProvider>
      <Tooltip defaultOpen={open}>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" aria-label="Save route">
            <Save aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-2">
            Save route
            <KbdGroup>
              <Kbd>{mod}</Kbd>
              <Kbd>S</Kbd>
            </KbdGroup>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** The shortcut in the button's tooltip, shown on hover or keyboard focus. */
export const KbdInTooltip: S = {
  render: () => (
    <div className="flex flex-col items-center gap-2">
      <SaveWithTooltip />
      <p className="text-sm text-muted-foreground">Point at the button or tab to it.</p>
    </div>
  ),
}

/** The tooltip open, for the visual test (the docs show the closed button above). */
export const KbdInTooltipOpen: S = {
  render: () => (
    <div className="pb-8">
      <SaveWithTooltip open />
    </div>
  ),
}

/** "Hold" is how the key is pressed, a word beside it, not a key of its own. */
export const KbdShortcutList: S = {
  render: function Demo() {
    const mod = useModKey()
    const shortcuts: { label: string; keys: string[]; hold?: boolean }[] = [
      { label: "Stop this robot", keys: ["Space"] },
      { label: "Stop all robots", keys: ["Space"], hold: true },
      { label: "Search", keys: [mod, "K"] },
      { label: "Next alarm", keys: ["J"] },
      { label: "Acknowledge", keys: ["A"] },
    ]
    return (
      <dl className="flex w-72 flex-col text-sm">
        {shortcuts.map(({ label, keys, hold }) => (
          <div key={label} className="flex h-(--h-md) items-center justify-between border-b border-border last:border-b-0">
            <dt>{label}</dt>
            <dd className="flex items-center gap-2 text-xs text-muted-foreground">
              {hold && "Hold"}
              <KbdGroup>
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </KbdGroup>
            </dd>
          </div>
        ))}
      </dl>
    )
  },
}

/** A key going down: it sinks and its edge thickens to the text colour, so it reads without colour. */
export const KbdPressed: S = {
  render: () => (
    <div className="flex w-fit items-center gap-2">
      <Kbd>1</Kbd>
      <Kbd pressed>2</Kbd>
      <Kbd>3</Kbd>
    </div>
  ),
}

const liveAnswers = { "1": "Yes", "2": "No", "3": "Skip" } as const

function LiveKeys() {
  const [last, setLast] = React.useState<string | null>(null)
  const { pressed } = useHotkeys({ "1": () => setLast("Yes"), "2": () => setLast("No"), "3": () => setLast("Skip") })
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {Object.entries(liveAnswers).map(([k, label]) => (
          <span key={k} className="flex items-center gap-2">
            <Kbd pressed={pressed === k}>{k}</Kbd>
            {label}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {last ? `You pressed ${last}.` : "Press 1, 2 or 3."}
      </p>
    </div>
  )
}

/** With useHotkeys: press 1, 2 or 3 and its key goes down for as long as it is held, at least 150 ms. */
export const KbdPressedLive: S = { render: () => <LiveKeys /> }
