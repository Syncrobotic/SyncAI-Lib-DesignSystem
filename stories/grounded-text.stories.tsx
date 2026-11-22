import type { Meta, StoryObj } from "@storybook/react-vite"
import { annotatedImageLabels, groundedTextLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import type { Annotation } from "@/registry/syncrobotic/ui/annotated-image"
import { fromGrounding, GroundedText, type GroundedSpan, type Grounding } from "@/registry/syncrobotic/ui/grounded-text"
import { warehouseFrame, zebraFrame, zebras } from "./placeholder-photos"

const meta: Meta = { title: "Display/Grounded text" }
export default meta
type S = StoryObj

const W = 640
const H = 480
const box = (x: number, y: number, width: number, height: number) => ({ type: "box" as const, x, y, width, height })
/** A span over the first `phrase` in `text`, as a model gives it by offsets. */
const at = (text: string, phrase: string, marks: string[]): GroundedSpan => {
  const start = text.indexOf(phrase)
  return { start, end: start + phrase.length, marks }
}

// A caption from a model: each object's name matches a box on the warehouse frame.
const caption =
  "A worker in a high-visibility vest stands on the left of the aisle, beside a pallet of brown boxes. A yellow forklift is parked on the right, in front of the dark shelving."
const captionBoxes: Annotation[] = [
  { id: "person", kind: "predicted", label: "worker", score: 0.94, shape: box(114, 160, 82, 246) },
  { id: "pallet", kind: "predicted", label: "pallet", score: 0.81, shape: box(226, 358, 82, 62) },
  { id: "forklift", kind: "predicted", label: "forklift", score: 0.9, shape: box(328, 218, 236, 196) },
  { id: "shelving", kind: "predicted", label: "shelving", score: 0.77, shape: box(520, 40, 120, 250) },
]
const captionSpans = [
  at(caption, "A worker in a high-visibility vest", ["person"]),
  at(caption, "a pallet of brown boxes", ["pallet"]),
  at(caption, "A yellow forklift", ["forklift"]),
  at(caption, "the dark shelving", ["shelving"]),
]

/** A caption: each object's name is linked to its box. Hover or focus a name to see its box; hover a box to see its name. */
export const GroundedTextCaption: S = {
  render: () => <GroundedText text={caption} spans={captionSpans} annotations={captionBoxes} src={warehouseFrame} width={W} height={H} label="Camera 2, aisle 3, 14:08" />,
}

// Reasoning with grounding as a model returns it: offsets into the text, points on a 0–1000 grid.
const reasoning =
  "Counting the animals: there are 8 zebras in the grass. 5 stand together in a herd on the left, and 3 graze on the right, near the acacia tree. No other animals are in view."
const norm = (i: number): [number, number] => [Math.round((zebras[i][0] / W) * 1000), Math.round((zebras[i][1] / H) * 1000)]
const span = (phrase: string) => ({ start_idx: reasoning.indexOf(phrase), end_idx: reasoning.indexOf(phrase) + phrase.length })
const grounding: Grounding[] = [
  { ...span("8 zebras"), points: zebras.map((_, i) => norm(i)), label: "zebra" },
  { ...span("5 stand together in a herd on the left"), points: [0, 1, 2, 3, 4].map(norm), label: "zebra" },
  { ...span("3 graze on the right"), points: [5, 6, 7].map(norm), label: "zebra" },
  { ...span("the acacia tree"), boxes: [[775, 258, 994, 583]], label: "tree" },
]
const zebraMarks = fromGrounding(reasoning, grounding, { width: W, height: H, scale: 1000 })

/** Reasoning: "8 zebras" is linked to 8 points; each group to its own. `fromGrounding` reads the model's offsets and 0–1000 points. */
export const GroundedTextReasoning: S = {
  render: () => <GroundedText text={reasoning} {...zebraMarks} src={zebraFrame} width={W} height={H} label="Savanna, frame 12" />,
}

/** Pinned: "8 zebras" was tapped, so its points stay highlighted and the rest fade. Tap again, or Esc, to let go. */
export const GroundedTextPinned: S = {
  render: () => <GroundedText text={reasoning} {...zebraMarks} src={zebraFrame} width={W} height={H} label="Savanna, frame 12" defaultPinned={{ span: 0 }} />,
}

// A dense caption: every part of the frame named.
const dense =
  "The worker's head is at the top left, above an orange vest band. Their two boots stand on the tan floor. Beside them, a pallet carries brown boxes on a dark base. The walkway's dashed line runs from the middle of the frame to the bottom left. The forklift has a yellow body, a black overhead guard, a grey mast, forks raised a little, and two black wheels. Grey shelving fills the left edge; darker shelving with two black beams fills the right."
const denseMarks: Annotation[] = [
  { id: "head", kind: "predicted", label: "head", shape: box(134, 168, 42, 42) },
  { id: "vest", kind: "predicted", label: "vest", shape: box(126, 232, 58, 18) },
  { id: "boot-l", kind: "predicted", label: "boot", shape: { type: "point", x: 143, y: 398 } },
  { id: "boot-r", kind: "predicted", label: "boot", shape: { type: "point", x: 167, y: 398 } },
  { id: "boxes", kind: "predicted", label: "boxes", shape: box(230, 360, 74, 44) },
  { id: "base", kind: "predicted", label: "pallet base", shape: box(226, 400, 82, 20) },
  { id: "walkway", kind: "predicted", label: "walkway", shape: { type: "polygon", points: [[296, 292], [306, 292], [214, 478], [204, 478]] } },
  { id: "body", kind: "predicted", label: "forklift body", shape: box(328, 294, 144, 98) },
  { id: "guard", kind: "predicted", label: "overhead guard", shape: box(338, 232, 128, 66) },
  { id: "mast", kind: "predicted", label: "mast", shape: box(468, 220, 22, 172) },
  { id: "forks", kind: "predicted", label: "forks", shape: box(486, 368, 76, 14) },
  { id: "wheel-1", kind: "predicted", label: "wheel", shape: { type: "point", x: 364, y: 394 } },
  { id: "wheel-2", kind: "predicted", label: "wheel", shape: { type: "point", x: 440, y: 394 } },
  { id: "shelf-l", kind: "predicted", label: "shelving", shape: box(0, 60, 96, 230) },
  { id: "shelf-r", kind: "predicted", label: "shelving", shape: box(520, 40, 120, 250) },
  { id: "beam-1", kind: "predicted", label: "beam", shape: box(530, 108, 100, 12) },
  { id: "beam-2", kind: "predicted", label: "beam", shape: box(530, 188, 100, 12) },
]
const denseSpans = [
  at(dense, "The worker's head", ["head"]),
  at(dense, "an orange vest band", ["vest"]),
  at(dense, "two boots", ["boot-l", "boot-r"]),
  at(dense, "brown boxes", ["boxes"]),
  at(dense, "a dark base", ["base"]),
  at(dense, "The walkway's dashed line", ["walkway"]),
  at(dense, "a yellow body", ["body"]),
  at(dense, "a black overhead guard", ["guard"]),
  at(dense, "a grey mast", ["mast"]),
  at(dense, "forks", ["forks"]),
  at(dense, "two black wheels", ["wheel-1", "wheel-2"]),
  at(dense, "Grey shelving", ["shelf-l"]),
  at(dense, "darker shelving", ["shelf-r"]),
  at(dense, "two black beams", ["beam-1", "beam-2"]),
]

/** Many spans: fourteen names over seventeen marks. Tab steps through the names in reading order. */
export const GroundedTextManySpans: S = {
  render: () => <GroundedText text={dense} spans={denseSpans} annotations={denseMarks} src={warehouseFrame} width={W} height={H} label="Camera 2, aisle 3, 14:08" />,
}

// A model checked against ground truth: one name points at both the prediction and the label a person drew, and two
// sentences point at the same person.
const review =
  "The model found the person and the forklift. It missed the pallet, and it took the dark shelving for a second person. The person on the left is the only one in the frame."
const reviewMarks: Annotation[] = [
  { id: "t-person", kind: "truth", label: "person", shape: box(118, 166, 74, 238) },
  { id: "p-person", kind: "predicted", label: "person", score: 0.92, shape: box(114, 160, 82, 246) },
  { id: "t-forklift", kind: "truth", label: "forklift", shape: box(328, 218, 236, 196) },
  { id: "p-forklift", kind: "predicted", label: "forklift", score: 0.88, shape: box(336, 226, 222, 182) },
  { id: "t-pallet", kind: "truth", label: "pallet", shape: box(226, 358, 82, 62) },
  { id: "p-shelf", kind: "predicted", label: "person", score: 0.41, shape: box(540, 96, 76, 150) },
]
const reviewSpans = [
  at(review, "the person", ["p-person", "t-person"]),
  at(review, "the forklift", ["p-forklift", "t-forklift"]),
  at(review, "the pallet", ["t-pallet"]),
  at(review, "a second person", ["p-shelf"]),
  at(review, "The person on the left", ["t-person", "p-person"]),
]

/** Overlapping marks: a prediction and its ground truth on one object share a name, and two sentences share a person. With the legend. */
export const GroundedTextOverlappingMarks: S = {
  render: () => (
    <GroundedText text={review} spans={reviewSpans} annotations={reviewMarks} src={warehouseFrame} width={W} height={H} label="Camera 2, aisle 3, 14:08" legend showLabels="selected" />
  ),
}

const zh = "畫面中共有 8 隻斑馬。左邊有 5 隻聚成一群，右邊的金合歡樹旁有 3 隻在吃草。畫面中沒有其他動物。"
const zhSpan = (phrase: string) => ({ start_idx: zh.indexOf(phrase), end_idx: zh.indexOf(phrase) + phrase.length })
const zhMarks = fromGrounding(
  zh,
  [
    { ...zhSpan("8 隻斑馬"), points: zebras.map((_, i) => norm(i)), label: "斑馬" },
    { ...zhSpan("左邊有 5 隻聚成一群"), points: [0, 1, 2, 3, 4].map(norm), label: "斑馬" },
    { ...zhSpan("右邊的金合歡樹旁有 3 隻"), points: [5, 6, 7].map(norm), label: "斑馬" },
  ],
  { width: W, height: H, scale: 1000 },
)

/** In Traditional Chinese: the descriptions read out ("圖上 8 個點") come from `labels`, the picture's from `imageLabels`. */
export const GroundedTextZhTw: S = {
  render: () => (
    <GroundedText
      text={zh}
      {...zhMarks}
      src={zebraFrame}
      width={W}
      height={H}
      label="草原，第 12 格"
      labels={groundedTextLabels}
      imageLabels={annotatedImageLabels}
      defaultPinned={{ span: 1 }}
    />
  ),
}
