import type { Metadata } from "next"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { TokenTable, Pager } from "@/site/doc"
import { H2, Inline, PageTitle } from "@/site/prose"

const description = "Upgrading to SYNCROBOTIC 0.42: resizable on react-resizable-panels 4, what keeps working and what changes, old to new."

export const metadata: Metadata = pageMeta({ title: "0.42 migration", description, path: "/docs/upgrading/0-42" })

/** What a product passes that keeps working in 0.42: the kit maps it onto version 4. */
const kept: string[][] = [
  ["ResizablePanelGroup", "`direction`", "`direction` or `orientation`", "The same values."],
  ["ResizablePanel", "`defaultSize={40}`, `minSize`, `maxSize`, `collapsedSize`", "the same numbers", "Still percentages of the group (version 4 alone reads a number as pixels). A string takes a unit: `\"240px\"`, `\"20rem\"`."],
  ["ResizablePanelGroup", "`autoSaveId`", "`autoSaveId`", "Restored after hydration without a mismatch. Give each panel an `id`: sizes saved by 0.41 are then read, otherwise they start from `defaultSize` once."],
  ["ResizableHandle", "`withHandle`", "`withHandle`", "The same grip, line, hit area, colours and focus ring."],
]

/** Old → new for 0.42, one row per change a product has to make. */
const migration: string[][] = [
  ["ResizablePanelGroup", "`onLayout={(sizes) => …}`", "`onLayoutChanged={(layout) => …}`", "`layout` maps panel id to percentage. `onLayoutChange` fires on every pointer move; prefer `onLayoutChanged`, which fires on release."],
  ["ResizablePanelGroup", "`ref` (`getLayout()`, `setLayout([…])`)", "`groupRef`", "`getLayout()` and `setLayout({ list: 30, map: 70 })` use the same id map. `useGroupRef()` types it."],
  ["ResizablePanelGroup", "`keyboardResizeBy`, `storage`, `tagName`", "removed", "Arrow keys move 5%. For another storage, call `useDefaultLayout` from react-resizable-panels and pass `defaultLayout` and `onLayoutChanged`."],
  ["ResizablePanel", "`onCollapse`, `onExpand`", "`onResize`", "Compare `panelSize.asPercentage` with the collapsed size, or ask `panelRef.current.isCollapsed()`."],
  ["ResizablePanel", "`onResize={(size, prev) => …}`", "`onResize={(size, id, prev) => …}`", "`size` is `{ asPercentage, inPixels }`, not a number."],
  ["ResizablePanel", "`ref` (`resize(30)`, `getSize()`)", "`panelRef` (`resize(\"30%\")`, `getSize().asPercentage`)", "`resize(30)` is 30 px in version 4: write the unit. `usePanelRef()` types it."],
  ["ResizablePanel", "`order`", "removed", "Panels follow their order in the DOM; give conditional panels an `id`."],
  ["ResizableHandle", "`onDragging`, `hitAreaMargins`, `tagName`", "removed", "`data-separator=\"active\"` while dragging; the hit area is the group's `resizeTargetMinimumSize` (the kit's: 16 px, `--h-md` on a touch screen)."],
  ["Your CSS", "`[data-panel-group-direction=vertical]`", "the group's `[data-orientation=vertical]`, the handle's `[aria-orientation=horizontal]`", "A vertical group is split by a horizontal separator."],
  ["Your CSS", "`[data-resize-handle-state=drag]`, `=hover`", "`[data-separator=active]`, `=hover`", "Also `focus`, `inactive` and `disabled`."],
  ["Your CSS and tests", "`data-panel-size`, `data-panel-id`, `data-panel-group-id`", "the handle's `aria-valuenow`, the panel's and group's `id`", "A Panel's `className` is now on an element inside the panel."],
  ["Keyboard", "Arrow 10%, Shift+Arrow all the way", "Arrow 5%; Home and End all the way", "F6 and Shift+F6 move between handles; a double-click restores the default size."],
]

const find = `# Run from your project's root: what is left to move by hand. The compiler lists the removed props too.
grep -rnE 'onLayout=|keyboardResizeBy|onCollapse=|onExpand=|onDragging=|hitAreaMargins|ImperativePanel(Group)?Handle|data-panel-group-direction|data-resize-handle|data-panel-size' src`

export default function Migration042Page() {
  return (
    <article>
      <PageTitle title="0.42 migration" lead="0.42 moves resizable to react-resizable-panels 4. The props products pass most keep working; callbacks, refs and the library's data attributes follow version 4." />

      <H2 id="kept">What keeps working</H2>
      <TokenTable head={["Component", "0.41", "0.42", "Notes"]} rows={kept.map((r) => r.map((c) => <Inline key={c} text={c} />))} />

      <H2 id="changes">What changed</H2>
      <p className="max-w-3xl text-base">
        <Inline text="Before 1.0 a rename or a removal is a minor version. A removed prop is a type error where it is used; a changed callback argument often is, but a CSS selector or a `resize(30)` is not, so search for those." />
      </p>
      <TokenTable head={["Where", "0.41", "0.42", "How"]} rows={migration.map((r) => r.map((c) => <Inline key={c} text={c} />))} />
      <div className="pt-4">
        <CodeBlock code={find} lang="bash" title="Find what to move" />
      </div>

      <Pager
        prev={{ href: "/docs/upgrading", title: "Versions and upgrades" }}
        next={{ href: "/docs/upgrading/0-40", title: "0.40 migration" }}
        trail={[
          { name: "Docs", path: "/docs" },
          { name: "Versions and upgrades", path: "/docs/upgrading" },
          { name: "0.42 migration", path: "/docs/upgrading/0-42" },
        ]}
      />
    </article>
  )
}
