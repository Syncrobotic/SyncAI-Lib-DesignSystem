// @syncrobotic/labels-zh-tw v0.51.0 · update: npx shadcn add @syncrobotic/labels-zh-tw --overwrite
// The kit's words in Traditional Chinese as written in Taiwan, one object per component that takes `labels`. Pass each
// to its component (`<DataGrid labels={dataGridLabels} />`), with `locale="zh-TW"` where it formats numbers, days or
// times. It imports no component, so it installs on its own.
// Terms: 警報 (alarm), 急停 (emergency stop), 機器人 (robot), 任務 (mission), and Taiwan usage (檔案, 設定, 影片, 連線,
// 網路). Units stay SI symbols (mm, m/s, N·m).

import { formatCount, formatNumber } from "@/registry/syncrobotic/lib/format-number"

/** The BCP 47 tag to pass as `locale` beside these labels. */
export const locale = "zh-TW"

// ---------- Formatting shared by several components ----------

const pad = (n: number) => String(n).padStart(2, "0")
// A 24-hour clock, as the English defaults write it and as Taiwan reads a time on a control panel.
const clock = (d: Date) => [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(":")
// Chinese lists take the enumeration comma (、), not a comma and "and".
const list = (names: string[]) => names.join("、")
// A real minus sign (U+2212), as the kit writes negative values.
const signed = (n: number, unit: string) => `${n < 0 ? "−" : ""}${Math.abs(n)}${unit}`
const degrees = (rad: number) => signed(Math.round((rad * 180) / Math.PI), "°")
const millimetres = (m: number) => signed(Math.round(m * 1000), " mm")
// One decimal without a negative zero, as the point cloud writes metres.
const fixed1 = (n: number) => (Object.is(Math.round(n * 10), -0) ? 0 : n).toFixed(1)
// The robot map writes metres with one decimal below 10 m and none above.
const mapMetres = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(0) : n.toFixed(1))
const mapAt = (x: number, y: number) => `${x.toFixed(1)}, ${y.toFixed(1)} m`
const compass = (deg: number) => Math.round(((deg % 360) + 360) % 360)

// ---------- Alarms ----------

export const alarmLabels = {
  critical: "緊急",
  high: "高",
  low: "低",
  unacknowledged: "未確認",
  acknowledged: "已確認",
  cleared: "已解除，尚未確認",
  clearedWhen: (t: string) => `${t} 已解除，尚未確認`,
  acknowledge: "確認",
  shelve: "擱置",
  unshelve: "取消擱置",
  shelvedUntil: "擱置至",
}

export const alarmListLabels = {
  ...alarmLabels,
  title: "警報",
  // AlarmList splits the summary at " · " to lay out its parts, so the separator stays.
  summary: (active: number, unacknowledged: number) => `${active} 個進行中 · ${unacknowledged} 個未確認`,
  none: "目前沒有警報",
  acknowledgeAll: "全部確認",
  acknowledgeShown: (n: number) => `確認顯示的 ${n} 個警報`,
  acknowledgeNonCritical: (n: number) => `確認 ${n} 個非緊急警報`,
  acknowledgedCount: (n: number) => `已確認 ${n} 個警報`,
  shelvedGroup: (n: number) => `已擱置 · ${n}`,
  hidden: (suppressed: number, outOfService: number) => [suppressed && `${suppressed} 個依設計抑制`, outOfService && `${outOfService} 個停用中`].filter(Boolean).join(" · "),
  flood: (n: number, minutes: number) => `警報氾濫：${minutes} 分鐘內 ${n} 個警報。請先處理緊急與高優先級，低優先級警報已合併顯示。`,
  lowGroup: (n: number) => `${n} 個低優先級警報`,
  many: (n: number) => `${n} 個新警報`,
  loading: "正在載入警報",
  errorEmpty: "無法載入警報，可能有警報未顯示在這裡。",
  errorStale: "無法更新警報，這份清單可能不是最新的。",
  updatedAt: (t: string) => `最後更新 ${t}`,
  retry: "重試",
}

export const islandAlarmLabels = {
  ...alarmLabels,
  more: (n: number) => `+${n}`,
  // Read after "+3", so a screen reader hears "+3 個其他未確認警報".
  moreAlarms: "個其他未確認警報",
  many: (n: number) => `${n} 個新警報`,
}

// ---------- Robot shell ----------

export const stopButtonLabels = {
  ready: "急停",
  idle: "停止",
  sending: "傳送中…",
  unconfirmed: "未確認，請再按一次",
  bluetooth: "急停 · 藍牙",
  "bluetooth-sent": "已透過藍牙送出",
  dead: "無連線",
  holdAll: "持續按住以停止全部",
}

export const teleopPadLabels = {
  name: "遙控機器人",
  roleDescription: "遙控操作盤",
  hint: "按住即可移動",
  release: "放開即停止",
  keys: "按住方向鍵或 W A S D 移動，按空白鍵停止。",
  driving: "移動中",
  speedUnit: "m/s",
  stopped: "已停止",
  lost: "已停止：輸入中斷，請再次按住以移動",
  disabled: "已停用",
  limit: "速度上限",
}

export const islandLabels = {
  attention: "另一台機器狗需要處理",
  status: "裝置狀態",
  offline: "離線",
  charging: "充電中",
  battery: (percent: number) => `電量 ${percent}%`,
  batteryUnknown: "電量未知",
  notifications: (unread: number) => `通知，${unread} 則未讀`,
  robotsPanel: "切換機器狗",
  statusPanel: "裝置狀態",
  notificationsPanel: "通知",
}

export const islandRobotsLabels = {
  current: "目前",
  attention: "需要處理",
  battery: (percent: number) => `${percent} %`,
}

export const islandStatusLabels = {
  connection: "連線",
  wifi: "Wi-Fi",
  bluetooth: "只剩藍牙：緊急停止與狀態仍可使用",
  offline: "離線",
  battery: "電量",
  charging: "充電中",
  notCharging: "未充電",
  unknown: "尚未回報",
  updated: "最後更新",
}

export const islandNotificationsLabels = {
  markAllRead: "全部標為已讀",
  empty: "沒有通知",
  unread: "未讀",
}

// ---------- Robot views ----------

export const cameraFeedLabels = {
  keys: "按空白鍵暫停或繼續畫面，按 F 切換全螢幕。暫停只會凍結這個畫面，機器人仍會持續串流。",
  live: "即時",
  latency: (ms: number) => `${Math.round(ms)} ms`,
  connecting: "連線中",
  connectingLong: "正在連線到攝影機…",
  stalled: "畫面停滯",
  lastFrame: (time: string) => `最後一格畫面 ${time}`,
  formatTime: clock,
  paused: "已暫停",
  offline: "攝影機離線",
  noCamera: "沒有攝影機",
  retry: "重新連線",
  pauseView: "暫停畫面",
  resumeView: "繼續畫面",
  mute: "靜音",
  unmute: "取消靜音",
  snapshot: "拍攝快照",
  fullscreen: "全螢幕",
  exitFullscreen: "離開全螢幕",
}

// CameraFeedStateLine (a wall tile's state) takes the same words as the feed.
export const cameraFeedStateLineLabels = cameraFeedLabels

