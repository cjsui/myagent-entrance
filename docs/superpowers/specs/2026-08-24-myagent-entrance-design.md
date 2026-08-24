# myagent-entrance 設計文件

日期：2026-08-24
狀態：待使用者審閱

## 背景與定位

`myagent.tw` 是 Ron（隋奇融）2026-08-24 新掛進 Cloudflare 帳號的網域（zone_id
`ec5bc9ccb06785beec9010ed4fe6bb5e`，account `7676821ea3e5ce4bb1248fe18603246f`）。

此網域的定位是 **AI Agent 品牌入口**，跟既有的 `ronsui.tw`（正式學術／專業個人網站，
Next.js + SQLite，列出 publications/projects/talks）不同：`ronsui.tw` 是完整履歷型網站，
`myagent.tw` 是以「AI agent 建造者」身分為主軸的科技感單頁入口，面向同行／潛在合作者，
用 3D 視覺場景做第一印象，再導流到 `ronsui.tw`、AISI 平台、GitHub 等既有陣地。

不做完整內容站；不重複 `ronsui.tw` 的履歷資料。

## 內容規格（雙語 zh/en，前端純狀態切換）

單一全螢幕畫面，不捲動，文字疊在 3D 場景上（`backdrop-filter` 霧化背景避免蓋字看不清）。

- 姓名／副標：
  - EN: `Chi-Jung Sui` / `Ron`
  - ZH: `隋奇融` / `Ron`
- 標語（hero tagline）：
  - EN: `Educator and builder at the edge of AI agents in education.`
  - ZH: `教學、研究，也打造 AI agent 的人。`
- 身分標籤（4 個 chip）：
  - Assistant Professor（助理教授）
  - EdTech Founder（AISI 創辦人）
  - Research PI（研究計畫主持人）
  - Systems Builder（系統建構者）
- 對外連結（3 個按鈕）：
  - Academic Site → `https://ronsui.tw`
  - AISI Platform → `https://aisi.tw`
  - GitHub → `https://github.com/cjsui`
- 右上角語言切換鈕 `EN / 中`，純前端狀態切換 DOM 文字，不重新整理、不換路由

## 視覺場景規格（Three.js 粒子神經網路）

- 全螢幕 WebGL canvas 當背景，z-index 在文字層之下
- 深色背景 `#05070f`
- 120–200 個粒子節點，3D 空間內緩慢漂移＋場景整體極緩速自轉
- 節點距離小於閾值時動態畫連線，連線隨節點移動即時增減（自寫邏輯，不依賴外部粒子庫）
- 主色電光藍 `#38bdf8`，搭配紫 `#8b5cf6` 做漸層/深度變化
- 滑鼠移動 → 場景輕微視差傾斜；滑鼠靠近的節點與其連線提高亮度（牽引感）
- 手機（viewport < 768px 或觸控裝置）：粒子數量降到約一半、停用視差滑鼠互動，保留自轉與連線動畫，避免效能問題與觸控滾動衝突
- 60fps 為目標；若裝置效能不足需優雅降級（可先用簡單 FPS 偵測降粒子數，不做過度工程）

## 技術棧

**Vite + TypeScript + 原生 Three.js**（不用 React/Next.js，不用 R3F）。

理由：入口頁本質是 WebGL 畫布疊加輕量文字層，用不到 React 的元件樹/虛擬 DOM；
Vite 建置快、bundle 精簡、首屏載入快（entrance page 特別在意這點）；
Vercel 對 Vite 靜態輸出零設定部署；TypeScript 保留型別安全，維護性優於純 CDN script 方案。

## 專案結構

```
myagent-entrance/
├── index.html                      # 單頁殼層，hero 文字結構
├── src/
│   ├── main.ts                     # 啟動 scene + UI，掛載事件
│   ├── scene/
│   │   └── particleNetwork.ts      # 粒子場、動態連線、相機視差、resize/降級處理
│   ├── content/
│   │   └── copy.ts                 # 雙語文案物件（zh/en 各一份，型別化）
│   ├── ui/
│   │   └── overlay.ts              # 渲染 hero 文字/標籤/連結/語言切換鈕
│   └── style.css                   # overlay 排版、backdrop-filter、響應式
├── public/
│   └── favicon.svg
├── docs/superpowers/specs/         # 本文件
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## 部署流程

1. `npm create vite@latest .`（vanilla-ts template）在
   `/Users/cjsui/Projects/puffin/myagent-entrance/` 建專案骨架
2. 依上述規格實作場景與內容，`npm run dev` 本機檢查（含雙語切換、手機視窗模擬）
3. `git init` → 首次 commit（`git config user.name "cjsui"` /
   `user.email "chrosui@gmail.com"`，本 repo 未設定過需先設）
4. 建 GitHub repo `cjsui/myagent-entrance`（public，比照 `ronsui`/`teaching-site` 慣例）→ push
5. 用 `deploy-to-vercel` skill 走 `vercel link` + `vercel --prod` 部署（Vite preset 自動偵測）
6. Vercel 專案加自訂網域 `myagent.tw` +（重導向）`www.myagent.tw`，記錄 Vercel 回傳的
   DNS 指示（apex 用 A 記錄或 Vercel 的 ALIAS/CNAME flattening；`www` 用 CNAME 指向
   `cname.vercel-dns.com`）
7. 用 Cloudflare API token（本機直打或經 `chrosui-nas-ts` fallback，見
   `puffin/CLAUDE.md` 「Cloudflare API Token 使用方式」）對 zone `ec5bc9ccb06785beec9010ed4fe6bb5e`
   寫入對應 DNS record；record 是否 proxied（橘雲）依 Vercel 文件建議判斷，
   預設先用 DNS only（灰雲）避免雙層 SSL/proxy 衝突，能力驗證後再視需要調整
8. 驗證：SSL 憑證核發成功、`curl -I https://myagent.tw` 回 200、桌機/手機視覺檢查、
   雙語切換測試、`www.myagent.tw` 導向正常
9. 更新 `puffin/CLAUDE.md`「個人網站 / 教學」章節與 `FOLDER-INDEX.md` 新增條目；
   寫入 Claude memory 記錄本次部署

## 非目標（Non-goals）

- 不做多頁／捲動式內容站（履歷、發表列表等留在 `ronsui.tw`）
- 不做後端／資料庫（純靜態站）
- 不做完整雙語系統（僅前端字典切換，不做路由層 i18n、不做 SEO 多語 URL）
- 不做 CMS 或內容可編輯後台

## 驗收標準

- [ ] `https://myagent.tw` 與 `https://www.myagent.tw` 皆可正常存取且憑證有效
- [ ] 桌機與手機（實際縮放視窗或裝置模擬）皆正常顯示，無版面破版
- [ ] 3D 粒子場景正常渲染、連線動態生成、滑鼠視差與節點發光互動正常（桌機）
- [ ] 語言切換鈕可即時切換全部文案，無需重新整理
- [ ] 三個外部連結（ronsui.tw / aisi.tw / GitHub）皆可正確導向
- [ ] `puffin/CLAUDE.md`、`FOLDER-INDEX.md`、Claude memory 皆已更新
