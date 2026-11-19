import type { Meta, StoryObj } from "@storybook/react"
import { MetricCard, MetricGrid } from "@/registry/syncrobotic/ui/metric-card"

const meta: Meta = { title: "Display/Metric card" }
export default meta
type S = StoryObj

/** The row under a dashboard's page header: four numbers, two across on a phone. Only the rise in events is coloured. */
export const MetricCardRow: S = {
  render: () => (
    <MetricGrid>
      <MetricCard label="Robots online" value="12" unit="/ 14" delta="+1" trend="good" series={[9, 10, 10, 11, 11, 12, 12]} caption="2 docked for charging" />
      <MetricCard label="Patrol hours" value="286" unit="h" delta="+8%" trend="good" series={[210, 230, 228, 250, 262, 270, 286]} caption="Last 7 days" />
      <MetricCard label="Events" value="24" delta="+6" trend="bad" series={[12, 15, 14, 18, 16, 18, 24]} caption="3 need review" />
      <MetricCard label="Avg. battery" value="71" unit="%" delta="−2%" trend="flat" series={[76, 75, 74, 72, 73, 72, 71]} caption="Lowest: 9C44 at 18%" />
    </MetricGrid>
  ),
}

/** The trend says whether the change is good, not which way it went: fewer stops is good, more events is bad. Only bad takes colour. */
export const MetricCardTrends: S = {
  render: () => (
    <MetricGrid className="xl:grid-cols-3">
      <MetricCard label="Unplanned stops" value="3" delta="−4" trend="good" caption="Against last week" />
      <MetricCard label="Events" value="24" delta="+6" trend="bad" caption="Against last week" />
      <MetricCard label="Missions done" value="968" delta="+0.2%" trend="flat" caption="Against last week" />
    </MetricGrid>
  ),
}

/** Each card opens the list behind its number. The whole card is the link; the ring goes round the card. */
export const MetricCardWithLink: S = {
  render: () => (
    <MetricGrid>
      <MetricCard href="#robots" label="Robots online" value="12" unit="/ 14" delta="+1" trend="good" caption="2 docked for charging" />
      <MetricCard href="#events" label="Events" value="24" delta="+6" trend="bad" caption="3 need review" />
    </MetricGrid>
  ),
}

/** While the numbers load, the labels stay and bones hold each card's height, so nothing jumps when they arrive. */
export const MetricCardLoading: S = {
  render: () => (
    <MetricGrid>
      <MetricCard label="Robots online" loading />
      <MetricCard label="Patrol hours" loading />
      <MetricCard label="Events" loading />
      <MetricCard label="Avg. battery" loading />
    </MetricGrid>
  ),
}

/** A number that cannot be read is a dash and a reason, never a 0 that looks like a real count. */
export const MetricCardUnavailable: S = {
  render: () => (
    <MetricGrid>
      <MetricCard label="Robots online" value="12" unit="/ 14" delta="+1" trend="good" caption="2 docked for charging" />
      <MetricCard label="Avg. battery" unit="%" unavailable="Fleet telemetry paused since 14:02" />
    </MetricGrid>
  ),
}

/** Without a series there is no sparkline; the value row keeps its height, so a row can mix both. */
export const MetricCardWithoutSparkline: S = {
  render: () => (
    <MetricGrid>
      <MetricCard label="Open incidents" value="2" caption="Both at Taoyuan plant" />
      <MetricCard label="Avg. mission time" value="18" unit="min" delta="+0.3 min" trend="flat" caption="Within the usual range" />
    </MetricGrid>
  ),
}

/** The same row in Traditional Chinese, with the words read aloud translated too. */
export const MetricCardTraditionalChinese: S = {
  render: () => {
    const labels = { better: "，變好", worse: "，變差", loading: "載入中", unavailable: "無法取得" }
    return (
      <MetricGrid lang="zh-Hant">
        <MetricCard label="上線機器人" value="12" unit="/ 14" delta="+1" trend="good" series={[9, 10, 10, 11, 11, 12, 12]} caption="2 台在充電站" labels={labels} />
        <MetricCard label="巡邏時數" value="286" unit="小時" delta="+8%" trend="good" series={[210, 230, 228, 250, 262, 270, 286]} caption="近 7 天" labels={labels} />
        <MetricCard label="事件" value="24" delta="+6" trend="bad" series={[12, 15, 14, 18, 16, 18, 24]} caption="3 件待審查" labels={labels} />
        <MetricCard label="平均電量" unit="%" unavailable="車隊遙測自 14:02 起暫停" labels={labels} />
      </MetricGrid>
    )
  },
}