// 頻寬 (bandwidth) and 攝影機 (camera) as Taiwan writes them; alarm priorities as the alarm list says them.
export const cameraWallLabels = {
  name: "攝影機",
  keys: "方向鍵在各攝影機之間移動，Enter 放大顯示，Esc 回到所有攝影機。",
  pausedToSave: "為節省頻寬已暫停",
  sort: "攝影機排序",
  attentionFirst: "需處理優先",
  byName: "名稱",
  needsAttention: "需要處理",
  count: (n: number, locale: string | undefined) => formatCount(n, { locale: locale ?? "zh-TW" }),
  allCameras: "所有攝影機",
  critical: "緊急",
  high: "高",
  low: "低",
  alarm: (priority: string, title: string) => `${priority}・${title}`,
  range: (from: number, to: number, total: number, locale?: string) =>
    `第 ${formatCount(from, { locale: locale ?? "zh-TW" })}–${formatCount(to, { locale: locale ?? "zh-TW" })} 台，共 ${formatCount(total, { locale: locale ?? "zh-TW" })} 台攝影機`,
  previousPage: "上一頁攝影機",
  nextPage: "下一頁攝影機",
  empty: "沒有攝影機",
  noneNeedAttention: "目前沒有需要處理的攝影機",
  showAll: "顯示所有攝影機",
  announce: (changes: { name: string; state: string }[], locale: string | undefined) => {
    const shown = changes.slice(0, 3).map((c) => `${c.name}：${c.state}。`)
    const more = changes.length - shown.length
    return shown.join("") + (more > 0 ? `另有 ${formatCount(more, { locale: locale ?? "zh-TW" })} 台攝影機狀態改變。` : "")
  },
  feed: cameraFeedLabels,
}

export const jointStateLabels = {
  title: "關節狀態",
  joint: "關節",
  position: "位置",
  velocity: "速度",
  effort: "出力",
  degrees: (v: string) => `${v}°`,
  millimetres: (v: string) => `${v} mm`,
  degreesPerSecond: (v: string) => `${v} °/s`,
  millimetresPerSecond: (v: string) => `${v} mm/s`,
  newtonMetres: (v: string) => `${v} N·m`,
  newtons: (v: string) => `${v} N`,
  effortPercent: (v: string) => `${v}%`,
  range: (lower: string, upper: string) => `範圍 ${lower} 至 ${upper}`,
  noLimits: "無限位（連續旋轉）",
  nearLower: "接近下限",
  nearUpper: "接近上限",
  atLower: "已達下限",
  atUpper: "已達上限",
  beyondLower: "超出下限",
  beyondUpper: "超出上限",
  stale: "資料過時",
  lastUpdate: (time: string) => `最後更新 ${time}`,
  formatTime: (d: Date, locale: string | undefined) => (locale ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }) : clock(d)),
  loading: "正在載入關節狀態…",
  empty: "尚無關節狀態",
  emptyHint: "機器人發布關節位置後，會顯示在這裡。",
}

export const diagnosticsLabels = {
  title: "診斷",
  ok: "正常",
  warn: "警告",
  error: "錯誤",
  stale: "未更新",
  summary: (problems: number, total: number, locale: string) =>
    problems === 0 ? `共 ${formatCount(total, { locale: locale ?? "zh-TW" })} 項，沒有需要注意的項目` : `${formatCount(total, { locale: locale ?? "zh-TW" })} 項中有 ${formatCount(problems, { locale: locale ?? "zh-TW" })} 項需要注意`,
  updatedAgo: (ms: number, locale: string) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    if (s < 60) return `${formatCount(s, { locale: locale ?? "zh-TW" })} 秒前更新`
    if (s < 3600) return `${formatCount(Math.floor(s / 60), { locale: locale ?? "zh-TW" })} 分鐘前更新`
    return `${formatCount(Math.floor(s / 3600), { locale: locale ?? "zh-TW" })} 小時前更新`
  },
  filter: "顯示",
  all: "全部",
  problems: "有問題",
  search: "搜尋診斷項目",
  searchPlaceholder: "依名稱或硬體 ID 篩選",
  hardwareId: "硬體 ID",
  noValues: "沒有數值",
  unnamed: "（未命名）",
  toggle: (name: string) => `${name} 底下的項目`,
  details: (name: string) => `${name} 的詳細資料`,
  loading: "正在載入診斷資料…",
  empty: "尚無診斷資料",
  emptyHint: "機器人發布硬體與軟體檢查結果後，會顯示在這裡。",
  noMatch: (query: string) => `沒有符合「${query}」的項目`,
  noMatchHint: "搜尋範圍為名稱與硬體 ID。",
  noProblems: "沒有需要注意的項目：全部正常。",
  announceError: (name: string, message: string) => (message ? `錯誤：${name}，${message}` : `錯誤：${name}`),
  announceErrors: (count: number) => `${count} 個新錯誤`,
}

// The components of a planar or floating joint, in URDF order, and whether each is an angle.
const POSE_AXES = {
  planar: [
    ["x", false],
    ["y", false],
    ["θ", true],
  ],
  floating: [
    ["x", false],
    ["y", false],
    ["z", false],
    ["滾轉", true],
    ["俯仰", true],
    ["偏航", true],
  ],
} as const

export const robotModelLabels = {
  keys: "拖曳可旋轉視角，按右鍵拖曳可移動視角；視圖取得焦點後，用滾輪或雙指縮放。方向鍵旋轉，Shift 加方向鍵移動，加號與減號縮放，0 重設視圖，F 讓機器人完整顯示。此視圖只顯示機器人，不會操控它。",
  robot: "機器人",
  jointCount: (n: number) => `${n} 個關節`,
  summary: (robot: string, n: number) => `${robot}，3D 視圖，${n} 個關節`,
  highlighted: (items: string[]) => `標示：${items.join("；")}`,
  // A planar or floating joint given as one number is its x, a distance.
  jointValue: (value: number, type: "revolute" | "continuous" | "prismatic" | "fixed" | "floating" | "planar") => (type === "prismatic" || type === "planar" || type === "floating" ? millimetres(value) : degrees(value)),
  poseValue: (values: readonly number[], type: "floating" | "planar") =>
    POSE_AXES[type]
      .flatMap(([axis, angle], i) => {
        const v = values[i]
        return v === undefined || !Number.isFinite(v) ? [] : [`${axis} ${angle ? degrees(v) : millimetres(v)}`]
      })
      .join("、"),
  jointDetail: (value: string | undefined, lower: string | undefined, upper: string | undefined) => [value && `目前 ${value}`, lower !== undefined && upper !== undefined && `限位 ${lower} 至 ${upper}`].filter(Boolean).join("，"),
  link: "連桿",
  loading: "正在載入機器人模型…",
  loadingMeshes: (loaded: number, total: number) => `正在載入網格，${loaded} / ${total}`,
  error: "無法載入機器人模型。",
  errorDetail: (path: string, reason: string) => `${path}：${reason}`,
  invalidUrdf: "不是 URDF 檔案（沒有 <robot> 元素，或 XML 格式有誤）",
  missingPackage: (pkg: string) => `未提供套件「${pkg}」的路徑`,
  unsupportedMesh: "不支援此網格格式（支援 STL 與 COLLADA）",
  retry: "重新載入",
  empty: "沒有可顯示的機器人模型。",
  stale: "資料過時",
  lastUpdate: (time: string) => `最後更新 ${time}`,
  formatTime: clock,
  noWebgl: "無法顯示 3D 視圖：此瀏覽器無法繪製 3D（WebGL 已關閉或不受支援）。",
  noWebglDetail: "以下改為列出各關節的位置。",
  jointsHeading: "關節位置",
  noValue: "無數值",
  contextLost: "正在還原 3D 視圖…",
  contextFailed: "無法還原 3D 視圖。",
  resetView: "重設視圖",
  fitView: "讓機器人完整顯示",
  axes: { x: "前", y: "左", z: "上" },
}

