import type { Meta, StoryObj } from "@storybook/react-vite"
import { evidencePanelLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { EvidencePanel, type EvidenceRow } from "@/registry/syncrobotic/ui/evidence-panel"

const meta: Meta = { title: "Data display/Evidence panel" }
export default meta
type S = StoryObj

const gpus = ["GPU-3f1c9a52-7d2e-4b8a-9c1f-08e2d4a6b7c3", "GPU-a90b17e4-2c6d-48f1-b3e5-6d7c8f9a0b12"]

// lm-hsinchu-01 asks to join; an operator registered its hardware beforehand. One GPU differs and the version is missing.
const review: EvidenceRow[] = [
  { id: "name", label: "Name it gives", reported: "lm-hsinchu-01", hint: "Chosen by whoever installed it; it names nothing." },
  { id: "key", label: "Key fingerprint", reported: "SHA256:q8Yx2m4Lr0Vb7Tn1Kc5Wd9Fe3Gh6Ji2Pa", mono: true, copy: true, hint: "Compare it with the one printed at the installation." },
  { id: "gpus", label: "GPU UUIDs", reported: [gpus[0], "GPU-77e0c3d1-5b9a-4e62-8f14-2a3b4c5d6e7f"], expected: gpus, mono: true },
  { id: "product", label: "Product UUID", reported: "4c4c4544-0042-3510-8051-b4c04f565432", expected: "4c4c4544-0042-3510-8051-b4c04f565432", mono: true },
  { id: "version", label: "Software version", reported: null, expected: "2.4.1", mono: true },
  { id: "ip", label: "Source IP", reported: "203.0.113.7", mono: true, hint: "Where the request came from; a proxy may hide the machine." },
]

/** An enrolment under review: the claims in a dashed frame headed by their source, each beside the record, what differs said first. */
export const EvidencePanelReview: S = {
  render: () => (
    <div className="w-full max-w-3xl">
      <EvidencePanel rows={review} />
    </div>
  ),
}

/** Every value on record matches. The check is grey: matching is what is expected, not a success to celebrate. */
export const EvidencePanelAllMatch: S = {
  render: () => (
    <div className="w-full max-w-3xl">
      <EvidencePanel
        rows={[
          { id: "gpus", label: "GPU UUIDs", reported: [...gpus].reverse(), expected: gpus, mono: true },
          { id: "product", label: "Product UUID", reported: "4c4c4544-0042-3510-8051-b4c04f565432", expected: "4c4c4544-0042-3510-8051-b4c04f565432", mono: true },
          { id: "version", label: "Software version", reported: "2.4.1", expected: "2.4.1", mono: true },
        ]}
      />
    </div>
  ),
}

/** Nothing registered to compare with (a device that found the project on its own): the claims alone, still framed as unverified. */
export const EvidencePanelNothingToCompare: S = {
  render: () => (
    <div className="w-full max-w-sm">
      <EvidencePanel rows={review.map(({ expected: _, ...r }) => r)} meta="From 203.0.113.7 · first seen Nov 27, 2026, 14:02" />
    </div>
  ),
}

/** In Traditional Chinese, through `evidencePanelLabels`. */
export const EvidencePanelZhTw: S = {
  render: () => (
    <div className="w-full max-w-3xl">
      <EvidencePanel
        labels={evidencePanelLabels}
        rows={[
          { id: "gpus", label: "GPU UUID", reported: [gpus[0], "GPU-77e0c3d1-5b9a-4e62-8f14-2a3b4c5d6e7f"], expected: gpus, mono: true },
          { id: "version", label: "軟體版本", reported: null, expected: "2.4.1", mono: true },
          { id: "product", label: "產品 UUID", reported: "4c4c4544-0042-3510-8051-b4c04f565432", expected: "4c4c4544-0042-3510-8051-b4c04f565432", mono: true },
        ]}
      />
    </div>
  ),
}
