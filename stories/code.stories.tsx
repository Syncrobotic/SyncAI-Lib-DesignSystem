import type { Meta, StoryObj } from "@storybook/react-vite"
import { Code } from "@/registry/syncrobotic/ui/code"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"

const meta: Meta = { title: "Display/Code" }
export default meta
type S = StoryObj

/** In a sentence: the size of the text around it, so the line height does not change. */
export const CodeInText: S = {
  render: () => (
    <p className="max-w-md text-base">
      Set <Code>max_items</Code> in <Code>config/export.yaml</Code> to cap each batch, then run <Code>dvc pull</Code> again.
    </p>
  ),
}

/** In a caption and a table cell: it takes their size, 12 or 14 px, with no size of its own. */
export const CodeSizes: S = {
  render: () => (
    <div className="flex max-w-md flex-col gap-3">
      <p className="text-sm">
        Released as <Code>forklift-aisles@v3</Code> on 14 Nov.
      </p>
      <p className="text-xs text-muted-foreground">
        Built from <Code>group/hall-b-captures@v7</Code> and <Code>synthetic-pallets@v4</Code>.
      </p>
    </div>
  ),
}

/** A long path breaks anywhere on a phone instead of pushing the page sideways. */
export const CodeLongPath: S = {
  render: () => (
    <p className="max-w-xs text-sm">
      Pictures are under <Code>s3://datacore-prod/collections/warehouse-forklifts/v3/images/hall-b/2026-10/</Code> until the release.
    </p>
  ),
}

/** A reference people paste: a CopyButton beside it, never inside. */
export const CodeWithCopy: S = {
  render: () => (
    <p className="flex items-center gap-2 text-sm">
      <span>
        Import with <Code>group/forklift-aisles@v3</Code>
      </span>
      <CopyButton value="group/forklift-aisles@v3" label="Copy reference" />
    </p>
  ),
}