export const pointCloudLabels = {
  viewName: "3D 點雲",
  keys: "拖曳可旋轉，按右鍵拖曳或用兩指可平移；視圖取得焦點後，用滾輪或雙指縮放。方向鍵旋轉，Shift 加方向鍵平移，加號與減號縮放，0 重設視圖。",
  count: (n: number) => `${formatCount(n, { locale: "zh-TW" })} 個點`,
  bounds: (b: { min: [number, number, number]; max: [number, number, number]; count: number }) =>
    `x ${fixed1(b.min[0])} 至 ${fixed1(b.max[0])} m（前方），y ${fixed1(b.min[1])} 至 ${fixed1(b.max[1])} m（左方），z ${fixed1(b.min[2])} 至 ${fixed1(b.max[2])} m（上方）`,
  robotAtOrigin: "機器人位於原點，面向 x 軸",
  frameTime: (ms: number) => `每幀 ${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`,
  loading: "正在載入點雲",
  empty: "沒有點",
  error: "無法載入點雲。",
  retry: "重新載入",
  stale: "資料過時",
  lastScan: (time: string) => `最後一次掃描 ${time}`,
  formatTime: clock,
  noWebGL: "此瀏覽器無法繪製 3D 視圖。",
  noWebGLHint: "WebGL 2 已關閉或不受支援。請開啟硬體加速，或改用最新版的瀏覽器開啟此頁面。",
  contextLost: "正在還原 3D 視圖…",
  resetView: "重設視圖",
  fit: "縮放至顯示所有點",
  axisX: "x 前方",
  axisY: "y 左方",
  axisZ: "z 上方",
  scaleHeight: "高度",
  scaleIntensity: "強度",
  metres: (m: number) => `${fixed1(m)} m`,
  intensityValue: (v: number) => (Math.abs(v) >= 100 ? Math.round(v).toString() : Number(v.toPrecision(3)).toString()),
}

export const robotMapLabels = {
  instructions: "方向鍵移動地圖，加號與減號縮放，0 顯示整個場域。地圖旁的機器人清單以文字列出相同的機器人。",
  zoomIn: "放大",
  zoomOut: "縮小",
  fit: "顯示整個場域",
  status: { active: "作業中", normal: "閒置", warning: "需要處理", danger: "已停止", offline: "離線" },
  // Nouns, so they read in "位於減速區內" as well as in parentheses after a zone's name.
  zoneKind: { restricted: "禁入區", slow: "減速區", charging: "充電區", other: "標記區" },
  empty: "此場域目前沒有機器人。",
  loading: "正在載入地圖",
  error: "無法載入地圖。",
  retry: "重新載入",
  count: (n: number) => `${n} 台機器人`,
  selected: (name: string, status: string) => `已選取：${name}，${status}`,
  north: (deg: number) => `北方位於畫面上方順時針 ${compass(deg)}°`,
  northLetter: "北",
  position: (x: number, y: number) => `向右 ${mapMetres(x)} m，向下 ${mapMetres(y)} m`,
  inZone: (zone: string, kind: string | undefined) => (kind ? `位於 ${zone}（${kind}）` : `位於 ${zone}`),
  inUnnamedZone: (kind: string) => `位於${kind}內`,
  noZone: "不在任何標記區內",
  heading: (deg: number) => `朝向 ${compass(deg)}°`,
  metres: (m: number) => `${m} m`,
  costTitle: "成本",
  costLow: "低",
  costHigh: "致命",
  at: mapAt,
  editKeys: "方向鍵移動十字準線，按住 Shift 可加大步距；Enter 或空白鍵放置，Esc 取消。按右鍵拖曳或用兩指可移動地圖。",
  goalHint: "按下以放置目標點，拖曳以設定方向。Esc 取消。",
  goalTurnHint: "左右方向鍵旋轉目標方向，Enter 確定，Esc 取消。",
  waypointsHint: "點一下新增航點，拖曳航點可移動。Delete 鍵移除選取的航點。",
  carryHint: "方向鍵移動，Enter 放下，Esc 放回原位。",
  zoneHint: "點一下放置新區域的第一個角點。",
  zoneEditableHint: "點一下開始新區域，或拖曳角點來移動。",
  zoneDrawHint: "點一下新增角點；點第一個角點或按 Enter 完成。Backspace 移除最後一個角點，Esc 取消。",
  panHint: "按右鍵拖曳或用兩指可移動地圖。",
  goalPlaced: (x: number, y: number) => `目標點位於 ${mapAt(x, y)}。左右方向鍵旋轉方向，Enter 確定。`,
  goalSet: (x: number, y: number, heading: number | undefined) => `已設定目標點於 ${mapAt(x, y)}${heading === undefined ? "" : `，朝向 ${Math.round(heading)}°`}`,
  goalCancelled: "已取消目標點",
  waypointAdded: (n: number, x: number, y: number) => `已新增航點 ${n}，位於 ${mapAt(x, y)}`,
  waypointPicked: (n: number) => `已拿起航點 ${n}。方向鍵移動，Enter 放下，Esc 放回原位。`,
  waypointMoved: (n: number, x: number, y: number) => `航點 ${n} 已移到 ${mapAt(x, y)}`,
  waypointRemoved: (n: number) => `已移除航點 ${n}`,
  moveCancelled: "已取消移動",
  cornerAdded: (n: number, x: number, y: number) => `角點 ${n} 位於 ${mapAt(x, y)}`,
  cornerRemoved: (left: number) => `已移除最後一個角點，剩下 ${left} 個`,
  cornerPicked: "已拿起角點。方向鍵移動，Enter 放下，Esc 放回原位。",
  cornerMoved: (x: number, y: number) => `角點已移到 ${mapAt(x, y)}`,
  zoneDrawn: (n: number) => `已畫好區域，共 ${n} 個角點`,
  zoneCancelled: "已取消區域",
}

export const robotMapListLabels = robotMapLabels

