import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { messageActionsLabels, messageLabels, streamingTextLabels, locale as zhTW } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Message, MessageMeta } from "@/registry/syncrobotic/ui/message"
import { MessageActions, type MessageFeedback } from "@/registry/syncrobotic/ui/message-actions"
import { StreamingText } from "@/registry/syncrobotic/ui/streaming-text"

const meta: Meta = { title: "Display/Message actions" }
export default meta
type S = StoryObj

const answer = "Two can. Patrol dog 1715 is free after its car park round at 23:40 and ends the night at 31 % battery."
const versions = [
  answer,
  "Patrol dog 1715 can, from 23:40. Patrol dog 9E37 could too once door C3 is cleared, but it would start late.",
  "1715 from 23:40 (ends at 31 %). 9E37 only after door C3 is cleared.",
]
const reasons = [
  { value: "facts", label: "Wrong facts" },
  { value: "request", label: "Did not follow the request" },
  { value: "unsafe", label: "Unsafe advice" },
  { value: "other", label: "Something else" },
]
const noop = () => {}

/** The latest answer keeps its actions in view (quiet={false}); earlier ones show them on hover or focus with a mouse. */
export const MessageActionsUnderAnAnswer: S = {
  render: function Render() {
    const [feedback, setFeedback] = React.useState<MessageFeedback | null>(null)
    return (
      <Message
        role="assistant"
        name="Fleet assistant"
        time="14:02"
        actions={<MessageActions copyText={answer} onRegenerate={noop} feedback={feedback} onFeedbackChange={setFeedback} quiet={false} />}
        footer={<MessageMeta model="Large" durationMs={2400} tokens={1204} />}
      >
        <StreamingText text={answer} phase="done" durationMs={2400} announce="status" />
      </Message>
    )
  },
}

/** After Bad: what was wrong, as one chip to pick. Bad stays pressed (inverted), never red. */
export const MessageActionsBadWithReason: S = {
  render: function Render() {
    const [feedback, setFeedback] = React.useState<MessageFeedback | null>("bad")
    const [reason, setReason] = React.useState<string | undefined>("facts")
    return (
      <Message
        role="assistant"
        name="Fleet assistant"
        time="14:02"
        actions={
          <MessageActions
            copyText={answer}
            onRegenerate={noop}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            reasons={reasons}
            reason={reason}
            onReasonChange={setReason}
          />
        }
      >
        <StreamingText text={answer} phase="done" announce="status" />
      </Message>
    )
  },
}

/** Regenerated twice: ‹ 2 / 3 › moves between the answers; the ends stay focusable and say they are the end. */
export const MessageActionsVersions: S = {
  render: function Render() {
    const [version, setVersion] = React.useState(2)
    return (
      <Message
        role="assistant"
        name="Fleet assistant"
        time="14:04"
        actions={
          <MessageActions
            copyText={versions[version - 1]}
            onRegenerate={noop}
            onFeedbackChange={noop}
            version={version}
            versions={versions.length}
            onVersionChange={setVersion}
            quiet={false}
          />
        }
      >
        <StreamingText text={versions[version - 1]} phase="done" announce="status" />
      </Message>
    )
  },
}

/** Copy only, for an answer that cannot be rated: each part shows only when it has what it needs. */
export const MessageActionsCopyOnly: S = {
  render: () => (
    <Message role="tool" name="robots.forecast" time="14:02" actions={<MessageActions copyText='{"1715": 0.31, "9E37": 0.44}' quiet={false} />}>
      <p className="text-sm">1715 ends at 31 %, 9E37 at 44 %.</p>
    </Message>
  ),
}

/** Every word through `labels`, the version numbers in the locale. */
export const MessageActionsZhTw: S = {
  render: () => (
    <Message
      role="assistant"
      name="車隊助理"
      time="14:02"
      labels={messageLabels}
      actions={
        <MessageActions
          copyText="兩台可以。"
          onRegenerate={noop}
          defaultFeedback="good"
          onFeedbackChange={noop}
          version={1}
          versions={2}
          onVersionChange={noop}
          locale={zhTW}
          labels={messageActionsLabels}
        />
      }
    >
      <StreamingText text="兩台可以。巡邏犬 1715 在 23:40 後有空。" phase="done" labels={streamingTextLabels} locale={zhTW} announce="status" />
    </Message>
  ),
}
