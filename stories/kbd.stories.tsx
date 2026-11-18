import type { Meta, StoryObj } from "@storybook/react"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Save, Search } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Kbd, KbdGroup } from "@/registry/syncrobotic/ui/kbd"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

const meta: Meta = { title: "Display/Kbd" }
export default meta
type S = StoryObj

export const KbdKeys: S = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
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
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <Input type="search" aria-label="Search robots" placeholder="Search robots" />
      <InputGroupAddon>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const KbdInTooltip: S = {
  render: () => (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" aria-label="Save route">
            <Save aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <span className="flex items-center gap-2">
            Save route
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>S</Kbd>
            </KbdGroup>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
}

export const KbdShortcutList: S = {
  render: () => (
    <dl className="flex w-72 flex-col text-sm">
      {[
        ["Stop this robot", ["Space"]],
        ["Stop all robots", ["Hold", "Space"]],
        ["Search", ["⌘", "K"]],
        ["Next alarm", ["J"]],
        ["Acknowledge", ["A"]],
      ].map(([label, keys]) => (
        <div key={label as string} className="flex h-(--h-md) items-center justify-between border-b border-border last:border-b-0">
          <dt>{label as string}</dt>
          <dd>
            <KbdGroup>
              {(keys as string[]).map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </KbdGroup>
          </dd>
        </div>
      ))}
    </dl>
  ),
}