// 航點 (waypoint) and 路線 (route), as robot-map says them; 停留 for dwell, the word a dispatcher uses for time at a stop.
const routeNumber = (n: number, locale: string | undefined, digits = 1) => formatNumber(n, { locale: locale ?? "zh-TW", minimumFractionDigits: digits, maximumFractionDigits: digits })
export const waypointEditorLabels = {
  name: "路線",
  map: "路線地圖",
  showAs: "顯示方式",
  listTab: "清單",
  mapTab: "地圖",
  add: "新增航點",
  empty: "尚無航點。點一下地圖或「新增航點」開始規劃路線。",
  defaultName: (n: number) => `航點 ${n}`,
  copyName: (name: string) => `${name} 副本`,
  move: (name: string) => `移動 ${name}`,
  rowKeys: "Enter 開啟詳細資料，Delete 刪除此航點。",
  fieldName: "名稱",
  x: "X",
  y: "Y",
  lat: "緯度",
  lon: "經度",
  heading: "朝向",
  headingHint: "留空表示不限朝向。",
  action: "抵達時",
  actions: { none: "不執行動作", wait: "等待", dock: "回充電座", photo: "拍照", custom: "自訂動作" },
  waitFor: "等待時間",
  customName: "動作名稱",
  dwell: "停留",
  dwellHint: "完成動作後再停留的時間。",
  duplicate: "複製航點",
  remove: "刪除",
  removed: (name: string) => `已刪除 ${name}`,
  undo: "復原",
  position: (x: number, y: number, locale: string | undefined) => `${routeNumber(x, locale)}, ${routeNumber(y, locale)} m`,
  geoPosition: (lat: number, lon: number, locale: string | undefined) => `${routeNumber(lat, locale, 6)}, ${routeNumber(lon, locale, 6)}`,
  headingShort: (deg: number) => `朝向 ${compass(deg)}°`,
  actionShort: (a: { type: string; seconds?: number; name?: string }, locale: string | undefined) =>
    a.type === "wait" ? `等待 ${formatNumber(a.seconds ?? 0, { locale: locale ?? "zh-TW" })} 秒` : a.type === "dock" ? "回充電座" : a.type === "photo" ? "拍照" : a.type === "custom" ? a.name || "自訂動作" : "",
  dwellShort: (s: number, locale: string | undefined) => `停留 ${formatNumber(s, { locale: locale ?? "zh-TW" })} 秒`,
  problem: (p: { kind: string; zone?: string; distance?: number }, min: number, locale: string | undefined) =>
    p.kind === "noName"
      ? "缺少名稱"
      : p.kind === "noActionName"
        ? "缺少動作名稱"
        : p.kind === "invalid"
          ? "位置不是數字"
          : p.kind === "outside"
            ? "超出地圖範圍"
            : p.kind === "keepOut"
              ? `位於${p.zone ?? "禁入區"}內`
              : `距上一個航點 ${routeNumber(p.distance ?? 0, locale, 2)} m（至少需 ${routeNumber(min, locale)} m）`,
  count: (n: number, locale: string | undefined) => `${formatCount(n, { locale: locale ?? "zh-TW" })} 個航點`,
  distanceTitle: "距離",
  durationTitle: "預估時間",
  distance: (m: number, locale: string | undefined) => (m >= 1000 ? `${routeNumber(m / 1000, locale, 2)} km` : `${routeNumber(m, locale)} m`),
  duration: (s: number, locale: string | undefined) => {
    const t = Math.round(s)
    const n = (v: number) => formatCount(v, { locale: locale ?? "zh-TW" })
    if (t < 60) return `約 ${n(t)} 秒`
    const h = Math.floor(t / 3600)
    const m = Math.floor((t % 3600) / 60)
    return h ? `約 ${n(h)} 小時 ${n(m)} 分` : `約 ${n(m)} 分 ${n(t % 60)} 秒`
  },
  unsaved: "有未儲存的變更",
  saved: "沒有未儲存的變更",
  save: "儲存路線",
  cancel: "取消",
  noChanges: "沒有要儲存的變更",
  needsWaypoint: "請先新增航點再儲存",
  blocked: (n: number, locale: string | undefined) => `請先修正 ${formatCount(n, { locale: locale ?? "zh-TW" })} 個問題再儲存`,
  saveFailed: "無法儲存路線，請再試一次。",
  savedNotice: "已儲存路線",
  discarded: "已捨棄變更",
  problems: (n: number, locale: string | undefined) => (n === 0 ? "已沒有問題" : `${formatCount(n, { locale: locale ?? "zh-TW" })} 個問題`),
  added: (name: string, n: number) => `已新增 ${name}，為第 ${n} 個航點`,
  duplicated: (name: string, n: number) => `已新增 ${name}，為第 ${n} 個航點`,
  readOnly: "僅供檢視：你無法變更這條路線。",
  details: "詳細資料",
}

// The outdoor map writes coordinates with fixed decimals and no grouping, in the locale's digits.
const geoNumber = (n: number, max: number, locale: string | undefined, min = max) =>
  formatNumber(n, { locale: locale ?? "en", minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: false })
const geoCompass = ["北", "東北", "東", "東南", "南", "西南", "西", "西北"]

export const geoMapLabels = {
  instructions: "方向鍵移動地圖，加號與減號縮放，0 顯示所有機器人。地圖旁的機器人清單以文字列出相同的機器人。",
  zoomIn: "放大",
  zoomOut: "縮小",
  fit: "顯示所有機器人",
  status: robotMapLabels.status,
  fix: { "rtk-fixed": "RTK 固定解", "rtk-float": "RTK 浮動解", dgps: "DGPS 定位", gps: "GPS 定位", none: "未定位" },
  fixWithAccuracy: (fix: string, accuracy: string) => `${fix} · ${accuracy}`,
  accuracy: (m: number, locale: string | undefined) =>
    m < 1 ? `±${geoNumber(Math.max(1, Math.round(m * 100)), 0, locale)} cm` : `±${geoNumber(m, m < 10 ? 1 : 0, locale, 0)} m`,
  fenceKind: { allowed: "作業區", "keep-out": "禁入區" },
  empty: "此地圖目前沒有機器人。",
  loading: "正在載入地圖",
  error: "無法載入地圖。",
  retry: "重新載入",
  tilesFailed: "無法載入地圖圖磚，改以座標格線顯示。",
  count: (n: number) => `${n} 台機器人`,
  selected: (name: string, status: string) => `已選取：${name}，${status}`,
  latitude: (deg: number, digits: number, locale: string | undefined) => `${deg < 0 ? "南緯" : "北緯"} ${geoNumber(Math.abs(deg), digits, locale)}°`,
  longitude: (deg: number, digits: number, locale: string | undefined) => `${deg < 0 ? "西經" : "東經"} ${geoNumber(Math.abs(deg), digits, locale)}°`,
  position: (lat: string, lon: string) => `${lat}，${lon}`,
  heading: (deg: number) => `航向 ${compass(deg)}°（${geoCompass[Math.round(compass(deg) / 45) % 8]}）`,
  inFence: (name: string, kind: string) => `位於 ${name}（${kind}）`,
  inUnnamedFence: (kind: string) => `位於${kind}內`,
  outsideAllowed: "在作業區外",
  distance: (m: number, locale: string | undefined) => (m >= 1000 ? `${geoNumber(m / 1000, 1, locale, 0)} km` : `${geoNumber(m, m < 1 ? 1 : 0, locale, 0)} m`),
  editKeys: "方向鍵移動十字準線，按住 Shift 可加大步距；Enter 或空白鍵放置目標點，Esc 取消。按右鍵拖曳或用兩指可移動地圖。",
  goalHint: "點一下放置目標點，拖曳以設定方向。Esc 取消。",
  goalConfirm: "要送出這個目標點嗎？",
  goalConfirmKeys: "左右方向鍵旋轉方向，Enter 送出，Esc 取消。",
  send: "送出目標點",
  cancel: "取消",
  goalInKeepOut: (fence: string) => `位於禁入區 ${fence} 內`,
  goalOutsideAllowed: (area: string | undefined) => (area ? `在作業區 ${area} 外` : "在作業區外"),
  goalPlaced: (position: string) => `目標點位於 ${position}。Enter 送出，Esc 取消。`,
  goalBlocked: (position: string, reason: string) => `目標點位於 ${position}。${reason}，無法送出。請重新放置，或按 Esc 取消。`,
  goalNotSent: (reason: string) => `${reason}，無法送出這個目標點。`,
  goalSet: (position: string, heading: number | undefined) => `已送出目標點：${position}${heading === undefined ? "" : `，航向 ${compass(heading)}°`}`,
  goalCancelled: "已取消目標點",
  fixChanged: (name: string, fix: string) => `${name}：${fix}`,
}

