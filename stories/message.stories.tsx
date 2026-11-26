import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Bot } from "lucide-react"
import { locale as zhTW, messageLabels, messageMetaLabels, streamingTextLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Attachment } from "@/registry/syncrobotic/ui/attachment"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Message, MessageMeta } from "@/registry/syncrobotic/ui/message"
import { StreamingText } from "@/registry/syncrobotic/ui/streaming-text"
import { Trace, TraceItem } from "@/registry/syncrobotic/ui/trace"

const meta: Meta = { title: "Display/Message" }
export default meta
type S = StoryObj

// An operator asking the fleet assistant about tonight's patrols. Every story is one frozen moment (text, phase and
// status as props), so a screenshot is the same on every machine.
const question = "Which robots can cover the loading bay tonight?"
const answer =
  "Two can. Patrol dog 1715 is free after its car park round at 23:40 and ends the night at 31 % battery.\n\nPatrol dog 9E37 is free too, but it is still waiting at door C3, so it would start late."
const noop = () => {}

/** The surface a conversation sits on, as a panel shows it. */
function Panel({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "@container flex w-full flex-col gap-6" : "flex w-full flex-col gap-6"}>{children}</div>
}

/** A question and its answer: the role word leads each header; the answer's facts and actions sit under it. */
export const MessageTurns: S = {
  render: () => (
    <Panel>
      <Message role="user" name="Kai Chen" time="14:02" dateTime="2026-11-26T14:02:00+08:00">
        <p>{question}</p>
      </Message>
      <Message role="assistant" name="Fleet assistant" time="14:02" dateTime="2026-11-26T14:02:09+08:00" footer={<MessageMeta model="Large" durationMs={2400} tokens={1204} />}>
        <StreamingText text={answer} phase="done" durationMs={2400} firstTokenMs={310} announce="status" />
      </Message>
    </Panel>
  ),
}

/** Still arriving: the turn is aria-busy; the answer's own status row says Generating and holds Stop. */
export const MessageStreaming: S = {
  render: () => (
    <Panel>
      <Message role="assistant" name="Fleet assistant" time="14:02" status="streaming">
        <StreamingText text={answer.slice(0, 104)} phase="streaming" onStop={noop} />
      </Message>
    </Panel>
  ),
}

/** A tool call inside the conversation: the role word says Tool, the name says which. */
export const MessageTool: S = {
  render: () => (
    <Panel>
      <Message role="tool" name="robots.forecast" time="14:02">
        <Trace size="sm">
          <TraceItem status="done" title="Read robot states" meta="robots.list" duration={900} />
          <TraceItem status="done" title="Forecast battery for each route" meta="robots.forecast" duration={4100} description="1715 ends at 31 %, 9E37 at 44 %" />
        </Trace>
      </Message>
    </Panel>
  ),
}

/** A turn that did not go through: Failed is a shape and a word, the reason follows, and Try again sends it again. */
export const MessageError: S = {
  render: () => (
    <Panel>
      <Message role="user" name="Kai Chen" time="14:03" status="error" error="No connection to the assistant" onRetry={noop} labels={{ failed: "Not sent" }}>
        <p>And which one has the fresher battery?</p>
      </Message>
    </Panel>
  ),
}

/** A tool call someone stopped: the stop glyph and the word, in grey. */
export const MessageStopped: S = {
  render: () => (
    <Panel>
      <Message role="tool" name="maps.reindex" time="14:05" status="stopped">
        <p className="text-sm text-muted-foreground">Re-indexing the warehouse map</p>
      </Message>
    </Panel>
  ),
}

/** On a wide container a person's turns may move to the end; they keep the role word and the avatar is optional. */
export const MessageAlignEnd: S = {
  render: () => (
    <Panel wide>
      <Message
        role="user"
        name="Kai Chen"
        time="14:02"
        align="end"
        avatar={
          <Avatar size="sm">
            <AvatarFallback>KC</AvatarFallback>
          </Avatar>
        }
      >
        <p>{question}</p>
        <Attachment variant="chip" name="patrol-routes-tonight.pdf" size={482_000} />
      </Message>
      <Message
        role="assistant"
        name="Fleet assistant"
        time="14:02"
        avatar={
          <Avatar size="sm" shape="square">
            <AvatarFallback>
              <Bot aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
        }
      >
        <StreamingText text={answer} phase="done" durationMs={2400} announce="status" />
      </Message>
      <Message role="assistant" name="Fleet assistant" time="14:03" continued>
        <p>Shall I draft the change for the loading bay?</p>
      </Message>
    </Panel>
  ),
}

/** A system note: the role word marks it, nothing else. */
export const MessageSystem: S = {
  render: () => (
    <Panel>
      <Message role="system" time="14:00">
        <p className="text-sm text-muted-foreground">The assistant can read robot states, the schedule and open incidents. It cannot move robots.</p>
      </Message>
    </Panel>
  ),
}

/** Every word through `labels`, numbers in the locale. */
export const MessageZhTw: S = {
  render: () => (
    <Panel>
      <Message role="user" name="陳凱" time="14:02" labels={messageLabels}>
        <p>今晚哪些機器人可以支援卸貨區？</p>
      </Message>
      <Message
        role="assistant"
        name="車隊助理"
        time="14:02"
        labels={messageLabels}
        footer={<MessageMeta model="Large" durationMs={2400} tokens={1204} locale={zhTW} labels={messageMetaLabels} />}
      >
        <StreamingText text="兩台可以。巡邏犬 1715 在 23:40 結束停車場巡邏後就有空，整晚結束時電量 31 %。" phase="done" durationMs={2400} labels={streamingTextLabels} locale={zhTW} announce="status" />
      </Message>
    </Panel>
  ),
}
