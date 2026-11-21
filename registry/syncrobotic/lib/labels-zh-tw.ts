// @syncrobotic/labels-zh-tw v0.27.0 · update: npx shadcn add @syncrobotic/labels-zh-tw --overwrite
// The kit's words in Traditional Chinese as written in Taiwan, one object per component that takes `labels`. Pass each
// to its component (`<DataGrid labels={dataGridLabels} />`) with `locale="zh-TW"` where the component formats numbers,
// days or times. The file imports no component, so it installs on its own; the kit's tests hold every object to the
// component's own labels type, so a key the kit adds or renames is caught before release instead of showing in English.
//
// Terms follow the kit's Chinese vocabulary: 警報 (alarm), 急停 (emergency stop), 機器人 (robot), 任務 (mission), and
// Taiwan usage throughout (檔案, 設定, 影片, 連線, 網路). Units stay SI symbols (mm, m/s, N·m), as on the robot's own panels.

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
  bluetooth: "急停",
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
  notifications: (unread: number) => `通知，${unread} 則未讀`,
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
  count: (n: number) => `${n.toLocaleString("zh-TW")} 個點`,
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
  retry: "重新載入地圖",
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

export const dataGridLabels = {
  region: "資料",
  empty: "沒有資料",
  resize: (column: string) => `調整「${column}」欄寬`,
  ascending: "遞增排序",
  descending: "遞減排序",
  unpin: "取消固定",
  pinLeft: "固定在左側",
  hideColumn: "隱藏此欄",
  columns: "欄位",
  showColumns: "顯示欄位",
  selected: (count: number, total: number) => `已選取 ${count} / ${total}`,
  selectAll: "選取本頁全部",
  selectRow: "選取此列",
  details: "詳細資料",
  showDetails: "顯示詳細資料",
  hideDetails: "隱藏詳細資料",
}

export const paginationLabels = {
  range: (from: number, to: number, total: number) => `第 ${from}–${to} 筆，共 ${total} 筆`,
  previous: "上一頁",
  next: "下一頁",
  page: (n: number) => `第 ${n} 頁`,
  empty: "沒有可顯示的內容",
}

export const dataGridPaginationLabels = paginationLabels

export const loadMoreLabels = {
  showing: (shown: number, total: number, locale: string | undefined) => `已顯示 ${shown.toLocaleString(locale)} / ${total.toLocaleString(locale)} 筆`,
  more: (next: number, left: number, locale: string | undefined) => `再顯示 ${next.toLocaleString(locale)} 筆（剩 ${left.toLocaleString(locale)} 筆）`,
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
}

export const chipGroupLabels = {
  more: (hidden: number) => `另外 ${hidden} 個`,
  less: "顯示較少",
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

export const commandDialogLabels = {
  title: "搜尋",
  description: "搜尋頁面、機器人與操作",
}

export const dialogContentLabels = { close: "關閉" }

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