export const geoMapListLabels = geoMapLabels

export const annotatedImageLabels = {
  predicted: "預測",
  truth: "真實標註",
  previous: "上一版",
  legend: "線條樣式",
  count: (n: number) => (n === 0 ? "沒有標註" : `${n} 個標註`),
  annotation: ({ label, kind, score }: { label: string; kind: string; score?: string | undefined; }) => [label, kind, score].filter(Boolean).join("，"),
  score: (n: number) => n.toFixed(2),
  layers: (names: string[]) => `圖層：${list(names)}`,
  loading: "正在載入圖片",
  failed: "無法載入圖片",
}

export const annotationLegendLabels = {
  legend: annotatedImageLabels.legend,
  previous: annotatedImageLabels.previous,
  predicted: annotatedImageLabels.predicted,
  truth: annotatedImageLabels.truth,
}

export const groundedTextLabels = {
  marks: ({ points, boxes, shapes }: { points: number; boxes: number; shapes: number }) =>
    `圖上 ${[boxes && `${boxes} 個框`, points && `${points} 個點`, shapes && `${shapes} 個標註`].filter(Boolean).join("和 ")}`,
  linked: (words: string[]) => `文字中：${words.join("；")}`,
}

export const groundedTextBodyLabels = groundedTextLabels

export const graphLabels = {
  from: (names: string[]) => `來自 ${list(names)}`,
  to: (names: string[]) => `通往 ${list(names)}`,
  status: { active: "執行中", normal: "已完成", warning: "需要處理", danger: "失敗", offline: "未執行" },
  instructions: "方向鍵沿著連線移動：往前到輸出，往後到輸入，或橫向移到同一欄的下一個節點。",
  inputs: "輸入",
  outputs: "輸出",
  loading: "載入中",
}

export const graphListLabels = graphLabels

export const traceLabels = {
  pending: "等待中",
  running: "執行中",
  done: "完成",
  warning: "警告",
  error: "失敗",
  skipped: "已略過",
  count: (n: number, status: string) => `${status} ${n}`,
  // As the English duration (840 ms, 1.2 s, 2 m 05 s, 1 h 04 m), with Chinese words for seconds, minutes and hours.
  duration: (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)} ms`
    if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} 秒`
    const s = Math.round(ms / 1000)
    if (s < 3600) return `${Math.floor(s / 60)} 分 ${pad(s % 60)} 秒`
    return `${Math.floor(s / 3600)} 小時 ${pad(Math.floor((s % 3600) / 60))} 分`
  },
}

export const traceHeaderLabels = traceLabels

// ---------- Media ----------

export const mediaPlayerLabels = {
  keys: "空白鍵或 K 播放／暫停，方向鍵前後移動 5 秒，J 和 L 前後移動 10 秒，M 靜音，F 全螢幕。",
  play: "播放",
  pause: "暫停",
  mute: "靜音",
  unmute: "取消靜音",
  speed: (rate: number) => `播放速度 ${rate}×`,
  captions: "字幕",
  fullscreen: "全螢幕",
  exitFullscreen: "離開全螢幕",
  seek: "影片播放位置",
  position: (current: string, total: string) => `${current} / ${total}`,
  markers: "此影片中的事件",
  markerCount: (count: number) => `${count} 個事件`,
  range: (start: string, end: string) => `${start}–${end}`,
  marker: (time: string, label: string) => `${time}，${label}`,
  loading: "正在載入影片",
  buffering: "緩衝中",
  unavailable: "無法播放影片",
  retry: "重新載入影片",
  mediaError: (code: number) =>
    code === 1
      ? "載入已中止。"
      : code === 2
        ? "載入時網路中斷。"
        : code === 3
          ? "檔案已損毀，或此瀏覽器無法解碼。"
          : "找不到檔案，或此瀏覽器無法播放這種影片。",
}

export const imageGridLabels = {
  loading: "正在載入圖片",
  broken: "無法載入",
  reveal: "顯示圖片",
  viewLarger: (name: string) => `放大檢視 ${name}`,
  previous: "上一張",
  next: "下一張",
  close: "關閉",
  position: (n: number, total: number) => `第 ${n} 張，共 ${total} 張`,
}

export const thumbnailLabels = {
  broken: "無法載入",
  restricted: "受限圖片",
}

export const attachmentLabels = {
  uploadFailed: "上傳失敗",
  failed: "失敗",
  uploading: (name: string) => `正在上傳 ${name}`,
  percent: (n: number) => `${n}%`,
  retry: (name: string) => `重試 ${name}`,
  download: (name: string) => `下載 ${name}`,
  cancel: (name: string) => `取消 ${name}`,
  remove: (name: string) => `移除 ${name}`,
}

// ---------- Data ----------

// A dataset's licence tier, after its code (T0 · 可商用).
export const tierBadgeLabels = {
  T0: "可商用",
  T1: "非商用",
  T2: "受限",
  T3: "僅限地端",
}

export const dataGridLabels = {
  region: "資料",
  empty: "沒有資料",
  resize: (column: string) => `調整「${column}」欄寬`,
  width: (px: number) => `${px} px`,
  ascending: "遞增排序",
  descending: "遞減排序",
  unpin: "取消固定",
  pinLeft: "固定在左側",
  hideColumn: "隱藏此欄",
  wider: "加寬",
  narrower: "縮窄",
  resetWidth: "恢復欄寬",
  columns: "欄位",
  showColumns: "顯示欄位",
  selected: (count: number, total: number) => `已選取 ${count} / ${total}`,
  selectAll: "選取本頁全部",
  selectRow: "選取此列",
  cannotSelect: "無法選取",
  details: "詳細資料",
  showDetails: "顯示詳細資料",
  hideDetails: "隱藏詳細資料",
}

/** ShellSearch (app-shell's search): pass as `search.labels`. */
export const shellSearchLabels = {
  search: "搜尋",
  scope: (scope: string) => `搜尋範圍：${scope}`,
  empty: (query: string, scope: string) => `在「${scope}」中找不到「${query}」。換個關鍵字，或搜尋全部。`,
}

export const paginationLabels = {
  nav: "分頁",
  range: (from: number, to: number, total: number, locale?: string) =>
    `第 ${formatCount(from, { locale: locale ?? "zh-TW" })}–${formatCount(to, { locale: locale ?? "zh-TW" })} 筆，共 ${formatCount(total, { locale: locale ?? "zh-TW" })} 筆`,
  previous: "上一頁",
  next: "下一頁",
  page: (n: number) => `第 ${n} 頁`,
  empty: "沒有可顯示的內容",
}

export const dataGridPaginationLabels = paginationLabels

export const loadMoreLabels = {
  showing: (shown: number, total: number, locale: string | undefined) => `已顯示 ${formatCount(shown, { locale: locale ?? "zh-TW" })} / ${formatCount(total, { locale: locale ?? "zh-TW" })} 筆`,
  more: (next: number, left: number, locale: string | undefined) => `再顯示 ${formatCount(next, { locale: locale ?? "zh-TW" })} 筆（剩 ${formatCount(left, { locale: locale ?? "zh-TW" })} 筆）`,
}

