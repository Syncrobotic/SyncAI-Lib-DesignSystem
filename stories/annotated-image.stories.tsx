import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { AnnotatedImage, type Annotation } from "@/registry/syncrobotic/ui/annotated-image"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { brokenPhoto } from "./placeholder-photos"

const meta: Meta = { title: "Display/Annotated image" }
export default meta
type S = StoryObj

// A camera frame drawn in code (named colours: a camera picture does not follow the theme), 640 × 480, with things at known
// places so the annotations below land on them: a person on the left, a pallet in the middle, a forklift on the right
// and dark shelving behind it, so the marks show on bright and dark parts of the picture.
const W = 640
const H = 480
const svg = (body: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${body}</svg>`)}`
const frame = svg(
  `<rect width="640" height="290" fill="lightsteelblue"/><rect y="290" width="640" height="190" fill="tan"/>` +
    `<rect x="0" y="60" width="96" height="230" fill="slategray"/><rect x="520" y="40" width="120" height="250" fill="darkslategray"/>` +
    `<rect x="530" y="110" width="100" height="8" fill="black"/><rect x="530" y="190" width="100" height="8" fill="black"/>` +
    `<line x1="300" y1="290" x2="210" y2="480" stroke="white" stroke-width="6" stroke-dasharray="20 14" opacity="0.7"/>` +
    // The person.
    `<circle cx="155" cy="190" r="20" fill="wheat"/><rect x="132" y="210" width="46" height="122" rx="8" fill="navy"/>` +
    `<rect x="122" y="216" width="10" height="92" rx="5" fill="navy"/><rect x="178" y="216" width="10" height="92" rx="5" fill="navy"/>` +
    `<rect x="136" y="330" width="14" height="72" fill="midnightblue"/><rect x="160" y="330" width="14" height="72" fill="midnightblue"/>` +
    `<rect x="128" y="236" width="54" height="10" fill="orange"/>` +
    // The pallet.
    `<rect x="232" y="362" width="70" height="40" fill="sienna"/><rect x="228" y="402" width="78" height="16" fill="saddlebrown"/>` +
    // The forklift.
    `<rect x="470" y="222" width="18" height="168" fill="dimgray"/><rect x="330" y="296" width="140" height="94" rx="6" fill="goldenrod"/>` +
    `<polyline points="340,296 352,236 452,236 462,296" fill="none" stroke="black" stroke-width="6"/>` +
    `<rect x="488" y="372" width="72" height="8" fill="dimgray"/><circle cx="364" cy="394" r="18" fill="black"/><circle cx="440" cy="394" r="18" fill="black"/>`,
)
// A depth map of the same frame, near is light: what a stereo camera adds beside the picture.
const depth = svg(
  `<defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient></defs>` +
    `<rect width="640" height="480" fill="url(#d)"/><rect x="120" y="168" width="72" height="236" fill="silver"/><rect x="326" y="220" width="236" height="190" fill="gainsboro"/>`,
)

const box = (x: number, y: number, width: number, height: number) => ({ type: "box" as const, x, y, width, height })

/** An evaluation: the model found the person and the forklift, missed the pallet, and saw a person in the shelving. */
const evaluation: Annotation[] = [
  { id: "t-person", kind: "truth", label: "person", shape: box(118, 166, 74, 238) },
  { id: "p-person", kind: "predicted", label: "person", score: 0.92, shape: box(114, 160, 82, 246) },
  { id: "t-forklift", kind: "truth", label: "forklift", shape: box(328, 218, 236, 196) },
  { id: "p-forklift", kind: "predicted", label: "forklift", score: 0.88, shape: box(336, 226, 222, 182) },
  { id: "t-pallet", kind: "truth", label: "pallet", shape: box(226, 358, 82, 62) },
  { id: "p-shelf", kind: "predicted", label: "person", score: 0.41, shape: box(540, 96, 76, 150) },
]

/** Predicted against ground truth on one picture: solid lines are the model, dashed the labels a person drew. */
export const AnnotatedImageEvaluation: S = {
  render: () => <AnnotatedImage src={frame} width={W} height={H} label="Camera 2, aisle 3, 14:08" annotations={evaluation} />,
}

/** The same frame against the previous version of the model: last version dotted and faded under this one. */
export const AnnotatedImagePreviousVersion: S = {
  render: () => (
    <AnnotatedImage
      src={frame}
      width={W}
      height={H}
      label="Camera 2, aisle 3, 14:08, model v3 against v2"
      annotations={[
        { id: "v2-person", kind: "previous", label: "person", score: 0.71, shape: box(104, 176, 98, 220) },
        { id: "v3-person", kind: "predicted", label: "person", score: 0.92, shape: box(114, 160, 82, 246) },
        { id: "v2-forklift", kind: "previous", label: "forklift", score: 0.64, shape: box(352, 238, 190, 166) },
        { id: "v3-forklift", kind: "predicted", label: "forklift", score: 0.88, shape: box(336, 226, 222, 182) },
        { id: "v2-pallet", kind: "previous", label: "pallet", score: 0.55, shape: box(222, 352, 90, 70) },
      ]}
    />
  ),
}

const joints: ([number, number] | null)[] = [
  [155, 190], // 0 head
  [155, 212], // 1 neck
  [134, 218], // 2 left shoulder
  [176, 218], // 3 right shoulder
  [127, 262], // 4 left elbow
  [183, 262], // 5 right elbow
  [127, 304], // 6 left wrist
  [183, 304], // 7 right wrist
  [143, 332], // 8 left hip
  [167, 332], // 9 right hip
  [143, 368], // 10 left knee
  [167, 368], // 11 right knee
  [143, 400], // 12 left ankle
  null, // 13 right ankle: behind the pallet's shadow, not visible
]
const bones: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 4],
  [4, 6],
  [3, 5],
  [5, 7],
  [2, 8],
  [3, 9],
  [8, 9],
  [8, 10],
  [10, 12],
  [9, 11],
  [11, 13],
]
const nudge = (p: [number, number] | null, dx: number, dy: number): [number, number] | null => (p ? [p[0] + dx, p[1] + dy] : null)

