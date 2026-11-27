import { readdirSync, readFileSync } from "node:fs"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import * as zh from "@/registry/syncrobotic/lib/labels-zh-tw"
import { AlarmList } from "@/registry/syncrobotic/ui/alarm"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { TimePicker } from "@/registry/syncrobotic/ui/time-picker"
import props from "@/site/props.json"

// The zh-TW label pack: one object per component that takes `labels`, each holding every key that component has, in
// Traditional Chinese as written in Taiwan. The types already require every key; these tests also catch a component
// added to the kit without an object here, and Simplified or mainland wording slipping in.
afterEach(cleanup)

type Key = { name: string }
type Part = { name: string; props: { name: string; keys?: Key[] }[] }
const pack = zh as unknown as Record<string, Record<string, unknown>>
const exportName = (component: string) => `${component[0]!.toLowerCase()}${component.slice(1)}Labels`

const withLabels = Object.entries(props as unknown as Record<string, Part[] | string>)
  .filter((e): e is [string, Part[]] => Array.isArray(e[1]))
  .flatMap(([, parts]) => parts.flatMap((part) => part.props.filter((p) => p.name === "labels" && p.keys?.length).map((p) => ({ component: part.name, keys: p.keys! }))))

describe("labels-zh-tw", () => {
  it("has an object for every component with labels, holding every key", () => {
    expect(withLabels.length).toBeGreaterThan(40)
    for (const { component, keys } of withLabels) {
      const labels = pack[exportName(component)]
      expect(labels, `${exportName(component)} for ${component}`).toBeTypeOf("object")
      for (const k of keys) expect(labels![k.name], `${component}.${k.name}`).toBeDefined()
    }
  })

  it("has an object for every block and shell part that takes labels, named for its labels type", () => {
    const dirs = ["registry/syncrobotic/blocks", "registry/syncrobotic/shell"]
    const wanted = dirs.flatMap((d) =>
      readdirSync(d)
        .filter((f) => f.endsWith(".tsx"))
        .flatMap((f) => {
          const src = readFileSync(`${d}/${f}`, "utf8")
          // A labels prop written inline has no type to translate against: name it (XxxLabels) so the pack can follow.
          expect(src, `${f}: a labels prop needs a named type`).not.toMatch(/\blabels\??:\s*\{/)
          return [...src.matchAll(/\blabels\??:\s*(?:Partial<)?(\w+)Labels\b|Labelled<(\w+)Labels>/g)].map((m) => ({ file: f, type: m[1] ?? m[2] }))
        }),
    )
    expect(wanted.length).toBeGreaterThan(15)
    for (const { file, type } of wanted) expect(pack[`${type[0]!.toLowerCase()}${type.slice(1)}Labels`], `${type}Labels in ${file}`).toBeTypeOf("object")
  })

  it("writes Traditional Chinese with Taiwan terms, not Simplified or mainland ones", () => {
    const src = readFileSync("registry/syncrobotic/lib/labels-zh-tw.ts", "utf8")
    // Simplified-only characters a translation from zh-CN tends to leave behind.
    for (const ch of "设视频网络连载击据错误选择删录页钮键这个们时间为说")
      expect(src.includes(ch), `Simplified character ${ch}`).toBe(false)
    // Mainland terms, written in Traditional characters, that Taiwan says differently.
    for (const term of ["文件", "設置", "視頻", "網絡", "連接", "信息", "默認", "屏幕", "鼠標", "軟件", "加載", "保存", "菜單"])
      expect(src.includes(term), `mainland term ${term}`).toBe(false)
    // The kit's own terms.
    expect(zh.alarmListLabels.title).toBe("警報")
    expect(zh.stopButtonLabels.ready).toBe("急停")
    expect(zh.robotModelLabels.robot).toBe("機器人")
  })

  it("formats numbers and units with functions, as the English defaults do", () => {
    expect(zh.robotModelLabels.jointValue(Math.PI / 2, "revolute")).toBe("90°")
    expect(zh.robotModelLabels.jointValue(-0.02, "prismatic")).toBe("−20 mm")
    expect(zh.robotModelLabels.poseValue([0.12, -0.04, Math.PI / 6], "planar")).toBe("x 120 mm、y −40 mm、θ 30°")
    expect(zh.traceLabels.duration(840)).toBe("840 ms")
    expect(zh.traceLabels.duration(1200)).toBe("1.2 秒")
    expect(zh.traceLabels.duration(125_000)).toBe("2 分 05 秒")
    expect(zh.traceLabels.duration(3_840_000)).toBe("1 小時 04 分")
    expect(zh.loadMoreLabels.showing(20, 12345, "zh-TW")).toBe("已顯示 20 / 12,345 筆")
    expect(zh.pointCloudLabels.metres(-0.04)).toBe("0.0 m")
    expect(zh.robotMapLabels.position(12.3, 4.56)).toBe("向右 12 m，向下 4.6 m")
    expect(zh.alarmListLabels.hidden(2, 0)).toBe("2 個依設計抑制")
  })

  it("groups the pagination range by the locale, as the English default does (#324)", () => {
    expect(zh.paginationLabels.range(1201, 1220, 12400, "zh-TW")).toBe("第 1,201–1,220 筆，共 12,400 筆")
    expect(zh.paginationLabels.range(1, 20, 40, "zh-TW")).toBe("第 1–20 筆，共 40 筆")
  })

  it("reaches the DOM through each component's labels prop", () => {
    render(<Spinner delay={0} labels={zh.spinnerLabels} />)
    expect(screen.getByRole("status", { name: "載入中" })).toBeTruthy()
    render(<TimePicker labels={zh.timePickerLabels} />)
    expect(screen.getByText("選擇時間")).toBeTruthy()
    // AlarmList lays its summary out by splitting at " · ", so the pack keeps that separator.
    render(<AlarmList alarms={[]} labels={zh.alarmListLabels} />)
    expect(screen.getByText("目前沒有警報")).toBeTruthy()
  })
})