export const streamingChartLabels = {
  live: "即時",
  paused: "已暫停",
  waiting: "等待資料",
  stale: "沒有新資料",
  lastSample: (time: string) => `最後讀數 ${time}`,
  pause: "暫停",
  resume: "繼續",
  jumpToLive: "回到即時",
  window: "時間範圍",
  windowOption: (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} 秒` : ms < 3_600_000 ? `${Math.round(ms / 60_000)} 分鐘` : `${Math.round(ms / 3_600_000)} 小時`),
  view: "顯示方式",
  viewOptions: "顯示選項",
  chart: "圖表",
  table: "表格",
  time: "時間",
  now: "現在",
  secondsAgo: (v: string) => `−${v} 秒`,
  minutesAgo: (v: string) => `−${v} 分`,
  overLimit: "超過上限",
  underLimit: "低於下限",
  limit: (v: string) => `上限 ${v}`,
  withUnit: (v: string, unit: string) => (unit === "°" ? `${v}°` : `${v} ${unit}`),
  noValue: "–",
  reading: (series: string, value: string) => `${series} ${value}`,
  keys: "空白鍵暫停或繼續。左右方向鍵在時間上往前或往後移動。End 鍵回到即時。",
  formatTime: (d: Date, locale: string | undefined) => (locale ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }) : clock(d)),
}

// Attitude in the words of Taiwan's flight instruments: 滾轉 (roll), 俯仰 (pitch), 航向 (heading); the nose 抬頭 or 低頭.
export const attitudeIndicatorLabels = {
  roll: "滾轉",
  pitch: "俯仰",
  heading: "航向",
  degrees: (v: string) => `${v}°`,
  directed: (v: string, d: string) => `${d} ${v}`,
  left: "向左",
  right: "向右",
  noseUp: "抬頭",
  noseDown: "低頭",
  compassPoints: ["北", "東北", "東", "東南", "南", "西南", "西", "西北"],
  headingText: (v: string, p: string) => `${v}（${p}）`,
  overLimit: "超過限制",
  critical: "嚴重",
  withState: (v: string, s: string) => `${v}，${s}`,
  withinLimits: "滾轉與俯仰皆在限制內",
  noValue: "–",
  waiting: "等待資料",
  stale: "資料過時",
  lastUpdate: (time: string) => `最後更新 ${time}`,
  summary: ({ roll, pitch, heading }: { roll?: string; pitch?: string; heading?: string }) =>
    [roll && `滾轉 ${roll}`, pitch && `俯仰 ${pitch}`, heading && `航向 ${heading}`].filter(Boolean).join("，"),
  formatTime: (d: Date, locale: string | undefined) => (locale ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }) : clock(d)),
}

export const gaugeLabels = {
  withUnit: (v: string, unit: string) => (!unit ? v : unit === "°" ? `${v}°` : `${v} ${unit}`),
  high: "偏高",
  low: "偏低",
  critical: "嚴重",
  backToNormal: "已恢復正常",
  withState: (v: string, s: string) => `${v}，${s}`,
  noValue: "–",
  waiting: "等待資料",
  stale: "資料過時",
  lastUpdate: (time: string) => `最後更新 ${time}`,
  formatTime: (d: Date, locale: string | undefined) => (locale ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }) : clock(d)),
}

export const meterLabels = {
  range: (value: string, max: string) => `${value} / ${max}`,
  critical: "嚴重",
  high: "偏高",
  low: "偏低",
}

export const chartViewSwitchLabels = {
  view: "顯示方式",
  chart: "圖表",
  table: "表格",
}

export const barListLabels = {
  more: (count: string) => `還有 ${count} 項`,
  empty: "沒有資料",
}

export const metricCardLabels = {
  better: "，較佳",
  worse: "，較差",
  loading: "載入中",
  unavailable: "無資料",
}

export const textDiffLabels = {
  added: "新增：",
  removed: "刪除：",
  end: "（結束）",
  summary: (added: number, removed: number) => [added ? `+${added} 個字詞` : "", removed ? `−${removed} 個字詞` : ""].filter(Boolean).join("，"),
  none: "沒有變更",
  empty: "空白",
}

// Log levels keep the words a ROS console prints in Taiwan's offices: 除錯 (debug), 資訊, 警告, 錯誤, 嚴重 (fatal).
export const logViewerLabels = {
  name: "日誌",
  debug: "除錯",
  info: "資訊",
  warn: "警告",
  error: "錯誤",
  fatal: "嚴重",
  time: "時間",
  level: "層級",
  source: "來源",
  message: "訊息",
  search: "搜尋日誌",
  searchPlaceholder: "搜尋訊息與來源",
  matches: (current: number, total: number, locale: string | undefined) =>
    total === 0 ? "沒有符合的結果" : current ? `第 ${formatCount(current, { locale: locale ?? "zh-TW" })} 筆，共 ${formatCount(total, { locale: locale ?? "zh-TW" })} 筆` : `${formatCount(total, { locale: locale ?? "zh-TW" })} 筆符合`,
  previousMatch: "上一筆符合",
  nextMatch: "下一筆符合",
  levels: "層級",
  allLevels: "所有層級",
  levelCount: (n: number) => `${n} 個層級`,
  sources: "來源",
  allSources: "所有來源",
  sourceCount: (n: number) => `${n} 個來源`,
  count: (n: number, locale: string | undefined) => formatCount(n, { locale: locale ?? "zh-TW" }),
  viewOptions: "顯示選項",
  wrap: "長訊息自動換行",
  relativeTime: "顯示經過時間",
  jumpToLatest: "跳到最新",
  newLines: (n: number, locale: string | undefined) => `${formatCount(n, { locale: locale ?? "zh-TW" })} 行新訊息`,
  following: "持續顯示最新",
  paused: "已暫停",
  total: (shown: number, total: number, locale: string | undefined) =>
    shown === total ? `共 ${formatCount(total, { locale: locale ?? "zh-TW" })} 行` : `顯示 ${formatCount(shown, { locale: locale ?? "zh-TW" })} 行，共 ${formatCount(total, { locale: locale ?? "zh-TW" })} 行`,
  capped: (max: number, locale: string | undefined) => `只保留最近 ${formatCount(max, { locale: locale ?? "zh-TW" })} 行`,
  empty: "尚無日誌",
  noMatch: "沒有符合篩選條件的行",
  showAll: "顯示全部",
  copyLines: (n: number) => (n === 1 ? "複製此行" : `複製 ${n} 行`),
  copied: "已複製",
  copyFailed: "無法複製：請選取文字後自行複製",
  copiedLines: (n: number) => `已複製 ${n} 行`,
  copyLine: "複製此行",
  moreLines: (n: number) => `（另有 ${n} 行）`,
  location: "位置",
  function: "函式",
  ago: (ms: number, locale: string | undefined) => {
    const s = Math.max(0, ms) / 1000
    const rtf = new Intl.RelativeTimeFormat(locale ?? "zh-TW", { numeric: "always", style: "narrow" })
    if (s < 60) return rtf.format(-Number(s.toFixed(s < 10 ? 1 : 0)), "second")
    if (s < 3600) return rtf.format(-Math.floor(s / 60), "minute")
    if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour")
    return rtf.format(-Math.floor(s / 86400), "day")
  },
  announce: ({ lines, errors, warnings }: { lines: number; errors: number; warnings: number }, locale: string | undefined) =>
    [`${formatCount(lines, { locale: locale ?? "zh-TW" })} 行新訊息`, errors && `${formatCount(errors, { locale: locale ?? "zh-TW" })} 個錯誤`, warnings && `${formatCount(warnings, { locale: locale ?? "zh-TW" })} 個警告`].filter(Boolean).join("，"),
  keys: "上下方向鍵在各行之間移動，按住 Shift 可選取多行，Enter 展開該行，C 複製，End 跳到最新一行，斜線鍵開始搜尋。",
}

// A model's answer as it streams: 生成 (generate), 推理 (reasoning), 首個 token (first token, the term engineers use).
const streamDuration = (ms: number, locale: string | undefined) => {
  const s = Math.max(0, ms) / 1000
  const n = (v: number, digits = 0) => formatNumber(v, { locale: locale ?? "zh-TW", minimumFractionDigits: digits, maximumFractionDigits: digits })
  if (s < 10) return `${n(s, 1)} 秒`
  if (s < 60) return `${n(Math.round(s))} 秒`
  const whole = Math.round(s)
  return whole % 60 ? `${n(Math.floor(whole / 60))} 分 ${n(whole % 60)} 秒` : `${n(whole / 60)} 分鐘`
}

export const streamingTextLabels = {
  name: "回答",
  queued: (position: number | undefined, locale: string | undefined) =>
    position === undefined ? "排隊等候中" : position <= 1 ? "下一個就輪到" : `排隊中，第 ${formatCount(position, { locale: locale ?? "zh-TW" })} 位`,
  thinking: "思考中",
  generating: "生成中",
  done: ({ durationMs, firstTokenMs }: { durationMs?: number; firstTokenMs?: number }, locale: string | undefined) =>
    [durationMs === undefined ? "已完成" : `已完成，耗時 ${streamDuration(durationMs, locale)}`, firstTokenMs !== undefined && `首個 token ${streamDuration(firstTokenMs, locale)}`]
      .filter(Boolean)
      .join(" · "),
  stopped: ({ durationMs, empty }: { durationMs?: number; empty: boolean }, locale: string | undefined) =>
    empty ? "已在回答開始前取消" : [durationMs === undefined ? "已停止" : `已在 ${streamDuration(durationMs, locale)} 後停止`, "回答不完整"].join(" · "),
  failed: "失敗",
  incomplete: "回答不完整",
  empty: "回答沒有內容",
  stop: "停止生成",
  cancel: "取消",
  retry: "重試",
  reasoningToggle: "推理過程",
  duration: streamDuration,
}

// One turn of a conversation: 你 (you) for the person's own turns, 助理 (assistant), 工具 (tool), 系統 (system).
export const messageLabels = {
  roles: { user: "你", assistant: "助理", tool: "工具", system: "系統" },
  label: ({ role, name, time }: { role: string; name?: string; time?: string }) => [role, name, time].filter(Boolean).join("，"),
  failed: "失敗",
  stopped: "已停止",
  retry: "重試",
}

export const messageMetaLabels = {
  duration: streamDuration,
  tokens: (n: number, locale: string | undefined) => `${formatCount(n, { locale: locale ?? "zh-TW" })} 個 token`,
}

export const messageActionsLabels = {
  group: "回答的動作",
  copy: "複製",
  copied: "已複製",
  copyFailed: "無法複製：請選取文字後自行複製",
  regenerate: "重新生成",
  good: "回答良好",
  bad: "回答不佳",
  reasons: "哪裡有問題？",
  versions: "版本",
  previous: "上一個版本",
  next: "下一個版本",
  version: (n: number, count: number, locale: string | undefined) =>
    `第 ${formatCount(n, { locale: locale ?? "zh-TW" })} 個版本，共 ${formatCount(count, { locale: locale ?? "zh-TW" })} 個`,
  versionShort: (n: number, count: number, locale: string | undefined) =>
    `${formatCount(n, { locale: locale ?? "zh-TW" })} / ${formatCount(count, { locale: locale ?? "zh-TW" })}`,
}

// The box people write to a model in: 訊息 (message), 送出 (send), 附加檔案 (attach files), 注音 and 倉頡 users press
// Enter to choose characters, which never sends.
export const promptComposerLabels = {
  label: "訊息",
  placeholder: "輸入訊息",
  send: "送出",
  stop: "停止生成",
  attach: "附加檔案",
  files: "已附加的檔案",
  keyboard: "按 Enter 送出，Shift+Enter 換行",
  empty: "請輸入訊息或附加檔案後再送出",
  streaming: "請等回答完成，或先停止生成",
  count: (length: number, max: number, locale: string | undefined) =>
    `${formatCount(length, { locale: locale ?? "zh-TW" })} / ${formatCount(max, { locale: locale ?? "zh-TW" })}`,
  overLimit: (over: number, max: number, locale: string | undefined) =>
    `超過 ${formatCount(max, { locale: locale ?? "zh-TW" })} 字上限 ${formatCount(over, { locale: locale ?? "zh-TW" })} 字`,
  rejected: ({ file, reason }: { file: { name: string }; reason: "type" | "size" | "count" }) =>
    reason === "type" ? `${file.name}：不支援這種檔案類型` : reason === "size" ? `${file.name}：檔案太大` : `${file.name}：檔案數量超過上限`,
  attachment: attachmentLabels,
}

export const messageScrollerLabels = {
  name: "對話",
  jump: "跳到最新",
  newCount: (n: number, locale: string | undefined) => `${formatCount(n, { locale: locale ?? "zh-TW" })} 則新訊息`,
  jumpLabel: (n: number, locale: string | undefined) => (n > 0 ? `跳到最新，${formatCount(n, { locale: locale ?? "zh-TW" })} 則新訊息` : "跳到最新"),
  loadEarlier: "載入較早的訊息",
  newTurn: (name: string, text: string) => (text ? `${name}：${text}` : name),
}

// Every operator the filter bar offers; the types test holds it to the full FilterOperator list, so a new one cannot be
// left in English.
const filterOperators = {
  contains: "包含",
  not_contains: "不包含",
  is: "是",
  is_not: "不是",
  any_of: "是下列任一",
  none_of: "不是下列任一",
  eq: "=",
  neq: "≠",
  lt: "<",
  gt: ">",
  between: "介於",
  before: "早於",
  after: "晚於",
  is_true: "為是",
  is_false: "為否",
}

export const filtersLabels = {
  label: "篩選條件",
  remove: (rule: string) => `移除篩選條件：${rule}`,
  clear: "全部清除",
  from: "從",
  to: "到",
  matchAll: "已套用的篩選條件，須全部符合",
  more: (first: string, more: number) => `${first} +${more}`,
  and: "且",
  add: "篩選",
  chooseField: "選擇欄位",
  chooseOperator: (field: string) => `${field}：選擇條件`,
  enterValue: (field: string, operator: string) => `${field} ${operator}：輸入值`,
  chooseValue: (field: string, operator: string) => `${field} ${operator}：選擇值`,
  searchFields: "搜尋欄位",
  searchOperators: "搜尋條件",
  searchOptions: "搜尋值",
  noMatches: "沒有符合的項目，請換個關鍵字試試。",
  apply: "套用",
  back: "返回",
  editField: (text: string) => `${text}，變更欄位`,
  editOperator: (text: string) => `${text}，變更條件`,
  editValue: (text: string) => `${text}，變更值`,
  operators: filterOperators,
}

export const filterViewsLabels = {
  label: "已儲存的檢視",
  modified: "已修改",
  reset: "還原",
  resetTo: (view: string) => `還原為 ${view}`,
  save: "儲存檢視",
  name: "檢視名稱",
  confirm: "儲存",
}

export const sortableLabels = {
  pickedUp: (name: string, position: number, total: number) => `已拿起 ${name}。目前位置 ${position} / ${total}。`,
  moved: (name: string, position: number, total: number) => `${name} 已移到位置 ${position} / ${total}。`,
  droppedAt: (name: string, position: number, total: number) => `${name} 已放在位置 ${position} / ${total}。`,
  dropped: (name: string) => `已放下 ${name}。`,
  cancelled: (name: string) => `已取消移動 ${name}。`,
  instructions: "若要重新排序，請按空白鍵拿起，用方向鍵移動，再按一次空白鍵放下，或按 Esc 取消。",
}

export const treeLabels = {
  toggle: (name: string) => `${name} 底下的項目`,
  details: (name: string) => `${name} 的詳細資料`,
}

export const facetsLabels = {
  title: "篩選",
  showAll: (count: string) => `顯示全部 ${count} 個`,
  showFewer: "顯示較少",
  // Read after the count on the drawer's button: "篩選 3 個已選取".
  active: "個已選取",
  clear: "全部清除",
  done: "完成",
}

export const facetListLabels = facetsLabels
export const facetsDrawerLabels = facetsLabels

export const chipGroupLabels = {
  more: (hidden: number) => `另外 ${hidden} 個`,
  less: "顯示較少",
  selected: "已選取",
}

// ---------- Inputs ----------

export const autocompleteLabels = {
  placeholder: "搜尋",
  empty: "沒有符合的結果",
  searching: "搜尋中…",
  searchingStatus: "搜尋中",
  clear: "清除",
  showAll: "顯示全部",
  suggestions: "建議",
}

export const searchFieldLabels = {
  label: "搜尋",
  placeholder: "搜尋",
}

export const datePickerLabels = {
  pickDay: "選擇日期",
  pickRange: "選擇日期範圍",
  clear: "清除",
  presets: "快速選項",
}

export const dateRangePickerLabels = datePickerLabels

export const timePickerLabels = {
  placeholder: "選擇時間",
  times: "時間",
}

export const numberFieldLabels = {
  decrease: "減少",
  increase: "增加",
}

export const phoneInputLabels = {
  country: "國家／地區",
  phoneNumber: "電話號碼",
}

export const questionnaireLabels = {
  submit: "送出",
  required: "請回答這一題再繼續。",
  review: "檢查答案",
  position: (n: number, total: number) => `第 ${n} 題，共 ${total} 題`,
  percent: (n: number) => `${n}%`,
  progress: "進度",
  answers: "你的回答",
  edit: "編輯",
  // Read after "編輯", so the button is named "編輯，第 3 題".
  editQuestion: (n: number) => `，第 ${n} 題`,
  back: "上一題",
  next: "下一題",
  notAnswered: "未回答",
  scaleAnswer: (value: number, max: number) => `${value} / ${max}`,
  upTo: (max: number) => `最多 ${max}。`,
  requiredMark: "（必填）",
}

export const questionFieldLabels = questionnaireLabels

// ---------- Navigation, overlays and feedback ----------

export const breadcrumbLabels = { nav: "導覽路徑" }

export const topBarShellLabels = {
  nav: "主要導覽",
  openNav: "開啟導覽",
  accountMenu: "帳號選單",
}

export const actionRailShellLabels = {
  back: "返回",
  stepLabel: "下一步",
  moreActions: "更多動作",
  headerMore: "更多",
}

// status-pages: one object per page.
export const notFoundPageLabels = {
  code: "404",
  title: "這個頁面不存在",
  body: "連結可能已經過期，或它指向的機器人或資料集已被移除。",
  primary: "前往總覽",
  secondary: "搜尋",
}

export const noAccessPageLabels = {
  code: "403",
  title: "你沒有存取權限",
  body: (role: string, admin: string) => `你的角色（${role}）無法開啟這個頁面，${admin}可以變更。`,
  admin: "你的站台管理員",
  primary: "申請存取權限",
  secondary: "返回",
}

export const errorPageLabels = {
  code: "500",
  title: "我們這邊出了問題",
  body: "你的工作已儲存。請再試一次；如果持續發生，請將這個參考碼提供給支援人員：",
  primary: "再試一次",
  secondary: "複製參考碼",
}

export const offlinePageLabels = {
  code: "離線",
  title: "無法連線到車隊伺服器",
  body: "機器人會繼續執行任務，緊急停止仍可從控制 App 透過藍牙使用。這個頁面會自動重新連線。",
  primary: "立即重試",
}

export const loadingPageLabels = {
  what: "正在載入車隊",
  robotsOnline: "在線機器人",
  patrolHours: "巡邏時數",
  events: "事件",
  avgBattery: "平均電量",
}

export const sidebarProviderLabels = {
  sidebar: "側邊欄",
  nav: "主要導覽",
  title: "導覽",
  collapse: "收合側邊欄",
  expand: "展開側邊欄",
  open: "開啟導覽",
  resize: "調整側邊欄寬度",
  drag: "拖曳以調整寬度",
}

export const commandDialogLabels = {
  title: "搜尋",
  description: "搜尋頁面、機器人與操作",
}

export const dialogContentLabels = { close: "關閉" }

export const dropdownMenuMoreTriggerLabels = {
  more: "更多動作",
  moreFor: (name: string) => `${name} 的更多動作`,
}

export const responsiveTableLabels = { actions: "動作" }

export const stepperLabels = {
  optional: "選填",
  unavailable: "無法使用",
  done: "已完成",
  error: "有錯誤",
  current: "目前步驟",
  upcoming: "尚未開始",
  position: (n: number, total: number) => `第 ${n} 步，共 ${total} 步`,
  progress: "步驟",
}

export const stepperCompactLabels = stepperLabels

export const spinnerLabels = { loading: "載入中" }

export const routeProgressLabels = { loading: "正在載入頁面" }

export const codeBlockLabels = {
  copy: (title: string | undefined) => (title ? `複製${title}` : "複製程式碼"),
  copied: "已複製",
  failed: "無法複製：請選取文字後自行複製",
  show: "顯示內容",
  hidden: "已隱藏",
  code: "程式碼",
}

export const markdownLabels = {
  image: (alt: string) => (alt ? `圖片：${alt}` : "圖片"),
  newTab: "（在新分頁開啟）",
  spokenCode: (language: string | undefined) => (language ? `${language} 程式碼。` : "程式碼。"),
  codeBlock: codeBlockLabels,
}

export const citationsLabels = {
  marker: (n: number, title: string) => `來源 ${n}：${title}`,
  sources: "來源",
  back: (n: number) => `回到引用 ${n}`,
  newTab: "（在新分頁開啟）",
}

export const copyButtonLabels = {
  copy: "複製",
  copied: "已複製",
  failed: "無法複製：請選取文字後自行複製",
  notCopied: "未複製",
}

export const themeToggleLabels = {
  light: "淺色",
  system: "跟隨系統",
  dark: "深色",
}