/** A pose: keypoints joined by the skeleton, in the same line styles. A keypoint that is not visible is left out, with its bones. */
export const AnnotatedImageKeypoints: S = {
  render: () => (
    <AnnotatedImage
      src={frame}
      width={W}
      height={H}
      label="Camera 2, aisle 3, 14:08, pose of the person"
      annotations={[
        { id: "t-pose", kind: "truth", label: "person", shape: { type: "keypoints", points: joints.map((p, i) => nudge(p, i % 2 ? 3 : -3, 4)), skeleton: bones } },
        { id: "p-pose", kind: "predicted", label: "person", score: 0.86, shape: { type: "keypoints", points: joints, skeleton: bones } },
      ]}
    />
  ),
}

const review: Annotation[] = [
  ...evaluation,
  {
    id: "p-spill",
    kind: "predicted",
    label: "spill",
    score: 0.67,
    shape: { type: "point", x: 404, y: 448 },
  },
  {
    id: "t-zone",
    kind: "truth",
    label: "walkway",
    shape: {
      type: "polygon",
      points: [
        [296, 292],
        [326, 292],
        [236, 478],
        [190, 478],
      ],
    },
  },
]
const kindWord = { predicted: "Predicted", truth: "Ground truth", previous: "Previous version" } as const

function Review({ showLabels }: { showLabels?: "all" | "selected" }) {
  const [selected, setSelected] = React.useState<string | null>("p-forklift")
  const a = review.find((x) => x.id === selected)
  return (
    <div className="flex flex-col gap-4">
      <AnnotatedImage
        src={frame}
        width={W}
        height={H}
        label="Camera 2, aisle 3, 14:08"
        annotations={review}
        selectedId={selected}
        onSelectedChange={setSelected}
        showLabels={showLabels}
      />
      {a ? (
        <DescriptionList
          items={[
            { label: "Class", value: a.label },
            { label: "Source", value: kindWord[a.kind] },
            { label: "Score", value: a.score === undefined ? "Labelled by hand" : a.score.toFixed(2) },
          ]}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Select an annotation to see its details. Tab to the picture, then use the arrow keys.</p>
      )}
    </div>
  )
}

/** Review: each annotation is a button. Tab reaches the picture once; the arrows move in reading order, Enter selects, Esc clears. */
export const AnnotatedImageSelectable: S = { render: () => <Review /> }

/** A crowded picture: only the selected annotation shows its word; every word is still read out. */
export const AnnotatedImageLabelsSelectedOnly: S = { render: () => <Review showLabels="selected" /> }

/** A raster layer between the picture and the marks: a depth map at 50 %. */
export const AnnotatedImageDepthOverlay: S = {
  render: () => (
    <AnnotatedImage
      src={frame}
      width={W}
      height={H}
      label="Camera 2, aisle 3, 14:08"
      annotations={evaluation.filter((a) => a.kind === "predicted")}
      overlays={[{ src: depth, label: "Depth", opacity: 0.5 }]}
    />
  ),
}

/** Loading: the box at the picture's aspect ratio, breathing, so nothing moves when it arrives. */
export const AnnotatedImageLoading: S = {
  render: () => <AnnotatedImage loading width={W} height={H} label="Camera 2, aisle 3, 14:08" annotations={[]} />,
}

/** The picture could not load: the annotations are hidden, since there is nothing to check them against. */
export const AnnotatedImageFailed: S = {
  render: () => <AnnotatedImage src={brokenPhoto} width={W} height={H} label="Camera 2, aisle 3, 14:08" annotations={evaluation} />,
}

/** In Traditional Chinese: the class words, the legend and what is read out all come from `labels` and the data. */
