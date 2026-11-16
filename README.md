# SyncAI-Lib-DesignSystem

SYNCROBOTIC 的 UI Kit。形式和 [ReUI](https://reui.io) 相同：**shadcn registry**。元件以原始碼裝進使用端專案，使用端可以讀、可以改，和 shadcn 生態一致。

設計來源是 Design 畫布「SyncAI-Dog App 設計」的 1 Style Guideline 與 2 元件與規則。對照表見 [`docs/canvas-mapping.md`](docs/canvas-mapping.md)。

## 給使用端（控制端 App、Dashboard…）

1. 專案已經 `npx shadcn init` 過（Tailwind v4）。
2. 在 `components.json` 加上 registry：

   ```json
   "registries": {
     "@syncrobotic": {
       "url": "https://<registry 網址>/r/{name}.json",
       "headers": { "Authorization": "Bearer ${SYNCROBOTIC_REGISTRY_TOKEN}" }
     }
   }
   ```

3. 安裝主題，並在 `globals.css` 的 `@import "tailwindcss";` 之後加上 `@import "../styles/syncrobotic-theme.css";`，刪掉 shadcn init 產生的 `:root`／`.dark`／`@theme inline`：

   ```bash
   npx shadcn add @syncrobotic/syncrobotic-theme
   ```

4. 安裝元件：

   ```bash
   npx shadcn add @syncrobotic/dock @syncrobotic/stop-button @syncrobotic/slide-to-release @syncrobotic/island
   ```

深色是預設：`<html class="dark">`。

## 元件

| 名稱 | 內容 |
| --- | --- |
| `syncrobotic-theme` | 色彩、圓角、字級、高度、動效 token |
| `stop-button` | 緊急停止（一碰就停、按住 2 秒停止全部、7 種狀態）與喚醒並站起來 |
| `slide-to-release` | 滑動解除：過 85% 解除、未過回彈、檢視者鎖住、鍵盤長按 2 秒替代 |
| `dock` | 底座三層：狀態動作／這頁的主要動作／導覽 |
| `island` | 動態島：名稱、設備狀態、通知三區；島內通知 |
| `list` | 分組列表 |
| `status-glyph`、`status-eyebrow` | 狀態形狀與狀態前導 |
| `skeleton` | 載入骨架 |
| `tray` | 島與底座共用的托盤 |
| `use-long-press`、`use-slide-release` | 互動 hooks |

### 一條架構規則

**緊急停止元件只負責畫面。** 它吃 `state`、丟出 `onStop`／`onStopAll`／`onRelease`。送指令、等狗回報、1.5 秒沒回報改走藍牙，都在 App 層，再把結果以 `state` 傳回元件。元件庫不碰安全邏輯，才能單獨測試。

## 開發

```bash
npm install
npm run storybook        # http://localhost:6006，工具列可切深色／淺色
npm run lint:tokens      # 不在 token 裡的值就報錯
npm run typecheck
npm run registry:build   # 產出 public/r/*.json
npm run build-storybook
npm run test:visual      # 每個 story、深淺兩種外觀截圖比對
```

第一次跑 `test:visual` 會建立基準圖，請一起 commit（`tests/__screenshots__/`）。之後任何改動讓畫面不同，CI 就會失敗並附上差異圖。要接受新的樣子：`npx playwright test --update-snapshots`。

### 規範檢查（CI 會擋）

- 不用 Tailwind 任意長度（`h-[72px]`），請用 token（`h-(--h-stop)`、`rounded-md`）
- 不寫死顏色，請用 `bg-stop`、`text-info` 這類 token
- 間距只用 1、2、3、4、6、8（4、8、12、16、24、32 px）
- 字重只用 400、500、700

### 新增一個元件

1. 寫在 `registry/syncrobotic/blocks/`，import 用 `@/lib/utils` 與 `@/registry/syncrobotic/...`（安裝時 CLI 會改寫成使用端的路徑）
2. 在 `registry.json` 加一筆，列出 `dependencies`（npm）與 `registryDependencies`（其他 `@syncrobotic/...`）
3. 在 `stories/` 為每個狀態寫一個 story
4. `npm run ci` 全過再開 PR

## 分支流程

`feat/*` → `dev` → `stage` → `main`，每一段都開 PR、CI 全過才合併。

## 部署 registry

`npm run registry:build` 產出的 `public/r/` 是純靜態 JSON，放到任何需要驗證的靜態主機即可（例如 Cloudflare Pages ＋ Access、內網 nginx）。repo 是 private，registry 也不要公開。

## 已知

- 同時安裝兩個以上共用 `@syncrobotic/cn` 的元件時，CLI 會印出「Circular dependency detected」。這是 CLI 合併共用依賴時的提示，安裝結果正確。
- shadcn CLI 安裝時會向 ui.shadcn.com 取基礎色盤，使用端需要能連到該網站。
