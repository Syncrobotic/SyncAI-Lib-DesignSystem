import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { promptComposerLabels, locale as zhTW } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { PromptComposer } from "@/registry/syncrobotic/ui/prompt-composer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"

const meta: Meta = { title: "Inputs/Prompt composer" }
export default meta
type S = StoryObj

const noop = () => {}
/** A file of about `kb` kilobytes, made in the browser for the example. */
const file = (name: string, type: string, kb: number) => new File([new Uint8Array(kb * 1024)], name, { type })

/** Empty and ready: Enter sends, Shift+Enter starts a new line; Send says why it waits until something is written. */
export const PromptComposerDefault: S = {
  render: () => <PromptComposer onSubmit={noop} />,
}

/** Files in a tray of chips above the text, with a model select in the toolbar beside the attach button. */
export const PromptComposerWithFiles: S = {
  render: function Render() {
    const [files] = React.useState(() => [file("dock-camera-14-02.jpg", "image/jpeg", 412), file("patrol-routes-tonight.pdf", "application/pdf", 96)])
    return (
      <PromptComposer
        onSubmit={noop}
        allowFiles
        accept="image/*,.pdf"
        maxSize={10 * 1024 * 1024}
        defaultFiles={files}
        defaultValue="Is the dock in this frame clear for 7F3A?"
        toolbar={
          <Select defaultValue="large">
            <SelectTrigger aria-label="Model" className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="fast">Fast</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    )
  },
}

/** While the answer streams, Send is Stop in the same place and size; the next question can be written meanwhile. */
export const PromptComposerStreaming: S = {
  render: () => <PromptComposer onSubmit={noop} onStop={noop} streaming defaultValue="And for tomorrow night?" />,
}

/** Past the limit: the edge and the count take the danger colour with a glyph and words, and Send waits. */
export const PromptComposerOverLimit: S = {
  render: () => (
    <PromptComposer
      onSubmit={noop}
      maxLength={120}
      defaultValue="Plan tonight's patrols for every robot at the Taipei warehouse, keep 25 % battery in reserve, skip bay C after 03:00 and tell me which robot covers the loading bay."
    />
  ),
}

/** Nothing can be sent: the reason in words under the box. */
export const PromptComposerDisabled: S = {
  render: () => <PromptComposer onSubmit={noop} disabled disabledReason="The assistant is offline: no connection since 14:02. Your draft is kept." defaultValue="Which robots are free?" />,
}

/** Try it: Send starts a pretend answer for 3 s, Stop ends it early. Type with Zhuyin or Pinyin: Enter only picks characters. */
export const PromptComposerTry: S = {
  render: function Render() {
    const [streaming, setStreaming] = React.useState(false)
    const [sent, setSent] = React.useState<string[]>([])
    const timer = React.useRef<number | undefined>(undefined)
    React.useEffect(() => () => window.clearTimeout(timer.current), [])
    return (
      <div className="flex w-full flex-col gap-3">
        <PromptComposer
          allowFiles
          maxLength={4000}
          streaming={streaming}
          onSubmit={(text, files) => {
            setSent((s) => [...s, files.length ? `${text} (${files.map((f) => f.name).join(", ")})` : text])
            setStreaming(true)
            timer.current = window.setTimeout(() => setStreaming(false), 3000)
          }}
          onStop={() => {
            window.clearTimeout(timer.current)
            setStreaming(false)
          }}
        />
        <p className="text-sm text-muted-foreground">{sent.length ? `Sent: ${sent[sent.length - 1]}` : "Nothing sent yet."}</p>
      </div>
    )
  },
}

/** Every word through `labels`, the counts in the locale. */
export const PromptComposerZhTw: S = {
  render: () => <PromptComposer onSubmit={noop} allowFiles maxLength={4000} defaultValue="今晚哪些機器人可以支援卸貨區？" labels={promptComposerLabels} locale={zhTW} />,
}
