import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { quotaFieldLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { QuotaField } from "@/registry/syncrobotic/ui/quota-field"

const meta: Meta = { title: "Inputs/Quota field" }
export default meta
type S = StoryObj

function Quota({ initial, ...props }: { initial: number | null } & Partial<React.ComponentProps<typeof QuotaField>>) {
  const [value, setValue] = React.useState(initial)
  return (
    <div className="w-full max-w-sm">
      <QuotaField legend="Device seats" unit="devices" {...props} value={value} onValueChange={setValue} />
    </div>
  )
}

/** A limit with how many are in use against it. */
export const QuotaFieldLimit: S = { render: () => <Quota initial={10} used={8} /> }

/** Unlimited is a switch (`null`): no number box to misread as 0. */
export const QuotaFieldUnlimited: S = { render: () => <Quota initial={null} used={8} /> }

/** 0 is a limit of none, said in words. */
export const QuotaFieldZero: S = { render: () => <Quota initial={0} /> }

/** Below what is in use: nothing is removed, the next one is refused. The one state that takes colour. */
export const QuotaFieldOver: S = { render: () => <Quota initial={5} used={7} /> }

/** Traditional Chinese labels. */
export const QuotaFieldZhTw: S = { render: () => <Quota initial={10} used={8} legend="設備席位" unit="台" labels={quotaFieldLabels} locale="zh-TW" /> }
