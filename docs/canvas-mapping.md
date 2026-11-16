# 畫布 → 程式碼對照

| 畫布板子 | 這個 repo | 狀態 |
| --- | --- | --- |
| Style Guideline：色彩、數值 | `registry/syncrobotic/styles/syncrobotic-theme.css` | 完成 |
| 狀態標示對照 | `status-glyph`、`status-eyebrow` | 完成 |
| 錯誤處理規則（時間表） | 各元件的預設值：長按 2000 ms、滑動門檻 85%、回彈 200 ms、轉圈 300 ms 後才出現 | 部分（轉圈待元件化） |
| 元件：外殼 → 動態島 | `island`（`Island`、`IslandNotice`） | 完成；三區的展開面板內容由 App 組合 |
| 元件：外殼 → 底座 | `dock`（`Dock`、`DockActions`、`DockNav`） | 完成 |
| 元件：外殼 → 緊急停止 | `stop-button`、`slide-to-release` | 完成 |
| 元件狀態機：緊急停止／底座／動態島 | `stories/` 每個狀態一個 story | 完成 |
| 元件：資訊呈現 → 分組列表 | `list` | 完成 |
| 元件：資訊呈現 → 載入中 | `skeleton` | 完成 |
| 元件：動作與輸入 → 按鈕、分段切換、開關、輸入框 | 用 shadcn 原生元件，改成規範的圓角與選中樣式 | 待做 |
| 元件狀態機：按鈕、開關、輸入框 | 對應 stories | 待做 |
| 機器狗狀態機（17 個狀態） | 整頁 stories | 待做 |
| 3D 點雲地圖 | 地圖元件（Three.js 或 deck.gl） | 待做，需 RD 的點雲格式 |

## 和畫布不同的地方

- 主題檔 v0.9：淺色模式原本把 `--ring` 定義了兩次，托盤邊線那個蓋掉了焦點框顏色。改名為 `--edge`（Tailwind：`ring-edge`）。
- 新增 `animate-breath`（骨架整體呼吸 1.2 秒），系統減少動態時停用。
